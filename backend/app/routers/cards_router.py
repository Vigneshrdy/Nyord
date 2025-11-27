from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, timedelta
from ..database import get_db
from ..models import Card, User
from ..schemas import CardCreate, CardOut, CardBlockRequest
from ..utils import get_current_user, hash_password, verify_password
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
def request_card(
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
    
    # Create card with ACTIVE status (or PENDING if you want approval workflow)
    new_card = Card(
        user_id=current_user.id,
        card_number=card_number,
        card_type=card_data.card_type,
        card_holder=card_holder,
        expiry_date=expiry,
        cvv=cvv,
        pin=hashed_pin,
        credit_limit=credit_limit,
        available_credit=credit_limit,  # Initially full credit available
        status="ACTIVE",
        issued_date=date.today(),
        gradient_colors=gradient,
    )
    
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    
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
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if card.status != "BLOCKED":
        raise HTTPException(status_code=400, detail="Card is not blocked")
    
    card.status = "ACTIVE"
    db.commit()
    db.refresh(card)
    
    return card
