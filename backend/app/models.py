from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
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
    
    # Additional profile fields
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    address = Column(String, nullable=True)

    accounts = relationship("Account", back_populates="owner")
    fixed_deposits = relationship("FixedDeposit", back_populates="owner")
    loans = relationship("Loan", back_populates="owner")
    cards = relationship("Card", back_populates="owner")


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


class FixedDeposit(Base):
    __tablename__ = "fixed_deposits"

    id = Column(Integer, primary_key=True, index=True)
    fd_number = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    principal = Column(Float, nullable=False)
    rate = Column(Float, nullable=False)
    start_date = Column(Date, nullable=False)
    maturity_date = Column(Date, nullable=False)
    tenure_months = Column(Integer, nullable=False)
    status = Column(String, default="ACTIVE")
    maturity_amount = Column(Float, nullable=True)

    owner = relationship("User", back_populates="fixed_deposits")


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    loan_type = Column(String, nullable=False)  # 'Home', 'Personal', 'Auto'
    principal = Column(Float, nullable=False)
    rate = Column(Float, nullable=False)  # annual %
    tenure_months = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    emi = Column(Float, nullable=False)
    total_payable = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    outstanding = Column(Float, nullable=False)
    next_due_date = Column(Date, nullable=True)
    status = Column(String, default="ACTIVE")  # ACTIVE, CLOSED, DEFAULTED
    account_ref = Column(String, nullable=True)

    owner = relationship("User", back_populates="loans")


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    card_number = Column(String, unique=True, nullable=False)
    card_type = Column(String, nullable=False)  # 'Premium', 'Platinum', 'Gold', 'Standard'
    card_holder = Column(String, nullable=False)
    expiry_date = Column(String, nullable=False)  # MM/YY format
    cvv = Column(String, nullable=False)
    pin = Column(String, nullable=False)  # Hashed 4-digit PIN
    credit_limit = Column(Float, default=0.0)
    available_credit = Column(Float, default=0.0)
    status = Column(String, default="PENDING")  # PENDING, ACTIVE, BLOCKED, EXPIRED
    issued_date = Column(Date, nullable=True)
    gradient_colors = Column(String, nullable=True)  # Store gradient class for UI

    owner = relationship("User", back_populates="cards")