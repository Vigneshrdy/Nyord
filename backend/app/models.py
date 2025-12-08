from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Boolean
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
    role = Column(String, default="customer", nullable=False)  # 'customer', 'admin'
    
    # Approval and KYC fields
    status = Column(String, default="pending", nullable=False)  # 'pending', 'approved', 'rejected', 'suspended'
    kyc_approved = Column(Boolean, default=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approval_date = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Basic profile fields
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    address = Column(String, nullable=True)
    
    # KYC fields
    government_id = Column(String, nullable=True)
    id_type = Column(String, default="passport", nullable=True)  # 'passport', 'national_id', 'driving_license', 'other'
    occupation = Column(String, nullable=True)
    annual_income = Column(Float, nullable=True)
    employer_name = Column(String, nullable=True)
    employment_type = Column(String, nullable=True)  # 'employed', 'self_employed', 'unemployed', 'student', 'retired', 'other'
    nationality = Column(String, nullable=True)
    marital_status = Column(String, nullable=True)  # 'single', 'married', 'divorced', 'widowed', 'other'
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    emergency_contact_relation = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    accounts = relationship("Account", back_populates="owner", foreign_keys="[Account.user_id]")
    fixed_deposits = relationship("FixedDeposit", back_populates="owner", foreign_keys="[FixedDeposit.user_id]")
    loans = relationship("Loan", back_populates="owner", foreign_keys="[Loan.user_id]")
    cards = relationship("Card", back_populates="owner", foreign_keys="[Card.user_id]")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String, unique=True, index=True)
    account_type = Column(String, default="savings")  # 'savings' or 'current'
    balance = Column(Float, default=0.0)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Account approval fields
    status = Column(String, default="pending", nullable=False)  # 'pending', 'approved', 'rejected'
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approval_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="accounts", foreign_keys=[user_id])
    approver = relationship("User", foreign_keys=[approved_by])

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    src_account = Column(Integer, ForeignKey("accounts.id"))
    dest_account = Column(Integer, ForeignKey("accounts.id"))
    amount = Column(Float, nullable=False)
    status = Column(String, default="PENDING")  # PENDING, SUCCESS, FAILED
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Card-based transaction support - UNCOMMENT AFTER RUNNING fix_transactions_table.sql
    # src_card_id = Column(Integer, ForeignKey("cards.id"), nullable=True)  # Source card for card-to-account transfers
    # dest_card_id = Column(Integer, ForeignKey("cards.id"), nullable=True)  # Destination card for account-to-card transfers
    # transaction_type = Column(String, default="account_to_account")  # account_to_account, card_to_account, account_to_card, card_to_card

    # relationships (not mandatory but useful)
    src_acc_rel = relationship("Account", foreign_keys=[src_account])
    dest_acc_rel = relationship("Account", foreign_keys=[dest_account])
    # UNCOMMENT AFTER RUNNING fix_transactions_table.sql:
    # src_card_rel = relationship("Card", foreign_keys=[src_card_id])
    # dest_card_rel = relationship("Card", foreign_keys=[dest_card_id])


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
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)  # Link to specific account
    principal = Column(Float, nullable=False)
    rate = Column(Float, nullable=False)
    start_date = Column(Date, nullable=False)
    maturity_date = Column(Date, nullable=False)
    tenure_months = Column(Integer, nullable=False)
    status = Column(String, default="ACTIVE")
    maturity_amount = Column(Float, nullable=True)
    
    # Approval fields
    approval_status = Column(String, default="pending", nullable=False)  # 'pending', 'approved', 'rejected'
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approval_date = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    owner = relationship("User", back_populates="fixed_deposits", foreign_keys=[user_id])
    account = relationship("Account", foreign_keys=[account_id])


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
    
    # Approval fields
    approval_status = Column(String, default="pending", nullable=False)  # 'pending', 'approved', 'rejected'
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approval_date = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="loans", foreign_keys=[user_id])


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
    
    # Approval fields
    approval_status = Column(String, default="pending", nullable=False)  # 'pending', 'approved', 'rejected'
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approval_date = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="cards", foreign_keys=[user_id])


class ApprovalNotification(Base):
    __tablename__ = "approval_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    request_type = Column(String, nullable=False)  # 'kyc', 'card', 'loan', 'fixed_deposit', 'account_activation'
    request_id = Column(Integer, nullable=True)  # ID of the related request (card_id, loan_id, etc.)
    status = Column(String, default="pending", nullable=False)  # 'pending', 'approved', 'rejected'
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False)  # 'loan_request', 'card_request', 'transaction', 'approval', 'rejection', 'general'
    related_id = Column(Integer, nullable=True)  # ID of related entity (loan_id, card_id, transaction_id)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)
    
    # For admin notifications
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    user = relationship("User", foreign_keys=[user_id])
    from_user = relationship("User", foreign_keys=[from_user_id])