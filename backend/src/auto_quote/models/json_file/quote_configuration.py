from pathlib import Path

from auto_quote.models.json_file.store import JSONFileSingleRecordStore
from auto_quote.models.quote_configuration import QuoteConfiguration, QuoteConfigurationDatabase, QuoteConfigurationInput


ENTITY_NAME = "Quote configuration"


class JSONFileQuoteConfigurationDatabase(QuoteConfigurationDatabase):
    def __init__(self, json_file_path: Path, default_configuration: QuoteConfigurationInput):
        self.store = JSONFileSingleRecordStore(
            json_file_path=json_file_path, record_type=QuoteConfiguration, entity_name=ENTITY_NAME, default_input=default_configuration
        )

    async def get_quote_configuration(self) -> QuoteConfiguration:
        return self.store.get_record()

    async def update_quote_configuration(self, configuration_input: QuoteConfigurationInput) -> QuoteConfiguration:
        return self.store.update_record(configuration_input)
