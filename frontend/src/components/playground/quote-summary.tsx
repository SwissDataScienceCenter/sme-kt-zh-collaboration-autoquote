import { useState } from "react";
import type { FunctionComponent } from "react";
import { DownloadIcon, MessageSquareTextIcon, TriangleAlertIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { QuoteFeedbackDialog } from "@/components/playground/quote-feedback-dialog";
import { Button } from "@/components/ui/button";
import { useExtraction } from "@/hooks/useExtraction";
import { formatUnitPrice } from "@/lib/products";
import { cn } from "@/lib/utils";
import { QuoteLineTypes } from "@/services/extraction";
import type { Quote } from "@/services/extraction";

const COLUMNS_CLASS_NAME = "grid grid-cols-[minmax(200px,3fr)_64px_96px_96px_104px] gap-x-4";

interface Props {
    quote: Quote;
}

export const QuoteSummary: FunctionComponent<Props> = (props: Props) => {
    const { quote } = props;
    const { t } = useTranslation();
    const { isDownloadingPdf, isAdjusting, downloadQuotePdf } = useExtraction();
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    const extraLineCount = quote.lines.filter((line) => line.type === QuoteLineTypes.EXTRA).length;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="text-xl">{quote.title}</h3>
                    <p className="text-sm text-muted-foreground">{quote.customer}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" disabled={isAdjusting} onClick={() => setIsFeedbackOpen(true)}>
                        <MessageSquareTextIcon />
                        {t("playground.quote.requestChanges")}
                    </Button>
                    <Button disabled={isDownloadingPdf || isAdjusting} onClick={() => void downloadQuotePdf()}>
                        <DownloadIcon />
                        {t("playground.quote.downloadPdf")}
                    </Button>
                </div>
            </div>

            {extraLineCount > 0 && (
                <div role="status" className="flex items-start gap-3 rounded-lg bg-warning/20 px-4 py-3 text-sm text-ink">
                    <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    <span>{t("playground.quote.extraWarning", { count: extraLineCount })}</span>
                </div>
            )}

            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">{t("playground.quote.scopeOfWork")}</span>
                <p className="text-sm whitespace-pre-line">{quote.scope_of_work}</p>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[620px]">
                    <div aria-hidden="true" className={cn(COLUMNS_CLASS_NAME, "px-3 pb-2.5 text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase")}>
                        <span>{t("playground.quote.columns.description")}</span>
                        <span className="text-right">{t("playground.quote.columns.quantity")}</span>
                        <span>{t("playground.quote.columns.unit")}</span>
                        <span className="text-right">{t("playground.quote.columns.unitPrice")}</span>
                        <span className="text-right">{t("playground.quote.columns.total")}</span>
                    </div>
                    {quote.lines.map((line, lineIndex) => {
                        const isExtra = line.type === QuoteLineTypes.EXTRA;
                        return (
                            <div key={lineIndex} className={cn(COLUMNS_CLASS_NAME, "items-center border-t border-border p-3 text-sm", isExtra && "bg-warning/20")}>
                                <span className="flex min-w-0 flex-col gap-1">
                                    <span className="flex flex-wrap items-center gap-2">
                                        {line.description}
                                        {isExtra && <Badge variant="warning">{t("playground.quote.extra")}</Badge>}
                                    </span>
                                    {line.product_reference !== null && <code className="text-[0.75rem] text-muted-foreground">{line.product_reference}</code>}
                                </span>
                                <span className="text-right">{line.quantity}</span>
                                <span>{line.unit}</span>
                                <span className="text-right">{formatUnitPrice(line.unit_price)}</span>
                                <span className="text-right">{formatUnitPrice(line.total)}</span>
                            </div>
                        );
                    })}
                    <div className={cn(COLUMNS_CLASS_NAME, "border-t-2 border-ink p-3 text-sm font-semibold")}>
                        <span>{t("playground.quote.total")}</span>
                        <span />
                        <span />
                        <span />
                        <span className="text-right">{formatUnitPrice(quote.total)}</span>
                    </div>
                </div>
            </div>

            <p className="text-sm text-muted-foreground">{quote.terms}</p>

            {isFeedbackOpen && <QuoteFeedbackDialog onClose={() => setIsFeedbackOpen(false)} />}
        </div>
    );
};
