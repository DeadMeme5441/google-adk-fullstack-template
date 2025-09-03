from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from loguru import logger
import os
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from models.auth import User
from models.auth_orm import Base, UserORM
from .base import AuthBackend


class SQLAuthBackend(AuthBackend):
    def __init__(self, db_url: str):
        self.db_url = db_url
        self.engine = create_async_engine(self.db_url, echo=False, future=True)
        self.session_factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
            bind=self.engine, expire_on_commit=False
        )

    async def init(self) -> None:
        # Ensure directory for SQLite if applicable
        try:
            if self.db_url.startswith("sqlite") and ":memory:" not in self.db_url:
                if ":///" in self.db_url:
                    path = self.db_url.split(":///", 1)[1]
                    dirpath = os.path.dirname(path)
                    if dirpath:
                        os.makedirs(dirpath, exist_ok=True)
        except Exception:
            # Non-fatal; SQLAlchemy may still handle
            pass
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Auth SQL tables ensured (migrated)")

    async def get_by_email_or_username(self, identifier: str) -> Optional[User]:
        async with self.session_factory() as session:
            stmt = select(UserORM).where((UserORM.email == identifier) | (UserORM.username == identifier))
            res = await session.execute(stmt)
            orm = res.scalar_one_or_none()
            if not orm:
                return None
            return User(
                id=orm.id,
                email=orm.email,
                username=orm.username,
                hashed_password=orm.hashed_password,
                created_at=orm.created_at,
                is_active=orm.is_active,
            )

    async def get_by_id(self, user_id: str) -> Optional[User]:
        async with self.session_factory() as session:
            res = await session.execute(select(UserORM).where(UserORM.id == user_id))
            orm = res.scalar_one_or_none()
            if not orm:
                return None
            return User(
                id=orm.id,
                email=orm.email,
                username=orm.username,
                hashed_password=orm.hashed_password,
                created_at=orm.created_at,
                is_active=orm.is_active,
            )

    async def create_user(self, user: User) -> User:
        async with self.session_factory() as session:
            orm = UserORM(
                id=user.id,
                email=user.email,
                username=user.username,
                hashed_password=user.hashed_password,
                created_at=user.created_at,
                is_active=user.is_active,
            )
            session.add(orm)
            await session.commit()
            return user
