"""Authentication models and schemas"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class User(BaseModel):
    """User document model for MongoDB"""
    id: str
    email: EmailStr
    username: str
    hashed_password: str
    created_at: datetime
    is_active: bool = True


class UserCreate(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    """Schema for user login"""
    email_or_username: str
    password: str


class UserResponse(BaseModel):
    """Schema for user data in API responses (without sensitive fields)"""
    id: str
    email: str
    username: str
    created_at: datetime
    is_active: bool


class AuthResponse(BaseModel):
    """Schema for authentication response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Schema for JWT token payload"""
    user_id: str
    exp: datetime