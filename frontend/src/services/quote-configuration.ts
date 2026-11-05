import { ApiClient } from "@/services/api";

export interface QuoteConfigurationInput {
    extra_margin_percentage: number;
    business_rules: string;
}

export interface QuoteConfiguration extends QuoteConfigurationInput {
    id: string;
    create_timestamp: number;
    update_timestamp: number;
}

export interface QuoteConfigurationPreview {
    system_prompt: string;
    prompt: string;
    tools: Record<string, unknown>[];
}

const QUOTE_CONFIGURATION_PATH = "/quote-configuration";
const RESET_PATH = `${QUOTE_CONFIGURATION_PATH}/reset`;
const PREVIEW_PATH = `${QUOTE_CONFIGURATION_PATH}/preview`;

class QuoteConfigurationService extends ApiClient {
    getQuoteConfiguration(): Promise<QuoteConfiguration> {
        return this.get<QuoteConfiguration>(QUOTE_CONFIGURATION_PATH);
    }

    updateQuoteConfiguration(configurationInput: QuoteConfigurationInput): Promise<QuoteConfiguration> {
        return this.put<QuoteConfiguration>(QUOTE_CONFIGURATION_PATH, configurationInput);
    }

    resetQuoteConfiguration(): Promise<QuoteConfiguration> {
        return this.post<QuoteConfiguration>(RESET_PATH);
    }

    previewQuoteConfiguration(): Promise<QuoteConfigurationPreview> {
        return this.get<QuoteConfigurationPreview>(PREVIEW_PATH);
    }
}

export const quoteConfigurationService = new QuoteConfigurationService();
