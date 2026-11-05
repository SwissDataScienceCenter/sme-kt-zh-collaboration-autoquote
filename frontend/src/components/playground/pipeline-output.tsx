import type { FunctionComponent } from "react";
import { LoaderCircleIcon, ScanTextIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PipelineResults } from "@/components/playground/pipeline-results";
import { PipelineStepTabs } from "@/components/playground/pipeline-step-tabs";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { SectionLabel } from "@/components/ui/section-label";
import { useExtraction } from "@/hooks/useExtraction";

export const PipelineOutput: FunctionComponent = () => {
    const { t } = useTranslation();
    const { extraction, isRunning, error, dismissError } = useExtraction();

    return (
        <section aria-labelledby="output-title" aria-busy={isRunning} className="flex min-w-0 flex-[5_1_500px] flex-col gap-6 rounded-lg bg-card p-6">
            <div className="flex flex-col gap-0.5">
                <SectionLabel>{t("playground.output.sectionLabel")}</SectionLabel>
                <h2 id="output-title" className="text-2xl leading-snug">
                    {t("playground.output.title")}
                </h2>
            </div>

            {error !== null && <NoticeBanner message={error} isError dismissLabel={t("common.dismiss")} onDismiss={dismissError} />}

            {extraction !== null ? (
                <PipelineResults extraction={extraction} />
            ) : (
                <>
                    <PipelineStepTabs activeStage={null} availableStages={[]} onSelect={() => undefined} />
                    <div className="flex flex-col items-center gap-3 rounded-lg bg-surface px-6 py-12 text-center">
                        {isRunning ? (
                            <LoaderCircleIcon aria-hidden="true" className="size-8 animate-spin text-ink" />
                        ) : (
                            <ScanTextIcon aria-hidden="true" className="size-8 text-ink" />
                        )}
                        <h3 className="text-xl">{isRunning ? t("playground.output.runningTitle") : t("playground.output.emptyTitle")}</h3>
                        <p className="max-w-md text-[0.95rem] text-muted-foreground">
                            {isRunning ? t("playground.output.runningDescription") : t("playground.output.emptyDescription")}
                        </p>
                    </div>
                </>
            )}
        </section>
    );
};
