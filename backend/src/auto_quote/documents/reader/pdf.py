from io import BytesIO

from pypdf import PdfReader

from auto_quote.documents.reader.document_reader import DocumentReader


class PDFDocumentReader(DocumentReader):
    # Scanned PDFs only hold images and come back empty; reading them would need OCR.
    def read_text(self, content: bytes) -> str:
        pdf_reader = PdfReader(BytesIO(content))
        return "\n".join(page.extract_text() for page in pdf_reader.pages).strip()
