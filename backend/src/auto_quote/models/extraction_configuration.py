from abc import ABC, abstractmethod
from enum import StrEnum
from typing import Any, Self

from pydantic import BaseModel, Field, model_validator


class FieldType(StrEnum):
    TEXT = "text"
    INTEGER = "integer"
    NUMBER = "number"
    DATE = "date"
    ENUM = "enum"
    BOOLEAN = "boolean"


FIELD_KEY_PATTERN = r"^[A-Za-z_][A-Za-z0-9_]*$"


class ExtractionField(BaseModel):
    key: str = Field(pattern=FIELD_KEY_PATTERN)
    label: str = Field(min_length=1)
    type: FieldType
    is_required: bool
    description: str
    allowed_values: list[str] = []


def find_duplicate_keys(fields: list[ExtractionField]) -> list[str]:
    keys = [field.key for field in fields]
    return sorted({key for key in keys if keys.count(key) > 1})


class ExtractionConfigurationInput(BaseModel):
    name: str
    description: str
    fields: list[ExtractionField]

    @model_validator(mode="after")
    def _check_unique_keys(self) -> Self:
        duplicate_keys = find_duplicate_keys(self.fields)
        if duplicate_keys:
            raise ValueError(f"Duplicate field keys: {', '.join(duplicate_keys)}")
        return self


class ExtractionConfiguration(ExtractionConfigurationInput):
    id: str
    create_timestamp: int
    update_timestamp: int


class ExtractionConfigurationPreview(BaseModel):
    json_schema: dict[str, Any]
    prompt: str


class ConfigurationFileFormat(StrEnum):
    XLSX = "xlsx"
    JSON = "json"


CONFIGURATION_FILE_MEDIA_TYPES: dict[ConfigurationFileFormat, str] = {
    ConfigurationFileFormat.XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ConfigurationFileFormat.JSON: "application/json",
}


class ImportMode(StrEnum):
    UPDATE = "update"
    SKIP = "skip"
    REPLACE = "replace"


class ConfigurationFile(BaseModel):
    file_name: str
    media_type: str
    content: bytes


class ExtractionConfigurationDatabase(ABC):
    """
    Stores the single extraction configuration shared by all users. The implementation is given the default it starts from, so reading it always
    returns one.
    """

    @abstractmethod
    async def get_extraction_configuration(self) -> ExtractionConfiguration:
        pass

    @abstractmethod
    async def update_extraction_configuration(self, configuration_input: ExtractionConfigurationInput) -> ExtractionConfiguration:
        pass
