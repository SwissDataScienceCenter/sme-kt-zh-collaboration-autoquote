from abc import ABC, abstractmethod
from enum import StrEnum
from typing import Any

from pydantic import BaseModel


class LLMRole(StrEnum):
    SYSTEM = "system"
    USER = "user"


class LLMMessage(BaseModel):
    role: LLMRole
    content: str


class LLM(ABC):
    """
    Generates completions from a conversation. Raises LLMResponseError when no usable answer comes back,
    e.g. the server cannot be reached, the response is empty, its JSON cannot be parsed or the forced tool was not called.
    """

    @abstractmethod
    async def generate_text(self, messages: list[LLMMessage]) -> str:
        pass

    @abstractmethod
    async def generate_json(self, messages: list[LLMMessage], json_schema: dict[str, Any], schema_name: str) -> dict[str, Any]:
        pass

    @abstractmethod
    async def call_tool(self, messages: list[LLMMessage], tool: dict[str, Any]) -> dict[str, Any]:
        """Forces the model to call the given function tool once and returns the arguments of that call."""
        pass
