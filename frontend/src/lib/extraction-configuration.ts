import { FieldTypes } from "@/services/extraction-configuration";
import type { ExtractionField, ExtractionConfiguration, ExtractionConfigurationInput } from "@/services/extraction-configuration";

// Mirrors the backend rule: keys become JSON-schema property names.
const FIELD_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ALLOWED_VALUES_SEPARATOR = ",";

export const CONFIGURATION_FILE_COLUMNS = ["key", "label", "type", "is_required", "description", "allowed_values"] as const;

export const FieldErrors = {
    KEY_REQUIRED: "keyRequired",
    KEY_INVALID: "keyInvalid",
    KEY_DUPLICATE: "keyDuplicate",
    LABEL_REQUIRED: "labelRequired",
    ALLOWED_VALUES_REQUIRED: "allowedValuesRequired",
} as const;

export type FieldError = (typeof FieldErrors)[keyof typeof FieldErrors];

export const createEmptyField = (): ExtractionField => ({
    key: "",
    label: "",
    type: FieldTypes.TEXT,
    is_required: false,
    description: "",
    allowed_values: [],
});

export const toConfigurationInput = (extractionConfiguration: ExtractionConfiguration): ExtractionConfigurationInput => ({
    name: extractionConfiguration.name,
    description: extractionConfiguration.description,
    fields: extractionConfiguration.fields,
});

export const replaceField = (fields: ExtractionField[], originalKey: ExtractionField["key"] | null, field: ExtractionField): ExtractionField[] =>
    originalKey === null ? [...fields, field] : fields.map((existingField) => (existingField.key === originalKey ? field : existingField));

export const removeField = (fields: ExtractionField[], key: ExtractionField["key"]): ExtractionField[] => fields.filter((field) => field.key !== key);

export const parseAllowedValues = (text: string): string[] =>
    text
        .split(ALLOWED_VALUES_SEPARATOR)
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

export const formatAllowedValues = (allowedValues: string[]): string => allowedValues.join(`${ALLOWED_VALUES_SEPARATOR} `);

export const normalizeField = (field: ExtractionField, allowedValuesText: string): ExtractionField => ({
    ...field,
    key: field.key.trim(),
    label: field.label.trim(),
    description: field.description.trim(),
    allowed_values: field.type === FieldTypes.ENUM ? parseAllowedValues(allowedValuesText) : [],
});

export const validateField = (field: ExtractionField, otherKeys: ExtractionField["key"][]): FieldError | null => {
    if (field.key === "") {
        return FieldErrors.KEY_REQUIRED;
    }
    if (!FIELD_KEY_PATTERN.test(field.key)) {
        return FieldErrors.KEY_INVALID;
    }
    if (otherKeys.includes(field.key)) {
        return FieldErrors.KEY_DUPLICATE;
    }
    if (field.label === "") {
        return FieldErrors.LABEL_REQUIRED;
    }
    if (field.type === FieldTypes.ENUM && field.allowed_values.length === 0) {
        return FieldErrors.ALLOWED_VALUES_REQUIRED;
    }
    return null;
};
