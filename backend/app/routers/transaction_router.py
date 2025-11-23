from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..schemas import TransactionCreate, TransactionOut
from ..database import get_db
from ..models import Account, Transaction
from ..rabbitmq import publish_event
from .account_router import get_user_id
from ..tasks import process_transaction

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("/initiate", response_model=TransactionOut)
def initiate_transaction(txn: TransactionCreate, 
                         db: Session = Depends(get_db), 
                         user_id: int = Depends(get_user_id)):

    # Check if source account belongs to the user
    src_acc = db.query(Account).filter(
        Account.id == txn.src_account,
        Account.user_id == user_id
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

@router.get("/{txn_id}", response_model=TransactionOut)
def get_transaction(txn_id: int,
                    db: Session = Depends(get_db),
                    user_id: int = Depends(get_user_id)):

    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()

    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Confirm the user owns the source account
    if txn.src_acc_rel.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this transaction")

    return txn