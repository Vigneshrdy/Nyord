from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserOut, UserUpdate, PasswordChange
from ..utils import get_current_user, hash_password, verify_password
from ..qr_utils import generate_user_qr_code, generate_user_qr_hash

router = APIRouter(prefix="/profile", tags=["Profile"]) 

@router.get("/me", response_model=UserOut)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's profile using the request DB session"""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.put("/update", response_model=UserOut)
def update_profile(
    profile_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile information using the request DB session"""

    # Re-fetch the current user with this DB session to avoid detached instance errors
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Check if email is being changed and if it's already taken
    if profile_data.email and profile_data.email != user.email:
        existing_user = db.query(User).filter(User.email == profile_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    # Update fields if provided
    if profile_data.full_name is not None:
        user.full_name = profile_data.full_name
    if profile_data.email is not None:
        user.email = profile_data.email
    if profile_data.phone is not None:
        user.phone = profile_data.phone
    if profile_data.date_of_birth is not None:
        user.date_of_birth = profile_data.date_of_birth
    if profile_data.address is not None:
        user.address = profile_data.address

    db.commit()
    db.refresh(user)

    return user

@router.post("/change-password")
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password using the request DB session"""

    # Re-fetch the current user with this DB session to avoid detached instance errors
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Verify current password
    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Hash new password
    hashed_new_password = hash_password(password_data.new_password)

    # Update password
    user.hashed_password = hashed_new_password
    db.commit()

    return {"message": "Password changed successfully"}

@router.get("/qr-code")
def get_user_qr_code(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a unique QR code for the current user.
    The QR code will always be the same for the same user.
    """
    # Re-fetch user to ensure we have complete data
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Prepare user data for QR code
    user_data = {
        "full_name": user.full_name,
        "email": user.email,
        "username": user.username
    }
    
    # Generate QR code
    qr_code_base64 = generate_user_qr_code(user.id, user_data)
    qr_hash = generate_user_qr_hash(user.id)
    
    return {
        "user_id": user.id,
        "qr_code": qr_code_base64,
        "qr_hash": qr_hash,
        "message": "QR code generated successfully"
    }

@router.get("/qr-info")
def get_qr_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get QR code information without generating the full image.
    Useful for getting just the hash or checking QR status.
    """
    qr_hash = generate_user_qr_hash(current_user.id)
    
    return {
        "user_id": current_user.id,
        "qr_hash": qr_hash,
        "qr_type": "user_profile",
        "app": "Nyord Banking"
    }
