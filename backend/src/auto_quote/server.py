from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from auto_quote.auth.auth_provider import AuthProvider
from auto_quote.controllers.document_index import DocumentIndexController
from auto_quote.controllers.extraction import ExtractionController
from auto_quote.controllers.extraction_configuration import ExtractionConfigurationController
from auto_quote.controllers.follow_up_configuration import FollowUpConfigurationController
from auto_quote.controllers.product import ProductController
from auto_quote.controllers.quote_configuration import QuoteConfigurationController
from auto_quote.errors import ConfigurationFileError, ConflictError, LLMResponseError, NotFoundError
from auto_quote.routes.document_index import create_document_index_router
from auto_quote.routes.extraction import create_extraction_router
from auto_quote.routes.extraction_configuration import create_extraction_configuration_router
from auto_quote.routes.follow_up_configuration import create_follow_up_configuration_router
from auto_quote.routes.product import create_product_router
from auto_quote.routes.quote_configuration import create_quote_configuration_router


APP_TITLE = "Auto Quote"

# Subclasses share their parent's status, e.g. every ConflictError is a 409.
ERROR_STATUS_CODES: dict[type[Exception], int] = {
    NotFoundError: status.HTTP_404_NOT_FOUND,
    ConflictError: status.HTTP_409_CONFLICT,
    ConfigurationFileError: status.HTTP_400_BAD_REQUEST,
    LLMResponseError: status.HTTP_502_BAD_GATEWAY,
}


def create_app(
    extraction_configuration_controller: ExtractionConfigurationController,
    follow_up_configuration_controller: FollowUpConfigurationController,
    quote_configuration_controller: QuoteConfigurationController,
    extraction_controller: ExtractionController,
    document_index_controller: DocumentIndexController,
    product_controller: ProductController,
    auth_provider: AuthProvider,
) -> FastAPI:
    app = FastAPI(title=APP_TITLE)
    app.include_router(
        create_extraction_configuration_router(
            extraction_configuration_controller=extraction_configuration_controller, auth_provider=auth_provider
        )
    )
    app.include_router(
        create_follow_up_configuration_router(
            follow_up_configuration_controller=follow_up_configuration_controller, auth_provider=auth_provider
        )
    )
    app.include_router(
        create_quote_configuration_router(quote_configuration_controller=quote_configuration_controller, auth_provider=auth_provider)
    )
    app.include_router(create_extraction_router(extraction_controller=extraction_controller, auth_provider=auth_provider))
    app.include_router(create_document_index_router(document_index_controller=document_index_controller, auth_provider=auth_provider))
    app.include_router(create_product_router(product_controller=product_controller, auth_provider=auth_provider))
    for error_type, status_code in ERROR_STATUS_CODES.items():
        app.add_exception_handler(error_type, _create_error_handler(status_code))
    return app


def _create_error_handler(status_code: int) -> Callable[[Request, Exception], Awaitable[JSONResponse]]:
    async def handle_error(request: Request, error: Exception) -> JSONResponse:
        return JSONResponse(status_code=status_code, content={"detail": str(error)})

    return handle_error
