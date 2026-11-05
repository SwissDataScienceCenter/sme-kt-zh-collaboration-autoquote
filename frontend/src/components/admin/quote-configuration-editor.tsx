import { useState } from "react";
import type { FunctionComponent } from "react";
import { RotateCcwIcon, ScanEyeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { QuoteBusinessRules } from "@/components/admin/quote-business-rules";
import { QuotePreviewDialog } from "@/components/admin/quote-preview-dialog";
import { QuotePricingSettings } from "@/components/admin/quote-pricing-settings";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { NoticeTypes } from "@/lib/notice";
import { useQuoteConfiguration } from "@/hooks/useQuoteConfiguration";
import { formatIsoDate } from "@/lib/dates";

export const QuoteConfigurationEditor: FunctionComponent = () => {
    const { t } = useTranslation();
    const { configuration: quoteConfiguration, isLoading, isSaving, notice, dismissNotice, resetConfiguration } = useQuoteConfiguration();
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
            {quoteConfiguration !== null && (
                <>
                    <AdminPageHeader
                        sectionLabel={t("admin.quoteConfiguration.sectionLabel")}
                        title={t("admin.quoteConfiguration.title")}
                        description={t("admin.quoteConfiguration.description")}
                        meta={t("admin.quoteConfiguration.lastEdited", { date: formatIsoDate(quoteConfiguration.update_timestamp) })}
                        actions={
                            <>
                                <Button variant="outline" disabled={isSaving} onClick={() => setIsResetDialogOpen(true)}>
                                    <RotateCcwIcon />
                                    {t("admin.quoteConfiguration.reset")}
                                </Button>
                                <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
                                    <ScanEyeIcon />
                                    {t("admin.quoteConfiguration.preview")}
                                </Button>
                            </>
                        }
                    />
                    <QuotePricingSettings quoteConfiguration={quoteConfiguration} />
                    {/* Remounted after a reset so the text area picks up the restored default. */}
                    <QuoteBusinessRules key={resetCount} quoteConfiguration={quoteConfiguration} />
                    {isResetDialogOpen && (
                        <ConfirmDialog
                            title={t("admin.quoteConfiguration.resetDialog.title")}
                            description={t("admin.quoteConfiguration.resetDialog.description")}
                            confirmLabel={t("admin.quoteConfiguration.resetDialog.confirm")}
                            cancelLabel={t("common.cancel")}
                            isDisabled={isSaving}
                            onConfirm={() => void handleConfirmReset()}
                            onClose={() => setIsResetDialogOpen(false)}
                        />
                    )}
                    {isPreviewOpen && <QuotePreviewDialog onClose={() => setIsPreviewOpen(false)} />}
                </>
            )}
        </div>
    );
};
