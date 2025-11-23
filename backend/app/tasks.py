import os
import asyncio
from datetime import datetime
from dotenv import load_dotenv

# SQLAlchemy imports
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# App imports
from .celery_app import celery_app
from .models import Transaction, Account, AuditLog
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

        db.commit()
        
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