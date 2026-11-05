from typing import Any

from pydantic import BaseModel

from auto_quote.models.extraction import ExtractedField
from auto_quote.models.product import Product
from auto_quote.models.quote import CURRENCY, Quote, QuoteLanguage, QuoteLine, QuoteLineType
from auto_quote.models.quote_configuration import QuoteConfigurationInput
from auto_quote.utils.extraction_prompt import format_understood_fields
from auto_quote.utils.json_schema import build_strict_object
from auto_quote.utils.product_reference import normalize_product_reference


BUILD_QUOTE_TOOL_NAME = "build_quote"
PRICE_DECIMALS = 2

QUOTE_SYSTEM_PROMPT = (
    "You prepare quotes for a small company from customer requests. You choose the products and the work the request needs, "
    f"then hand them to the {BUILD_QUOTE_TOOL_NAME} tool. You never compute totals yourself: the tool does."
)


class _LLMProductLine(BaseModel):
    product_reference: str
    quantity: float


class _LLMExtraLine(BaseModel):
    description: str
    quantity: float
    unit: str
    unit_price: float


class _LLMQuote(BaseModel):
    customer: str
    title: str
    scope_of_work: str
    terms: str
    product_lines: list[_LLMProductLine]
    extra_lines: list[_LLMExtraLine]
    language: QuoteLanguage


def build_quote_tool() -> dict[str, Any]:
    product_line_json_schema = build_strict_object(
        properties={
            "product_reference": {"type": "string", "description": "Reference of a catalogue product that has a price."},
            "quantity": {"type": "number", "description": "Quantity in the product's unit."},
        }
    )
    extra_line_json_schema = build_strict_object(
        properties={
            "description": {"type": "string", "description": "What the line is, written for the customer."},
            "quantity": {"type": "number"},
            "unit": {"type": "string", "description": "e.g. h, flat, day, pc"},
            "unit_price": {
                "type": "number",
                "description": "Rate from the business rules, or your best estimate from similar offers, without the margin.",
            },
        }
    )
    return {
        "type": "function",
        "name": BUILD_QUOTE_TOOL_NAME,
        "description": "Builds the quote. Catalogue prices, the margin and the totals are applied by the tool.",
        "parameters": build_strict_object(
            properties={
                "customer": {"type": "string", "description": "Organisation and contact person as given in the request."},
                "title": {"type": "string", "description": "Short subject of the quote."},
                "scope_of_work": {"type": "string", "description": "What will be done, written for the customer, without prices."},
                "terms": {"type": "string", "description": "Validity and payment terms from the business rules."},
                "product_lines": {"type": "array", "items": product_line_json_schema},
                "extra_lines": {"type": "array", "items": extra_line_json_schema},
                "language": {
                    "type": "string",
                    "enum": list(QuoteLanguage),
                    "description": "Language of the request, in which the quote text is written. The PDF labels follow it.",
                },
            }
        ),
        "strict": True,
    }


def build_quote_prompt(
    configuration: QuoteConfigurationInput, request: str, products: str, similar_offers: str, adjustment: str | None
) -> str:
    adjustment_section = f"\n\n{adjustment}" if adjustment is not None else ""
    return (
        f"Build a quote for the customer request below by calling the {BUILD_QUOTE_TOOL_NAME} tool once.\n\n"
        f"Business rules:\n{configuration.business_rules}\n\n"
        f"Parameters:\n"
        f"- Extra margin: {configuration.extra_margin_percentage:g} %. The tool adds it to every unit price, "
        f"so use the catalogue prices and the rates from the business rules as they are. Never mention the margin.\n\n"
        f"How to build the quote:\n"
        f"- Product lines: catalogue products that have a price, by their product_reference, with the quantity the request needs.\n"
        f"- Extra lines: everything else the request needs (work rated by the business rules, products missing from the catalogue "
        f"or without a price), with a description, quantity, unit and unit price taken from the business rules or estimated from the similar offers.\n"
        f"- Language: write the title, scope of work, terms and line descriptions in the language of the request, and give it as language.\n"
        f"- Scope of work: inspired by the similar past offers. Never mention prices in it.\n"
        f"- Never invent requirements the request does not state.\n\n"
        f"Customer request:\n<request>\n{request}\n</request>\n\n"
        f"Product catalogue:\n<products>\n{products}\n</products>\n\n"
        f"Similar past offers:\n<offers>\n{similar_offers}\n</offers>"
        f"{adjustment_section}"
    )


def format_quote_request(message: str, extracted_fields: list[ExtractedField]) -> str:
    detail_lines = format_understood_fields(extracted_fields)
    return f"{message}\n\nExtracted details:\n{detail_lines or '- None'}"


