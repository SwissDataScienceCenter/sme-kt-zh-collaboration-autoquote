from typing import Any

from pydantic import BaseModel

from auto_quote.models.extraction import ExtractedField, FieldStatus
from auto_quote.models.extraction_configuration import ExtractionField, FieldType
from auto_quote.utils.json_schema import build_strict_object


EXTRACTION_SYSTEM_PROMPT = (
    "You extract structured information from customer messages. You only report what the message supports and never invent values."
)

DATE_FORMAT_HINT = "Use YYYY-MM-DD when an exact date is given, otherwise keep the period as written."
EVIDENCE_DESCRIPTION = "Exact words from the message supporting the value, or the reason for an assumption."
# Stands in for the customer message when a prompt is previewed in Admin.
CUSTOMER_MESSAGE_PLACEHOLDER = "[customer message]"
UNDERSTOOD_STATUSES = {FieldStatus.FOUND, FieldStatus.ASSUMED}

VALUE_TYPES: dict[FieldType, str] = {
    FieldType.TEXT: "string",
    FieldType.INTEGER: "integer",
    FieldType.NUMBER: "number",
    FieldType.DATE: "string",
    FieldType.ENUM: "string",
    FieldType.BOOLEAN: "boolean",
}

STATUS_INSTRUCTIONS: dict[FieldStatus, str] = {
    FieldStatus.FOUND: "the message states the value explicitly.",
    FieldStatus.ASSUMED: "the message does not state the value, but it can be safely inferred from it (e.g. the language it is written in).",
    FieldStatus.PARTIAL: "the message only gives an imprecise or incomplete value (e.g. “sometime in spring” for a date).",
    FieldStatus.MISSING: "the message does not give the value.",
}


class _LLMExtractedValue(BaseModel):
    evidence: str | None
    value: str | int | float | bool | None
    status: FieldStatus


def build_extraction_json_schema(fields: list[ExtractionField]) -> dict[str, Any]:
    field_json_schemas = {field.key: _build_field_json_schema(field) for field in fields}
    return build_strict_object(properties={"fields": build_strict_object(properties=field_json_schemas)})


def build_extraction_prompt(description: str, fields: list[ExtractionField], message: str) -> str:
    context = f"Context: {description}\n\n" if description.strip() else ""
    field_lines = "\n".join(_describe_field(field) for field in fields)
    status_lines = "\n".join(f"  - {status}: {instruction}" for status, instruction in STATUS_INSTRUCTIONS.items())

    return (
        f"{context}"
        f"Extract the fields below from the customer message.\n\n"
        f"Fields:\n{field_lines}\n\n"
        f"For each field, return:\n"
        f"- evidence: the exact words from the message that support the value. For {FieldStatus.ASSUMED}, a short reason instead. "
        f"Null when the field is {FieldStatus.MISSING}.\n"
        f"- value: the value in the field's type, or null when the field is {FieldStatus.MISSING}. {DATE_FORMAT_HINT}\n"
        f"- status, one of:\n{status_lines}\n\n"
        f"Never invent information that the message does not contain.\n\n"
        f"Customer message:\n<message>\n{message}\n</message>"
    )


def parse_extraction_result(result: dict[str, Any], fields: list[ExtractionField]) -> list[ExtractedField]:
    raw_values = result["fields"]
    return [_to_extracted_field(field=field, extracted_value=_LLMExtractedValue.model_validate(raw_values[field.key])) for field in fields]


def _build_field_json_schema(field: ExtractionField) -> dict[str, Any]:
    return build_strict_object(
        description=f"{field.label}: {field.description}",
        properties={
            "evidence": {"type": ["string", "null"], "description": EVIDENCE_DESCRIPTION},
            "value": _build_value_json_schema(field),
            "status": {"type": "string", "enum": [status.value for status in FieldStatus]},
        },
    )


def _build_value_json_schema(field: ExtractionField) -> dict[str, Any]:
    value_json_schema: dict[str, Any] = {"type": [VALUE_TYPES[field.type], "null"]}
    if _has_allowed_values(field):
        value_json_schema["enum"] = [*field.allowed_values, None]
    if field.type == FieldType.DATE:
        value_json_schema["description"] = DATE_FORMAT_HINT
    return value_json_schema


def _describe_field(field: ExtractionField) -> str:
    attributes = [field.type.value]
    if _has_allowed_values(field):
        attributes.append(f"one of: {' / '.join(field.allowed_values)}")
    return f"- {field.key} ({', '.join(attributes)}): {field.label}. {field.description}"


# A value without content is missing whatever status the model gave it, so the follow-up asks for it.
def _to_extracted_field(field: ExtractionField, extracted_value: _LLMExtractedValue) -> ExtractedField:
    is_missing = extracted_value.status == FieldStatus.MISSING or extracted_value.value is None
    return ExtractedField(
        key=field.key,
        label=field.label,
        is_required=field.is_required,
        value=None if is_missing else extracted_value.value,
        status=FieldStatus.MISSING if is_missing else extracted_value.status,
        evidence=extracted_value.evidence,
    )


# An enum without allowed values falls back to free text rather than an unfillable field.
def _has_allowed_values(field: ExtractionField) -> bool:
    return field.type == FieldType.ENUM and len(field.allowed_values) > 0


def format_understood_fields(extracted_fields: list[ExtractedField]) -> str:
    return "\n".join(f"- {field.label}: {field.value}" for field in extracted_fields if field.status in UNDERSTOOD_STATUSES)
