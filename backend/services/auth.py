"""Authentication service orchestrator using pluggable backends with JWT."""

import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from loguru import logger

from models.auth import User, UserCreate, UserResponse
from config.settings import Settings
from services.auth_backends.base import AuthBackend
from services.auth_backends.sql_backend import SQLAuthBackend
from services.auth_backends.mongo_backend import MongoAuthBackend
from services.auth_backends.inmemory_backend import InMemoryAuthBackend


class AuthService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.backend: AuthBackend = self._select_backend()

    def _select_backend(self) -> AuthBackend:
        st = self.settings
        storage = st.auth_storage_type
        if storage == "auto":
            # Follow session service where practical; default to SQLite
            if st.session_service_type == "mongo":
                url = st.auth_mongo_url or st.mongo_url
                db = st.auth_mongo_db_name or st.mongo_db_name
                logger.info("Auth storage: auto -> Mongo (following session service)")
                return MongoAuthBackend(url, db)
            elif st.session_service_type == "database" and st.session_database_url:
                logger.info("Auth storage: auto -> SQL database (following session service)")
                return SQLAuthBackend(st.session_database_url)
            else:
                logger.info("Auth storage: auto -> default SQLite")
                return SQLAuthBackend(st.auth_db_url)
        elif storage in ("sqlite", "database"):
            logger.info("Auth storage: SQL database (%s)", st.auth_db_url)
            return SQLAuthBackend(st.auth_db_url)
        elif storage == "mongo":
            url = st.auth_mongo_url or st.mongo_url
            db = st.auth_mongo_db_name or st.mongo_db_name
            logger.info("Auth storage: MongoDB")
            return MongoAuthBackend(url, db)
        elif storage == "inmemory":
            logger.warning("Auth storage: InMemory (not persistent)")
            return InMemoryAuthBackend()
        else:
            logger.warning("Unknown auth storage type '%s', defaulting to SQLite", storage)
            return SQLAuthBackend(st.auth_db_url)

    async def init(self) -> None:
        await self.backend.init()

    def hash_password(self, password: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    def verify_password(self, password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))

    def create_access_token(self, user_id: str) -> str:
        expire = datetime.now(timezone.utc) + timedelta(days=self.settings.jwt_access_token_expire_days)
        payload = {"user_id": user_id, "exp": expire, "iat": datetime.now(timezone.utc)}
        return jwt.encode(payload, self.settings.jwt_secret_key, algorithm=self.settings.jwt_algorithm)

    def verify_token(self, token: str) -> Optional[str]:
        try:
            payload = jwt.decode(token, self.settings.jwt_secret_key, algorithms=[self.settings.jwt_algorithm])
            return payload.get("user_id")
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token expired")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Invalid JWT token")
            return None

    async def register_user(self, user_data: UserCreate) -> User:
        # Uniqueness check
        existing = await self.backend.get_by_email_or_username(user_data.email)
        if existing:
            raise ValueError("Email already registered")
        existing = await self.backend.get_by_email_or_username(user_data.username)
        if existing:
            raise ValueError("Username already taken")

        user_id = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
        user = User(
            id=user_id,
            email=user_data.email,
            username=user_data.username,
            hashed_password=self.hash_password(user_data.password),
            created_at=datetime.now(timezone.utc),
            is_active=True,
        )
        created = await self.backend.create_user(user)
        logger.info(f"New user registered: {created.username} ({created.email})")
        return created

    async def authenticate_user(self, email_or_username: str, password: str) -> Optional[User]:
        user = await self.backend.get_by_email_or_username(email_or_username)
        if not user:
            logger.warning(f"Authentication failed: user not found ({email_or_username})")
            return None
        if not self.verify_password(password, user.hashed_password):
            logger.warning(f"Authentication failed: invalid password ({email_or_username})")
            return None
        return user

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        return await self.backend.get_by_id(user_id)

    async def get_user_response(self, user: User) -> UserResponse:
        return UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            created_at=user.created_at,
            is_active=user.is_active,
        )
