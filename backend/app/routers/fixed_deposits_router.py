from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date
from ..database import get_db
from ..models import FixedDeposit, User, Account
from ..schemas import FixedDepositCreate, FixedDepositOut, FixedDepositRenew
from ..utils import get_current_user

ALLOWED_RATES = {7.0, 8.0, 9.0, 10.0}

router = APIRouter(prefix="/fixed-deposits", tags=["FixedDeposits"])


def _add_months(source_date: date, months: int) -> date:
    # safe month add
    month = source_date.month - 1 + months
    year = source_date.year + month // 12
    month = month % 12 + 1
    # days per month
    mdays = [31, 29 if (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    day = min(source_date.day, mdays[month - 1])
    return date(year, month, day)


@router.get("/me", response_model=list[FixedDepositOut])
def list_my_fds(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List fixed deposits for current user"""
    fds = db.query(FixedDeposit).filter(FixedDeposit.user_id == current_user.id).order_by(FixedDeposit.id.desc()).all()
    return fds


@router.post("/", response_model=FixedDepositOut, status_code=status.HTTP_201_CREATED)
def create_fd(fd_in: FixedDepositCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new fixed deposit for the authenticated user"""
    if fd_in.rate not in ALLOWED_RATES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid rate. Allowed rates: 7, 8, 9, 10")
    if fd_in.tenure_months <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenure must be positive months")
    if fd_in.principal <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Principal must be positive")

    # Get the specified account
    user_account = db.query(Account).filter(
        Account.id == fd_in.account_id,
        Account.user_id == current_user.id
    ).first()
    
    if not user_account:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account not found or does not belong to you.")
    
    # Check if user has sufficient balance
    if user_account.balance < fd_in.principal:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient balance. Available: ${user_account.balance:.2f}")
    
    # Deduct FD amount from account balance
    user_account.balance -= fd_in.principal

    start = fd_in.start_date
    maturity = _add_months(start, fd_in.tenure_months)
    # Use compound interest with monthly compounding: A = P(1 + r/n)^(nt)
    # where n = 12 (monthly compounding), t = years
    years = fd_in.tenure_months / 12
    monthly_rate = fd_in.rate / 12 / 100  # Convert annual rate to monthly decimal
    maturity_amount = round(fd_in.principal * ((1 + monthly_rate) ** fd_in.tenure_months), 2)
    fd_number = f"FD{int(datetime.utcnow().timestamp())}{current_user.id}"

    fd = FixedDeposit(
        fd_number=fd_number,
        user_id=current_user.id,
        account_id=fd_in.account_id,
        principal=fd_in.principal,
        rate=fd_in.rate,
        start_date=start,
        maturity_date=maturity,
        tenure_months=fd_in.tenure_months,
        maturity_amount=maturity_amount,
        status="ACTIVE",
        approval_status="approved",  # Auto-approve for self-service
        approved_by=current_user.id,
        approval_date=datetime.utcnow(),
    )
    db.add(fd)
    db.commit()
    db.refresh(fd)
    return fd


@router.post("/{fd_id}/renew", response_model=FixedDepositOut, status_code=status.HTTP_201_CREATED)
def renew_fd(
    fd_id: int,
    renew_data: FixedDepositRenew,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Renew an existing active fixed deposit. Creates a new FD with same rate; marks old as RENEWED."""
    if renew_data.principal <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Principal must be positive")
    if renew_data.tenure_months <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenure must be positive months")

    old_fd = db.query(FixedDeposit).filter(FixedDeposit.id == fd_id, FixedDeposit.user_id == current_user.id).first()
    if not old_fd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fixed deposit not found")
    if old_fd.status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only ACTIVE deposits can be renewed")

    # Get the specified account
    user_account = db.query(Account).filter(
        Account.id == renew_data.account_id,
        Account.user_id == current_user.id
    ).first()
    
    if not user_account:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account not found or does not belong to you.")
    
    if user_account.balance < renew_data.principal:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient balance. Available: ${user_account.balance:.2f}")
    
    # Deduct renewal amount from account
    user_account.balance -= renew_data.principal

    # Mark old as renewed
    old_fd.status = "RENEWED"

    start = date.today()
    maturity = _add_months(start, renew_data.tenure_months)
    # Use compound interest with monthly compounding
    monthly_rate = old_fd.rate / 12 / 100
    maturity_amount = round(renew_data.principal * ((1 + monthly_rate) ** renew_data.tenure_months), 2)
    fd_number = f"FD{int(datetime.utcnow().timestamp())}{current_user.id}"

    new_fd = FixedDeposit(
        fd_number=fd_number,
        user_id=current_user.id,
        account_id=renew_data.account_id,
        principal=renew_data.principal,
        rate=old_fd.rate,  # keep same rate
        start_date=start,
        maturity_date=maturity,
        tenure_months=renew_data.tenure_months,
        maturity_amount=maturity_amount,
        status="ACTIVE",
        approval_status="approved",
        approved_by=current_user.id,
        approval_date=datetime.utcnow(),
    )
    db.add(new_fd)
    db.commit()
    db.refresh(new_fd)
    return new_fd


@router.post("/{fd_id}/cancel", response_model=FixedDepositOut)
def cancel_fd(
    fd_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel/premature withdrawal of an active fixed deposit with penalty"""
    fd = db.query(FixedDeposit).filter(
        FixedDeposit.id == fd_id,
        FixedDeposit.user_id == current_user.id
    ).first()
    
    if not fd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fixed deposit not found")
    
    if fd.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel FD with status {fd.status}. Only ACTIVE FDs can be cancelled."
        )
    
    # Get user's account
    user_account = db.query(Account).filter(Account.user_id == current_user.id).first()
    if not user_account:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No account found")
    
    # Calculate days elapsed
    today = date.today()
    days_elapsed = (today - fd.start_date).days
    total_days = (fd.maturity_date - fd.start_date).days
    
    # Penalty logic: 
    # - If cancelled within 3 months: Return principal - 2% penalty
    # - If cancelled after 3 months: Return principal + proportional interest - 1% penalty
    months_elapsed = days_elapsed / 30.44  # Average days per month
    
    if months_elapsed < 3:
        # Early cancellation - 2% penalty on principal
        penalty_rate = 0.02
        return_amount = fd.principal * (1 - penalty_rate)
        penalty_amount = fd.principal * penalty_rate
    else:
        # Partial tenure completed - give proportional interest with 1% penalty
        monthly_rate = fd.rate / 12 / 100
        months_completed = int(months_elapsed)
        interest_earned = fd.principal * ((1 + monthly_rate) ** months_completed) - fd.principal
        penalty_rate = 0.01
        penalty_amount = (fd.principal + interest_earned) * penalty_rate
        return_amount = fd.principal + interest_earned - penalty_amount
    
    # Credit the return amount to user's account
    user_account.balance += return_amount
    
    # Mark FD as cancelled
    fd.status = "CANCELLED"
    
    db.commit()
    db.refresh(fd)
    
    return fd
