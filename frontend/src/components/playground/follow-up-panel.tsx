import type { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyStatuses, useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { getLatestFollowUp } from "@/lib/extraction";
import { FieldStatuses, FollowUpTypes } from "@/services/extraction";
import type { Extraction } from "@/services/extraction";

const EMAIL_ROWS = 15;

interface Props {
    extraction: Extraction;
    email: string;
    onEmailChange: (email: string) => void;
}

export const FollowUpPanel: FunctionComponent<Props> = (props: Props) => {
    const { extraction, email, onEmailChange } = props;
    const { t } = useTranslation();
    const { copyStatus, copy } = useCopyToClipboard();

    const followUp = getLatestFollowUp(extraction);
    const isMissingInformation = followUp.type === FollowUpTypes.MISSING_INFORMATION;
    const missingFields = extraction.fields.filter((field) => followUp.missing_field_keys.includes(field.key));
    const copyLabel = {
        [CopyStatuses.IDLE]: t("playground.followUp.copy"),
        [CopyStatuses.COPIED]: t("playground.followUp.copied"),
        [CopyStatuses.FAILED]: t("playground.followUp.copyFailed"),
    }[copyStatus];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h3 className="text-xl">{isMissingInformation ? t("playground.followUp.missingTitle", { count: missingFields.length }) : t("playground.followUp.quoteTitle")}</h3>
                <p className="text-sm text-muted-foreground">{isMissingInformation ? t("playground.followUp.missingDescription") : t("playground.followUp.quoteDescription")}</p>
            </div>

            {isMissingInformation && (
                <ul className="flex flex-col gap-2">
                    {missingFields.map((field) => (
                        <li key={field.key} className="flex flex-wrap items-center gap-3 rounded-lg bg-surface px-4 py-3.5">
                            <span className="flex-[1_1_240px] text-[0.95rem]">
                                {field.label}
                                {field.status === FieldStatuses.PARTIAL && field.value !== null && (
                                    <span className="block text-sm text-muted-foreground">{t("playground.followUp.partialValue", { value: String(field.value) })}</span>
                                )}
                            </span>
                            <code className="text-xs text-ink">{field.key}</code>
                        </li>
                    ))}
                </ul>
            )}

            <div className="flex flex-col gap-2">
                <Label htmlFor="follow-up-email">{t("playground.followUp.emailLabel")}</Label>
                <Textarea id="follow-up-email" rows={EMAIL_ROWS} value={email} onChange={(e) => onEmailChange(e.target.value)} className="leading-normal" />
            </div>

            <div className="flex justify-end" aria-live="polite">
                <Button variant="outline" onClick={() => void copy(email)}>
                    {copyLabel}
                </Button>
            </div>
        </div>
    );
};
