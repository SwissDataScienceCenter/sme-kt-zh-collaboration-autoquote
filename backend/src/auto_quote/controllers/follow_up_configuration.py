from auto_quote.models.extraction import ExtractedField, FieldStatus, ReplyLanguage
from auto_quote.models.follow_up_configuration import (
    FollowUpConfiguration,
    FollowUpConfigurationDatabase,
    FollowUpConfigurationInput,
    FollowUpConfigurationPreview,
)
from auto_quote.utils.extraction_prompt import CUSTOMER_MESSAGE_PLACEHOLDER
from auto_quote.utils.follow_up_prompt import SENDER_PLACEHOLDER, build_follow_up_prompt


DEFAULT_FOLLOW_UP_CONFIGURATION = FollowUpConfigurationInput(
    system_prompt=(
        "You write short, polite and professional email replies to customers on behalf of the company that received their request. "
        "Thank the customer for their request and briefly restate what we understood. "
        "Start with a line “Subject: …”, then the email body. "
        f"Sign it as {SENDER_PLACEHOLDER}. Do not mention prices and do not promise anything the details you are given do not support."
    ),
    missing_information_instructions="Ask the customer for the following information, as a short numbered list of questions:",
    quote_instructions="Tell the customer we are pleased to send them our quote. Do not ask any questions.",
)

PREVIEW_UNDERSTOOD_FIELD = ExtractedField(
    key="understood_field", label="[Understood field]", is_required=True, value="[value]", status=FieldStatus.FOUND, evidence=None
)
PREVIEW_MISSING_FIELD = ExtractedField(
    key="missing_field", label="[Missing field]", is_required=True, value=None, status=FieldStatus.MISSING, evidence=None
)


class FollowUpConfigurationController:
    def __init__(self, follow_up_configuration_database: FollowUpConfigurationDatabase):
        self.follow_up_configuration_database = follow_up_configuration_database

    async def get_follow_up_configuration(self) -> FollowUpConfiguration:
        return await self.follow_up_configuration_database.get_follow_up_configuration()

    async def update_follow_up_configuration(self, configuration_input: FollowUpConfigurationInput) -> FollowUpConfiguration:
        return await self.follow_up_configuration_database.update_follow_up_configuration(configuration_input)

    async def reset_follow_up_configuration(self) -> FollowUpConfiguration:
        return await self.update_follow_up_configuration(configuration_input=DEFAULT_FOLLOW_UP_CONFIGURATION)

    async def preview_follow_up_configuration(self) -> FollowUpConfigurationPreview:
        follow_up_configuration = await self.get_follow_up_configuration()
        return FollowUpConfigurationPreview(
            system_prompt=follow_up_configuration.system_prompt,
            missing_information_prompt=build_follow_up_prompt(
                configuration=follow_up_configuration,
                message=CUSTOMER_MESSAGE_PLACEHOLDER,
                extracted_fields=[PREVIEW_UNDERSTOOD_FIELD, PREVIEW_MISSING_FIELD],
                missing_fields=[PREVIEW_MISSING_FIELD],
                reply_language=ReplyLanguage.SAME_AS_MESSAGE,
                quote=None,
            ),
            quote_prompt=build_follow_up_prompt(
                configuration=follow_up_configuration,
                message=CUSTOMER_MESSAGE_PLACEHOLDER,
                extracted_fields=[PREVIEW_UNDERSTOOD_FIELD],
                missing_fields=[],
                reply_language=ReplyLanguage.SAME_AS_MESSAGE,
                quote=None,
            ),
        )
