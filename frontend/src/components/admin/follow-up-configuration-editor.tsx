import { useState } from "react";
import type { FunctionComponent } from "react";
import { RotateCcwIcon, ScanEyeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FollowUpPreviewDialog } from "@/components/admin/follow-up-preview-dialog";
import { FollowUpPromptSections } from "@/components/admin/follow-up-prompt-sections";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { NoticeTypes } from "@/lib/notice";
import { useFollowUpConfiguration } from "@/hooks/useFollowUpConfiguration";
import { formatIsoDate } from "@/lib/dates";

export const FollowUpConfigurationEditor: FunctionComponent = () => {
    const { t } = useTranslation();
    const { configuration: followUpConfiguration, isLoading, isSaving, notice, dismissNotice, resetConfiguration } = useFollowUpConfiguration();
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [resetCount, setResetCount] = useState(0);

    if (isLoading) {
        return <p className="text-muted-foreground">{t("common.loading")}</p>;
    }

    const handleConfirmReset = async () => {
        const isReset = await resetConfiguration();
        if (isReset) {
            setResetCount((currentCount) => currentCount + 1);
        }
        setIsResetDialogOpen(false);
    };

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-6">
            {notice !== null && <NoticeBanner message={notice.message} isError={notice.type === NoticeTypes.ERROR} dismissLabel={t("common.dismiss")} onDismiss={dismissNotice} />}
            {followUpConfiguration !== null && (
                <>
                    <AdminPageHeader
                        sectionLabel={t("admin.followUp.details.sectionLabel")}
                        title={t("admin.followUp.details.title")}
                        description={t("admin.followUp.details.description")}
                        meta={t("admin.followUp.details.lastEdited", { date: formatIsoDate(followUpConfiguration.update_timestamp) })}
                        actions={
                            <>
                                <Button variant="outline" disabled={isSaving} onClick={() => setIsResetDialogOpen(true)}>
                                    <RotateCcwIcon />
                                    {t("admin.followUp.details.reset")}
                                </Button>
                                <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
                                    <ScanEyeIcon />
                                    {t("admin.followUp.details.preview")}
                                </Button>
                            </>
                        }
                    />
                    {/* Remounted after a reset so the text areas pick up the restored defaults. */}
                    <FollowUpPromptSections key={resetCount} followUpConfiguration={followUpConfiguration} />
                    {isResetDialogOpen && (
                        <ConfirmDialog
                            title={t("admin.followUp.resetDialog.title")}
                            description={t("admin.followUp.resetDialog.description")}
                            confirmLabel={t("admin.followUp.resetDialog.confirm")}
                            cancelLabel={t("common.cancel")}
                            isDisabled={isSaving}
                            onConfirm={() => void handleConfirmReset()}
                            onClose={() => setIsResetDialogOpen(false)}
                        />
                    )}
                    {isPreviewOpen && <FollowUpPreviewDialog onClose={() => setIsPreviewOpen(false)} />}
                </>
            )}
        </div>
    );
};
