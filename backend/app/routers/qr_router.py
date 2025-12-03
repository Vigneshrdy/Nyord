from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..utils import get_current_user
from ..qr_utils import generate_user_qr_code, generate_user_qr_hash, verify_qr_code
from typing import Optional

router = APIRouter(prefix="/qr", tags=["QR Codes"])

@router.get("/generate/{user_id}")
def generate_qr_for_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate QR code for a specific user. 
    Users can only generate their own QR code, admins can generate for any user.
    """
    # Check if user is requesting their own QR or if they're admin
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only generate QR code for your own account"
        )
    
    # Get the target user
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Prepare user data for QR code
    user_data = {
        "full_name": target_user.full_name,
        "email": target_user.email,
        "username": target_user.username
    }
    
    # Generate QR code
    qr_code_base64 = generate_user_qr_code(target_user.id, user_data)
    qr_hash = generate_user_qr_hash(target_user.id)
    
    return {
        "user_id": target_user.id,
        "username": target_user.username,
        "full_name": target_user.full_name,
        "qr_code": qr_code_base64,
        "qr_hash": qr_hash,
        "generated_by": current_user.id,
        "message": "QR code generated successfully"
    }

@router.get("/verify/{user_id}")
def verify_user_qr(
    user_id: int,
    qr_hash: str = Query(..., description="QR hash to verify"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify if a QR hash belongs to the specified user.
    """
    # Generate expected hash for the user
    expected_hash = generate_user_qr_hash(user_id)
    
    # Check if the provided hash matches
    is_valid = qr_hash == expected_hash
    
    # Get user info if valid
    user_info = None
    if is_valid:
        target_user = db.query(User).filter(User.id == user_id).first()
        if target_user:
            user_info = {
                "id": target_user.id,
                "username": target_user.username,
                "full_name": target_user.full_name,
                "email": target_user.email
            }
    
    return {
        "valid": is_valid,
        "user_id": user_id,
        "user_info": user_info,
        "verified_by": current_user.id,
        "message": "QR verification completed"
    }

@router.get("/admin/all-users")
def get_all_user_qr_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return")
):
    """
    Admin endpoint to get QR info for all users.
    """
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    users = db.query(User).offset(skip).limit(limit).all()
    
    user_qr_list = []
    for user in users:
        qr_hash = generate_user_qr_hash(user.id)
        user_qr_list.append({
            "user_id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "qr_hash": qr_hash,
            "role": user.role,
            "status": user.status
        })
    
    return {
        "users": user_qr_list,
        "total": len(user_qr_list),
        "skip": skip,
        "limit": limit
    }

@router.get("/user/{user_id}/info")
def get_user_qr_info_by_id(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get QR information for a specific user by ID.
    Users can only access their own info, admins can access any user's info.
    """
    # Check permissions
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own QR information"
        )
    
    # Get user
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    qr_hash = generate_user_qr_hash(target_user.id)
    
    return {
        "user_id": target_user.id,
        "username": target_user.username,
        "full_name": target_user.full_name,
        "email": target_user.email,
        "qr_hash": qr_hash,
        "qr_type": "user_profile",
        "app": "Nyord Banking",
        "accessed_by": current_user.id
    }