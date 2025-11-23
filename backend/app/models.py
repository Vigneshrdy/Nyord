from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import DateTime, Text
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    accounts = relationship("Account", back_populates="owner")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String, unique=True, index=True)
    balance = Column(Float, default=0.0)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="accounts")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    src_account = Column(Integer, ForeignKey("accounts.id"))
    dest_account = Column(Integer, ForeignKey("accounts.id"))
    amount = Column(Float, nullable=False)
    status = Column(String, default="PENDING")  # PENDING, SUCCESS, FAILED
    timestamp = Column(DateTime, default=datetime.utcnow)

    # relationships (not mandatory but useful)
    src_acc_rel = relationship("Account", foreign_keys=[src_account])
    dest_acc_rel = relationship("Account", foreign_keys=[dest_account])


class AuditLog(Base):
    __tablename__ = "auditlogs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True)
    message = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)