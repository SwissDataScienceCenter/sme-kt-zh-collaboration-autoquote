from abc import ABC, abstractmethod
from enum import StrEnum

from pydantic import BaseModel

from auto_quote.models.product import ProductInput


class DocumentCategory(StrEnum):
    DATASHEET = "datasheet"
    REQUEST = "request"
    OFFER = "offer"
    UNKNOWN = "unknown"


class IndexedDocumentInput(BaseModel):
    file_name: str
    category: DocumentCategory
    summary: str


class IndexedDocument(IndexedDocumentInput):
    id: str
    create_timestamp: int


class OfferPrice(BaseModel):
    product_reference: str
    unit_price: float


class DocumentExtraction(BaseModel):
    file_name: str
    category: DocumentCategory
    summary: str
    products: list[ProductInput]
    offer_prices: list[OfferPrice]


class IndexingState(StrEnum):
    RUNNING = "running"
    FINISHED = "finished"
    FAILED = "failed"


class DocumentIndexing(BaseModel):
    state: IndexingState
    total_file_count: int
    processed_file_count: int
    indexed_file_names: list[str]
    failed_file_names: list[str]


class DocumentIndexStatus(BaseModel):
    document_counts: dict[DocumentCategory, int]
    pending_file_count: int
    product_count: int
    create_timestamp: int | None
    update_timestamp: int | None
    indexing: DocumentIndexing | None


class IndexedDocumentDatabase(ABC):
    """
    Stores what was learnt from each document file, shared by all users. A file is indexed at most once.
    """

    @abstractmethod
    async def create_indexed_document(self, document_input: IndexedDocumentInput) -> IndexedDocument:
        pass

    @abstractmethod
    async def get_indexed_documents(self) -> list[IndexedDocument]:
        pass

    @abstractmethod
    async def delete_indexed_documents(self, indexed_document_ids: list[str]) -> None:
        pass
