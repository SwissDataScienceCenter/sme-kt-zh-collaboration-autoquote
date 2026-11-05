import { useState } from "react";
import type { FunctionComponent } from "react";
import { ExtractionResults } from "@/components/playground/extraction-results";
import { FollowUpPanel } from "@/components/playground/follow-up-panel";
import { PipelineStages, PipelineStepTabs } from "@/components/playground/pipeline-step-tabs";
import type { PipelineStage } from "@/components/playground/pipeline-step-tabs";
import { useExtraction } from "@/hooks/useExtraction";
import { getLatestQuote } from "@/lib/extraction";
import { QuoteSummary } from "@/components/playground/quote-summary";
import { RetrievalResults } from "@/components/playground/retrieval-results";
import type { Extraction } from "@/services/extraction";

const QUOTE_STAGES: PipelineStage[] = [PipelineStages.EXTRACTION, PipelineStages.RETRIEVAL, PipelineStages.QUOTE, PipelineStages.FOLLOW_UP];
const MISSING_INFORMATION_STAGES: PipelineStage[] = [PipelineStages.EXTRACTION, PipelineStages.FOLLOW_UP];

interface Props {
    extraction: Extraction;
}

// Mounted once per run, so the active stage starts fresh with every new extraction.
export const PipelineResults: FunctionComponent<Props> = (props: Props) => {
    const { extraction } = props;
    const [activeStage, setActiveStage] = useState<PipelineStage>(PipelineStages.EXTRACTION);
    const { email, setEmail } = useExtraction();

    const quote = getLatestQuote(extraction);
    // Retrieval and quote only run once every required detail is known.
    const hasQuote = quote !== null;
    const availableStages = hasQuote ? QUOTE_STAGES : MISSING_INFORMATION_STAGES;
    const nextStage = hasQuote ? PipelineStages.RETRIEVAL : PipelineStages.FOLLOW_UP;

    return (
        <>
            <PipelineStepTabs activeStage={activeStage} availableStages={availableStages} onSelect={setActiveStage} />
            {activeStage === PipelineStages.EXTRACTION && <ExtractionResults extraction={extraction} onNext={() => setActiveStage(nextStage)} />}
            {activeStage === PipelineStages.RETRIEVAL && <RetrievalResults similarDocuments={extraction.similar_documents} />}
            {activeStage === PipelineStages.QUOTE && quote !== null && <QuoteSummary quote={quote} />}
            {activeStage === PipelineStages.FOLLOW_UP && <FollowUpPanel extraction={extraction} email={email} onEmailChange={setEmail} />}
        </>
    );
};
