import asyncio

from loguru import logger
from pydantic import ValidationError

from auto_quote.documents.reader.document_reader import DOCUMENT_MEDIA_TYPES, DocumentReader, DocumentType, get_document_type
from auto_quote.documents.reader.document_text import get_document_reader, read_document_text
from auto_quote.errors import IndexingInProgressError, LLMResponseError, NotFoundError
from auto_quote.llm.llm import LLM, LLMMessage, LLMRole
from auto_quote.models.document_file import DocumentFile, DocumentFileStorage
from auto_quote.models.document_vector import DocumentVectorStore
from auto_quote.models.indexed_document import (
    DocumentCategory,
    DocumentExtraction,
    DocumentIndexing,
    DocumentIndexStatus,
    IndexedDocumentDatabase,
    IndexedDocumentInput,
    IndexingState,
)
from auto_quote.models.product import ProductDatabase, ProductInput
from auto_quote.utils.document_index_prompt import (
    DOCUMENT_INDEX_SYSTEM_PROMPT,
    build_document_index_json_schema,
    build_document_index_prompt,
    parse_document_index_result,
)


DOCUMENT_INDEX_RESULT_NAME = "document_index"
DOCUMENT_FILE_ENTITY_NAME = "Document file"


class DocumentIndexController:
    def __init__(
        self,
        document_file_storage: DocumentFileStorage,
        indexed_document_database: IndexedDocumentDatabase,
        product_database: ProductDatabase,
        document_vector_store: DocumentVectorStore,
        document_readers: dict[DocumentType, DocumentReader],
        llm: LLM,
    ):
        self.document_file_storage = document_file_storage
        self.indexed_document_database = indexed_document_database
        self.product_database = product_database
        self.document_vector_store = document_vector_store
        self.document_readers = document_readers
        self.llm = llm
        # Deleting the index while a run writes to it would leave half of the run behind.
        self.indexing_lock = asyncio.Lock()
        self.indexing: DocumentIndexing | None = None
        # Kept so the running task is not garbage collected before it finishes.
        self.indexing_task: asyncio.Task[None] | None = None

    async def get_document_file(self, file_name: str) -> DocumentFile:
        document_type = get_document_type(file_name)
        if document_type is None or document_type not in self.document_readers:
            raise NotFoundError(entity_name=DOCUMENT_FILE_ENTITY_NAME, entity_id=file_name)
        content = await self.document_file_storage.get_document_file_content(file_name)
        return DocumentFile(content=content, media_type=DOCUMENT_MEDIA_TYPES[document_type])

    async def get_document_index_status(self) -> DocumentIndexStatus:
        indexed_documents = await self.indexed_document_database.get_indexed_documents()
        pending_file_names = await self._get_pending_file_names()
        products = await self.product_database.get_products()
        index_timestamps = [indexed_document.create_timestamp for indexed_document in indexed_documents]
        return DocumentIndexStatus(
            document_counts={
                category: sum(1 for indexed_document in indexed_documents if indexed_document.category == category)
                for category in DocumentCategory
            },
            pending_file_count=len(pending_file_names),
            product_count=len(products),
            create_timestamp=min(index_timestamps, default=None),
            update_timestamp=max(index_timestamps, default=None),
            indexing=self.indexing,
        )

    async def start_document_indexing(self) -> DocumentIndexing:
        if self._is_indexing():
            raise IndexingInProgressError("Documents are already being indexed")
        # Set before any await, so a second request arriving meanwhile sees the run as started.
        indexing = DocumentIndexing(
            state=IndexingState.RUNNING, total_file_count=0, processed_file_count=0, indexed_file_names=[], failed_file_names=[]
        )
        self.indexing = indexing
        self.indexing_task = asyncio.create_task(self._run_indexing(indexing))
        return indexing

    async def _run_indexing(self, indexing: DocumentIndexing) -> None:
        # Nobody awaits this task, so any failure is reported through the run state instead of being raised.
        try:
            async with self.indexing_lock:
                pending_file_names = await self._get_pending_file_names()
                indexing.total_file_count = len(pending_file_names)
                extractions: list[DocumentExtraction] = []
                for file_name in pending_file_names:
                    # One unreadable file or bad answer must not stop the others from being indexed; it stays pending for the next run.
                    try:
                        extractions.append(await self._extract_document(file_name))
                    except Exception as e:
                        logger.error(f"Error indexing document {file_name}: {e}")
                        indexing.failed_file_names.append(file_name)
                    indexing.processed_file_count += 1

                await self._save_extractions(extractions)
                indexing.indexed_file_names = [extraction.file_name for extraction in extractions]
                indexing.state = IndexingState.FINISHED
        except Exception as e:
            logger.error(f"Error indexing documents: {e}")
            indexing.state = IndexingState.FAILED

    async def _save_extractions(self, extractions: list[DocumentExtraction]) -> None:
        # Products go first, so an offer can price a product from a datasheet indexed in the same run.
        for extraction in extractions:
            for product_input in extraction.products:
                await self._add_product(product_input)
        for extraction in extractions:
            for offer_price in extraction.offer_prices:
                await self._fill_missing_price(product_reference=offer_price.product_reference, unit_price=offer_price.unit_price)
        for extraction in extractions:
            await self.indexed_document_database.create_indexed_document(
                IndexedDocumentInput(file_name=extraction.file_name, category=extraction.category, summary=extraction.summary)
            )

    async def delete_document_index(self) -> DocumentIndexStatus:
        if self._is_indexing():
            raise IndexingInProgressError("The index cannot be deleted while documents are being indexed")
        async with self.indexing_lock:
            indexed_documents = await self.indexed_document_database.get_indexed_documents()
            await self.indexed_document_database.delete_indexed_documents([indexed_document.id for indexed_document in indexed_documents])
            await self.document_vector_store.delete_document_vectors([indexed_document.id for indexed_document in indexed_documents])
            products = await self.product_database.get_products()
            await self.product_database.delete_products([product.id for product in products])
            self.indexing = None
        return await self.get_document_index_status()

    def _is_indexing(self) -> bool:
        return self.indexing is not None and self.indexing.state == IndexingState.RUNNING

    async def _get_pending_file_names(self) -> list[str]:
        indexed_documents = await self.indexed_document_database.get_indexed_documents()
        indexed_file_names = {indexed_document.file_name for indexed_document in indexed_documents}
        file_names = await self.document_file_storage.get_document_file_names()
        return [
            file_name
            for file_name in file_names
            if file_name not in indexed_file_names and self._get_document_reader(file_name) is not None
        ]

    def _get_document_reader(self, file_name: str) -> DocumentReader | None:
        return get_document_reader(document_readers=self.document_readers, file_name=file_name)

    async def _extract_document(self, file_name: str) -> DocumentExtraction:
        text = await read_document_text(
            document_file_storage=self.document_file_storage, document_readers=self.document_readers, file_name=file_name
        )
        result = await self.llm.generate_json(
            messages=[
                LLMMessage(role=LLMRole.SYSTEM, content=DOCUMENT_INDEX_SYSTEM_PROMPT),
                LLMMessage(role=LLMRole.USER, content=build_document_index_prompt(file_name=file_name, text=text)),
            ],
            json_schema=build_document_index_json_schema(),
            schema_name=DOCUMENT_INDEX_RESULT_NAME,
        )
        try:
            return parse_document_index_result(result=result, file_name=file_name)
        except ValidationError as e:
            logger.error(f"Error parsing the index result for document {file_name}: {e}")
            raise LLMResponseError(f"The model returned an index result that does not match the schema for {file_name}") from e

    async def _add_product(self, product_input: ProductInput) -> None:
        existing_product = await self.product_database.find_product_by_reference(product_input.product_reference)
        if existing_product is None:
            await self.product_database.create_product(product_input)
            return
        if product_input.unit_price is not None:
            await self._fill_missing_price(product_reference=product_input.product_reference, unit_price=product_input.unit_price)

    # Indexing never overwrites a price, so prices edited by hand are kept.
    async def _fill_missing_price(self, product_reference: str, unit_price: float) -> None:
        product = await self.product_database.find_product_by_reference(product_reference)
        if product is None or product.unit_price is not None:
            return
        product_input = ProductInput(
            product_reference=product.product_reference,
            description=product.description,
            unit=product.unit,
            unit_price=unit_price,
            spec=product.spec,
        )
        await self.product_database.update_product(product_id=product.id, product_input=product_input)
