import type { FunctionComponent } from "react";
import { DocumentsEditor } from "@/components/admin/documents-editor";
import { DocumentsProvider } from "@/hooks/useDocuments";

export const DocumentRetrievalView: FunctionComponent = () => {
    return (
        <DocumentsProvider>
            <DocumentsEditor />
        </DocumentsProvider>
    );
};
