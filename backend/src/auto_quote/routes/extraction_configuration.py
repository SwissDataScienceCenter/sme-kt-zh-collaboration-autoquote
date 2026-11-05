from typing import Annotated

from fastapi import APIRouter, Depends, Form, Response, UploadFile

from auto_quote.auth.auth_provider import AuthProvider, User
from auto_quote.controllers.extraction_configuration import ExtractionConfigurationController
from auto_quote.models.extraction_configuration import (
    ConfigurationFileFormat,
    ExtractionConfiguration,
    ExtractionConfigurationInput,
    ExtractionConfigurationPreview,
    ImportMode,
)
from auto_quote.routes.paths import ApiPaths


def create_extraction_configuration_router(
    extraction_configuration_controller: ExtractionConfigurationController, auth_provider: AuthProvider
) -> APIRouter:
    router = APIRouter()
    CurrentUser = Annotated[User, Depends(auth_provider.get_current_user)]

    @router.get(ApiPaths.EXTRACTION_CONFIGURATION)
    async def get_extraction_configuration(user: CurrentUser) -> ExtractionConfiguration:
        return await extraction_configuration_controller.get_extraction_configuration()

    @router.put(ApiPaths.EXTRACTION_CONFIGURATION)
    async def update_extraction_configuration(
        configuration_input: ExtractionConfigurationInput, user: CurrentUser
    ) -> ExtractionConfiguration:
        return await extraction_configuration_controller.update_extraction_configuration(configuration_input=configuration_input)

    @router.get(ApiPaths.EXTRACTION_CONFIGURATION_PREVIEW)
    async def preview_extraction_configuration(user: CurrentUser) -> ExtractionConfigurationPreview:
        return await extraction_configuration_controller.preview_extraction_configuration()

    @router.post(ApiPaths.EXTRACTION_CONFIGURATION_IMPORT)
    async def import_into_extraction_configuration(
        file: UploadFile,
        file_format: Annotated[ConfigurationFileFormat, Form()],
        user: CurrentUser,
        mode: Annotated[ImportMode, Form()] = ImportMode.UPDATE,
    ) -> ExtractionConfiguration:
        content = await file.read()
        return await extraction_configuration_controller.import_into_extraction_configuration(
            content=content, file_format=file_format, mode=mode
        )

    @router.get(ApiPaths.EXTRACTION_CONFIGURATION_EXPORT)
    async def export_extraction_configuration(
        user: CurrentUser, file_format: ConfigurationFileFormat = ConfigurationFileFormat.XLSX
    ) -> Response:
        configuration_file = await extraction_configuration_controller.export_extraction_configuration(file_format=file_format)
        return Response(
            content=configuration_file.content,
            media_type=configuration_file.media_type,
            headers={"Content-Disposition": f'attachment; filename="{configuration_file.file_name}"'},
        )

    return router
