import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { extractionConfigurationService } from "@/services/extraction-configuration";
import type { ExtractionConfigurationPreview } from "@/services/extraction-configuration";
import { followUpConfigurationService } from "@/services/follow-up-configuration";
import type { FollowUpConfigurationPreview } from "@/services/follow-up-configuration";
import { quoteConfigurationService } from "@/services/quote-configuration";
import type { QuoteConfigurationPreview } from "@/services/quote-configuration";

interface PreviewState<TPreview> {
    preview: TPreview | null;
    error: string | null;
}

// fetchPreview must be stable (defined at module level), or the preview is fetched again on every render.
const usePreview = <TPreview,>(fetchPreview: () => Promise<TPreview>): PreviewState<TPreview> => {
    const { t } = useTranslation();
    const [preview, setPreview] = useState<TPreview | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isCancelled = false;
        fetchPreview()
            .then((result) => {
                if (!isCancelled) {
                    setPreview(result);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setError(t("common.previewError"));
                }
            });
        return () => {
            isCancelled = true;
        };
    }, [fetchPreview, t]);

    return { preview, error };
};

const fetchExtractionConfigurationPreview = () => extractionConfigurationService.previewExtractionConfiguration();
const fetchFollowUpConfigurationPreview = () => followUpConfigurationService.previewFollowUpConfiguration();
const fetchQuoteConfigurationPreview = () => quoteConfigurationService.previewQuoteConfiguration();

export const useExtractionConfigurationPreview = (): PreviewState<ExtractionConfigurationPreview> => usePreview(fetchExtractionConfigurationPreview);

export const useFollowUpConfigurationPreview = (): PreviewState<FollowUpConfigurationPreview> => usePreview(fetchFollowUpConfigurationPreview);

export const useQuoteConfigurationPreview = (): PreviewState<QuoteConfigurationPreview> => usePreview(fetchQuoteConfigurationPreview);
