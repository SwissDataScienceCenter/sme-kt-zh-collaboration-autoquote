import type { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { getDocumentFileUrl } from "@/services/document-index";
import type { SimilarDocument } from "@/services/extraction";

const FULL_PERCENTAGE = 100;

interface Props {
    similarDocuments: SimilarDocument[];
}

export const RetrievalResults: FunctionComponent<Props> = (props: Props) => {
    const { similarDocuments } = props;
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h3 className="text-xl">{t("playground.retrieval.title", { count: similarDocuments.length })}</h3>
                <p className="text-sm text-muted-foreground">{t("playground.retrieval.description")}</p>
            </div>
            {similarDocuments.length === 0 ? (
                <p className="rounded-lg bg-surface px-4 py-3.5 text-sm text-muted-foreground">{t("playground.retrieval.empty")}</p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {similarDocuments.map((similarDocument) => (
                        <li key={similarDocument.file_name} className="flex flex-col gap-1.5 rounded-lg bg-surface px-4 py-3.5">
                            <div className="flex flex-wrap items-center gap-3">
                                <a
                                    href={getDocumentFileUrl(similarDocument.file_name)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-[0.8rem] text-ink underline-offset-4 hover:text-primary hover:underline"
                                >
                                    {similarDocument.file_name}
                                </a>
                                <Badge variant="highlight">{t(`admin.documents.categories.${similarDocument.category}`)}</Badge>
                                <span className="ml-auto text-sm text-muted-foreground">
                                    {t("playground.retrieval.similarity", { percentage: Math.round(similarDocument.similarity * FULL_PERCENTAGE) })}
                                </span>
                            </div>
                            <p className="text-sm">{similarDocument.summary}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
