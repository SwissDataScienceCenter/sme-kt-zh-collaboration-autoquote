import type { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { PREVIEW_JSON_INDENT, PreviewDialog } from "@/components/admin/preview-dialog";
import { useQuoteConfigurationPreview } from "@/hooks/usePreview";

const PreviewTabs = {
    SYSTEM_PROMPT: "systemPrompt",
    PROMPT: "prompt",
    TOOLS: "tools",
} as const;

interface Props {
    onClose: () => void;
}

export const QuotePreviewDialog: FunctionComponent<Props> = (props: Props) => {
    const { onClose } = props;
    const { t } = useTranslation();
    const { preview, error } = useQuoteConfigurationPreview();

    const previewTexts = {
        [PreviewTabs.SYSTEM_PROMPT]: preview?.system_prompt,
        [PreviewTabs.PROMPT]: preview?.prompt,
        [PreviewTabs.TOOLS]: JSON.stringify(preview?.tools, null, PREVIEW_JSON_INDENT),
    };

    return (
        <PreviewDialog
            sectionLabel={t("admin.quoteConfiguration.previewDialog.sectionLabel")}
            title={t("admin.quoteConfiguration.previewDialog.title")}
            description={t("admin.quoteConfiguration.previewDialog.description")}
            tabs={Object.values(PreviewTabs).map((previewTab) => ({
                value: previewTab,
                label: t(`admin.quoteConfiguration.previewDialog.tabs.${previewTab}`),
                text: previewTexts[previewTab] ?? "",
            }))}
            defaultTab={PreviewTabs.PROMPT}
            isLoading={preview === null}
            error={error}
            onClose={onClose}
        />
    );
};
