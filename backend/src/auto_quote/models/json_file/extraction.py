from pathlib import Path

from auto_quote.models.extraction import (
    Extraction,
    ExtractionDatabase,
    ExtractionInput,
    ExtractionResult,
    FollowUp,
    QuoteAdjustment,
    QuoteAdjustmentInput,
)
from auto_quote.models.json_file.store import JSONFileStore
from auto_quote.models.quote import Quote
from auto_quote.utils.ids import generate_id
from auto_quote.utils.time import get_current_timestamp


ENTITY_NAME = "Extraction"


class JSONFileExtractionDatabase(ExtractionDatabase):
    def __init__(self, json_file_path: Path):
        self.store = JSONFileStore(json_file_path=json_file_path, record_type=Extraction, entity_name=ENTITY_NAME)

    async def create_extraction(self, extraction_input: ExtractionInput, extraction_result: ExtractionResult) -> Extraction:
        timestamp = get_current_timestamp()
        extraction = Extraction(
            id=generate_id(),
            message=extraction_input.message,
            reply_language=extraction_input.reply_language,
            fields=extraction_result.fields,
            similar_documents=extraction_result.similar_documents,
            quote=extraction_result.quote,
            follow_up=extraction_result.follow_up,
            adjustments=[],
            create_timestamp=timestamp,
            update_timestamp=timestamp,
        )
        self.store.save_record(record_id=extraction.id, record=extraction)
        return extraction

    async def get_extraction_by_id(self, extraction_id: str) -> Extraction:
        return self.store.get_record_by_id(extraction_id)

    async def add_quote_adjustment(
        self, extraction_id: str, adjustment_input: QuoteAdjustmentInput, quote: Quote, follow_up: FollowUp
    ) -> Extraction:
        extraction = await self.get_extraction_by_id(extraction_id)
        timestamp = get_current_timestamp()
        adjustment = QuoteAdjustment(feedback=adjustment_input.feedback, quote=quote, follow_up=follow_up, create_timestamp=timestamp)
        updated_extraction = extraction.model_copy(
            update={"adjustments": [*extraction.adjustments, adjustment], "update_timestamp": timestamp}
        )
        self.store.save_record(record_id=extraction_id, record=updated_extraction)
        return updated_extraction
