from enum import StrEnum

from pydantic import BaseModel


CURRENCY = "CHF"


class QuoteLanguage(StrEnum):
    ENGLISH = "en"
    FRENCH = "fr"
    GERMAN = "de"
    ITALIAN = "it"


class QuoteLineType(StrEnum):
    PRODUCT = "product"
    EXTRA = "extra"


class QuoteLine(BaseModel):
    type: QuoteLineType
    product_reference: str | None
    description: str
    quantity: float
    unit: str
    unit_price: float
    total: float


class Quote(BaseModel):
    customer: str
    title: str
    scope_of_work: str
    terms: str
    lines: list[QuoteLine]
    total: float
    # Quotes stored before the language was recorded are read as English.
    language: QuoteLanguage = QuoteLanguage.ENGLISH
