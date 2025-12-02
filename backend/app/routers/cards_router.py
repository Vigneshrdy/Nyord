from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, timedelta
from ..database import get_db
from ..models import Card, User
from ..schemas import CardCreate, CardOut, CardBlockRequest, CardChangePinRequest, NotificationCreate
from ..utils import get_current_user, hash_password, verify_password
from .notification_router import create_notification_service
import random
from dateutil.relativedelta import relativedelta

router = APIRouter(prefix="/cards", tags=["Cards"])

CARD_TYPE_GRADIENTS = {
    "Premium": "from-blue-600 to-blue-800",
    "Platinum": "from-purple-600 to-pink-600",
    "Gold": "from-amber-500 to-yellow-600",
    "Standard": "from-gray-600 to-gray-800",
}

CARD_TYPE_LIMITS = {
    "Premium": 50000.0,
    "Platinum": 25000.0,
    "Gold": 15000.0,
    "Standard": 5000.0,
}


def _generate_card_number():
    """Generate a random 16-digit card number"""
    return f"{random.randint(1000, 9999)} {random.randint(1000, 9999)} {random.randint(1000, 9999)} {random.randint(1000, 9999)}"


def _generate_cvv():
    """Generate a random 3-digit CVV"""
    return str(random.randint(100, 999))


def _generate_expiry():
    """Generate expiry date 3 years from now in MM/YY format"""
    future = date.today() + relativedelta(years=3)
    return future.strftime("%m/%y")


@router.get("/me", response_model=list[CardOut])
def list_my_cards(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all cards for the current user"""
    cards = db.query(Card).filter(Card.user_id == current_user.id).all()
    return cards


@router.post("/", response_model=CardOut, status_code=status.HTTP_201_CREATED)
async def request_card(
    card_data: CardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request a new card"""
    if card_data.card_type not in CARD_TYPE_GRADIENTS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid card type. Choose from: {', '.join(CARD_TYPE_GRADIENTS.keys())}"
        )
    
    # Validate PIN is 4 digits
    if not card_data.pin or len(card_data.pin) != 4 or not card_data.pin.isdigit():
        raise HTTPException(
            status_code=400,
            detail="PIN must be exactly 4 digits"
        )
    
    # Use predefined limit for the card type, or provided limit
    credit_limit = CARD_TYPE_LIMITS.get(card_data.card_type, card_data.credit_limit)
    
    # Generate card details
    card_number = _generate_card_number()
    cvv = _generate_cvv()
    expiry = _generate_expiry()
    card_holder = (current_user.full_name or current_user.username or "CARD HOLDER").upper()
    gradient = CARD_TYPE_GRADIENTS.get(card_data.card_type, "from-gray-600 to-gray-800")
    
    # Hash the PIN
    hashed_pin = hash_password(card_data.pin)
    
    # Create card with PENDING status for approval workflow
    new_card = Card(
        user_id=current_user.id,
        card_number=card_number,
        card_type=card_data.card_type,
        card_holder=card_holder,
        expiry_date=expiry,
        cvv=cvv,
        pin=hashed_pin,
        credit_limit=credit_limit,
        available_credit=0.0,  # No credit until approved
        status="PENDING",
        issued_date=date.today(),
        gradient_colors=gradient,
    )
    
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    
    # Create notifications
    # 1. Notification for user
    user_notification = NotificationCreate(
        user_id=current_user.id,
        title="Card Application Submitted",
        message=f"Your {card_data.card_type} card application has been submitted successfully. It is currently pending approval. You will be notified once it's reviewed.",
        type="card_request",
        related_id=new_card.id
    )
    await create_notification_service(db, user_notification)
    
    # 2. Notification for admins
    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        admin_notification = NotificationCreate(
            user_id=admin.id,
            title="New Card Application",
            message=f"{current_user.username} has applied for a {card_data.card_type} card with requested credit limit ${credit_limit:,.2f}. Please review and approve/reject the application.",
            type="card_request",
            related_id=new_card.id,
            from_user_id=current_user.id
        )
        await create_notification_service(db, admin_notification)
    
    return new_card


