from io import BytesIO

from docx import Document

from auto_quote.documents.reader.document_reader import DocumentReader


class DOCXDocumentReader(DocumentReader):
    def read_text(self, content: bytes) -> str:
        document = Document(BytesIO(content))
        paragraphs = [paragraph.text for paragraph in document.paragraphs]
        table_rows = [" | ".join(cell.text for cell in row.cells) for table in document.tables for row in table.rows]
        return "\n".join([*paragraphs, *table_rows]).strip()
