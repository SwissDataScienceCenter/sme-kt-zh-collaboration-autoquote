import { useState } from "react";
import type { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuoteConfiguration } from "@/hooks/useQuoteConfiguration";
import { toConfigurationInput } from "@/lib/quote-configuration";
import type { QuoteConfiguration } from "@/services/quote-configuration";

const BUSINESS_RULES_ROWS = 8;

interface Props {
    quoteConfiguration: QuoteConfiguration;
}

export const QuoteBusinessRules: FunctionComponent<Props> = (props: Props) => {
    const { quoteConfiguration } = props;
    const { t } = useTranslation();
    const { updateConfiguration } = useQuoteConfiguration();
    const [businessRules, setBusinessRules] = useState(quoteConfiguration.business_rules);

    const handleBlur = () => {
        const trimmedBusinessRules = businessRules.trim();
        if (trimmedBusinessRules === "") {
            setBusinessRules(quoteConfiguration.business_rules);
            return;
        }
        setBusinessRules(trimmedBusinessRules);
        if (trimmedBusinessRules !== quoteConfiguration.business_rules) {
            void updateConfiguration({ ...toConfigurationInput(quoteConfiguration), business_rules: trimmedBusinessRules });
        }
    };

    return (
        <section aria-labelledby="business-rules-title" className="flex flex-col gap-4 rounded-lg bg-card p-6">
            <div className="flex flex-wrap items-baseline gap-2.5">
                <h2 id="business-rules-title" className="text-2xl leading-snug">
                    {t("admin.quoteConfiguration.businessRules.title")}
                </h2>
                <span className="text-sm text-muted-foreground">{t("admin.quoteConfiguration.businessRules.hint")}</span>
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="quote-business-rules">{t("admin.quoteConfiguration.businessRules.label")}</Label>
                <Textarea id="quote-business-rules" rows={BUSINESS_RULES_ROWS} value={businessRules} onChange={(e) => setBusinessRules(e.target.value)} onBlur={handleBlur} />
                <span className="text-[0.8rem] text-muted-foreground">{t("admin.quoteConfiguration.businessRules.help")}</span>
            </div>
        </section>
    );
};
