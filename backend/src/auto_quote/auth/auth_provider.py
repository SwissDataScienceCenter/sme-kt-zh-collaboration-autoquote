from abc import ABC, abstractmethod

from fastapi import Request, Response
from pydantic import BaseModel


class User(BaseModel):
    id: str


class AuthProvider(ABC):
    """Resolves the user behind a request. Used as a FastAPI dependency, so it may set headers or cookies on the response."""

    @abstractmethod
    async def get_current_user(self, request: Request, response: Response) -> User:
        pass
