import { ApiClient } from "@/services/api";
import type { DownloadedFile } from "@/services/api";

export const FieldTypes = {
    TEXT: "text",
    INTEGER: "integer",
    NUMBER: "number",
    DATE: "date",
    ENUM: "enum",
    BOOLEAN: "boolean",
} as const;

export type FieldType = (typeof FieldTypes)[keyof typeof FieldTypes];

export const ConfigurationFileFormats = {
    XLSX: "xlsx",
    JSON: "json",
} as const;

export type ConfigurationFileFormat = (typeof ConfigurationFileFormats)[keyof typeof ConfigurationFileFormats];

export const ImportModes = {
    UPDATE: "update",
    SKIP: "skip",
    REPLACE: "replace",
} as const;

export type ImportMode = (typeof ImportModes)[keyof typeof ImportModes];

export interface ExtractionField {
    key: string;
    label: string;
    type: FieldType;
    is_required: boolean;
    description: string;
    allowed_values: string[];
}

export interface ExtractionConfigurationInput {
    name: string;
    description: string;
    fields: ExtractionField[];
}

export interface ExtractionConfiguration extends ExtractionConfigurationInput {
    id: string;
    create_timestamp: number;
    update_timestamp: number;
}

export interface ExtractionConfigurationPreview {
    json_schema: Record<string, unknown>;
    prompt: string;
}

const EXTRACTION_CONFIGURATION_PATH = "/extraction-configuration";
const PREVIEW_PATH = `${EXTRACTION_CONFIGURATION_PATH}/preview`;
const IMPORT_PATH = `${EXTRACTION_CONFIGURATION_PATH}/import`;
const EXPORT_PATH = `${EXTRACTION_CONFIGURATION_PATH}/export`;

class ExtractionConfigurationService extends ApiClient {
    getExtractionConfiguration(): Promise<ExtractionConfiguration> {
        return this.get<ExtractionConfiguration>(EXTRACTION_CONFIGURATION_PATH);
    }

    updateExtractionConfiguration(configurationInput: ExtractionConfigurationInput): Promise<ExtractionConfiguration> {
        return this.put<ExtractionConfiguration>(EXTRACTION_CONFIGURATION_PATH, configurationInput);
    }

    importIntoExtractionConfiguration(file: File, fileFormat: ConfigurationFileFormat, mode: ImportMode): Promise<ExtractionConfiguration> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("file_format", fileFormat);
        formData.append("mode", mode);
        return this.postForm<ExtractionConfiguration>(IMPORT_PATH, formData);
    }

    exportExtractionConfiguration(fileFormat: ConfigurationFileFormat): Promise<DownloadedFile> {
        return this.getFile(`${EXPORT_PATH}?file_format=${fileFormat}`);
    }

    previewExtractionConfiguration(): Promise<ExtractionConfigurationPreview> {
        return this.get<ExtractionConfigurationPreview>(PREVIEW_PATH);
    }
}

export const extractionConfigurationService = new ExtractionConfigurationService();
