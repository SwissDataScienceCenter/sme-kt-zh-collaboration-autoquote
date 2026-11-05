import { createContext, useContext } from "react";
import type { FunctionComponent, ReactNode } from "react";
import { createEditableConfigurationDefault, useEditableConfiguration } from "@/hooks/useEditableConfiguration";
import type { ConfigurationOperations, EditableConfiguration } from "@/hooks/useEditableConfiguration";
import { quoteConfigurationService } from "@/services/quote-configuration";
import type { QuoteConfiguration, QuoteConfigurationInput } from "@/services/quote-configuration";

type QuoteConfigurationContextValue = EditableConfiguration<QuoteConfiguration, QuoteConfigurationInput>;

const QUOTE_CONFIGURATION_OPERATIONS: ConfigurationOperations<QuoteConfiguration, QuoteConfigurationInput> = {
    getConfiguration: () => quoteConfigurationService.getQuoteConfiguration(),
    updateConfiguration: (configurationInput) => quoteConfigurationService.updateQuoteConfiguration(configurationInput),
    resetConfiguration: () => quoteConfigurationService.resetQuoteConfiguration(),
};

const QuoteConfigurationContext = createContext<QuoteConfigurationContextValue>(createEditableConfigurationDefault());

interface Props {
    children: ReactNode;
}

export const QuoteConfigurationProvider: FunctionComponent<Props> = (props: Props) => {
    const { children } = props;
    const value = useEditableConfiguration(QUOTE_CONFIGURATION_OPERATIONS, "admin.quoteConfiguration.notices");

    return <QuoteConfigurationContext.Provider value={value}>{children}</QuoteConfigurationContext.Provider>;
};

export const useQuoteConfiguration = (): QuoteConfigurationContextValue => useContext(QuoteConfigurationContext);
