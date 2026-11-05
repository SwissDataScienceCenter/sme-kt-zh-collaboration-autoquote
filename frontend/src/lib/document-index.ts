import type { DocumentIndexing } from "@/services/document-index";

const FULL_PERCENTAGE = 100;

export const getIndexingPercentage = (indexing: DocumentIndexing): number =>
    indexing.total_file_count === 0 ? 0 : Math.round((indexing.processed_file_count / indexing.total_file_count) * FULL_PERCENTAGE);
