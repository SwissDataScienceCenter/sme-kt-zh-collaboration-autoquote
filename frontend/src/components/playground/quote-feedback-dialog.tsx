import { useState } from "react";
import type { FunctionComponent } from "react";
import { LoaderCircleIcon, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SectionLabel } from "@/components/ui/section-label";
import { Textarea } from "@/components/ui/textarea";
import { useExtraction } from "@/hooks/useExtraction";

const FEEDBACK_ROWS = 5;

interface Props {
    onClose: () => void;
}

export const QuoteFeedbackDialog: FunctionComponent<Props> = (props: Props) => {
    const { onClose } = props;
    const { t } = useTranslation();
    const { isAdjusting, adjustError, dismissAdjustError, adjustQuote } = useExtraction();
    const [feedback, setFeedback] = useState("");

    const trimmedFeedback = feedback.trim();

    const handleClose = () => {
        dismissAdjustError();
        onClose();
    };

    const handleAdjust = async () => {
        const isAdjusted = await adjustQuote(trimmedFeedback);
        if (isAdjusted) {
            handleClose();
        }
    };

    return (
        <Dialog open onOpenChange={(isOpen) => !isOpen && !isAdjusting && handleClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <SectionLabel>{t("playground.quoteFeedback.sectionLabel")}</SectionLabel>
                        <DialogTitle>{t("playground.quoteFeedback.title")}</DialogTitle>
                        <DialogDescription>{t("playground.quoteFeedback.description")}</DialogDescription>
                    </div>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" disabled={isAdjusting} aria-label={t("common.close")}>
                            <XIcon />
                        </Button>
                    </DialogClose>
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="quote-feedback">{t("playground.quoteFeedback.label")}</Label>
                    <Textarea
                        id="quote-feedback"
                        rows={FEEDBACK_ROWS}
                        value={feedback}
                        disabled={isAdjusting}
                        placeholder={t("playground.quoteFeedback.placeholder")}
                        onChange={(e) => setFeedback(e.target.value)}
                    />
                </div>

                {adjustError !== null && (
                    <p role="alert" className="text-sm text-destructive">
                        {adjustError}
                    </p>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
                    <DialogClose asChild>
                        <Button variant="text" disabled={isAdjusting}>
                            {t("common.cancel")}
                        </Button>
                    </DialogClose>
                    <Button disabled={isAdjusting || trimmedFeedback === ""} onClick={() => void handleAdjust()}>
                        {isAdjusting && <LoaderCircleIcon aria-hidden="true" className="animate-spin" />}
                        {isAdjusting ? t("playground.quoteFeedback.adjusting") : t("playground.quoteFeedback.submit")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
