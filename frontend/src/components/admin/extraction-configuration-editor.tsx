import { useState } from "react";
import type { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { FieldDialog } from "@/components/admin/field-dialog";
import { FieldsTable } from "@/components/admin/fields-table";
import { ImportPanel } from "@/components/admin/import-panel";
import { ConfigurationDetails } from "@/components/admin/configuration-details";
import { ConfigurationPreviewDialog } from "@/components/admin/configuration-preview-dialog";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { useExtractionConfiguration } from "@/hooks/useExtractionConfiguration";
import { NoticeTypes } from "@/lib/notice";
import { createEmptyField } from "@/lib/extraction-configuration";
import type { ExtractionField, ConfigurationFileFormat } from "@/services/extraction-configuration";

const NEW_FIELD_DIALOG_KEY = "new-field";

interface EditingField {
    originalKey: ExtractionField["key"] | null;
    field: ExtractionField;
}

export const ExtractionConfigurationEditor: FunctionComponent = () => {
    const { t } = useTranslation();
    const { extractionConfiguration, isLoading, notice, dismissNotice } = useExtractionConfiguration();
    const [importFileFormat, setImportFileFormat] = useState<ConfigurationFileFormat | null>(null);
    const [editingField, setEditingField] = useState<EditingField | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    if (isLoading) {
        return <p className="text-muted-foreground">{t("common.loading")}</p>;
    }

    const handleSelectField = (key: ExtractionField["key"]) => {
        const field = extractionConfiguration?.fields.find((existingField) => existingField.key === key);
        if (field !== undefined) {
            setEditingField({ originalKey: key, field });
        }
    };

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-6">
            {notice !== null && <NoticeBanner message={notice.message} isError={notice.type === NoticeTypes.ERROR} dismissLabel={t("common.dismiss")} onDismiss={dismissNotice} />}
            {extractionConfiguration !== null && (
                <>
                    <ConfigurationDetails extractionConfiguration={extractionConfiguration} onImport={setImportFileFormat} onPreview={() => setIsPreviewOpen(true)} />
                    {importFileFormat !== null && <ImportPanel fileFormat={importFileFormat} onFileFormatChange={setImportFileFormat} onClose={() => setImportFileFormat(null)} />}
                    <FieldsTable
                        fields={extractionConfiguration.fields}
                        onSelectField={handleSelectField}
                        onAddField={() => setEditingField({ originalKey: null, field: createEmptyField() })}
                    />
                    {editingField !== null && (
                        <FieldDialog
                            key={editingField.originalKey ?? NEW_FIELD_DIALOG_KEY}
                            extractionConfiguration={extractionConfiguration}
                            initialField={editingField.field}
                            originalKey={editingField.originalKey}
                            onClose={() => setEditingField(null)}
                        />
                    )}
                    {isPreviewOpen && <ConfigurationPreviewDialog onClose={() => setIsPreviewOpen(false)} />}
                </>
            )}
        </div>
    );
};
