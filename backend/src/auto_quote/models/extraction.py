from abc import ABC, abstractmethod
from enum import StrEnum

from pydantic import BaseModel, Field

from auto_quote.models.indexed_document import DocumentCategory
from auto_quote.models.quote import Quote


class FieldStatus(StrEnum):
    FOUND = "FOUND"
    ASSUMED = "ASSUMED"
    PARTIAL = "PARTIAL"
    MISSING = "MISSING"


class ReplyLanguage(StrEnum):
    SAME_AS_MESSAGE = "same_as_message"
    ENGLISH = "en"
    FRENCH = "fr"
    GERMAN = "de"


class FollowUpType(StrEnum):
    MISSING_INFORMATION = "missing_information"
    QUOTE = "quote"


class ExtractionInput(BaseModel):
    message: str = Field(min_length=1)
    reply_language: ReplyLanguage = ReplyLanguage.SAME_AS_MESSAGE


class ExtractedField(BaseModel):
    key: str
    label: str
    is_required: bool
    value: str | int | float | bool | None
    status: FieldStatus
    evidence: str | None


class FollowUp(BaseModel):
    type: FollowUpType
    missing_field_keys: list[str]
    email: str


class SimilarDocument(BaseModel):
    file_name: str
    category: DocumentCategory
    summary: str
    similarity: float


class ExtractionResult(BaseModel):
    fields: list[ExtractedField]
    similar_documents: list[SimilarDocument]
    quote: Quote | None
    follow_up: FollowUp


class QuoteAdjustmentInput(BaseModel):
    feedback: str = Field(min_length=1)


class QuoteAdjustment(QuoteAdjustmentInput):
    quote: Quote
    follow_up: FollowUp
    create_timestamp: int


# The top-level quote and follow-up are those of the first run; each adjustment keeps the ones it produced.
class Extraction(ExtractionInput, ExtractionResult):
    id: str
    adjustments: list[QuoteAdjustment]
    create_timestamp: int
    update_timestamp: int


class ExtractionDatabase(ABC):
    """
    Keeps every pipeline run and its quote adjustments as a log, shared by all users. Lookups by id raise NotFoundError when the
    extraction does not exist.
    """

    @abstractmethod
    async def create_extraction(self, extraction_input: ExtractionInput, extraction_result: ExtractionResult) -> Extraction:
        pass

    @abstractmethod
    async def get_extraction_by_id(self, extraction_id: str) -> Extraction:
        pass

    @abstractmethod
    async def add_quote_adjustment(
        self, extraction_id: str, adjustment_input: QuoteAdjustmentInput, quote: Quote, follow_up: FollowUp
    ) -> Extraction:
        pass
