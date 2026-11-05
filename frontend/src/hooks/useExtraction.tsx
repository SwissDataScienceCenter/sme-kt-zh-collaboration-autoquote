import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { FunctionComponent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { downloadFile } from "@/lib/download";
import { getLatestFollowUp } from "@/lib/extraction";
import { ReplyLanguages, extractionService } from "@/services/extraction";
import type { Extraction, ReplyLanguage } from "@/services/extraction";

interface ExtractionContextValue {
    message: string;
    setMessage: (message: string) => void;
    replyLanguage: ReplyLanguage;
    setReplyLanguage: (replyLanguage: ReplyLanguage) => void;
    extraction: Extraction | null;
    email: string;
    setEmail: (email: string) => void;
    isRunning: boolean;
    isDownloadingPdf: boolean;
    isAdjusting: boolean;
    error: string | null;
    dismissError: () => void;
    adjustError: string | null;
    dismissAdjustError: () => void;
    runExtraction: (message: string) => Promise<void>;
    resetExtraction: () => void;
    downloadQuotePdf: () => Promise<void>;
    adjustQuote: (feedback: string) => Promise<boolean>;
}

const ExtractionContext = createContext<ExtractionContextValue>({
    message: "",
    setMessage: () => {},
    replyLanguage: ReplyLanguages.SAME_AS_MESSAGE,
    setReplyLanguage: () => {},
    extraction: null,
    email: "",
    setEmail: () => {},
    isRunning: false,
    isDownloadingPdf: false,
    isAdjusting: false,
    error: null,
    dismissError: () => {},
    adjustError: null,
    dismissAdjustError: () => {},
    runExtraction: async () => {},
    resetExtraction: () => {},
    downloadQuotePdf: async () => {},
    adjustQuote: async () => false,
});

const getErrorDetail = (error: unknown): string => (error instanceof Error ? error.message : String(error));

interface Props {
    children: ReactNode;
}

// Provided at the root, so the request, the results and the edited email survive a visit to Admin.
export const ExtractionProvider: FunctionComponent<Props> = (props: Props) => {
    const { children } = props;
    const { t } = useTranslation();
    const [message, setMessage] = useState("");
    const [replyLanguage, setReplyLanguage] = useState<ReplyLanguage>(ReplyLanguages.SAME_AS_MESSAGE);
    const [extraction, setExtraction] = useState<Extraction | null>(null);
    const [email, setEmail] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Kept apart from the run and PDF errors, so it only shows inside the feedback dialog that caused it.
    const [adjustError, setAdjustError] = useState<string | null>(null);

    const dismissError = useCallback(() => setError(null), []);
    const dismissAdjustError = useCallback(() => setAdjustError(null), []);

    const applyExtraction = useCallback((newExtraction: Extraction) => {
        setExtraction(newExtraction);
        setEmail(getLatestFollowUp(newExtraction).email);
    }, []);

    const runExtraction = useCallback(
        async (runMessage: string) => {
            setExtraction(null);
            setError(null);
            setIsRunning(true);
            try {
                applyExtraction(await extractionService.createExtraction({ message: runMessage, reply_language: replyLanguage }));
            } catch (runError) {
                setError(t("playground.errors.run", { detail: getErrorDetail(runError) }));
            } finally {
                setIsRunning(false);
            }
        },
        [applyExtraction, replyLanguage, t],
    );

    const resetExtraction = useCallback(() => {
        setMessage("");
        setExtraction(null);
        setEmail("");
        setError(null);
    }, []);

    const downloadQuotePdf = useCallback(async () => {
        if (extraction === null) {
            return;
        }
        setIsDownloadingPdf(true);
        try {
            const quoteFile = await extractionService.getQuotePdf(extraction.id);
            downloadFile(quoteFile.blob, quoteFile.fileName);
        } catch (downloadError) {
            setError(t("playground.errors.pdf", { detail: getErrorDetail(downloadError) }));
        } finally {
            setIsDownloadingPdf(false);
        }
    }, [extraction, t]);

    const adjustQuote = useCallback(
        async (feedback: string): Promise<boolean> => {
            if (extraction === null) {
                return false;
            }
            setAdjustError(null);
            setIsAdjusting(true);
            try {
                applyExtraction(await extractionService.adjustQuote(extraction.id, { feedback }));
                return true;
            } catch (adjustQuoteError) {
                setAdjustError(t("playground.errors.adjust", { detail: getErrorDetail(adjustQuoteError) }));
                return false;
            } finally {
                setIsAdjusting(false);
            }
        },
        [applyExtraction, extraction, t],
    );

    const value = useMemo(
        () => ({
            message,
            setMessage,
            replyLanguage,
            setReplyLanguage,
            extraction,
            email,
            setEmail,
            isRunning,
            isDownloadingPdf,
            isAdjusting,
            error,
            dismissError,
            adjustError,
            dismissAdjustError,
            runExtraction,
            resetExtraction,
            downloadQuotePdf,
            adjustQuote,
        }),
        [
            message,
            replyLanguage,
            extraction,
            email,
            isRunning,
            isDownloadingPdf,
            isAdjusting,
            error,
            dismissError,
            adjustError,
            dismissAdjustError,
            runExtraction,
            resetExtraction,
            downloadQuotePdf,
            adjustQuote,
        ],
    );

    return <ExtractionContext.Provider value={value}>{children}</ExtractionContext.Provider>;
};

export const useExtraction = (): ExtractionContextValue => useContext(ExtractionContext);
