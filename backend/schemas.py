from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    store_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool

    class Config:
        from_attributes = True

class StoreResponse(BaseModel):
    id: int
    name: str
    owner_id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str


class LoginResponse(Token):
    store_id: int

class TransactionCreate(BaseModel):
    amount: int

class TransactionResponse(BaseModel):
    id: str
    store_id: int
    amount: int
    status: str
    created_at: datetime
    qr_url: Optional[str] = None

    class Config:
        from_attributes = True
