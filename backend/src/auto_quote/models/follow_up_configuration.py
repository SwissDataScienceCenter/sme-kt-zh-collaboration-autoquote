from abc import ABC, abstractmethod

from pydantic import BaseModel, Field


class FollowUpConfigurationInput(BaseModel):
    system_prompt: str = Field(min_length=1)
    missing_information_instructions: str = Field(min_length=1)
    quote_instructions: str = Field(min_length=1)


class FollowUpConfiguration(FollowUpConfigurationInput):
    id: str
    create_timestamp: int
    update_timestamp: int


class FollowUpConfigurationPreview(BaseModel):
    system_prompt: str
    missing_information_prompt: str
    quote_prompt: str


class FollowUpConfigurationDatabase(ABC):
    """
    Stores the single follow-up configuration shared by all users. The implementation is given the default it starts from, so reading it always
    returns one.
    """

    @abstractmethod
    async def get_follow_up_configuration(self) -> FollowUpConfiguration:
        pass

    @abstractmethod
    async def update_follow_up_configuration(self, configuration_input: FollowUpConfigurationInput) -> FollowUpConfiguration:
        pass
