from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from . import models, utils
from .database import get_db
from datetime import datetime
import random
import asyncio


def get_current_user(token: str = Depends(utils.get_token_from_header), db: Session = Depends(get_db)):
    """Get current authenticated user from token"""
    payload = utils.verify_access_token(token)
    user_id = payload.get("user_id")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


def get_current_user_from_token(token: str, db: Session):
    """Get current user from raw token (for WebSocket authentication)"""
    payload = utils.verify_access_token(token)
    user_id = payload.get("user_id")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


def get_admin_user(current_user: models.User = Depends(get_current_user)):
    """Verify current user is an admin"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def create_admin_user(username: str, email: str, password: str, db: Session):
    """Create the first admin user (for setup purposes)"""
    existing = db.query(models.User).filter(models.User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    existing_email = db.query(models.User).filter(models.User.email == email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = utils.hash_password(password)

    admin_user = models.User(
        username=username,
        email=email,
        hashed_password=hashed_pw,
        role="admin",
        full_name="System Administrator"
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    return admin_user

# Testing endpoints:
#  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NjM3MjIxNDB9.hp892mtm3CAo3yT9LYc7benh5Pkpw0jgV749mcJYCyA

def register_user(user_data, db: Session):
    existing = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    existing_email = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = utils.hash_password(user_data.password)

    new_user = models.User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pw,
        role=user_data.role if hasattr(user_data, 'role') else "customer",
        status="pending",  # All new users need approval
        kyc_approved=False,
        full_name=user_data.full_name,
        phone=user_data.phone,
        date_of_birth=user_data.date_of_birth,
        address=user_data.address,
        nationality=user_data.nationality,
        government_id=user_data.government_id,
        id_type=user_data.id_type,
        occupation=user_data.occupation,
        annual_income=user_data.annual_income,
        employer_name=user_data.employer_name,
        employment_type=user_data.employment_type,
        marital_status=user_data.marital_status,
        emergency_contact_name=user_data.emergency_contact_name,
        emergency_contact_phone=user_data.emergency_contact_phone,
        emergency_contact_relation=user_data.emergency_contact_relation,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create KYC approval notification for admin
    kyc_notification = models.ApprovalNotification(
        user_id=new_user.id,
        request_type="kyc",
        request_id=new_user.id,
        status="pending",
        message=f"New KYC application from {new_user.full_name} ({new_user.username})"
    )
    db.add(kyc_notification)
    
    # Don't create account yet - wait for KYC approval
    db.commit()
    
    return new_user


def login_user(user_data, db: Session):
    user = db.query(models.User).filter(models.User.username == user_data.username).first()

    if not user or not utils.verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Check if user is approved (except for admins)
    if user.role == "customer" and user.status != "approved":
        if user.status == "pending":
            raise HTTPException(status_code=403, detail="Account pending approval. Please wait for admin verification.")
        elif user.status == "rejected":
            raise HTTPException(status_code=403, detail="Account has been rejected. Please contact support.")
        elif user.status == "suspended":
            raise HTTPException(status_code=403, detail="Account has been suspended. Please contact support.")

    token = utils.create_access_token({"user_id": user.id, "role": user.role})
    return {
        "access_token": token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "kyc_approved": user.kyc_approved,
            "full_name": user.full_name,
            "phone": user.phone,
            "date_of_birth": str(user.date_of_birth) if user.date_of_birth else None,
            "address": user.address
        }
    }