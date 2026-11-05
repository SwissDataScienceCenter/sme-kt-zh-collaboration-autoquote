import { useState } from "react";
import type { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuoteConfiguration } from "@/hooks/useQuoteConfiguration";
import { parsePercentage, toConfigurationInput } from "@/lib/quote-configuration";
import type { QuoteConfiguration } from "@/services/quote-configuration";

const PERCENTAGE_STEP = 0.1;

interface Props {
    quoteConfiguration: QuoteConfiguration;
}

export const QuotePricingSettings: FunctionComponent<Props> = (props: Props) => {
    const { quoteConfiguration } = props;
    const { t } = useTranslation();
    const { updateConfiguration } = useQuoteConfiguration();
    const [marginText, setMarginText] = useState(String(quoteConfiguration.extra_margin_percentage));

    const handleMarginBlur = () => {
        const percentage = parsePercentage(marginText);
        if (percentage === null) {
            setMarginText(String(quoteConfiguration.extra_margin_percentage));
            return;
        }
        setMarginText(String(percentage));
        if (percentage !== quoteConfiguration.extra_margin_percentage) {
            void updateConfiguration({ ...toConfigurationInput(quoteConfiguration), extra_margin_percentage: percentage });
        }
    };

    return (
        <section aria-labelledby="pricing-title" className="flex flex-col gap-4 rounded-lg bg-card p-6">
            <div className="flex flex-wrap items-baseline gap-2.5">
                <h2 id="pricing-title" className="text-2xl leading-snug">
                    {t("admin.quoteConfiguration.pricing.title")}
                </h2>
                <span className="text-sm text-muted-foreground">{t("admin.quoteConfiguration.pricing.hint")}</span>
            </div>
            <div className="flex max-w-sm flex-col gap-2">
                <Label htmlFor="pricing-extra-margin">{t("admin.quoteConfiguration.pricing.extraMargin.label")}</Label>
                <Input
                    id="pricing-extra-margin"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={PERCENTAGE_STEP}
                    value={marginText}
                    onChange={(e) => setMarginText(e.target.value)}
                    onBlur={handleMarginBlur}
                />
                <span className="text-[0.8rem] text-muted-foreground">{t("admin.quoteConfiguration.pricing.extraMargin.help")}</span>
            </div>
        </section>
    );
};
