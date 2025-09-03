"""Authentication routes for user login, registration, and profile management"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated
from loguru import logger

from models.auth import UserCreate, UserLogin, AuthResponse, UserResponse
from services.auth import AuthService
from middleware.auth import get_auth_service, get_current_user


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    auth_service: Annotated[AuthService, Depends(get_auth_service)]
) -> AuthResponse:
    """
    Register a new user account.
    
    - **email**: Valid email address (must be unique)
    - **username**: Username (3-50 characters, must be unique)
    - **password**: Password (6-100 characters)
    
    Returns JWT access token and user information.
    """
    try:
        # Create the user
        user = await auth_service.register_user(user_data)
        
        # Generate access token
        access_token = auth_service.create_access_token(user.id)
        
        # Convert user to response format
        user_response = await auth_service.get_user_response(user)
        
        logger.info(f"User registered successfully: {user.username}")
        
        return AuthResponse(
            access_token=access_token,
            user=user_response
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: UserLogin,
    auth_service: Annotated[AuthService, Depends(get_auth_service)]
) -> AuthResponse:
    """
    Authenticate user and return access token.
    
    - **email_or_username**: Email address or username
    - **password**: User's password
    
    Returns JWT access token and user information.
    """
    try:
        # Authenticate user
        user = await auth_service.authenticate_user(
            credentials.email_or_username,
            credentials.password
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Generate access token
        access_token = auth_service.create_access_token(user.id)
        
        # Convert user to response format
        user_response = await auth_service.get_user_response(user)
        
        logger.info(f"User logged in successfully: {user.username}")
        
        return AuthResponse(
            access_token=access_token,
            user=user_response
        )
        
    except HTTPException:
        # Re-raise HTTPException as-is
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[UserResponse, Depends(get_current_user)]
) -> UserResponse:
    """
    Get current authenticated user's information.
    
    Requires valid JWT token in Authorization header.
    """
    return await current_user


@router.post("/logout")
async def logout():
    """
    Logout endpoint (for consistency with frontend).
    
    Since we're using JWTs, logout is handled client-side by removing the token.
    This endpoint exists for API completeness and future extensions
    (like token blacklisting if needed).
    """
    return {"message": "Successfully logged out"}


@router.get("/health")
async def auth_health():
    """Health check endpoint for auth service"""
    return {"status": "healthy", "service": "auth"}