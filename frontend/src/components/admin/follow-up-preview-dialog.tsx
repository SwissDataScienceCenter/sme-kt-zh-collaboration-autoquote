import type { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { PreviewDialog } from "@/components/admin/preview-dialog";
import { useFollowUpConfigurationPreview } from "@/hooks/usePreview";

const PreviewTabs = {
    SYSTEM_PROMPT: "systemPrompt",
    MISSING_INFORMATION: "missingInformation",
    QUOTE: "quote",
} as const;

interface Props {
    onClose: () => void;
}

export const FollowUpPreviewDialog: FunctionComponent<Props> = (props: Props) => {
    const { onClose } = props;
    const { t } = useTranslation();
    const { preview, error } = useFollowUpConfigurationPreview();

    const previewTexts = {
        [PreviewTabs.SYSTEM_PROMPT]: preview?.system_prompt,
        [PreviewTabs.MISSING_INFORMATION]: preview?.missing_information_prompt,
        [PreviewTabs.QUOTE]: preview?.quote_prompt,
    };

    return (
        <PreviewDialog
            sectionLabel={t("admin.followUp.previewDialog.sectionLabel")}
            title={t("admin.followUp.previewDialog.title")}
            description={t("admin.followUp.previewDialog.description")}
            tabs={Object.values(PreviewTabs).map((previewTab) => ({
                value: previewTab,
                label: t(`admin.followUp.previewDialog.tabs.${previewTab}`),
                text: previewTexts[previewTab] ?? "",
            }))}
            defaultTab={PreviewTabs.MISSING_INFORMATION}
            isLoading={preview === null}
            error={error}
            onClose={onClose}
        />
    );
};
