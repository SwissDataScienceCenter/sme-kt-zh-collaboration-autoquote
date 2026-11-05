from typing import Annotated

from fastapi import APIRouter, Depends, Response

from auto_quote.auth.auth_provider import AuthProvider, User
from auto_quote.controllers.document_index import DocumentIndexController
from auto_quote.models.indexed_document import DocumentIndexing, DocumentIndexStatus
from auto_quote.routes.paths import ApiPaths


def create_document_index_router(document_index_controller: DocumentIndexController, auth_provider: AuthProvider) -> APIRouter:
    router = APIRouter()
    CurrentUser = Annotated[User, Depends(auth_provider.get_current_user)]

    @router.get(ApiPaths.DOCUMENT_FILE)
    async def get_document_file(file_name: str, user: CurrentUser) -> Response:
        document_file = await document_index_controller.get_document_file(file_name)
        # Inline, so the browser shows the document in the tab instead of downloading it when it can.
        return Response(content=document_file.content, media_type=document_file.media_type, headers={"Content-Disposition": "inline"})

    @router.get(ApiPaths.DOCUMENT_INDEX)
    async def get_document_index_status(user: CurrentUser) -> DocumentIndexStatus:
        return await document_index_controller.get_document_index_status()

    @router.post(ApiPaths.DOCUMENT_INDEX)
    async def start_document_indexing(user: CurrentUser) -> DocumentIndexing:
        return await document_index_controller.start_document_indexing()

    @router.delete(ApiPaths.DOCUMENT_INDEX)
    async def delete_document_index(user: CurrentUser) -> DocumentIndexStatus:
        return await document_index_controller.delete_document_index()

    return router
