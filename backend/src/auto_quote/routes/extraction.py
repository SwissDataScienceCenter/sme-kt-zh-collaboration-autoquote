from typing import Annotated

from fastapi import APIRouter, Depends, Response

from auto_quote.auth.auth_provider import AuthProvider, User
from auto_quote.controllers.extraction import ExtractionController
from auto_quote.models.extraction import Extraction, ExtractionInput, QuoteAdjustmentInput
from auto_quote.routes.paths import ApiPaths


PDF_MEDIA_TYPE = "application/pdf"
PDF_FILE_NAME = "quote.pdf"


def create_extraction_router(extraction_controller: ExtractionController, auth_provider: AuthProvider) -> APIRouter:
    router = APIRouter()
    CurrentUser = Annotated[User, Depends(auth_provider.get_current_user)]

    @router.post(ApiPaths.EXTRACTIONS)
    async def create_extraction(extraction_input: ExtractionInput, user: CurrentUser) -> Extraction:
        return await extraction_controller.create_extraction(extraction_input=extraction_input)

    @router.post(ApiPaths.QUOTE_ADJUSTMENTS)
    async def adjust_quote(extraction_id: str, adjustment_input: QuoteAdjustmentInput, user: CurrentUser) -> Extraction:
        return await extraction_controller.adjust_quote(extraction_id=extraction_id, adjustment_input=adjustment_input)

    @router.get(ApiPaths.EXTRACTION_QUOTE_PDF)
    async def render_quote_pdf(extraction_id: str, user: CurrentUser) -> Response:
        return Response(
            content=await extraction_controller.render_quote_pdf(extraction_id),
            media_type=PDF_MEDIA_TYPE,
            headers={"Content-Disposition": f'attachment; filename="{PDF_FILE_NAME}"'},
        )

    return router
