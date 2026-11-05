from abc import ABC, abstractmethod

from pydantic import BaseModel


class DocumentFile(BaseModel):
    content: bytes
    media_type: str


class DocumentFileStorage(ABC):
    """
    Read-only access to the document files, shared by all users and identified by their file name. Reading a missing file raises NotFoundError.
    """

    @abstractmethod
    async def get_document_file_names(self) -> list[str]:
        pass

    @abstractmethod
    async def get_document_file_content(self, file_name: str) -> bytes:
        pass
