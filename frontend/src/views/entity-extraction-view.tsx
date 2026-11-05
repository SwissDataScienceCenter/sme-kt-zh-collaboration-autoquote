import type { FunctionComponent } from "react";
import { ExtractionConfigurationEditor } from "@/components/admin/extraction-configuration-editor";
import { ExtractionConfigurationProvider } from "@/hooks/useExtractionConfiguration";

export const EntityExtractionView: FunctionComponent = () => {
    return (
        <ExtractionConfigurationProvider>
            <ExtractionConfigurationEditor />
        </ExtractionConfigurationProvider>
    );
};
