from auto_quote.documents.reader.document_reader import DocumentReader


class TXTDocumentReader(DocumentReader):
    def read_text(self, content: bytes) -> str:
        return content.decode("utf-8", errors="replace").strip()
