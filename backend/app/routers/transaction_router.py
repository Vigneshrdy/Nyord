from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..schemas import TransactionCreate, TransactionOut
from ..database import get_db
from ..models import Account, Transaction
from ..rabbitmq import publish_event
from ..utils import get_current_user
from ..tasks import process_transaction
from typing import Optional

class QRTransferRequest(BaseModel):
    recipient_id: int
    amount: float
    description: Optional[str] = None
    transaction_type: str = "qr_transfer"

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("/initiate", response_model=TransactionOut)
def initiate_transaction(txn: TransactionCreate,
                         db: Session = Depends(get_db),
                         current_user = Depends(get_current_user)):

    # Check if source account belongs to the user
    src_acc = db.query(Account).filter(
        Account.id == txn.src_account,
        Account.user_id == current_user.id
    ).first()

    if not src_acc:
        raise HTTPException(status_code=403, detail="Unauthorized source account")

    # Validate destination account exists
    dest_acc = db.query(Account).filter(Account.id == txn.dest_account).first()
    if not dest_acc:
        raise HTTPException(status_code=404, detail="Destination account not found")

    # Validate balance
    if src_acc.balance < txn.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Create transaction with PENDING status
    new_txn = Transaction(
        src_account=txn.src_account,
        dest_account=txn.dest_account,
        amount=txn.amount,
        status="PENDING"
    )

    db.add(new_txn)
    db.commit()
    db.refresh(new_txn)

    # Publish event to RabbitMQ
    event_payload = {
        "transaction_id": new_txn.id,
        "src_account": txn.src_account,
        "dest_account": txn.dest_account,
        "amount": txn.amount
    }

    
    process_transaction.delay(event_payload)

    return new_txn

@router.get("/me", response_model=list[TransactionOut])
def get_my_transactions(db: Session = Depends(get_db),
                        current_user = Depends(get_current_user)):
    """Get all transactions where user's accounts are involved (as source or destination)"""
    
    # Get all account IDs owned by the user
    user_account_ids = [acc.id for acc in db.query(Account).filter(Account.user_id == current_user.id).all()]
    
    if not user_account_ids:
        return []
    
    # Fetch transactions where user's accounts are either source or destination
    transactions = db.query(Transaction).filter(
        (Transaction.src_account.in_(user_account_ids)) | 
        (Transaction.dest_account.in_(user_account_ids))
    ).order_by(Transaction.timestamp.desc()).all()

    # Build response list including source/destination usernames for frontend display
    result = []
    for txn in transactions:
        src_user_name = None
        dest_user_name = None
        try:
            if txn.src_acc_rel and txn.src_acc_rel.owner:
                src_user_name = txn.src_acc_rel.owner.username
        except Exception:
            src_user_name = None

        try:
            if txn.dest_acc_rel and txn.dest_acc_rel.owner:
                dest_user_name = txn.dest_acc_rel.owner.username
        except Exception:
            dest_user_name = None

        result.append({
            "id": txn.id,
            "src_account": txn.src_account,
            "dest_account": txn.dest_account,
            "amount": txn.amount,
            "status": txn.status,
            "timestamp": txn.timestamp,
            "src_user_name": src_user_name,
            "dest_user_name": dest_user_name
        })

    return result


@router.post("/qr-transfer", response_model=TransactionOut)
def qr_transfer(
    request: QRTransferRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Initiate a transaction using QR code recipient data.
    This endpoint handles transactions initiated via QR code scanning/upload.
    """
    from ..models import User
    
    # Extract values from request
    recipient_id = request.recipient_id
    amount = request.amount
    description = request.description or "QR Payment"
    
    # Validate amount
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    
    if amount > 999999:
        raise HTTPException(status_code=400, detail="Amount cannot exceed $999,999")
    
    # Prevent self-transfer
    if recipient_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot transfer money to yourself")
    
    # Verify recipient exists
    recipient = db.query(User).filter(User.id == recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    # Get sender's primary account - try checking first, then any account
    src_account = db.query(Account).filter(
        Account.user_id == current_user.id,
        Account.account_type == "checking"
    ).first()
    
    # If no checking account, get any account for the user
    if not src_account:
        src_account = db.query(Account).filter(
            Account.user_id == current_user.id
        ).first()
    
    if not src_account:
        raise HTTPException(status_code=404, detail="No account found for user")
    
    # Get recipient's primary account - try checking first, then any account
    dest_account = db.query(Account).filter(
        Account.user_id == recipient_id,
        Account.account_type == "checking"
    ).first()
    
    # If no checking account, get any account for the recipient
    if not dest_account:
        dest_account = db.query(Account).filter(
            Account.user_id == recipient_id
        ).first()
    
    if not dest_account:
        raise HTTPException(status_code=404, detail="No account found for recipient")
    
    # Check sufficient balance
    if src_account.balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Create transaction
    new_txn = Transaction(
        src_account=src_account.id,
        dest_account=dest_account.id,
        amount=amount,
        status="PENDING"
    )
    
    db.add(new_txn)
    db.commit()
    db.refresh(new_txn)
    
    # Process transaction - try async first, fallback to sync if needed
    try:
        event_payload = {
            "transaction_id": new_txn.id,
            "src_account": src_account.id,
            "dest_account": dest_account.id,
            "amount": amount,
            "sender": current_user.username,
            "recipient": recipient.username
        }
        
        # Try to publish event to RabbitMQ
        try:
            publish_event("transaction.initiated", event_payload)
        except Exception as rabbitmq_error:
            print(f"Failed to publish to RabbitMQ: {rabbitmq_error}")
        
        # Try async processing first
        try:
            process_transaction.delay(event_payload)
        except Exception as celery_error:
            print(f"Celery not available, processing synchronously: {celery_error}")
            
            # Fallback: Process transaction synchronously
            # Update balances directly
            src_account.balance -= amount
            dest_account.balance += amount
            new_txn.status = "SUCCESS"
            
            db.commit()
            print(f"Transaction {new_txn.id} processed synchronously")
        
    except Exception as e:
        # If everything fails, mark transaction as failed
        new_txn.status = "FAILED" 
        db.commit()
        print(f"Failed to process transaction: {e}")
        raise HTTPException(status_code=500, detail=f"Transaction processing failed: {str(e)}")
    
    return new_txn

@router.get("/{txn_id}", response_model=TransactionOut)
def get_transaction(txn_id: int,
                    db: Session = Depends(get_db),
                    current_user = Depends(get_current_user)):

    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()

    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Confirm the user owns the source account
    if txn.src_acc_rel.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this transaction")

    return txn