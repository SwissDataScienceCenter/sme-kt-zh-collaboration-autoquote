import type { FunctionComponent } from "react";
import type { VariantProps } from "class-variance-authority";
import { ArrowRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FieldStatuses } from "@/services/extraction";
import type { ExtractedField, Extraction, FieldStatus } from "@/services/extraction";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const STATUS_BADGE_VARIANTS: Record<FieldStatus, BadgeVariant> = {
    [FieldStatuses.FOUND]: "default",
    [FieldStatuses.ASSUMED]: "highlight",
    [FieldStatuses.PARTIAL]: "warning",
    [FieldStatuses.MISSING]: "ink",
};

const STATUS_TRANSLATION_KEYS = {
    [FieldStatuses.FOUND]: "found",
    [FieldStatuses.ASSUMED]: "assumed",
    [FieldStatuses.PARTIAL]: "partial",
    [FieldStatuses.MISSING]: "missing",
} as const satisfies Record<FieldStatus, string>;

const FILLED_STATUSES: FieldStatus[] = [FieldStatuses.FOUND, FieldStatuses.ASSUMED];
const PERCENT = 100;

interface Props {
    extraction: Extraction;
    onNext: () => void;
}

export const ExtractionResults: FunctionComponent<Props> = (props: Props) => {
    const { extraction, onNext } = props;
    const { t } = useTranslation();

    const totalCount = extraction.fields.length;
    const filledCount = extraction.fields.filter((field) => FILLED_STATUSES.includes(field.status)).length;
    const coverage = totalCount === 0 ? 0 : Math.round((filledCount / totalCount) * PERCENT);
    const needInputCount = extraction.follow_up.missing_field_keys.length;

    const formatValue = (value: ExtractedField["value"]): string => {
        if (value === null) {
            return t("playground.extraction.emptyValue");
        }
        if (typeof value === "boolean") {
            return value ? t("common.yes") : t("common.no");
        }
        return String(value);
    };

    const formatEvidence = (field: ExtractedField): string => {
        if (field.evidence === null) {
            return field.status === FieldStatuses.MISSING ? t("playground.extraction.notMentioned") : t("playground.extraction.emptyValue");
        }
        // An assumption comes with a reason rather than words quoted from the message.
        return field.status === FieldStatuses.ASSUMED ? field.evidence : t("playground.extraction.quotedEvidence", { evidence: field.evidence });
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap justify-between gap-3 text-sm">
                    <span className="font-medium text-ink">{t("playground.extraction.filled", { filled: filledCount, total: totalCount })}</span>
                    <span className="text-muted-foreground">{t("playground.extraction.needInput", { count: needInputCount })}</span>
                </div>
                <Progress value={coverage} aria-label={t("playground.extraction.coverageLabel")} />
            </div>

            <div className="overflow-x-auto">
                <table aria-label={t("playground.extraction.tableLabel")} className="w-full min-w-[560px] text-left">
                    <thead>
                        <tr className="text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase">
                            <th scope="col" className="pr-4 pb-2.5 font-medium">
                                {t("playground.extraction.columns.field")}
                            </th>
                            <th scope="col" className="pr-4 pb-2.5 font-medium">
                                {t("playground.extraction.columns.value")}
                            </th>
                            <th scope="col" className="pr-4 pb-2.5 font-medium">
                                {t("playground.extraction.columns.status")}
                            </th>
                            <th scope="col" className="pb-2.5 font-medium">
                                {t("playground.extraction.columns.evidence")}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {extraction.fields.map((field) => (
                            <tr key={field.key} className="border-t border-border align-top">
                                <td className="py-3.5 pr-4">
                                    <code className="text-[0.8rem] text-ink">{field.key}</code>
                                    <div className="text-sm text-muted-foreground">{field.label}</div>
                                </td>
                                <td className="py-3.5 pr-4 font-medium">{formatValue(field.value)}</td>
                                <td className="py-3.5 pr-4">
                                    <Badge variant={STATUS_BADGE_VARIANTS[field.status]}>{t(`playground.statuses.${STATUS_TRANSLATION_KEYS[field.status]}`)}</Badge>
                                </td>
                                <td className="py-3.5 text-sm text-muted-foreground">{formatEvidence(field)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end">
                <Button onClick={onNext}>
                    {t("playground.extraction.next")}
                    <ArrowRightIcon />
                </Button>
            </div>
        </div>
    );
};
