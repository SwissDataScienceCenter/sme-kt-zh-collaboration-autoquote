from pathlib import Path

from loguru import logger

from auto_quote.errors import NotFoundError
from auto_quote.models.document_file import DocumentFileStorage


ENTITY_NAME = "Document file"


class FileSystemDocumentFileStorage(DocumentFileStorage):
    def __init__(self, folder: Path):
        self.folder = folder
        self.folder.mkdir(parents=True, exist_ok=True)

    async def get_document_file_names(self) -> list[str]:
        return sorted(path.name for path in self.folder.iterdir() if path.is_file() and not path.name.startswith("."))

    async def get_document_file_content(self, file_name: str) -> bytes:
        path = self._get_path(file_name)
        if not path.is_file():
            raise NotFoundError(entity_name=ENTITY_NAME, entity_id=file_name)
        try:
            return path.read_bytes()
        except OSError as e:
            logger.error(f"Error reading document file {file_name}: {e}")
            raise

    # Only the last path component is kept, so a name like "../x" can never leave the folder.
    def _get_path(self, file_name: str) -> Path:
        return self.folder / Path(file_name).name
