from pathlib import Path

import chromadb
from chromadb.config import Settings
from loguru import logger

from auto_quote.models.document_vector import DocumentSimilarity, DocumentVectorStore


COLLECTION_NAME = "indexed_documents"


class ChromaDocumentVectorStore(DocumentVectorStore):
    """Embedded Chroma database stored in a local folder; no Chroma server is started."""

    def __init__(self, db_path: Path):
        client = chromadb.PersistentClient(path=str(db_path), settings=Settings(anonymized_telemetry=False))
        self.collection = client.get_or_create_collection(name=COLLECTION_NAME, metadata={"hnsw:space": "cosine"})

    async def add_document_vectors(self, document_ids: list[str], embeddings: list[list[float]]) -> None:
        try:
            self.collection.upsert(ids=document_ids, embeddings=embeddings)
        except Exception as e:
            logger.error(f"Error adding {len(document_ids)} document vectors: {e}")
            raise

    async def get_document_vector_ids(self) -> list[str]:
        return self.collection.get(include=[])["ids"]

    async def get_similar_documents(self, embedding: list[float], limit: int) -> list[DocumentSimilarity]:
        result_count = min(limit, self.collection.count())
        if result_count == 0:
            return []
        try:
            results = self.collection.query(query_embeddings=[embedding], n_results=result_count, include=["distances"])
        except Exception as e:
            logger.error(f"Error querying similar documents: {e}")
            raise
        distances = results["distances"][0] if results["distances"] else []
        # The collection uses the cosine distance, so the similarity is its complement.
        return [
            DocumentSimilarity(document_id=document_id, similarity=1 - distance)
            for document_id, distance in zip(results["ids"][0], distances, strict=True)
        ]

    async def delete_document_vectors(self, document_ids: list[str]) -> None:
        if not document_ids:
            return
        try:
            self.collection.delete(ids=document_ids)
        except Exception as e:
            logger.error(f"Error deleting {len(document_ids)} document vectors: {e}")
            raise
