from typing import Annotated

from fastapi import APIRouter, Depends

from auto_quote.auth.auth_provider import AuthProvider, User
from auto_quote.controllers.quote_configuration import QuoteConfigurationController
from auto_quote.models.quote_configuration import QuoteConfiguration, QuoteConfigurationInput, QuoteConfigurationPreview
from auto_quote.routes.paths import ApiPaths


def create_quote_configuration_router(
    quote_configuration_controller: QuoteConfigurationController, auth_provider: AuthProvider
) -> APIRouter:
    router = APIRouter()
    CurrentUser = Annotated[User, Depends(auth_provider.get_current_user)]

    @router.get(ApiPaths.QUOTE_CONFIGURATION)
    async def get_quote_configuration(user: CurrentUser) -> QuoteConfiguration:
        return await quote_configuration_controller.get_quote_configuration()

    @router.put(ApiPaths.QUOTE_CONFIGURATION)
    async def update_quote_configuration(configuration_input: QuoteConfigurationInput, user: CurrentUser) -> QuoteConfiguration:
        return await quote_configuration_controller.update_quote_configuration(configuration_input=configuration_input)

    @router.post(ApiPaths.QUOTE_CONFIGURATION_RESET)
    async def reset_quote_configuration(user: CurrentUser) -> QuoteConfiguration:
        return await quote_configuration_controller.reset_quote_configuration()

    @router.get(ApiPaths.QUOTE_CONFIGURATION_PREVIEW)
    async def preview_quote_configuration(user: CurrentUser) -> QuoteConfigurationPreview:
        return await quote_configuration_controller.preview_quote_configuration()

    return router
