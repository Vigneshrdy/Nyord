from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from . import models, utils
from .database import get_db

# Testing endpoints:
#  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NjM3MjIxNDB9.hp892mtm3CAo3yT9LYc7benh5Pkpw0jgV749mcJYCyA

def register_user(user_data, db: Session):
    existing = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_pw = utils.hash_password(user_data.password)

    new_user = models.User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pw,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def login_user(user_data, db: Session):
    user = db.query(models.User).filter(models.User.username == user_data.username).first()

    if not user or not utils.verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = utils.create_access_token({"user_id": user.id})
    return {"access_token": token, "token_type": "bearer"}