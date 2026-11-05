from pathlib import Path

from auto_quote.models.follow_up_configuration import FollowUpConfiguration, FollowUpConfigurationDatabase, FollowUpConfigurationInput
from auto_quote.models.json_file.store import JSONFileSingleRecordStore


ENTITY_NAME = "Follow-up configuration"


class JSONFileFollowUpConfigurationDatabase(FollowUpConfigurationDatabase):
    def __init__(self, json_file_path: Path, default_configuration: FollowUpConfigurationInput):
        self.store = JSONFileSingleRecordStore(
            json_file_path=json_file_path, record_type=FollowUpConfiguration, entity_name=ENTITY_NAME, default_input=default_configuration
        )

    async def get_follow_up_configuration(self) -> FollowUpConfiguration:
        return self.store.get_record()

    async def update_follow_up_configuration(self, configuration_input: FollowUpConfigurationInput) -> FollowUpConfiguration:
        return self.store.update_record(configuration_input)
