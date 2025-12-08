from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from fastapi import Header
from ..database import get_db
from .. import models, schemas, auth
from ..utils import get_current_user
from datetime import datetime
import os
import random

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("JWT_ALGORITHM")

router = APIRouter(prefix="/accounts", tags=["Accounts"])

def get_user_id(token: str = Header(None)):
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("user_id")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/create", response_model=schemas.AccountOut)
def create_account(
    account: schemas.AccountCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Create a new account (requires admin approval)"""
    # Check if user has KYC approval
    if not current_user.kyc_approved:
        raise HTTPException(status_code=400, detail="KYC approval required before creating accounts")
    
    # Generate unique account number
    acc_num = f"ACCT{random.randint(10000000, 99999999)}"
    while db.query(models.Account).filter(models.Account.account_number == acc_num).first():
        acc_num = f"ACCT{random.randint(10000000, 99999999)}"

    new_acc = models.Account(
        account_number=acc_num,
        account_type=account.account_type,
        balance=0.0,  # Initial balance is always 0, will be added after approval
        user_id=current_user.id,
        status="pending"
    )

    db.add(new_acc)
    db.commit()
    db.refresh(new_acc)
    
    # Log the account creation request
    audit_log = models.AuditLog(
        event_type="ACCOUNT_REQUEST",
        message=f"User {current_user.username} requested new {account.account_type} account"
    )
    db.add(audit_log)
    db.commit()

    return new_acc

@router.post("/approve", response_model=dict)
def approve_account(
    approval_request: schemas.AccountApprovalRequest,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_admin_user)
):
    """Approve or reject account creation (admin only)"""
    account = db.query(models.Account).filter(models.Account.id == approval_request.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if account.status != "pending":
        raise HTTPException(status_code=400, detail="Account already processed")
    
    if approval_request.action.lower() == "approve":
        account.status = "approved"
        account.approved_by = admin_user.id
        account.approval_date = datetime.utcnow()
        message = f"Account {account.account_number} approved successfully"
        
        # Log approval
        audit_log = models.AuditLog(
            event_type="ACCOUNT_APPROVED",
            message=f"Admin {admin_user.username} approved account {account.account_number} for user {account.owner.username}"
        )
    elif approval_request.action.lower() == "reject":
        account.status = "rejected"
        account.approved_by = admin_user.id
        account.approval_date = datetime.utcnow()
        message = f"Account {account.account_number} rejected"
        
        # Log rejection
        audit_log = models.AuditLog(
            event_type="ACCOUNT_REJECTED",
            message=f"Admin {admin_user.username} rejected account {account.account_number} for user {account.owner.username}. Reason: {approval_request.reason or 'No reason provided'}"
        )
    else:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
    
    db.add(audit_log)
    db.commit()
    db.refresh(account)
    
    return {
        "message": message,
        "account_id": account.id,
        "account_number": account.account_number,
        "status": account.status,
        "action": approval_request.action,
        "reason": approval_request.reason
    }


@router.get("/me", response_model=list[schemas.AccountOut])
def get_my_accounts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Return accounts for the currently authenticated user using Bearer token auth."""
    return db.query(models.Account).filter(models.Account.user_id == current_user.id).all()

@router.get("/user/{target_user_id}", response_model=list[schemas.AccountOut])
def get_user_accounts(
    target_user_id: int, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get accounts for a specific user (for transfer purposes). Only returns account info, not sensitive data."""
    accounts = db.query(models.Account).filter(models.Account.user_id == target_user_id).all()
    return accounts

@router.get("/pending-approvals", response_model=list[schemas.AccountOut])
def get_pending_account_approvals(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_admin_user)
):
    """Get all pending account creation requests (admin only)"""
    pending_accounts = db.query(models.Account).filter(
        models.Account.status == "pending"
    ).order_by(models.Account.created_at.desc()).all()
    return pending_accounts

@router.post("/transfer-between-accounts")
def transfer_between_accounts(
    transfer_data: schemas.InterAccountTransfer,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Transfer money between user's own accounts"""
    from_account_id = transfer_data.from_account_id
    to_account_id = transfer_data.to_account_id
    amount = transfer_data.amount
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Transfer amount must be positive")
    
    # Get source account
    from_account = db.query(models.Account).filter(
        models.Account.id == from_account_id,
        models.Account.user_id == current_user.id,
        models.Account.status == "approved"
    ).first()
    
    if not from_account:
        raise HTTPException(status_code=404, detail="Source account not found or not approved")
    
    # Get destination account  
    to_account = db.query(models.Account).filter(
        models.Account.id == to_account_id,
        models.Account.user_id == current_user.id,
        models.Account.status == "approved"
    ).first()
    
    if not to_account:
        raise HTTPException(status_code=404, detail="Destination account not found or not approved")
    
    # Check sufficient balance
    if from_account.balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Perform transfer (update balances)
    from_account.balance -= amount
    to_account.balance += amount

    # Create a single transaction record representing this transfer
    txn = models.Transaction(
        src_account=from_account.id,
        dest_account=to_account.id,
        amount=amount,
        status="SUCCESS"
    )

    db.add(txn)

    # Log the transfer
    audit_log = models.AuditLog(
        event_type="INTER_ACCOUNT_TRANSFER",
        message=f"User {current_user.username} transferred ${amount} from {from_account.account_number} to {to_account.account_number}"
    )
    db.add(audit_log)

    db.commit()

    return {
        "message": "Transfer completed successfully",
        "from_account": from_account.account_number,
        "to_account": to_account.account_number,
        "amount": amount,
        "from_balance": from_account.balance,
        "to_balance": to_account.balance,
        "transaction_id": txn.id
    }

@router.get("/my-approved", response_model=list[schemas.AccountOut])
def get_my_approved_accounts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get only approved accounts for the current user"""
    return db.query(models.Account).filter(
        models.Account.user_id == current_user.id,
        models.Account.status == "approved"
    ).all()

@router.get("/{account_id}/balance")
def get_account_balance(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get balance for a specific account (user must own the account)"""
    account = db.query(models.Account).filter(
        models.Account.id == account_id,
        models.Account.user_id == current_user.id,
        models.Account.status == "approved"
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    return {
        "account_id": account.id,
        "account_number": account.account_number,
        "account_type": account.account_type,
        "balance": account.balance
    }

@router.get("/qr-codes/all")
def get_all_account_qr_codes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get QR codes for all approved accounts (like UPI - one QR per account)"""
    from ..qr_utils import generate_account_qr_code
    
    # Get all approved accounts for the user
    accounts = db.query(models.Account).filter(
        models.Account.user_id == current_user.id,
        models.Account.status == "approved"
    ).all()
    
    if not accounts:
        raise HTTPException(status_code=404, detail="No approved accounts found")
    
    # Generate QR code for each account
    qr_codes = []
    for account in accounts:
        account_data = {
            "account_number": account.account_number,
            "user_name": current_user.full_name or current_user.username,
            "account_type": account.account_type
        }
        
        qr_code = generate_account_qr_code(
            account_id=account.id,
            account_data=account_data,
            base_url="http://localhost:3000"
        )
        
        qr_codes.append({
            "account_id": account.id,
            "account_number": account.account_number,
            "account_type": account.account_type,
            "balance": account.balance,
            "qr_code": qr_code
        })
    
    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "accounts": qr_codes
    }