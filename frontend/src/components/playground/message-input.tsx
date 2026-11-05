import type { FunctionComponent } from "react";
import { PlayIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PipelineSettings } from "@/components/playground/pipeline-settings";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { Textarea } from "@/components/ui/textarea";
import { useExtraction } from "@/hooks/useExtraction";

export const MessageInput: FunctionComponent = () => {
    const { t } = useTranslation();
    const { message, setMessage, isRunning, runExtraction, resetExtraction } = useExtraction();

    const canRun = message.trim() !== "" && !isRunning;

    return (
        <section aria-labelledby="input-title" className="flex min-w-0 flex-[6_1_560px] flex-col gap-5 rounded-lg bg-card p-6">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                    <SectionLabel>{t("playground.input.sectionLabel")}</SectionLabel>
                    <h2 id="input-title" className="text-2xl leading-snug">
                        {t("playground.input.title")}
                    </h2>
                </div>
                <PipelineSettings />
            </div>

            <Textarea
                id="customer-message"
                aria-labelledby="input-title"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("playground.input.messagePlaceholder")}
                className="min-h-[520px] flex-1 px-5 py-4 leading-[1.7]"
            />

            <div className="flex flex-wrap items-center gap-3">
                <Button disabled={!canRun} onClick={() => void runExtraction(message.trim())}>
                    <PlayIcon />
                    {isRunning ? t("playground.input.running") : t("playground.input.run")}
                </Button>
                <Button variant="text" disabled={isRunning} onClick={resetExtraction}>
                    {t("playground.input.reset")}
                </Button>
            </div>
        </section>
    );
};
