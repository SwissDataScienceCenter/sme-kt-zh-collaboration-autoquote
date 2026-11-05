from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, Field


class QuoteConfigurationInput(BaseModel):
    extra_margin_percentage: float = Field(ge=0)
    business_rules: str = Field(min_length=1)


class QuoteConfiguration(QuoteConfigurationInput):
    id: str
    create_timestamp: int
    update_timestamp: int


class QuoteConfigurationPreview(BaseModel):
    system_prompt: str
    prompt: str
    tools: list[dict[str, Any]]


class QuoteConfigurationDatabase(ABC):
    """
    Stores the single quote configuration shared by all users. The implementation is given the default it starts from, so reading it always
    returns one.
    """

    @abstractmethod
    async def get_quote_configuration(self) -> QuoteConfiguration:
        pass

    @abstractmethod
    async def update_quote_configuration(self, configuration_input: QuoteConfigurationInput) -> QuoteConfiguration:
        pass