@router.get("/{card_id}", response_model=CardOut)
def get_card(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details of a specific card"""
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    return card

@router.post("/{card_id}/verify-pin")
def verify_card_pin(
    card_id: int,
    payload: CardBlockRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify the provided PIN for the card belongs to the current user."""
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()

    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    if not verify_password(payload.pin, card.pin):
        raise HTTPException(status_code=401, detail="Invalid PIN")

    return {"message": "PIN verified"}

@router.post("/{card_id}/change-pin")
def change_pin(
    card_id: int,
    payload: CardChangePinRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change card PIN: verify current PIN then set new PIN."""
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()

    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # Verify existing PIN
    if not verify_password(payload.current_pin, card.pin):
        raise HTTPException(status_code=401, detail="Invalid current PIN")

    # Validate new PIN format
    if not payload.new_pin or len(payload.new_pin) != 4 or not payload.new_pin.isdigit():
        raise HTTPException(status_code=400, detail="New PIN must be exactly 4 digits")

    # Hash and update
    card.pin = hash_password(payload.new_pin)
    db.commit()

    return {"message": "PIN updated successfully"}

@router.post("/{card_id}/block", response_model=CardOut)
def block_card(
    card_id: int,
    block_data: CardBlockRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Block a card - requires PIN verification"""
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if card.status == "BLOCKED":
        raise HTTPException(status_code=400, detail="Card is already blocked")
    
    # Verify PIN
    if not verify_password(block_data.pin, card.pin):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    card.status = "BLOCKED"
    db.commit()
    db.refresh(card)
    
    return card


@router.post("/{card_id}/unblock", response_model=CardOut)
def unblock_card(
    card_id: int,
    block_data: CardBlockRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unblock a card - requires PIN verification"""
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if card.status != "BLOCKED":
        raise HTTPException(status_code=400, detail="Card is not blocked")
    
    # Verify PIN
    if not verify_password(block_data.pin, card.pin):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    card.status = "ACTIVE"
    db.commit()
    db.refresh(card)
    
    return card


@router.post("/{card_id}/transfer")
async def card_transfer(
    card_id: int,
    transfer_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Transfer money using card to account"""
    # Verify card ownership and status
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id,
        Card.status == "ACTIVE"
    ).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Active card not found")
    
    # Verify PIN
    if not verify_password(transfer_data.get("pin", ""), card.pin):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    # Check available credit
    if card.available_credit < transfer_data.get("amount", 0):
        raise HTTPException(status_code=400, detail="Insufficient credit limit")
    
    # For card transfers, we deduct from available credit and add to destination account
    from ..models import Account, Transaction
    
    dest_acc = db.query(Account).filter(Account.id == transfer_data["dest_account"]).first()
    if not dest_acc:
        raise HTTPException(status_code=404, detail="Destination account not found")
    
    # Create transaction record
    new_txn = Transaction(
        src_card_id=card_id,
        dest_account=transfer_data["dest_account"],
        amount=transfer_data["amount"],
        status="SUCCESS",  # Card transfers are immediate
        transaction_type="card_to_account"
    )
    
    # Update card credit and destination account balance
    card.available_credit -= transfer_data["amount"]
    dest_acc.balance += transfer_data["amount"]
    
    db.add(new_txn)
    db.commit()
    db.refresh(new_txn)
    
    # Create notifications for card transfer
    user_notification = NotificationCreate(
        user_id=current_user.id,
        title="Card Transfer Sent",
        message=f"You transferred ${transfer_data['amount']:,.2f} from your {card.card_type} card to account {transfer_data['dest_account']}. Remaining credit: ${card.available_credit:,.2f}",
        type="transaction",
        related_id=new_txn.id
    )
    await create_notification_service(db, user_notification)
    
    # Notification for receiver
    dest_user = db.query(User).filter(User.id == dest_acc.user_id).first()
    if dest_user and dest_user.id != current_user.id:
        receiver_notification = NotificationCreate(
            user_id=dest_user.id,
            title="Transfer Received",
            message=f"You received ${transfer_data['amount']:,.2f} from {current_user.username}'s card. Your new balance is ${dest_acc.balance:,.2f}.",
            type="transaction",
            related_id=new_txn.id,
            from_user_id=current_user.id
        )
        await create_notification_service(db, receiver_notification)
    
    return new_txn
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if card.status != "BLOCKED":
        raise HTTPException(status_code=400, detail="Card is not blocked")
    
    card.status = "ACTIVE"
    db.commit()
    db.refresh(card)
    
    return card
