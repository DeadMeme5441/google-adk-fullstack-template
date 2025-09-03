from __future__ import annotations

from typing import Dict, Optional
from models.auth import User
from .base import AuthBackend


class InMemoryAuthBackend(AuthBackend):
    def __init__(self):
        self._users_by_id: Dict[str, User] = {}
        self._id_by_email: Dict[str, str] = {}
        self._id_by_username: Dict[str, str] = {}

    async def get_by_email_or_username(self, identifier: str) -> Optional[User]:
        user_id = self._id_by_email.get(identifier) or self._id_by_username.get(identifier)
        return self._users_by_id.get(user_id) if user_id else None

    async def get_by_id(self, user_id: str) -> Optional[User]:
        return self._users_by_id.get(user_id)

    async def create_user(self, user: User) -> User:
        self._users_by_id[user.id] = user
        self._id_by_email[user.email] = user.id
        self._id_by_username[user.username] = user.id
        return user

