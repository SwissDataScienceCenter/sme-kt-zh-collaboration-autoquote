from auto_quote.embeddings.embedding_model import EmbeddingModel
from auto_quote.models.document_vector import DocumentVectorStore
from auto_quote.models.extraction import SimilarDocument
from auto_quote.models.indexed_document import DocumentCategory, IndexedDocument, IndexedDocumentDatabase


SIMILAR_DOCUMENTS_LIMIT = 4
RETRIEVED_CATEGORIES = {DocumentCategory.REQUEST, DocumentCategory.OFFER}


class RetrievalController:
    def __init__(
        self,
        indexed_document_database: IndexedDocumentDatabase,
        document_vector_store: DocumentVectorStore,
        embedding_model: EmbeddingModel,
    ):
        self.indexed_document_database = indexed_document_database
        self.document_vector_store = document_vector_store
        self.embedding_model = embedding_model

    async def retrieve_similar_documents(self, query: str) -> list[SimilarDocument]:
        indexed_documents = [
            indexed_document
            for indexed_document in await self.indexed_document_database.get_indexed_documents()
            if indexed_document.category in RETRIEVED_CATEGORIES
        ]
        await self._embed_missing_documents(indexed_documents)
        [query_embedding] = await self.embedding_model.embed([query])
        similarities = await self.document_vector_store.get_similar_documents(embedding=query_embedding, limit=SIMILAR_DOCUMENTS_LIMIT)

        documents_by_id = {indexed_document.id: indexed_document for indexed_document in indexed_documents}
        return [
            SimilarDocument(
                file_name=documents_by_id[similarity.document_id].file_name,
                category=documents_by_id[similarity.document_id].category,
                summary=documents_by_id[similarity.document_id].summary,
                similarity=similarity.similarity,
            )
            for similarity in similarities
            if similarity.document_id in documents_by_id
        ]

    # Documents are embedded on first use, so an index copied from elsewhere or built before retrieval existed works without re-indexing.
    async def _embed_missing_documents(self, indexed_documents: list[IndexedDocument]) -> None:
        vector_ids = set(await self.document_vector_store.get_document_vector_ids())
        missing_documents = [indexed_document for indexed_document in indexed_documents if indexed_document.id not in vector_ids]
        if not missing_documents:
            return
        embeddings = await self.embedding_model.embed([indexed_document.summary for indexed_document in missing_documents])
        await self.document_vector_store.add_document_vectors(
            document_ids=[indexed_document.id for indexed_document in missing_documents], embeddings=embeddings
        )
