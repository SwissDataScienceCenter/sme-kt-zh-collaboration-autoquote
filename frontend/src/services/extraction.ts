import { ApiClient } from "@/services/api";
import type { DownloadedFile } from "@/services/api";
import type { DocumentCategory } from "@/services/document-index";
import type { ExtractionField } from "@/services/extraction-configuration";

export const FieldStatuses = {
    FOUND: "FOUND",
    ASSUMED: "ASSUMED",
    PARTIAL: "PARTIAL",
    MISSING: "MISSING",
} as const;

export type FieldStatus = (typeof FieldStatuses)[keyof typeof FieldStatuses];

export const ReplyLanguages = {
    SAME_AS_MESSAGE: "same_as_message",
    ENGLISH: "en",
    FRENCH: "fr",
    GERMAN: "de",
} as const;

export type ReplyLanguage = (typeof ReplyLanguages)[keyof typeof ReplyLanguages];

export const FollowUpTypes = {
    MISSING_INFORMATION: "missing_information",
    QUOTE: "quote",
} as const;

export type FollowUpType = (typeof FollowUpTypes)[keyof typeof FollowUpTypes];

export interface ExtractionInput {
    message: string;
    reply_language: ReplyLanguage;
}

export interface ExtractedField {
    key: ExtractionField["key"];
    label: string;
    is_required: boolean;
    value: string | number | boolean | null;
    status: FieldStatus;
    evidence: string | null;
}

export interface FollowUp {
    type: FollowUpType;
    missing_field_keys: ExtractionField["key"][];
    email: string;
}

export const QuoteLineTypes = {
    PRODUCT: "product",
    EXTRA: "extra",
} as const;

export type QuoteLineType = (typeof QuoteLineTypes)[keyof typeof QuoteLineTypes];

export interface SimilarDocument {
    file_name: string;
    category: DocumentCategory;
    summary: string;
    similarity: number;
}

export interface QuoteLine {
    type: QuoteLineType;
    product_reference: string | null;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total: number;
}

export const QuoteLanguages = {
    ENGLISH: "en",
    FRENCH: "fr",
    GERMAN: "de",
    ITALIAN: "it",
} as const;

export type QuoteLanguage = (typeof QuoteLanguages)[keyof typeof QuoteLanguages];

export interface Quote {
    customer: string;
    title: string;
    scope_of_work: string;
    terms: string;
    lines: QuoteLine[];
    total: number;
    language: QuoteLanguage;
}

export interface QuoteAdjustmentInput {
    feedback: string;
}

export interface QuoteAdjustment extends QuoteAdjustmentInput {
    quote: Quote;
    follow_up: FollowUp;
    create_timestamp: number;
}

// The top-level quote and follow-up are those of the first run; each adjustment keeps the ones it produced.
export interface Extraction extends ExtractionInput {
    id: string;
    fields: ExtractedField[];
    similar_documents: SimilarDocument[];
    quote: Quote | null;
    follow_up: FollowUp;
    adjustments: QuoteAdjustment[];
    create_timestamp: number;
    update_timestamp: number;
}

const EXTRACTIONS_PATH = "/extractions";
class ExtractionService extends ApiClient {
    createExtraction(extractionInput: ExtractionInput): Promise<Extraction> {
        return this.post<Extraction>(EXTRACTIONS_PATH, extractionInput);
    }

    adjustQuote(extractionId: Extraction["id"], adjustmentInput: QuoteAdjustmentInput): Promise<Extraction> {
        return this.post<Extraction>(`${EXTRACTIONS_PATH}/${extractionId}/quote-adjustments`, adjustmentInput);
    }

    getQuotePdf(extractionId: Extraction["id"]): Promise<DownloadedFile> {
        return this.getFile(`${EXTRACTIONS_PATH}/${extractionId}/quote.pdf`);
    }
}

export const extractionService = new ExtractionService();
