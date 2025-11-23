from pydantic import BaseModel
from datetime import datetime

# ------------------ USER -------------------
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        orm_mode = True


# ------------------ ACCOUNT -------------------
class AccountCreate(BaseModel):
    initial_balance: float = 0.0


class AccountOut(BaseModel):
    id: int
    account_number: str
    balance: float

    class Config:
        orm_mode = True


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
        orm_mode = True