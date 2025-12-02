from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, timedelta
from ..database import get_db
from ..models import Loan, User
from ..schemas import LoanCreate, LoanOut, LoanPayment, NotificationCreate
from ..utils import get_current_user
from .notification_router import create_notification_service
import math
import pika
import json

router = APIRouter(prefix="/loans", tags=["Loans"]) 

ALLOWED_TYPES = {"Home", "Personal", "Auto"}


def _compute_emi(principal: float, annual_rate: float, months: int) -> float:
    r = annual_rate / 12 / 100
    if r == 0:
        return round(principal / months, 2)
    emi = principal * r * ((1 + r) ** months) / (((1 + r) ** months) - 1)
    return round(emi, 2)


def _publish_ws_event(event: dict):
    connection = pika.BlockingConnection(pika.ConnectionParameters("127.0.0.1"))
    channel = connection.channel()
    channel.exchange_declare(exchange="ws_events", exchange_type="fanout", durable=True)
    channel.basic_publish(exchange="ws_events", routing_key="", body=json.dumps(event))
    connection.close()


@router.get("/me", response_model=list[LoanOut])
def list_my_loans(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    return loans


@router.post("/", response_model=LoanOut, status_code=status.HTTP_201_CREATED)
async def apply_loan(payload: LoanCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.loan_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Invalid loan type")
    if payload.principal <= 0:
        raise HTTPException(status_code=400, detail="Principal must be positive")
    if payload.rate <= 0:
        raise HTTPException(status_code=400, detail="Rate must be positive")
    if payload.tenure_months <= 0:
        raise HTTPException(status_code=400, detail="Tenure must be positive months")

    emi = _compute_emi(payload.principal, payload.rate, payload.tenure_months)
    total_payable = round(emi * payload.tenure_months, 2)
    outstanding = total_payable

    next_due = payload.start_date + timedelta(days=30)

    loan = Loan(
        user_id=current_user.id,
        loan_type=payload.loan_type,
        principal=payload.principal,
        rate=payload.rate,
        tenure_months=payload.tenure_months,
        start_date=payload.start_date,
        emi=emi,
        total_payable=total_payable,
        amount_paid=0.0,
        outstanding=outstanding,
        next_due_date=next_due,
        status="ACTIVE",
        account_ref=payload.account_ref,
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)

    # Create notifications
    # 1. Notification for user
    user_notification = NotificationCreate(
        user_id=current_user.id,
        title="Loan Application Submitted",
        message=f"Your {payload.loan_type} loan application for ${payload.principal:,.2f} has been submitted and is pending approval.",
        type="loan_request",
        related_id=loan.id
    )
    await create_notification_service(db, user_notification)
    
    # 2. Notification for admins
    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        admin_notification = NotificationCreate(
            user_id=admin.id,
            title="New Loan Application",
            message=f"{current_user.username} has applied for a {payload.loan_type} loan of ${payload.principal:,.2f}",
            type="loan_request",
            related_id=loan.id,
            from_user_id=current_user.id
        )
        await create_notification_service(db, admin_notification)

    _publish_ws_event({
        "type": "loan.created",
        "loan_id": loan.id,
        "user_id": loan.user_id,
        "principal": loan.principal,
        "emi": loan.emi,
        "outstanding": loan.outstanding,
    })

    return loan


@router.post("/{loan_id}/pay", response_model=LoanOut)
def pay_loan(loan_id: int, payment: LoanPayment, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payment.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment must be positive")

    loan = db.query(Loan).filter(Loan.id == loan_id, Loan.user_id == current_user.id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if loan.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Loan is not active")

    loan.amount_paid = round(loan.amount_paid + payment.amount, 2)
    loan.outstanding = round(max(loan.total_payable - loan.amount_paid, 0.0), 2)

    # Advance next due by ~30 days
    if loan.outstanding > 0:
        loan.next_due_date = (loan.next_due_date or date.today()) + timedelta(days=30)
    else:
        loan.status = "CLOSED"
        loan.next_due_date = None

    db.commit()
    db.refresh(loan)

    _publish_ws_event({
        "type": "loan.payment",
        "loan_id": loan.id,
        "user_id": loan.user_id,
        "amount": payment.amount,
        "outstanding": loan.outstanding,
        "status": loan.status,
    })

    return loan
