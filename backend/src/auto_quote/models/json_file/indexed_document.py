from pathlib import Path

from auto_quote.models.indexed_document import IndexedDocument, IndexedDocumentDatabase, IndexedDocumentInput
from auto_quote.models.json_file.store import JSONFileStore
from auto_quote.utils.ids import generate_id
from auto_quote.utils.time import get_current_timestamp


ENTITY_NAME = "Indexed document"


class JSONFileIndexedDocumentDatabase(IndexedDocumentDatabase):
    def __init__(self, json_file_path: Path):
        self.store = JSONFileStore(json_file_path=json_file_path, record_type=IndexedDocument, entity_name=ENTITY_NAME)

    async def create_indexed_document(self, document_input: IndexedDocumentInput) -> IndexedDocument:
        indexed_document = IndexedDocument(
            id=generate_id(),
            file_name=document_input.file_name,
            category=document_input.category,
            summary=document_input.summary,
            create_timestamp=get_current_timestamp(),
        )
        self.store.save_record(record_id=indexed_document.id, record=indexed_document)
        return indexed_document

    async def get_indexed_documents(self) -> list[IndexedDocument]:
        return self.store.get_records()

    async def delete_indexed_documents(self, indexed_document_ids: list[str]) -> None:
        self.store.delete_records(indexed_document_ids)
