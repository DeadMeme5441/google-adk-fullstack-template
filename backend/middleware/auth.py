"""Authentication middleware for protecting routes"""

from fastapi import HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Annotated
from motor.motor_asyncio import AsyncIOMotorDatabase

from services.auth import AuthService
from models.auth import User
from config import settings


# HTTP Bearer scheme for extracting tokens from Authorization header
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


def get_auth_service(request: Request) -> AuthService:
    """Get AuthService instance from app state"""
    return request.app.state.auth_service


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)]
) -> User:
    """
    Get the current authenticated user from JWT token.
    Raises HTTPException if token is invalid or user not found.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify JWT token
    user_id = auth_service.verify_token(credentials.credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user = await auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_user_optional(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(optional_security)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)]
) -> Optional[User]:
    """
    Get the current authenticated user from JWT token.
    Returns None if no token is provided or if token is invalid.
    This is for endpoints that can work with or without authentication.
    """
    if not credentials:
        return None
    
    # Verify JWT token
    user_id = auth_service.verify_token(credentials.credentials)
    if not user_id:
        return None
    
    # Get user from database
    user = await auth_service.get_user_by_id(user_id)
    return user


async def get_current_user_id(
    current_user: Annotated[User, Depends(get_current_user)]
) -> str:
    """
    Get just the user ID from the current authenticated user.
    This is useful for endpoints that only need the user ID.
    """
    return current_user.id


async def get_current_user_id_optional(
    current_user: Annotated[Optional[User], Depends(get_current_user_optional)]
) -> Optional[str]:
    """
    Get just the user ID from the current authenticated user (optional).
    Returns None if no authenticated user.
    """
    return current_user.id if current_user else None