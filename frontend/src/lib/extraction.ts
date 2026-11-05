import type { Extraction, FollowUp, Quote } from "@/services/extraction";

export const getLatestQuote = (extraction: Extraction): Quote | null => extraction.adjustments.at(-1)?.quote ?? extraction.quote;

export const getLatestFollowUp = (extraction: Extraction): FollowUp => extraction.adjustments.at(-1)?.follow_up ?? extraction.follow_up;
