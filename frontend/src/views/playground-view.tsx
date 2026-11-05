import type { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { MessageInput } from "@/components/playground/message-input";
import { PipelineOutput } from "@/components/playground/pipeline-output";
import { SectionLabel } from "@/components/ui/section-label";

export const PlaygroundView: FunctionComponent = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex max-w-[760px] flex-col gap-2">
                <SectionLabel>{t("playground.sectionLabel")}</SectionLabel>
                <h1 className="text-4xl leading-[1.1] sm:text-[2.5rem]">{t("playground.title")}</h1>
                <p className="text-muted-foreground">{t("playground.description")}</p>
            </div>
            <div className="flex flex-wrap items-stretch gap-6">
                <MessageInput />
                <PipelineOutput />
            </div>
        </div>
    );
};
