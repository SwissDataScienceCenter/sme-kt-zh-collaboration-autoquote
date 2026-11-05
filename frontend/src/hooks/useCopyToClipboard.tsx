import { useCallback, useEffect, useState } from "react";

export const CopyStatuses = {
    IDLE: "idle",
    COPIED: "copied",
    FAILED: "failed",
} as const;

export type CopyStatus = (typeof CopyStatuses)[keyof typeof CopyStatuses];

const COPY_FEEDBACK_DURATION_MS = 2000;

interface CopyToClipboardState {
    copyStatus: CopyStatus;
    copy: (text: string) => Promise<void>;
}

export const useCopyToClipboard = (): CopyToClipboardState => {
    const [copyStatus, setCopyStatus] = useState<CopyStatus>(CopyStatuses.IDLE);

    useEffect(() => {
        if (copyStatus === CopyStatuses.IDLE) {
            return;
        }
        const timeoutId = setTimeout(() => setCopyStatus(CopyStatuses.IDLE), COPY_FEEDBACK_DURATION_MS);
        return () => clearTimeout(timeoutId);
    }, [copyStatus]);

    const copy = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyStatus(CopyStatuses.COPIED);
        } catch {
            setCopyStatus(CopyStatuses.FAILED);
        }
    }, []);

    return { copyStatus, copy };
};
