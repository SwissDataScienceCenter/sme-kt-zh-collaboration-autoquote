from abc import ABC, abstractmethod
from enum import StrEnum
from pathlib import PurePath


class DocumentType(StrEnum):
    PDF = "pdf"
    DOCX = "docx"
    TXT = "txt"


DOCUMENT_MEDIA_TYPES: dict[DocumentType, str] = {
    DocumentType.PDF: "application/pdf",
    DocumentType.DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    DocumentType.TXT: "text/plain; charset=utf-8",
}


class DocumentReader(ABC):
    """
    Extracts the plain text of a document of one type. Raises when the content cannot be read.
    """

    @abstractmethod
    def read_text(self, content: bytes) -> str:
        pass


def get_document_type(file_name: str) -> DocumentType | None:
    extension = PurePath(file_name).suffix.removeprefix(".").lower()
    return next((document_type for document_type in DocumentType if document_type == extension), None)
