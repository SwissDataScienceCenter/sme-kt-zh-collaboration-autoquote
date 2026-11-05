from pathlib import Path

from auto_quote.models.extraction_configuration import (
    ExtractionConfiguration,
    ExtractionConfigurationDatabase,
    ExtractionConfigurationInput,
)
from auto_quote.models.json_file.store import JSONFileSingleRecordStore


ENTITY_NAME = "Extraction configuration"


class JSONFileExtractionConfigurationDatabase(ExtractionConfigurationDatabase):
    def __init__(self, json_file_path: Path, default_configuration: ExtractionConfigurationInput):
        self.store = JSONFileSingleRecordStore(
            json_file_path=json_file_path, record_type=ExtractionConfiguration, entity_name=ENTITY_NAME, default_input=default_configuration
        )

    async def get_extraction_configuration(self) -> ExtractionConfiguration:
        return self.store.get_record()

    async def update_extraction_configuration(self, configuration_input: ExtractionConfigurationInput) -> ExtractionConfiguration:
        return self.store.update_record(configuration_input)
