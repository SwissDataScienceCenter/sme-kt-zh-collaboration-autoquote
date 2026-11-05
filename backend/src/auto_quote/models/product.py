from abc import ABC, abstractmethod

from pydantic import BaseModel, Field


class ProductInput(BaseModel):
    product_reference: str = Field(min_length=1)
    description: str
    unit: str
    unit_price: float | None = Field(ge=0)
    spec: dict[str, str]


class Product(ProductInput):
    id: str
    create_timestamp: int
    update_timestamp: int


class ProductDatabase(ABC):
    """
    Stores the product catalogue shared by all users. Lookups by id raise NotFoundError when the product does not exist.
    """

    @abstractmethod
    async def create_product(self, product_input: ProductInput) -> Product:
        pass

    @abstractmethod
    async def get_products(self) -> list[Product]:
        pass

    @abstractmethod
    async def get_product_by_id(self, product_id: str) -> Product:
        pass

    # A search rather than a lookup: references are matched loosely, and None means no product uses it.
    @abstractmethod
    async def find_product_by_reference(self, product_reference: str) -> Product | None:
        pass

    @abstractmethod
    async def update_product(self, product_id: str, product_input: ProductInput) -> Product:
        pass

    @abstractmethod
    async def delete_products(self, product_ids: list[str]) -> None:
        pass
