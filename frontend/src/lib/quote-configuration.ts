import type { QuoteConfiguration, QuoteConfigurationInput } from "@/services/quote-configuration";

export const toConfigurationInput = (quoteConfiguration: QuoteConfiguration): QuoteConfigurationInput => ({
    extra_margin_percentage: quoteConfiguration.extra_margin_percentage,
    business_rules: quoteConfiguration.business_rules,
});

export const parsePercentage = (text: string): number | null => {
    const trimmedText = text.trim();
    const percentage = Number(trimmedText);
    const isValid = trimmedText !== "" && Number.isFinite(percentage) && percentage >= 0;
    return isValid ? percentage : null;
};
