import { useRef, useState } from "react";
import type { ChangeEvent, FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExtractionConfiguration } from "@/hooks/useExtractionConfiguration";
import { CONFIGURATION_FILE_COLUMNS, formatAllowedValues, parseAllowedValues } from "@/lib/extraction-configuration";
import { isOneOf } from "@/lib/guards";
import { FieldTypes, ImportModes, ConfigurationFileFormats } from "@/services/extraction-configuration";
import type { ExtractionField, ImportMode, ConfigurationFileFormat } from "@/services/extraction-configuration";

const EXAMPLE_FIELD_KEY = "service_type";
const JSON_INDENT = 2;

interface Props {
    fileFormat: ConfigurationFileFormat;
    onFileFormatChange: (fileFormat: ConfigurationFileFormat) => void;
    onClose: () => void;
}

export const ImportPanel: FunctionComponent<Props> = (props: Props) => {
    const { fileFormat, onFileFormatChange, onClose } = props;
    const { t } = useTranslation();
    const { isSaving, importIntoConfiguration } = useExtractionConfiguration();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [mode, setMode] = useState<ImportMode>(ImportModes.UPDATE);

    const isXlsx = fileFormat === ConfigurationFileFormats.XLSX;
    const exampleField: ExtractionField = {
        key: EXAMPLE_FIELD_KEY,
        label: t("admin.importPanel.example.label"),
        type: FieldTypes.ENUM,
        is_required: true,
        description: t("admin.importPanel.example.description"),
        allowed_values: parseAllowedValues(t("admin.importPanel.example.allowedValues")),
    };
    const exampleRow = [
        exampleField.key,
        exampleField.label,
        exampleField.type,
        String(exampleField.is_required).toUpperCase(),
        exampleField.description,
        formatAllowedValues(exampleField.allowed_values),
    ];

    const handleFileFormatChange = (value: string) => {
        if (!isOneOf(Object.values(ConfigurationFileFormats), value)) {
            return;
        }
        setSelectedFile(null);
        onFileFormatChange(value);
    };

    const handleModeChange = (value: string) => {
        if (isOneOf(Object.values(ImportModes), value)) {
            setMode(value);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedFile(e.target.files?.[0] ?? null);
    };

    const handleImport = async () => {
        if (selectedFile === null) {
            return;
        }
        const isImported = await importIntoConfiguration(selectedFile, fileFormat, mode);
        if (isImported) {
            onClose();
        }
    };

    return (
        <section aria-labelledby="import-title" className="flex flex-col gap-5 rounded-lg bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex max-w-2xl flex-col gap-1">
                    <h2 id="import-title" className="text-2xl leading-snug">
                        {isXlsx ? t("admin.importPanel.xlsxTitle") : t("admin.importPanel.jsonTitle")}
                    </h2>
                    <p className="text-[0.95rem] text-muted-foreground">{isXlsx ? t("admin.importPanel.xlsxHelp") : t("admin.importPanel.jsonHelp")}</p>
                </div>
                <Tabs value={fileFormat} onValueChange={handleFileFormatChange}>
                    <TabsList aria-label={t("admin.importPanel.formatLabel")}>
                        <TabsTrigger value={ConfigurationFileFormats.XLSX}>{t("admin.importPanel.excel")}</TabsTrigger>
                        <TabsTrigger value={ConfigurationFileFormats.JSON}>{t("admin.importPanel.json")}</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {isXlsx ? (
                <div className="overflow-x-auto rounded-lg">
                    <table aria-label={t("admin.importPanel.sampleLabel")} className="w-full min-w-[960px] border-separate border-spacing-px bg-highlight text-sm">
                        <thead>
                            <tr>
                                {CONFIGURATION_FILE_COLUMNS.map((column) => (
                                    <th key={column} scope="col" className="bg-highlight px-3 py-2 text-left font-mono text-xs font-medium text-ink">
                                        {column}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {exampleRow.map((value, columnIndex) => (
                                    <td key={CONFIGURATION_FILE_COLUMNS[columnIndex]} className="bg-surface px-3 py-2">
                                        {value}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <pre aria-label={t("admin.importPanel.sampleLabel")} className="overflow-auto rounded-lg bg-ink p-4 font-mono text-xs leading-relaxed text-highlight">
                    {JSON.stringify({ fields: [exampleField] }, null, JSON_INDENT)}
                </pre>
            )}

            <div className="flex flex-wrap items-end gap-6">
                <div className="flex max-w-md min-w-0 flex-[1_1_280px] flex-col gap-2">
                    <Label htmlFor="import-mode">{t("admin.importPanel.modeLabel")}</Label>
                    <Select value={mode} onValueChange={handleModeChange}>
                        <SelectTrigger id="import-mode" className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(ImportModes).map((importMode) => (
                                <SelectItem key={importMode} value={importMode}>
                                    {t(`admin.importPanel.modes.${importMode}`)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-3">
                    <span className="text-sm text-muted-foreground">{selectedFile?.name ?? t("admin.importPanel.noFileChosen")}</span>
                    <input ref={fileInputRef} type="file" accept={`.${fileFormat}`} onChange={handleFileChange} className="hidden" />
                    <Button variant="text" onClick={onClose}>
                        {t("common.cancel")}
                    </Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        {t("admin.importPanel.chooseFile")}
                    </Button>
                    <Button disabled={selectedFile === null || isSaving} onClick={() => void handleImport()}>
                        {t("admin.importPanel.submit")}
                    </Button>
                </div>
            </div>
        </section>
    );
};
