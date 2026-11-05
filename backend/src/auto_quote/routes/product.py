from typing import Annotated

from fastapi import APIRouter, Depends

from auto_quote.auth.auth_provider import AuthProvider, User
from auto_quote.controllers.product import ProductController
from auto_quote.models.product import Product, ProductInput
from auto_quote.routes.paths import ApiPaths


def create_product_router(product_controller: ProductController, auth_provider: AuthProvider) -> APIRouter:
    router = APIRouter()
    CurrentUser = Annotated[User, Depends(auth_provider.get_current_user)]

    @router.get(ApiPaths.PRODUCTS)
    async def get_products(user: CurrentUser) -> list[Product]:
        return await product_controller.get_products()

    @router.post(ApiPaths.PRODUCTS)
    async def create_product(product_input: ProductInput, user: CurrentUser) -> Product:
        return await product_controller.create_product(product_input)

    @router.put(ApiPaths.PRODUCT)
    async def update_product(product_id: str, product_input: ProductInput, user: CurrentUser) -> Product:
        return await product_controller.update_product(product_id=product_id, product_input=product_input)

    return router
