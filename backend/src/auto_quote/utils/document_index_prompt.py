from typing import Any

from pydantic import BaseModel

from auto_quote.models.indexed_document import DocumentCategory, DocumentExtraction, OfferPrice
from auto_quote.models.product import ProductInput
from auto_quote.utils.json_schema import build_strict_object


DOCUMENT_INDEX_SYSTEM_PROMPT = (
    "You index the documents of a small company that sends quotes to its customers. "
    "You only report what the document supports and never invent values."
)

CATEGORY_DESCRIPTIONS: dict[DocumentCategory, str] = {
    DocumentCategory.DATASHEET: "describes one or more products: technical data, dimensions, materials, catalogue or price list pages.",
    DocumentCategory.REQUEST: "a customer asking for work or a quote: an email, meeting or call notes.",
    DocumentCategory.OFFER: "a quote sent by the company to a customer, listing priced items.",
    DocumentCategory.UNKNOWN: "anything else.",
}


class _LLMSpecEntry(BaseModel):
    name: str
    value: str


class _LLMProduct(BaseModel):
    product_reference: str
    description: str
    unit: str
    unit_price: float | None
    spec: list[_LLMSpecEntry]


class _LLMDocumentIndex(BaseModel):
    category: DocumentCategory
    summary: str
    products: list[_LLMProduct]
    offer_prices: list[OfferPrice]


def build_document_index_json_schema() -> dict[str, Any]:
    spec_entry_json_schema = build_strict_object(properties={"name": {"type": "string"}, "value": {"type": "string"}})
    product_json_schema = build_strict_object(
        properties={
            "product_reference": {"type": "string"},
            "description": {"type": "string"},
            "unit": {"type": "string"},
            "unit_price": {"type": ["number", "null"]},
            "spec": {"type": "array", "items": spec_entry_json_schema},
        }
    )
    offer_price_json_schema = build_strict_object(properties={"product_reference": {"type": "string"}, "unit_price": {"type": "number"}})
    return build_strict_object(
        properties={
            "category": {"type": "string", "enum": [category.value for category in DocumentCategory]},
            "summary": {"type": "string"},
            "products": {"type": "array", "items": product_json_schema},
            "offer_prices": {"type": "array", "items": offer_price_json_schema},
        }
    )


def build_document_index_prompt(file_name: str, text: str) -> str:
    category_lines = "\n".join(f"- {category}: {description}" for category, description in CATEGORY_DESCRIPTIONS.items())

    return (
        f"Classify the document below and extract what its category needs.\n\n"
        f"Categories:\n{category_lines}\n\n"
        f"Return:\n"
        f"- category: one of the categories above.\n"
        f"- summary: two or three sentences on what the document is about, in the language of the document.\n"
        f"- products: only for a {DocumentCategory.DATASHEET}, one entry per product, otherwise empty. For each product:\n"
        f"  - product_reference: its article number, or its name when it has none.\n"
        f"  - description: one line describing it.\n"
        f"  - unit: the unit its price applies to (e.g. m, pc, kg), empty when unknown.\n"
        f"  - unit_price: the price per unit as a number, null when the document gives none.\n"
        f"  - spec: every property of the product as written in the document, as name/value pairs.\n"
        f"- offer_prices: only for an {DocumentCategory.OFFER}, otherwise empty. One entry per item that has an article number, "
        f"with that number as product_reference and its unit price. Leave out work such as labour, installation or transport.\n\n"
        f"Never invent information that the document does not contain.\n\n"
        f"File name: {file_name}\n"
        f"<document>\n{text}\n</document>"
    )


def parse_document_index_result(result: dict[str, Any], file_name: str) -> DocumentExtraction:
    document_index = _LLMDocumentIndex.model_validate(result)
    return DocumentExtraction(
        file_name=file_name,
        category=document_index.category,
        summary=document_index.summary.strip(),
        products=[_to_product_input(product) for product in document_index.products if product.product_reference.strip()],
        offer_prices=[
            OfferPrice(product_reference=offer_price.product_reference.strip(), unit_price=offer_price.unit_price)
            for offer_price in document_index.offer_prices
            if offer_price.product_reference.strip() and offer_price.unit_price >= 0
        ],
    )


# Strict structured outputs cannot describe an object with free keys, so the spec comes back as pairs and is turned into one here.
def _to_product_input(product: _LLMProduct) -> ProductInput:
    is_price_valid = product.unit_price is not None and product.unit_price >= 0
    return ProductInput(
        product_reference=product.product_reference.strip(),
        description=product.description.strip(),
        unit=product.unit.strip(),
        unit_price=product.unit_price if is_price_valid else None,
        spec={entry.name.strip(): entry.value.strip() for entry in product.spec if entry.name.strip()},
    )
