import os
import asyncio
from datetime import datetime
from dotenv import load_dotenv

# SQLAlchemy imports
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# App imports
from .celery_app import celery_app
from .models import Transaction, Account, AuditLog, User, Notification
from app.websocket_manager import manager

import pika
import json

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
# Ensure pool_pre_ping is on to handle disconnected DB connections
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

@celery_app.task(name="process_transaction")
def process_transaction(event_payload: dict):
    db = SessionLocal()

    try:
        txn_id = event_payload.get("transaction_id")
        src_id = event_payload.get("src_account")
        dest_id = event_payload.get("dest_account")
        amount = event_payload.get("amount")

        if not all([txn_id, src_id, dest_id, amount]):
            print("Invalid payload")
            return

        # 1. Lock the Transaction Row to prevent double processing
        # with_for_update() prevents other workers from reading this specific row until we commit
        txn = db.query(Transaction).filter(Transaction.id == txn_id).with_for_update().first()

        if not txn:
            print(f"Transaction {txn_id} not found.")
            return

        # Idempotency check
        if txn.status != "PENDING":
            print(f"Transaction {txn_id} already processed (Status: {txn.status}), skipping...")
            return

        # 2. Lock Account Rows (CRITICAL for financial apps)
        # This prevents race conditions where two transactions update balance simultaneously
        # We order by ID to prevent Deadlocks (always lock in same order)
        ids_to_lock = sorted([src_id, dest_id])
        accounts = {
            acc.id: acc 
            for acc in db.query(Account).filter(Account.id.in_(ids_to_lock)).with_for_update().all()
        }
        
        src_acc = accounts.get(src_id)
        dest_acc = accounts.get(dest_id)

        if not src_acc or not dest_acc:
            print("Source or Destination account not found.")
            txn.status = "FAILED"
            db.commit()
            return

        # 3. Logic Check (Insufficient Funds)
        if src_acc.balance < amount:
            txn.status = "FAILED"
            db.add(AuditLog(
                event_type="TRANSACTION_FAILED",
                message=f"Insufficient balance for txn {txn_id}"
            ))
            db.commit()
            
            # Optional: Notify user of failure via WebSocket here
            return

        # 4. Process Transfer
        src_acc.balance -= amount
        dest_acc.balance += amount

        txn.status = "SUCCESS"
        txn.timestamp = datetime.utcnow()

        db.add(AuditLog(
            event_type="TRANSACTION_SUCCESS",
            message=f"Txn {txn_id}: {amount} transferred from {src_id} to {dest_id}"
        ))

        # Create notifications for both sender and receiver
        # Get user information
        src_user = db.query(User).filter(User.id == src_acc.user_id).first()
        dest_user = db.query(User).filter(User.id == dest_acc.user_id).first()

        sender_notification = None
        receiver_notification = None

        if src_user:
            # Notification for sender
            sender_notification = Notification(
                user_id=src_user.id,
                title="Transaction Sent",
                message=f"You successfully sent ${amount:,.2f} to {dest_user.username if dest_user else 'Account ' + str(dest_id)}. Your new balance is ${src_acc.balance:,.2f}.",
                type="transaction",
                related_id=txn_id
            )
            db.add(sender_notification)
            print(f"Created sender notification for user {src_user.id}")

        if dest_user and (not src_user or dest_user.id != src_user.id):
            # Notification for receiver (only if different from sender)
            receiver_notification = Notification(
                user_id=dest_user.id,
                title="Transaction Received",
                message=f"You received ${amount:,.2f} from {src_user.username if src_user else 'Account ' + str(src_id)}. Your new balance is ${dest_acc.balance:,.2f}.",
                type="transaction",
                related_id=txn_id,
                from_user_id=src_user.id if src_user else None
            )
            db.add(receiver_notification)
            print(f"Created receiver notification for user {dest_user.id}")

        db.commit()
        print(f"Notifications committed to database for transaction {txn_id}")
        
        # Send real-time notifications via WebSocket
        if sender_notification and src_user:
            try:
                print(f"Sending WebSocket notification to sender user {src_user.id}")
                asyncio.run(manager.send_personal_message(
                    message={
                        "type": "notification",
                        "data": {
                            "id": sender_notification.id,
                            "user_id": sender_notification.user_id,
                            "title": sender_notification.title,
                            "message": sender_notification.message,
                            "type": sender_notification.type,
                            "related_id": sender_notification.related_id,
                            "is_read": False,
                            "created_at": sender_notification.created_at.isoformat(),
                            "read_at": None,
                            "from_user_id": None,
                            "from_user_name": None
                        }
                    },
                    user_id=src_user.id
                ))
                print(f"WebSocket notification sent to sender user {src_user.id}")
            except Exception as e:
                print(f"Failed to send real-time notification to sender: {e}")

        if receiver_notification and dest_user and (not src_user or dest_user.id != src_user.id):
            try:
                print(f"Sending WebSocket notification to receiver user {dest_user.id}")
                asyncio.run(manager.send_personal_message(
                    message={
                        "type": "notification",
                        "data": {
                            "id": receiver_notification.id,
                            "user_id": receiver_notification.user_id,
                            "title": receiver_notification.title,
                            "message": receiver_notification.message,
                            "type": receiver_notification.type,
                            "related_id": receiver_notification.related_id,
                            "is_read": False,
                            "created_at": receiver_notification.created_at.isoformat(),
                            "read_at": None,
                            "from_user_id": receiver_notification.from_user_id,
                            "from_user_name": src_user.username if src_user else None
                        }
                    },
                    user_id=dest_user.id
                ))
                print(f"WebSocket notification sent to receiver user {dest_user.id}")
            except Exception as e:
                print(f"Failed to send real-time notification to receiver: {e}")
        
        print(f"Processed transaction {txn_id}: SUCCESS")
        # --- Publish SUCCESS event to RabbitMQ ---
        publish_ws_event({
    "type": "transaction.success",
    "transaction_id": txn_id,
    "src": src_id,
    "dest": dest_id,
    "amount": amount,
    "new_src_balance": src_acc.balance,
    "new_dest_balance": dest_acc.balance
})

# --- Publish LOW BALANCE event ---
        if src_acc.balance < 1000:
         publish_ws_event({
        "type": "low_balance",
        "account_id": src_id,
        "balance": src_acc.balance
    })

        # 5. WebSocket Notification (Moved INSIDE the function)
        # We use asyncio.run() because Celery is synchronous, but the manager is async


    except Exception as e:
        print(f"Error processing transaction {event_payload.get('transaction_id')}: {e}")
        db.rollback()  # Important: Rollback on error
        # Depending on requirements, you might want to: raise self.retry(...)

    finally:
        db.close()
def publish_ws_event(event: dict):
    connection = pika.BlockingConnection(pika.ConnectionParameters("127.0.0.1"))
    channel = connection.channel()

    channel.exchange_declare(exchange="ws_events", exchange_type="fanout", durable=True)

    channel.basic_publish(
        exchange="ws_events",
        routing_key="",
        body=json.dumps(event)
    )

    connection.close()