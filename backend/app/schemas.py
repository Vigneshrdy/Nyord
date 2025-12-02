from pydantic import BaseModel, validator
from datetime import datetime, date
from typing import Optional, Union

# ------------------ USER -------------------
class UserCreate(BaseModel):
    # Basic account info
    username: str
    email: str
    password: str
    role: str = "customer"  # 'customer', 'admin'
    account_type: str = "savings"  # 'savings' or 'current'
    
    # Personal information (required for KYC)
    full_name: str
    phone: str
    date_of_birth: Optional[Union[date, str]] = None
    address: str
    nationality: str
    
    # Government ID information (required for KYC)
    government_id: str
    id_type: str = "passport"  # 'passport', 'national_id', 'driving_license', 'other'
    
    # Employment information (required for KYC)
    occupation: str
    annual_income: Optional[Union[float, str]] = None
    employer_name: Optional[str] = None
    employment_type: str = "employed"  # 'employed', 'self_employed', 'unemployed', 'student', 'retired', 'other'
    
    # Personal details (required for KYC)
    marital_status: str = "single"  # 'single', 'married', 'divorced', 'widowed', 'other'
    
    # Emergency contact (required for KYC)
    emergency_contact_name: str
    emergency_contact_phone: str
    emergency_contact_relation: str

    @validator('date_of_birth', pre=True)
    def validate_date_of_birth(cls, v):
        if v == "" or v is None:
            return None
        return v
    
    @validator('annual_income', pre=True)
    def validate_annual_income(cls, v):
        if v == "" or v is None:
            return None
        return float(v)

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    status: str  # 'pending', 'approved', 'rejected', 'suspended'
    kyc_approved: bool
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    nationality: Optional[str] = None
    government_id: Optional[str] = None
    id_type: Optional[str] = None
    occupation: Optional[str] = None
    annual_income: Optional[float] = None
    employer_name: Optional[str] = None
    employment_type: Optional[str] = None
    marital_status: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None

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
    account_type: str
    balance: float

    class Config:
        from_attributes = True


# ------------------ TOKEN -------------------
class Token(BaseModel):
    access_token: str
    token_type: str

class TransactionCreate(BaseModel):
    src_account: Optional[int] = None
    dest_account: Optional[int] = None
    amount: float
    
    # Card-based transfer support
    src_card_id: Optional[int] = None
    dest_card_id: Optional[int] = None
    transaction_type: str = "account_to_account"  # account_to_account, card_to_account, account_to_card, card_to_card
    card_pin: Optional[str] = None  # Required for card-based transactions


class TransactionOut(BaseModel):
    id: int
    src_account: Optional[int] = None
    dest_account: Optional[int] = None
    amount: float
    status: str
    timestamp: datetime
    
    # Card-based transfer fields
    src_card_id: Optional[int] = None
    dest_card_id: Optional[int] = None
    transaction_type: str = "account_to_account"

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
    approval_status: str
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
    approval_status: str
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
    approval_status: str
    issued_date: Optional[date]
    gradient_colors: Optional[str]

    class Config:
        from_attributes = True


class CardBlockRequest(BaseModel):
    pin: str  # 4-digit PIN for verification

class CardChangePinRequest(BaseModel):
    current_pin: str
    new_pin: str

    @classmethod
    def __get_validators__(cls):
        yield cls._validate_pins

    @staticmethod
    def _validate_pin_value(v: str) -> str:
        if not v or len(v) != 4 or not v.isdigit():
            raise ValueError('PIN must be a 4-digit number')
        return v

    @classmethod
    def _validate_pins(cls, values):
        # Pydantic v1-style validator fallback
        if isinstance(values, dict):
            for key in ('current_pin', 'new_pin'):
                if key in values:
                    values[key] = cls._validate_pin_value(values[key])
        return values


# ------------------ ADMIN -------------------
class AdminCreateUser(BaseModel):
    username: str
    email: str
    password: str
    role: str = "customer"
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    account_type: str = "savings"
    initial_balance: float = 10000.0


class AdminUserUpdate(BaseModel):
    role: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None


class AdminStats(BaseModel):
    total_users: int
    total_accounts: int
    total_balance: float
    total_transactions: int
    total_loans: int
    total_fixed_deposits: int
    total_cards: int
    pending_kyc: int
    pending_cards: int
    pending_loans: int
    pending_fds: int


# Approval schemas
class ApprovalRequest(BaseModel):
    item_id: int
    action: str  # 'approve' or 'reject'
    reason: Optional[str] = None


class ApprovalNotificationOut(BaseModel):
    id: int
    user_id: int
    request_type: str
    request_id: Optional[int]
    status: str
    message: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class KYCApprovalRequest(BaseModel):
    user_id: int
    action: str  # 'approve' or 'reject'
    reason: Optional[str] = None


# ------------------ NOTIFICATIONS -------------------
class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    type: str  # 'loan_request', 'card_request', 'transaction', 'approval', 'rejection', 'general'
    related_id: Optional[int] = None
    from_user_id: Optional[int] = None


class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    related_id: Optional[int] = None
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    from_user_id: Optional[int] = None
    from_user_name: Optional[str] = None  # We'll populate this manually

    class Config:
        from_attributes = True


class NotificationUpdate(BaseModel):
    is_read: bool = True


class NotificationStats(BaseModel):
    total_count: int
    unread_count: int