from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from .. import models, schemas, auth
from ..database import get_db
from .notification_router import create_notification_service
import random

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/setup-admin")
async def setup_admin_account(db: Session = Depends(get_db)):
    """Create initial admin account - only works if no admin exists"""
    existing_admin = db.query(models.User).filter(models.User.role == "admin").first()
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin account already exists")
    
    admin_user = auth.create_admin_user(
        username="admin",
        email="admin@nyordbank.com", 
        password="admin123",  # Change this in production!
        db=db
    )
    
    return {
        "message": "Admin account created successfully",
        "username": "admin",
        "password": "admin123",
        "note": "Please change the password immediately!"
    }


@router.get("/stats", response_model=schemas.AdminStats)
async def get_admin_stats(
    admin_user: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Get system statistics for admin dashboard"""
    total_users = db.query(models.User).filter(models.User.role == "customer").count()
    total_accounts = db.query(models.Account).count()
    total_balance = db.query(func.sum(models.Account.balance)).scalar() or 0
    total_transactions = db.query(models.Transaction).count()
    total_loans = db.query(models.Loan).count()
    total_fixed_deposits = db.query(models.FixedDeposit).count()
    total_cards = db.query(models.Card).count()
    
    # Count pending approvals
    pending_kyc = db.query(models.User).filter(
        models.User.role == "customer",
        models.User.status == "pending"
    ).count()
    
    pending_cards = db.query(models.Card).filter(
        models.Card.approval_status == "pending"
    ).count()
    
    pending_loans = db.query(models.Loan).filter(
        models.Loan.approval_status == "pending"
    ).count()
    
    pending_fds = db.query(models.FixedDeposit).filter(
        models.FixedDeposit.approval_status == "pending"
    ).count()
    
    return schemas.AdminStats(
        total_users=total_users,
        total_accounts=total_accounts,
        total_balance=float(total_balance),
        total_transactions=total_transactions,
        total_loans=total_loans,
        total_fixed_deposits=total_fixed_deposits,
        total_cards=total_cards,
        pending_kyc=pending_kyc,
        pending_cards=pending_cards,
        pending_loans=pending_loans,
        pending_fds=pending_fds
    )


@router.get("/users", response_model=List[schemas.UserOut])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    admin_user: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users


@router.get("/users/{user_id}", response_model=schemas.UserOut)
async def get_user_by_id(
    user_id: int,
    admin_user: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Get specific user by ID (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}")
async def update_user_by_admin(
    user_id: int,
    user_update: schemas.AdminUserUpdate,
    admin_user: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Update user details (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update only provided fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return {"message": "User updated successfully", "user": user}


@router.post("/users", response_model=schemas.UserOut)
async def create_user_by_admin(
    user_data: schemas.AdminCreateUser,
    admin_user: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Create new user (admin only)"""
    existing = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    existing_email = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    from .. import utils
    hashed_pw = utils.hash_password(user_data.password)

    new_user = models.User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pw,
        role=user_data.role,
        full_name=user_data.full_name,
        phone=user_data.phone,
        date_of_birth=user_data.date_of_birth,
        address=user_data.address,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create account if it's a customer
    if new_user.role == "customer":
        account_number = ''.join([str(random.randint(0, 9)) for _ in range(16)])
        new_account = models.Account(
            account_number=account_number,
            account_type=user_data.account_type,
            balance=user_data.initial_balance,
            user_id=new_user.id
        )
        db.add(new_account)
        db.commit()
    
    return new_user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin_user: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete user and all related data (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin user")
    
    # Delete all related data
    db.query(models.Account).filter(models.Account.user_id == user_id).delete()
    db.query(models.FixedDeposit).filter(models.FixedDeposit.user_id == user_id).delete()
    db.query(models.Loan).filter(models.Loan.user_id == user_id).delete()
    db.query(models.Card).filter(models.Card.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}


@router.get("/transactions")
async def get_all_transactions(
    skip: int = 0,
    limit: int = 100,
    admin_user: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all transactions (admin only)"""
    transactions = db.query(models.Transaction).offset(skip).limit(limit).all()
    return transactions


@router.get("/accounts")
async def get_all_accounts(
    skip: int = 0,
    limit: int = 100,
    admin_user: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all accounts (admin only)"""
    accounts = db.query(models.Account).offset(skip).limit(limit).all()
    return accounts


@router.post("/accounts/{account_id}/adjust-balance")
async def adjust_account_balance(
    account_id: int,
    amount: float,
    reason: str,
    admin_user: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Adjust account balance (admin only)"""
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    old_balance = account.balance
    account.balance += amount
    
    # Log the adjustment
    audit_log = models.AuditLog(
        event_type="BALANCE_ADJUSTMENT",
        message=f"Admin {admin_user.username} adjusted account {account.account_number} balance from {old_balance} to {account.balance}. Reason: {reason}"
    )
    db.add(audit_log)
    db.commit()
    
    return {
        "message": "Balance adjusted successfully",
        "account_id": account_id,
        "old_balance": old_balance,
        "new_balance": account.balance,
        "adjustment": amount
    }


@router.get("/pending-users", response_model=List[schemas.UserOut])
async def get_pending_kyc_users(
    skip: int = 0,
    limit: int = 100,
    admin_user: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users with pending KYC approval (admin only)"""
    pending_users = db.query(models.User).filter(
        models.User.role == "customer",
        models.User.status == "pending"
    ).offset(skip).limit(limit).all()
    return pending_users


@router.post("/approve-kyc")
async def approve_kyc(
    approval_request: schemas.KYCApprovalRequest,
    admin_user: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Approve or reject user KYC (admin only)"""
    user = db.query(models.User).filter(models.User.id == approval_request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role != "customer":
        raise HTTPException(status_code=400, detail="Can only approve KYC for customer accounts")
    
    if approval_request.action.lower() == "approve":
        user.status = "approved"
        user.kyc_approved = True
        message = f"KYC approved for user {user.username}"
        
        # Create a primary account for the user if they don't have one
        existing_account = db.query(models.Account).filter(models.Account.user_id == user.id).first()
        if not existing_account:
            account_number = ''.join([str(random.randint(0, 9)) for _ in range(16)])
            new_account = models.Account(
                account_number=account_number,
                account_type="savings",
                balance=0.0,
                user_id=user.id
            )
            db.add(new_account)
    
    elif approval_request.action.lower() == "reject":
        user.status = "rejected"
        user.kyc_approved = False
        message = f"KYC rejected for user {user.username}"
    else:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
    
    # Log the action
    audit_log = models.AuditLog(
        event_type="KYC_APPROVAL",
        message=f"Admin {admin_user.username} {approval_request.action}d KYC for user {user.username}. Reason: {approval_request.reason or 'No reason provided'}"
    )
    db.add(audit_log)
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": message,
        "user_id": user.id,
        "username": user.username,
        "status": user.status,
        "action": approval_request.action,
        "reason": approval_request.reason
    }


@router.get("/pending-cards", response_model=List[schemas.CardOut])
async def get_pending_cards(
    skip: int = 0,
    limit: int = 100,
    admin_user: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all cards with pending approval (admin only)"""
    pending_cards = db.query(models.Card).filter(
        models.Card.approval_status == "pending"
    ).offset(skip).limit(limit).all()
    return pending_cards


@router.post("/approve-card")
async def approve_card(
    approval_request: schemas.ApprovalRequest,
    admin_user: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Approve or reject card application (admin only)"""
    card = db.query(models.Card).filter(models.Card.id == approval_request.item_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if approval_request.action.lower() == "approve":
        card.approval_status = "approved"
        card.status = "active"
        message = f"Card approved for user {card.owner.username}"
    elif approval_request.action.lower() == "reject":
        card.approval_status = "rejected"
        card.status = "rejected"
        message = f"Card rejected for user {card.owner.username}"
    else:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
    
    # Log the action
    audit_log = models.AuditLog(
        event_type="CARD_APPROVAL",
        message=f"Admin {admin_user.username} {approval_request.action}d card application for user {card.owner.username}. Reason: {approval_request.reason or 'No reason provided'}"
    )
    db.add(audit_log)
    
    db.commit()
    db.refresh(card)
    
    # Create notification for user
    if approval_request.action.lower() == "approve":
        notification_title = "Card Application Approved"
        notification_message = f"Congratulations! Your {card.card_type} card application has been approved and is now active with credit limit ${card.credit_limit:,.2f}."
        notification_type = "card_approval"
    else:
        notification_title = "Card Application Rejected"
        notification_message = f"Your {card.card_type} card application has been rejected. Reason: {approval_request.reason or 'No specific reason provided'}"
        notification_type = "card_rejection"
    
    user_notification = schemas.NotificationCreate(
        user_id=card.user_id,
        title=notification_title,
        message=notification_message,
        type=notification_type,
        related_id=card.id,
        from_user_id=admin_user.id
    )
    
    # Create notification after commit
    await create_notification_service(db, user_notification)
    
    return {
        "message": message,
        "card_id": card.id,
        "user_id": card.user_id,
        "status": card.approval_status,
        "action": approval_request.action,
        "reason": approval_request.reason
    }


@router.get("/pending-loans", response_model=List[schemas.LoanOut])
async def get_pending_loans(
    skip: int = 0,
    limit: int = 100,
    admin_user: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all loans with pending approval (admin only)"""
    pending_loans = db.query(models.Loan).filter(
        models.Loan.approval_status == "pending"
    ).offset(skip).limit(limit).all()
    return pending_loans


@router.post("/approve-loan")
async def approve_loan(
    approval_request: schemas.ApprovalRequest,
    admin_user: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Approve or reject loan application (admin only)"""
    loan = db.query(models.Loan).filter(models.Loan.id == approval_request.item_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    if approval_request.action.lower() == "approve":
        loan.approval_status = "approved"
        loan.status = "active"
        # Disburse loan amount to user's account
        account = db.query(models.Account).filter(models.Account.user_id == loan.user_id).first()
        if account:
            old_balance = account.balance
            account.balance += loan.principal
            # Create a transaction record (using existing Transaction model structure)
            transaction = models.Transaction(
                dest_account=account.id,
                amount=loan.principal,
                status="SUCCESS"
            )
            db.add(transaction)
            
            # Also log in audit log for better tracking
            audit_log_disburse = models.AuditLog(
                event_type="LOAN_DISBURSAL",
                message=f"Loan amount ${loan.principal} disbursed to account {account.account_number}. Balance: ${old_balance} -> ${account.balance}"
            )
            db.add(audit_log_disburse)
        message = f"Loan approved and ${loan.principal} disbursed to user {loan.owner.username}'s account"
    elif approval_request.action.lower() == "reject":
        loan.approval_status = "rejected"
        loan.status = "rejected"
        message = f"Loan rejected for user {loan.owner.username}"
    else:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
    
    # Log the action
    audit_log = models.AuditLog(
        event_type="LOAN_APPROVAL",
        message=f"Admin {admin_user.username} {approval_request.action}d loan application for user {loan.owner.username}. Reason: {approval_request.reason or 'No reason provided'}"
    )
    db.add(audit_log)
    
    db.commit()
    db.refresh(loan)
    
    # Create notification for user
    if approval_request.action.lower() == "approve":
        notification_title = "Loan Application Approved"
        notification_message = f"Congratulations! Your {loan.loan_type} loan application for ${loan.principal:,.2f} has been approved. The amount has been disbursed to your account."
        notification_type = "loan_approval"
    else:
        notification_title = "Loan Application Rejected"
        notification_message = f"Your {loan.loan_type} loan application for ${loan.principal:,.2f} has been rejected. Reason: {approval_request.reason or 'No specific reason provided'}"
        notification_type = "loan_rejection"
    
    user_notification = schemas.NotificationCreate(
        user_id=loan.user_id,
        title=notification_title,
        message=notification_message,
        type=notification_type,
        related_id=loan.id,
        from_user_id=admin_user.id
    )
    
    # Create notification after commit
    await create_notification_service(db, user_notification)
    
    return {
        "message": message,
        "loan_id": loan.id,
        "user_id": loan.user_id,
        "amount": loan.principal,
        "status": loan.approval_status,
        "action": approval_request.action,
        "reason": approval_request.reason
    }


@router.get("/pending-fixed-deposits", response_model=List[schemas.FixedDepositOut])
async def get_pending_fixed_deposits(
    skip: int = 0,
    limit: int = 100,
    admin_user: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all fixed deposits with pending approval (admin only)"""
    pending_fds = db.query(models.FixedDeposit).filter(
        models.FixedDeposit.approval_status == "pending"
    ).offset(skip).limit(limit).all()
    return pending_fds


@router.post("/approve-fixed-deposit")
async def approve_fixed_deposit(
    approval_request: schemas.ApprovalRequest,
    admin_user: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Approve or reject fixed deposit application (admin only)"""
    try:
        fd = db.query(models.FixedDeposit).filter(models.FixedDeposit.id == approval_request.item_id).first()
        if not fd:
            raise HTTPException(status_code=404, detail="Fixed deposit not found")
        
        if approval_request.action.lower() == "approve":
            fd.approval_status = "approved"
            fd.status = "active"
            message = f"Fixed deposit approved for user {fd.owner.username}"
        elif approval_request.action.lower() == "reject":
            fd.approval_status = "rejected"
            fd.status = "rejected"
            message = f"Fixed deposit rejected for user {fd.owner.username}"
        else:
            raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
        
        # Log the action
        audit_log = models.AuditLog(
            event_type="FD_APPROVAL",
            message=f"Admin {admin_user.username} {approval_request.action}d fixed deposit application for user {fd.owner.username}. Reason: {approval_request.reason or 'No reason provided'}"
        )
        db.add(audit_log)
        
        db.commit()
        db.refresh(fd)
        
        return {
            "message": message,
            "fd_id": fd.id,
            "user_id": fd.user_id,
            "amount": fd.principal,
            "status": fd.approval_status,
            "action": approval_request.action,
            "reason": approval_request.reason
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing approval: {str(e)}")