# Prices are given without the margin, as the model sees them in the catalogue and the business rules.
def format_quote_adjustment(quote: Quote, feedback: str, extra_margin_percentage: float) -> str:
    margin_factor = _get_margin_factor(extra_margin_percentage)
    product_lines = [f"- {line.product_reference} × {line.quantity:g}" for line in quote.lines if line.type == QuoteLineType.PRODUCT]
    extra_lines = [
        f"- {line.description} | {line.quantity:g} {line.unit} | {CURRENCY} {line.unit_price / margin_factor:.2f}"
        for line in quote.lines
        if line.type == QuoteLineType.EXTRA
    ]
    return (
        f"Current quote:\n"
        f"- Customer: {quote.customer}\n"
        f"- Title: {quote.title}\n"
        f"- Scope of work: {quote.scope_of_work}\n"
        f"- Terms: {quote.terms}\n"
        f"Product lines:\n{'\n'.join(product_lines) or '- None'}\n"
        f"Extra lines:\n{'\n'.join(extra_lines) or '- None'}\n\n"
        f"Feedback from the person reviewing the quote:\n<feedback>\n{feedback}\n</feedback>\n\n"
        f"Call the {BUILD_QUOTE_TOOL_NAME} tool with the whole adjusted quote: apply the feedback and keep everything it does not mention."
    )


def format_product_catalogue(products: list[Product]) -> str:
    return "\n".join(_describe_product(product) for product in products) or "- No products yet"


# Prices come from the catalogue, never from the model; anything the catalogue cannot price becomes an extra line.
def parse_quote_result(result: dict[str, Any], products: list[Product], extra_margin_percentage: float) -> Quote:
    llm_quote = _LLMQuote.model_validate(result)
    products_by_reference = {normalize_product_reference(product.product_reference): product for product in products}
    margin_factor = _get_margin_factor(extra_margin_percentage)

    lines = [
        _to_product_line(
            product_line=product_line,
            product=products_by_reference.get(normalize_product_reference(product_line.product_reference)),
            margin_factor=margin_factor,
        )
        for product_line in llm_quote.product_lines
    ]
    lines += [
        _build_line(
            line_type=QuoteLineType.EXTRA,
            product_reference=None,
            description=extra_line.description,
            quantity=extra_line.quantity,
            unit=extra_line.unit,
            base_unit_price=extra_line.unit_price,
            margin_factor=margin_factor,
        )
        for extra_line in llm_quote.extra_lines
    ]
    return Quote(
        customer=llm_quote.customer,
        title=llm_quote.title,
        scope_of_work=llm_quote.scope_of_work,
        terms=llm_quote.terms,
        lines=lines,
        total=round(sum(line.total for line in lines), PRICE_DECIMALS),
        language=llm_quote.language,
    )


def _get_margin_factor(extra_margin_percentage: float) -> float:
    return 1 + extra_margin_percentage / 100


def _describe_product(product: Product) -> str:
    price = f"{CURRENCY} {product.unit_price:.2f} per {product.unit or 'unit'}" if product.unit_price is not None else "no price"
    return f"- {product.product_reference} | {product.description} | {price}"


# A reference the catalogue does not know or cannot price is kept as an extra line at 0, so the person reviewing the quote notices it.
def _to_product_line(product_line: _LLMProductLine, product: Product | None, margin_factor: float) -> QuoteLine:
    if product is None:
        return _build_line(
            line_type=QuoteLineType.EXTRA,
            product_reference=None,
            description=product_line.product_reference.strip(),
            quantity=product_line.quantity,
            unit="",
            base_unit_price=0,
            margin_factor=margin_factor,
        )
    return _build_line(
        line_type=QuoteLineType.PRODUCT if product.unit_price is not None else QuoteLineType.EXTRA,
        product_reference=product.product_reference,
        description=product.description,
        quantity=product_line.quantity,
        unit=product.unit,
        base_unit_price=product.unit_price or 0,
        margin_factor=margin_factor,
    )


def _build_line(
    line_type: QuoteLineType,
    product_reference: str | None,
    description: str,
    quantity: float,
    unit: str,
    base_unit_price: float,
    margin_factor: float,
) -> QuoteLine:
    unit_price = round(base_unit_price * margin_factor, PRICE_DECIMALS)
    return QuoteLine(
        type=line_type,
        product_reference=product_reference,
        description=description,
        quantity=quantity,
        unit=unit,
        unit_price=unit_price,
        total=round(unit_price * quantity, PRICE_DECIMALS),
    )
