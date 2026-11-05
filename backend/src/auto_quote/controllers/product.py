from auto_quote.errors import AlreadyExistsError
from auto_quote.models.product import Product, ProductDatabase, ProductInput
from auto_quote.utils.product_reference import normalize_product_reference


ENTITY_NAME = "Product"


class ProductController:
    def __init__(self, product_database: ProductDatabase):
        self.product_database = product_database

    async def get_products(self) -> list[Product]:
        products = await self.product_database.get_products()
        return sorted(products, key=lambda product: normalize_product_reference(product.product_reference))

    async def create_product(self, product_input: ProductInput) -> Product:
        await self._ensure_reference_is_free(product_reference=product_input.product_reference, product_id=None)
        return await self.product_database.create_product(product_input)

    async def update_product(self, product_id: str, product_input: ProductInput) -> Product:
        await self._ensure_reference_is_free(product_reference=product_input.product_reference, product_id=product_id)
        return await self.product_database.update_product(product_id=product_id, product_input=product_input)

    async def _ensure_reference_is_free(self, product_reference: str, product_id: str | None) -> None:
        existing_product = await self.product_database.find_product_by_reference(product_reference)
        if existing_product is not None and existing_product.id != product_id:
            raise AlreadyExistsError(entity_name=ENTITY_NAME, entity_id=product_reference)
