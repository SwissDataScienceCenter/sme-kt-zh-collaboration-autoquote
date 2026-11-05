from typing import Any


# Strict structured outputs require every property to be listed as required and no additional properties.
def build_strict_object(properties: dict[str, Any], description: str | None = None) -> dict[str, Any]:
    json_schema: dict[str, Any] = {
        "type": "object",
        "properties": properties,
        "required": list(properties),
        "additionalProperties": False,
    }
    if description is not None:
        json_schema["description"] = description
    return json_schema
