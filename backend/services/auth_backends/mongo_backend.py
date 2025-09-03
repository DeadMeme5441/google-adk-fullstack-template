from __future__ import annotations

from datetime import datetime
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient
from models.auth import User
from .base import AuthBackend


class MongoAuthBackend(AuthBackend):
    def __init__(self, mongo_url: str, db_name: str):
        self.client = AsyncIOMotorClient(mongo_url)
        self.db = self.client[db_name]
        self.users = self.db.users

    async def init(self) -> None:
        await self.users.create_index("email", unique=True)
        await self.users.create_index("username", unique=True)

    async def get_by_email_or_username(self, identifier: str) -> Optional[User]:
        doc = await self.users.find_one({
            "$or": [{"email": identifier}, {"username": identifier}],
            "is_active": True,
        })
        if not doc:
            return None
        return User(**doc)

    async def get_by_id(self, user_id: str) -> Optional[User]:
        doc = await self.users.find_one({"id": user_id, "is_active": True})
        return User(**doc) if doc else None

    async def create_user(self, user: User) -> User:
        await self.users.insert_one(user.model_dump())
        return user

