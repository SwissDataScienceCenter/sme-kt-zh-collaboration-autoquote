from loguru import logger
from pydantic import ValidationError

from auto_quote.controllers.quote import QuoteController
from auto_quote.controllers.retrieval import RetrievalController
from auto_quote.errors import LLMResponseError, MissingQuoteError
from auto_quote.llm.llm import LLM, LLMMessage, LLMRole
from auto_quote.models.extraction import (
    ExtractedField,
    Extraction,
    ExtractionDatabase,
    ExtractionInput,
    ExtractionResult,
    FieldStatus,
    FollowUp,
    FollowUpType,
    QuoteAdjustmentInput,
    ReplyLanguage,
)
from auto_quote.models.extraction_configuration import ExtractionConfiguration, ExtractionConfigurationDatabase
from auto_quote.models.follow_up_configuration import FollowUpConfigurationDatabase
from auto_quote.models.quote import Quote
from auto_quote.utils.extraction_prompt import (
    EXTRACTION_SYSTEM_PROMPT,
    build_extraction_json_schema,
    build_extraction_prompt,
    parse_extraction_result,
)
from auto_quote.utils.follow_up_prompt import build_follow_up_prompt
from auto_quote.utils.time import to_date


EXTRACTION_RESULT_NAME = "extraction"
MISSING_STATUSES = {FieldStatus.MISSING, FieldStatus.PARTIAL}


class ExtractionController:
    def __init__(
        self,
        extraction_database: ExtractionDatabase,
        extraction_configuration_database: ExtractionConfigurationDatabase,
        follow_up_configuration_database: FollowUpConfigurationDatabase,
        retrieval_controller: RetrievalController,
        quote_controller: QuoteController,
        llm: LLM,
    ):
        self.extraction_database = extraction_database
        self.extraction_configuration_database = extraction_configuration_database
        self.follow_up_configuration_database = follow_up_configuration_database
        self.retrieval_controller = retrieval_controller
        self.quote_controller = quote_controller
        self.llm = llm

    async def create_extraction(self, extraction_input: ExtractionInput) -> Extraction:
        extraction_configuration = await self.extraction_configuration_database.get_extraction_configuration()
        extracted_fields = await self._extract_fields(extraction_configuration=extraction_configuration, message=extraction_input.message)
        missing_fields = [field for field in extracted_fields if field.is_required and field.status in MISSING_STATUSES]

        # A quote is only worth building once every required detail is known; until then the follow-up asks for them.
        similar_documents = (
            [] if missing_fields else await self.retrieval_controller.retrieve_similar_documents(query=extraction_input.message)
        )
        quote = (
            None
            if missing_fields
            else await self.quote_controller.build_quote(
                message=extraction_input.message, extracted_fields=extracted_fields, similar_documents=similar_documents
            )
        )

        follow_up = await self._write_follow_up(
            message=extraction_input.message,
            extracted_fields=extracted_fields,
            missing_fields=missing_fields,
            reply_language=extraction_input.reply_language,
            quote=quote,
        )
        extraction_result = ExtractionResult(fields=extracted_fields, similar_documents=similar_documents, quote=quote, follow_up=follow_up)
        return await self.extraction_database.create_extraction(extraction_input=extraction_input, extraction_result=extraction_result)

    # The similar documents are reused, and the email is written again so it matches the adjusted quote.
    async def adjust_quote(self, extraction_id: str, adjustment_input: QuoteAdjustmentInput) -> Extraction:
        extraction = await self.extraction_database.get_extraction_by_id(extraction_id)
        latest_quote = _get_latest_quote(extraction)
        quote = await self.quote_controller.adjust_quote(
            message=extraction.message,
            extracted_fields=extraction.fields,
            similar_documents=extraction.similar_documents,
            quote=latest_quote,
            feedback=adjustment_input.feedback,
        )
        follow_up = await self._write_follow_up(
            message=extraction.message,
            extracted_fields=extraction.fields,
            missing_fields=[],
            reply_language=extraction.reply_language,
            quote=quote,
        )
        return await self.extraction_database.add_quote_adjustment(
            extraction_id=extraction_id, adjustment_input=adjustment_input, quote=quote, follow_up=follow_up
        )

    async def render_quote_pdf(self, extraction_id: str) -> bytes:
        extraction = await self.extraction_database.get_extraction_by_id(extraction_id)
        # Only creating the run and adjusting its quote update it, so this is the date of the latest quote and stays stable across downloads.
        issue_date = to_date(extraction.update_timestamp)
        return self.quote_controller.render_quote_pdf(quote=_get_latest_quote(extraction), issue_date=issue_date)

    async def _write_follow_up(
        self,
        message: str,
        extracted_fields: list[ExtractedField],
        missing_fields: list[ExtractedField],
        reply_language: ReplyLanguage,
        quote: Quote | None,
    ) -> FollowUp:
        follow_up_configuration = await self.follow_up_configuration_database.get_follow_up_configuration()
        follow_up_prompt = build_follow_up_prompt(
            configuration=follow_up_configuration,
            message=message,
            extracted_fields=extracted_fields,
            missing_fields=missing_fields,
            reply_language=reply_language,
            quote=quote,
        )
        email = await self.llm.generate_text(
            messages=[
                LLMMessage(role=LLMRole.SYSTEM, content=follow_up_configuration.system_prompt),
                LLMMessage(role=LLMRole.USER, content=follow_up_prompt),
            ]
        )
        return FollowUp(
            type=FollowUpType.MISSING_INFORMATION if missing_fields else FollowUpType.QUOTE,
            missing_field_keys=[field.key for field in missing_fields],
            email=email,
        )

    async def _extract_fields(self, extraction_configuration: ExtractionConfiguration, message: str) -> list[ExtractedField]:
        extraction_prompt = build_extraction_prompt(
            description=extraction_configuration.description, fields=extraction_configuration.fields, message=message
        )
        result = await self.llm.generate_json(
            messages=[
                LLMMessage(role=LLMRole.SYSTEM, content=EXTRACTION_SYSTEM_PROMPT),
                LLMMessage(role=LLMRole.USER, content=extraction_prompt),
            ],
            json_schema=build_extraction_json_schema(fields=extraction_configuration.fields),
            schema_name=EXTRACTION_RESULT_NAME,
        )
        try:
            return parse_extraction_result(result=result, fields=extraction_configuration.fields)
        except (KeyError, TypeError, ValidationError) as e:
            logger.error(f"Error parsing the extraction for configuration {extraction_configuration.id}: {e}")
            raise LLMResponseError(
                f"The model returned an extraction that does not match configuration {extraction_configuration.id}"
            ) from e


def _get_latest_quote(extraction: Extraction) -> Quote:
    latest_quote = extraction.adjustments[-1].quote if extraction.adjustments else extraction.quote
    if latest_quote is None:
        raise MissingQuoteError(f"Extraction {extraction.id} has no quote")
    return latest_quote
