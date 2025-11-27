from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional

# ------------------ USER -------------------
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str


# ------------------ ACCOUNT -------------------
class AccountCreate(BaseModel):
    initial_balance: float = 0.0


class AccountOut(BaseModel):
    id: int
    account_number: str
    balance: float

    class Config:
        from_attributes = True


# ------------------ TOKEN -------------------
class Token(BaseModel):
    access_token: str
    token_type: str

class TransactionCreate(BaseModel):
    src_account: int
    dest_account: int
    amount: float


class TransactionOut(BaseModel):
    id: int
    src_account: int
    dest_account: int
    amount: float
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True


# ------------------ FIXED DEPOSITS -------------------
class FixedDepositCreate(BaseModel):
    principal: float
    rate: float
    start_date: date
    tenure_months: int


class FixedDepositOut(BaseModel):
    id: int
    fd_number: str
    user_id: int
    principal: float
    rate: float
    start_date: date
    maturity_date: date
    tenure_months: int
    status: str
    maturity_amount: Optional[float] = None

    class Config:
        from_attributes = True


# ------------------ LOANS -------------------
class LoanCreate(BaseModel):
    loan_type: str
    principal: float
    rate: float  # annual %
    tenure_months: int
    start_date: date
    account_ref: Optional[str] = None


class LoanOut(BaseModel):
    id: int
    user_id: int
    loan_type: str
    principal: float
    rate: float
    tenure_months: int
    start_date: date
    emi: float
    total_payable: float
    amount_paid: float
    outstanding: float
    next_due_date: Optional[date]
    status: str
    account_ref: Optional[str] = None

    class Config:
        from_attributes = True


class LoanPayment(BaseModel):
    amount: float


# ------------------ CARDS -------------------
class CardCreate(BaseModel):
    card_type: str  # 'Premium', 'Platinum', 'Gold', 'Standard'
    credit_limit: float = 5000.0
    pin: str  # 4-digit PIN


class CardOut(BaseModel):
    id: int
    user_id: int
    card_number: str
    card_type: str
    card_holder: str
    expiry_date: str
    cvv: str
    credit_limit: float
    available_credit: float
    status: str
    issued_date: Optional[date]
    gradient_colors: Optional[str]

    class Config:
        from_attributes = True


class CardBlockRequest(BaseModel):
    pin: str  # 4-digit PIN for verification