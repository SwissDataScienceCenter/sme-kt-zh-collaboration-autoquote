import { createFileRoute } from "@tanstack/react-router";
import { DocumentRetrievalView } from "@/views/document-retrieval-view";

export const Route = createFileRoute("/admin/document-retrieval")({ component: DocumentRetrievalView });
