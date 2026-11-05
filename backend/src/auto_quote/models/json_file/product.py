from pathlib import Path

from auto_quote.models.json_file.store import JSONFileStore
from auto_quote.models.product import Product, ProductDatabase, ProductInput
from auto_quote.utils.ids import generate_id
from auto_quote.utils.product_reference import normalize_product_reference
from auto_quote.utils.time import get_current_timestamp


ENTITY_NAME = "Product"


class JSONFileProductDatabase(ProductDatabase):
    def __init__(self, json_file_path: Path):
        self.store = JSONFileStore(json_file_path=json_file_path, record_type=Product, entity_name=ENTITY_NAME)

    async def create_product(self, product_input: ProductInput) -> Product:
        timestamp = get_current_timestamp()
        product = Product(
            id=generate_id(),
            product_reference=product_input.product_reference,
            description=product_input.description,
            unit=product_input.unit,
            unit_price=product_input.unit_price,
            spec=product_input.spec,
            create_timestamp=timestamp,
            update_timestamp=timestamp,
        )
        self.store.save_record(record_id=product.id, record=product)
        return product

    async def get_products(self) -> list[Product]:
        return self.store.get_records()

    async def get_product_by_id(self, product_id: str) -> Product:
        return self.store.get_record_by_id(product_id)

    async def find_product_by_reference(self, product_reference: str) -> Product | None:
        normalized_reference = normalize_product_reference(product_reference)
        return next(
            (
                product
                for product in self.store.get_records()
                if normalize_product_reference(product.product_reference) == normalized_reference
            ),
            None,
        )

    async def update_product(self, product_id: str, product_input: ProductInput) -> Product:
        product = await self.get_product_by_id(product_id)
        updated_product = product.model_copy(
            update={
                "product_reference": product_input.product_reference,
                "description": product_input.description,
                "unit": product_input.unit,
                "unit_price": product_input.unit_price,
                "spec": product_input.spec,
                "update_timestamp": get_current_timestamp(),
            }
        )
        self.store.save_record(record_id=product_id, record=updated_product)
        return updated_product

    async def delete_products(self, product_ids: list[str]) -> None:
        self.store.delete_records(product_ids)
