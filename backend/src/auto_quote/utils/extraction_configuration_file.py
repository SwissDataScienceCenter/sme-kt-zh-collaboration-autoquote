import json
import re
from io import BytesIO
from typing import Any

from openpyxl import Workbook, load_workbook

from auto_quote.errors import ConfigurationFileError
from auto_quote.models.extraction_configuration import (
    ConfigurationFileFormat,
    ExtractionConfigurationInput,
    ExtractionField,
    ImportMode,
    find_duplicate_keys,
)


FIELDS_SHEET_NAME = "fields"
FIELD_COLUMNS = ["key", "label", "type", "is_required", "description", "allowed_values"]
ALLOWED_VALUES_SEPARATOR = ","
DEFAULT_FILE_SLUG = "extraction-configuration"


def build_configuration_file(configuration_input: ExtractionConfigurationInput, file_format: ConfigurationFileFormat) -> bytes:
    if file_format == ConfigurationFileFormat.JSON:
        return json.dumps(configuration_input.model_dump(mode="json"), indent=4, ensure_ascii=False).encode("utf-8")
    return _build_xlsx(configuration_input.fields)


def build_configuration_file_name(name: str, file_format: ConfigurationFileFormat) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or DEFAULT_FILE_SLUG
    return f"{slug}.{file_format}"


def parse_configuration_file(content: bytes, file_format: ConfigurationFileFormat) -> list[ExtractionField]:
    # Anything going wrong here comes from the uploaded file, so it is reported to the user rather than treated as a server error.
    try:
        raw_fields = _read_json_fields(content) if file_format == ConfigurationFileFormat.JSON else _read_xlsx_fields(content)
        fields = [ExtractionField.model_validate(raw_field) for raw_field in raw_fields]
    except Exception as e:
        raise ConfigurationFileError(f"Could not read the {file_format} file: {e}") from e

    duplicate_keys = find_duplicate_keys(fields)
    if duplicate_keys:
        raise ConfigurationFileError(f"Duplicate field keys in the {file_format} file: {', '.join(duplicate_keys)}")
    return fields


def merge_imported_fields(
    current_fields: list[ExtractionField], imported_fields: list[ExtractionField], mode: ImportMode
) -> list[ExtractionField]:
    if mode == ImportMode.REPLACE:
        return imported_fields

    current_keys = {field.key for field in current_fields}
    new_fields = [field for field in imported_fields if field.key not in current_keys]
    if mode == ImportMode.SKIP:
        return [*current_fields, *new_fields]

    imported_fields_by_key = {field.key: field for field in imported_fields}
    return [imported_fields_by_key.get(field.key, field) for field in current_fields] + new_fields


def _read_json_fields(content: bytes) -> list[Any]:
    return json.loads(content)["fields"]


def _read_xlsx_fields(content: bytes) -> list[dict[str, Any]]:
    workbook = load_workbook(BytesIO(content), read_only=True, data_only=True)
    try:
        worksheet = workbook[FIELDS_SHEET_NAME] if FIELDS_SHEET_NAME in workbook.sheetnames else workbook.worksheets[0]
        rows = worksheet.iter_rows(values_only=True)
        header = [str(cell).strip() if cell is not None else "" for cell in next(rows)]
        return [_to_raw_field(dict(zip(header, row, strict=False))) for row in rows if any(cell is not None for cell in row)]
    finally:
        workbook.close()


def _to_raw_field(row: dict[str, Any]) -> dict[str, Any]:
    field_type = row.get("type")
    allowed_values = row.get("allowed_values") or ""
    return {
        "key": row.get("key"),
        "label": row.get("label"),
        "type": str(field_type).strip().lower() if field_type is not None else None,
        "is_required": row.get("is_required"),
        "description": row.get("description") or "",
        "allowed_values": [value.strip() for value in str(allowed_values).split(ALLOWED_VALUES_SEPARATOR) if value.strip()],
    }


def _build_xlsx(fields: list[ExtractionField]) -> bytes:
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = FIELDS_SHEET_NAME
    worksheet.append(FIELD_COLUMNS)
    for field in fields:
        allowed_values = f"{ALLOWED_VALUES_SEPARATOR} ".join(field.allowed_values)
        worksheet.append([field.key, field.label, field.type.value, field.is_required, field.description, allowed_values])

    buffer = BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()
