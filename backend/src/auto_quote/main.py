import os
from pathlib import Path

from dotenv import load_dotenv

from auto_quote.auth.session_cookie import SessionCookieProvider
from auto_quote.controllers.document_index import DocumentIndexController
from auto_quote.controllers.extraction import ExtractionController
from auto_quote.controllers.extraction_configuration import DEFAULT_EXTRACTION_CONFIGURATION, ExtractionConfigurationController
from auto_quote.controllers.follow_up_configuration import DEFAULT_FOLLOW_UP_CONFIGURATION, FollowUpConfigurationController
from auto_quote.controllers.product import ProductController
from auto_quote.controllers.quote import QuoteController
from auto_quote.controllers.quote_configuration import DEFAULT_QUOTE_CONFIGURATION, QuoteConfigurationController
from auto_quote.controllers.retrieval import RetrievalController
from auto_quote.documents.reader.document_reader import DocumentType
from auto_quote.documents.reader.docx import DOCXDocumentReader
from auto_quote.documents.reader.pdf import PDFDocumentReader
from auto_quote.documents.reader.txt import TXTDocumentReader
from auto_quote.documents.renderer.reportlab import ReportLabQuoteRenderer
from auto_quote.embeddings.openai import OpenAIEmbeddingModel
from auto_quote.llm.openai import OpenAILLM
from auto_quote.models.branding import Branding
from auto_quote.models.chroma.document_vector import ChromaDocumentVectorStore
from auto_quote.models.file_system.document_file import FileSystemDocumentFileStorage
from auto_quote.models.json_file.extraction import JSONFileExtractionDatabase
from auto_quote.models.json_file.extraction_configuration import JSONFileExtractionConfigurationDatabase
from auto_quote.models.json_file.follow_up_configuration import JSONFileFollowUpConfigurationDatabase
from auto_quote.models.json_file.indexed_document import JSONFileIndexedDocumentDatabase
from auto_quote.models.json_file.product import JSONFileProductDatabase
from auto_quote.models.json_file.quote_configuration import JSONFileQuoteConfigurationDatabase
from auto_quote.server import create_app


BACKEND_FOLDER = Path(__file__).resolve().parents[2]
ROOT_FOLDER = BACKEND_FOLDER.parent
DATA_FOLDER = BACKEND_FOLDER / "data"
BRANDING_FOLDER = ROOT_FOLDER / "branding"
ENV = os.getenv("ENV", "local")

load_dotenv(ROOT_FOLDER / f".env.{ENV}")

is_session_cookie_secure = os.getenv("SESSION_COOKIE_SECURE", "true").lower() == "true"
auth_provider = SessionCookieProvider(is_secure=is_session_cookie_secure)

extraction_configuration_database = JSONFileExtractionConfigurationDatabase(
    json_file_path=DATA_FOLDER / "extraction_configurations.json", default_configuration=DEFAULT_EXTRACTION_CONFIGURATION
)
extraction_configuration_controller = ExtractionConfigurationController(extraction_configuration_database=extraction_configuration_database)

follow_up_configuration_database = JSONFileFollowUpConfigurationDatabase(
    json_file_path=DATA_FOLDER / "follow_up_configurations.json", default_configuration=DEFAULT_FOLLOW_UP_CONFIGURATION
)
follow_up_configuration_controller = FollowUpConfigurationController(follow_up_configuration_database=follow_up_configuration_database)

quote_configuration_database = JSONFileQuoteConfigurationDatabase(
    json_file_path=DATA_FOLDER / "quote_configurations.json", default_configuration=DEFAULT_QUOTE_CONFIGURATION
)
quote_configuration_controller = QuoteConfigurationController(quote_configuration_database=quote_configuration_database)

product_database = JSONFileProductDatabase(json_file_path=DATA_FOLDER / "products.json")
product_controller = ProductController(product_database=product_database)

branding = Branding.model_validate_json((BRANDING_FOLDER / "branding.json").read_text(encoding="utf-8"))
branding_logo = (BRANDING_FOLDER / "logo.png").read_bytes()

llm_base_url = os.getenv("LLM_BASE_URL") or None
llm_api_key = os.environ["LLM_API_KEY"]
llm = OpenAILLM(base_url=llm_base_url, api_key=llm_api_key, model=os.environ["LLM_MODEL"])
embedding_model = OpenAIEmbeddingModel(base_url=llm_base_url, api_key=llm_api_key, model=os.environ["EMBEDDING_MODEL"])

# One reader per supported document type; files of any other type are ignored.
document_readers = {DocumentType.PDF: PDFDocumentReader(), DocumentType.DOCX: DOCXDocumentReader(), DocumentType.TXT: TXTDocumentReader()}
document_file_storage = FileSystemDocumentFileStorage(folder=DATA_FOLDER / "documents")
indexed_document_database = JSONFileIndexedDocumentDatabase(json_file_path=DATA_FOLDER / "indexed_documents.json")
document_vector_store = ChromaDocumentVectorStore(db_path=DATA_FOLDER / "chroma")
document_index_controller = DocumentIndexController(
    document_file_storage=document_file_storage,
    indexed_document_database=indexed_document_database,
    product_database=product_database,
    document_vector_store=document_vector_store,
    document_readers=document_readers,
    llm=llm,
)

retrieval_controller = RetrievalController(
    indexed_document_database=indexed_document_database, document_vector_store=document_vector_store, embedding_model=embedding_model
)
quote_controller = QuoteController(
    quote_configuration_database=quote_configuration_database,
    product_database=product_database,
    document_file_storage=document_file_storage,
    document_readers=document_readers,
    quote_renderer=ReportLabQuoteRenderer(branding=branding, logo=branding_logo),
    llm=llm,
)
extraction_database = JSONFileExtractionDatabase(json_file_path=DATA_FOLDER / "extractions.json")
extraction_controller = ExtractionController(
    extraction_database=extraction_database,
    extraction_configuration_database=extraction_configuration_database,
    follow_up_configuration_database=follow_up_configuration_database,
    retrieval_controller=retrieval_controller,
    quote_controller=quote_controller,
    llm=llm,
)

app = create_app(
    extraction_configuration_controller=extraction_configuration_controller,
    follow_up_configuration_controller=follow_up_configuration_controller,
    quote_configuration_controller=quote_configuration_controller,
    extraction_controller=extraction_controller,
    document_index_controller=document_index_controller,
    product_controller=product_controller,
    auth_provider=auth_provider,
)
