import type { FunctionComponent } from "react";
import { QuoteConfigurationEditor } from "@/components/admin/quote-configuration-editor";
import { QuoteConfigurationProvider } from "@/hooks/useQuoteConfiguration";

export const QuoteConfigurationView: FunctionComponent = () => {
    return (
        <QuoteConfigurationProvider>
            <QuoteConfigurationEditor />
        </QuoteConfigurationProvider>
    );
};
