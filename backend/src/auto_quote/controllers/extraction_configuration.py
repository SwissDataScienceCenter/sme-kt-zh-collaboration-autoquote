from auto_quote.models.extraction_configuration import (
    CONFIGURATION_FILE_MEDIA_TYPES,
    ConfigurationFile,
    ConfigurationFileFormat,
    ExtractionConfiguration,
    ExtractionConfigurationDatabase,
    ExtractionConfigurationInput,
    ExtractionConfigurationPreview,
    ExtractionField,
    FieldType,
    ImportMode,
)
from auto_quote.utils.extraction_configuration_file import (
    build_configuration_file,
    build_configuration_file_name,
    merge_imported_fields,
    parse_configuration_file,
)
from auto_quote.utils.extraction_prompt import CUSTOMER_MESSAGE_PLACEHOLDER, build_extraction_json_schema, build_extraction_prompt


DEFAULT_EXTRACTION_CONFIGURATION = ExtractionConfigurationInput(
    name="Service request",
    description="Details to extract from incoming service requests.",
    fields=[
        ExtractionField(
            key="customer_name",
            label="Customer name",
            type=FieldType.TEXT,
            is_required=True,
            description="Full name of the person who wrote the request.",
        ),
        ExtractionField(
            key="service_type",
            label="Service type",
            type=FieldType.ENUM,
            is_required=True,
            description="What the customer wants to buy.",
            allowed_values=["Training", "Workshop", "Consulting"],
        ),
        ExtractionField(
            key="participants",
            label="Participants",
            type=FieldType.INTEGER,
            is_required=True,
            description="Number of attendees. Use the upper bound when a range is given.",
        ),
    ],
)


class ExtractionConfigurationController:
    def __init__(self, extraction_configuration_database: ExtractionConfigurationDatabase):
        self.extraction_configuration_database = extraction_configuration_database

    async def get_extraction_configuration(self) -> ExtractionConfiguration:
        return await self.extraction_configuration_database.get_extraction_configuration()

    async def update_extraction_configuration(self, configuration_input: ExtractionConfigurationInput) -> ExtractionConfiguration:
        return await self.extraction_configuration_database.update_extraction_configuration(configuration_input)

    async def import_into_extraction_configuration(
        self, content: bytes, file_format: ConfigurationFileFormat, mode: ImportMode
    ) -> ExtractionConfiguration:
        extraction_configuration = await self.get_extraction_configuration()
        imported_fields = parse_configuration_file(content=content, file_format=file_format)
        fields = merge_imported_fields(current_fields=extraction_configuration.fields, imported_fields=imported_fields, mode=mode)
        configuration_input = ExtractionConfigurationInput(
            name=extraction_configuration.name, description=extraction_configuration.description, fields=fields
        )
        return await self.update_extraction_configuration(configuration_input)

    async def export_extraction_configuration(self, file_format: ConfigurationFileFormat) -> ConfigurationFile:
        extraction_configuration = await self.get_extraction_configuration()
        return ConfigurationFile(
            file_name=build_configuration_file_name(name=extraction_configuration.name, file_format=file_format),
            media_type=CONFIGURATION_FILE_MEDIA_TYPES[file_format],
            content=build_configuration_file(
                configuration_input=_to_configuration_input(extraction_configuration), file_format=file_format
            ),
        )

    async def preview_extraction_configuration(self) -> ExtractionConfigurationPreview:
        extraction_configuration = await self.get_extraction_configuration()
        return ExtractionConfigurationPreview(
            json_schema=build_extraction_json_schema(fields=extraction_configuration.fields),
            prompt=build_extraction_prompt(
                description=extraction_configuration.description,
                fields=extraction_configuration.fields,
                message=CUSTOMER_MESSAGE_PLACEHOLDER,
            ),
        )


def _to_configuration_input(extraction_configuration: ExtractionConfiguration) -> ExtractionConfigurationInput:
    return ExtractionConfigurationInput(
        name=extraction_configuration.name, description=extraction_configuration.description, fields=extraction_configuration.fields
    )
