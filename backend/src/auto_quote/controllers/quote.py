from datetime import date

from loguru import logger
from pydantic import ValidationError

from auto_quote.documents.reader.document_reader import DocumentReader, DocumentType
from auto_quote.documents.reader.document_text import read_document_text
from auto_quote.documents.renderer.quote_renderer import QuoteRenderer
from auto_quote.errors import LLMResponseError
from auto_quote.llm.llm import LLM, LLMMessage, LLMRole
from auto_quote.models.document_file import DocumentFileStorage
from auto_quote.models.extraction import ExtractedField, SimilarDocument
from auto_quote.models.indexed_document import DocumentCategory
from auto_quote.models.product import ProductDatabase
from auto_quote.models.quote import Quote
from auto_quote.models.quote_configuration import QuoteConfigurationDatabase
from auto_quote.utils.quote_prompt import (
    QUOTE_SYSTEM_PROMPT,
    build_quote_prompt,
    build_quote_tool,
    format_product_catalogue,
    format_quote_adjustment,
    format_quote_request,
    parse_quote_result,
)


NO_SIMILAR_OFFERS = "No similar offers found."


class QuoteController:
    def __init__(
        self,
        quote_configuration_database: QuoteConfigurationDatabase,
        product_database: ProductDatabase,
        document_file_storage: DocumentFileStorage,
        document_readers: dict[DocumentType, DocumentReader],
        quote_renderer: QuoteRenderer,
        llm: LLM,
    ):
        self.quote_configuration_database = quote_configuration_database
        self.product_database = product_database
        self.document_file_storage = document_file_storage
        self.document_readers = document_readers
        self.quote_renderer = quote_renderer
        self.llm = llm

    async def build_quote(self, message: str, extracted_fields: list[ExtractedField], similar_documents: list[SimilarDocument]) -> Quote:
        return await self._generate_quote(
            message=message, extracted_fields=extracted_fields, similar_documents=similar_documents, quote=None, feedback=None
        )

    async def adjust_quote(
        self, message: str, extracted_fields: list[ExtractedField], similar_documents: list[SimilarDocument], quote: Quote, feedback: str
    ) -> Quote:
        return await self._generate_quote(
            message=message, extracted_fields=extracted_fields, similar_documents=similar_documents, quote=quote, feedback=feedback
        )

    def render_quote_pdf(self, quote: Quote, issue_date: date) -> bytes:
        return self.quote_renderer.render(quote=quote, issue_date=issue_date)

    async def _generate_quote(
        self,
        message: str,
        extracted_fields: list[ExtractedField],
        similar_documents: list[SimilarDocument],
        quote: Quote | None,
        feedback: str | None,
    ) -> Quote:
        quote_configuration = await self.quote_configuration_database.get_quote_configuration()
        products = await self.product_database.get_products()
        adjustment = (
            format_quote_adjustment(quote=quote, feedback=feedback, extra_margin_percentage=quote_configuration.extra_margin_percentage)
            if quote is not None and feedback is not None
            else None
        )
        prompt = build_quote_prompt(
            configuration=quote_configuration,
            request=format_quote_request(message=message, extracted_fields=extracted_fields),
            products=format_product_catalogue(products),
            similar_offers=await self._read_similar_offers(similar_documents),
            adjustment=adjustment,
        )
        result = await self.llm.call_tool(
            messages=[LLMMessage(role=LLMRole.SYSTEM, content=QUOTE_SYSTEM_PROMPT), LLMMessage(role=LLMRole.USER, content=prompt)],
            tool=build_quote_tool(),
        )
        try:
            return parse_quote_result(result=result, products=products, extra_margin_percentage=quote_configuration.extra_margin_percentage)
        except ValidationError as e:
            logger.error(f"Error parsing the quote returned by the model: {e}")
            raise LLMResponseError("The model returned a quote that does not match the build_quote tool") from e

    async def _read_similar_offers(self, similar_documents: list[SimilarDocument]) -> str:
        offer_texts = []
        for similar_document in similar_documents:
            if similar_document.category != DocumentCategory.OFFER:
                continue
            # An offer deleted or unreadable since indexing must not fail the whole run; the other offers are still used.
            try:
                offer_text = await read_document_text(
                    document_file_storage=self.document_file_storage,
                    document_readers=self.document_readers,
                    file_name=similar_document.file_name,
                )
            except Exception as e:
                logger.warning(f"Skipping similar offer {similar_document.file_name}: {e}")
                continue
            offer_texts.append(f"### {similar_document.file_name}\n{offer_text}")
        return "\n\n".join(offer_texts) or NO_SIMILAR_OFFERS
