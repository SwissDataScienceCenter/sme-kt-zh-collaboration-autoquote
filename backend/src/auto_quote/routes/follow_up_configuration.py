from typing import Annotated

from fastapi import APIRouter, Depends

from auto_quote.auth.auth_provider import AuthProvider, User
from auto_quote.controllers.follow_up_configuration import FollowUpConfigurationController
from auto_quote.models.follow_up_configuration import FollowUpConfiguration, FollowUpConfigurationInput, FollowUpConfigurationPreview
from auto_quote.routes.paths import ApiPaths


def create_follow_up_configuration_router(
    follow_up_configuration_controller: FollowUpConfigurationController, auth_provider: AuthProvider
) -> APIRouter:
    router = APIRouter()
    CurrentUser = Annotated[User, Depends(auth_provider.get_current_user)]

    @router.get(ApiPaths.FOLLOW_UP_CONFIGURATION)
    async def get_follow_up_configuration(user: CurrentUser) -> FollowUpConfiguration:
        return await follow_up_configuration_controller.get_follow_up_configuration()

    @router.put(ApiPaths.FOLLOW_UP_CONFIGURATION)
    async def update_follow_up_configuration(configuration_input: FollowUpConfigurationInput, user: CurrentUser) -> FollowUpConfiguration:
        return await follow_up_configuration_controller.update_follow_up_configuration(configuration_input=configuration_input)

    @router.post(ApiPaths.FOLLOW_UP_CONFIGURATION_RESET)
    async def reset_follow_up_configuration(user: CurrentUser) -> FollowUpConfiguration:
        return await follow_up_configuration_controller.reset_follow_up_configuration()

    @router.get(ApiPaths.FOLLOW_UP_CONFIGURATION_PREVIEW)
    async def preview_follow_up_configuration(user: CurrentUser) -> FollowUpConfigurationPreview:
        return await follow_up_configuration_controller.preview_follow_up_configuration()

    return router
