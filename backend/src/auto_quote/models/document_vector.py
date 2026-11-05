from abc import ABC, abstractmethod

from pydantic import BaseModel


class DocumentSimilarity(BaseModel):
    document_id: str
    similarity: float


class DocumentVectorStore(ABC):
    """
    Stores one embedding per indexed document, shared by all users, and finds the documents closest to a query embedding.
    """

    @abstractmethod
    async def add_document_vectors(self, document_ids: list[str], embeddings: list[list[float]]) -> None:
        pass

    @abstractmethod
    async def get_document_vector_ids(self) -> list[str]:
        pass

    @abstractmethod
    async def get_similar_documents(self, embedding: list[float], limit: int) -> list[DocumentSimilarity]:
        pass

    @abstractmethod
    async def delete_document_vectors(self, document_ids: list[str]) -> None:
        pass
