from auto_quote.documents.reader.document_reader import DocumentReader, DocumentType, get_document_type
from auto_quote.models.document_file import DocumentFileStorage


def get_document_reader(document_readers: dict[DocumentType, DocumentReader], file_name: str) -> DocumentReader | None:
    document_type = get_document_type(file_name)
    return document_readers.get(document_type) if document_type is not None else None


async def read_document_text(
    document_file_storage: DocumentFileStorage, document_readers: dict[DocumentType, DocumentReader], file_name: str
) -> str:
    document_reader = get_document_reader(document_readers=document_readers, file_name=file_name)
    if document_reader is None:
        raise ValueError(f"Unsupported document type: {file_name}")
    content = await document_file_storage.get_document_file_content(file_name)
    text = document_reader.read_text(content)
    if not text:
        raise ValueError(f"No text found in {file_name}, it may be a scanned document")
    return text
