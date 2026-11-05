import type { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export const PipelineStages = {
    EXTRACTION: "extraction",
    RETRIEVAL: "retrieval",
    QUOTE: "quote",
    FOLLOW_UP: "followUp",
} as const;

export type PipelineStage = (typeof PipelineStages)[keyof typeof PipelineStages];

interface Props {
    activeStage: PipelineStage | null;
    availableStages: PipelineStage[];
    onSelect: (stage: PipelineStage) => void;
}

export const PipelineStepTabs: FunctionComponent<Props> = (props: Props) => {
    const { activeStage, availableStages, onSelect } = props;
    const { t } = useTranslation();

    return (
        <div role="group" aria-label={t("playground.output.stepsLabel")} className="flex flex-wrap gap-2">
            {Object.values(PipelineStages).map((stage, stageIndex) => {
                const isAvailable = availableStages.includes(stage);
                const isActive = isAvailable && stage === activeStage;

                return (
                    <button
                        key={stage}
                        type="button"
                        disabled={!isAvailable}
                        aria-current={isActive ? "step" : undefined}
                        onClick={() => onSelect(stage)}
                        className={cn(
                            "inline-flex min-h-11 items-center gap-2.5 rounded-lg border pr-4 pl-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                            isActive && "border-ink bg-ink text-white",
                            isAvailable && !isActive && "cursor-pointer border-surface bg-surface text-ink",
                            !isAvailable && "cursor-not-allowed border-input text-muted-foreground",
                        )}
                    >
                        <span
                            className={cn(
                                "inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                                isActive && "bg-white text-ink",
                                isAvailable && !isActive && "bg-ink text-white",
                                !isAvailable && "bg-border text-muted-foreground",
                            )}
                        >
                            {stageIndex + 1}
                        </span>
                        {t(`playground.output.steps.${stage}`)}
                    </button>
                );
            })}
        </div>
    );
};
