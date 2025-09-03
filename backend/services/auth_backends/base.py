from __future__ import annotations

from typing import Optional
from models.auth import User


class AuthBackend:
    async def init(self) -> None:  # optional setup/migrations
        return None

    async def get_by_email_or_username(self, identifier: str) -> Optional[User]:
        raise NotImplementedError

    async def get_by_id(self, user_id: str) -> Optional[User]:
        raise NotImplementedError

    async def create_user(self, user: User) -> User:
        raise NotImplementedError

