import { API_BASE_PATH, ApiClient } from "@/services/api";

export const DocumentCategories = {
    DATASHEET: "datasheet",
    REQUEST: "request",
    OFFER: "offer",
    UNKNOWN: "unknown",
} as const;

export type DocumentCategory = (typeof DocumentCategories)[keyof typeof DocumentCategories];

export const IndexingStates = {
    RUNNING: "running",
    FINISHED: "finished",
    FAILED: "failed",
} as const;

export type IndexingState = (typeof IndexingStates)[keyof typeof IndexingStates];

export interface DocumentIndexing {
    state: IndexingState;
    total_file_count: number;
    processed_file_count: number;
    indexed_file_names: string[];
    failed_file_names: string[];
}

export interface DocumentIndexStatus {
    document_counts: Record<DocumentCategory, number>;
    pending_file_count: number;
    product_count: number;
    create_timestamp: number | null;
    update_timestamp: number | null;
    indexing: DocumentIndexing | null;
}

const DOCUMENTS_PATH = "/documents";
const DOCUMENT_INDEX_PATH = `${DOCUMENTS_PATH}/index`;

export const getDocumentFileUrl = (fileName: string): string => `${API_BASE_PATH}${DOCUMENTS_PATH}/files/${encodeURIComponent(fileName)}`;

class DocumentIndexService extends ApiClient {
    getDocumentIndexStatus(): Promise<DocumentIndexStatus> {
        return this.get<DocumentIndexStatus>(DOCUMENT_INDEX_PATH);
    }

    startDocumentIndexing(): Promise<DocumentIndexing> {
        return this.post<DocumentIndexing>(DOCUMENT_INDEX_PATH);
    }

    deleteDocumentIndex(): Promise<DocumentIndexStatus> {
        return this.delete<DocumentIndexStatus>(DOCUMENT_INDEX_PATH);
    }
}

export const documentIndexService = new DocumentIndexService();
