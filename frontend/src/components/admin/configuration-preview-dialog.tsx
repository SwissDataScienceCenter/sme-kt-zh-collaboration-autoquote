import type { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { PREVIEW_JSON_INDENT, PreviewDialog } from "@/components/admin/preview-dialog";
import { useExtractionConfigurationPreview } from "@/hooks/usePreview";

const PreviewTabs = {
    PROMPT: "prompt",
    STRUCTURED_OUTPUT: "structuredOutput",
} as const;

interface Props {
    onClose: () => void;
}

export const ConfigurationPreviewDialog: FunctionComponent<Props> = (props: Props) => {
    const { onClose } = props;
    const { t } = useTranslation();
    const { preview, error } = useExtractionConfigurationPreview();

    const previewTexts = {
        [PreviewTabs.PROMPT]: preview?.prompt,
        [PreviewTabs.STRUCTURED_OUTPUT]: JSON.stringify(preview?.json_schema, null, PREVIEW_JSON_INDENT),
    };

    return (
        <PreviewDialog
            sectionLabel={t("admin.previewDialog.sectionLabel")}
            title={t("admin.previewDialog.title")}
            description={t("admin.previewDialog.description")}
            tabs={Object.values(PreviewTabs).map((previewTab) => ({
                value: previewTab,
                label: t(`admin.previewDialog.tabs.${previewTab}`),
                text: previewTexts[previewTab] ?? "",
            }))}
            defaultTab={PreviewTabs.PROMPT}
            isLoading={preview === null}
            error={error}
            onClose={onClose}
        />
    );
};
