import type { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";
import { getIndexingPercentage } from "@/lib/document-index";
import { DocumentCategories, IndexingStates } from "@/services/document-index";
import type { DocumentIndexStatus } from "@/services/document-index";

interface Props {
    indexStatus: DocumentIndexStatus;
}

export const DocumentIndexPanel: FunctionComponent<Props> = (props: Props) => {
    const { indexStatus } = props;
    const { t } = useTranslation();

    const runningIndexing = indexStatus.indexing?.state === IndexingStates.RUNNING ? indexStatus.indexing : null;
    const stats = [
        ...Object.values(DocumentCategories).map((category) => ({
            key: category,
            label: t(`admin.documents.categories.${category}`),
            count: indexStatus.document_counts[category],
        })),
        { key: "products", label: t("admin.documents.productsStat"), count: indexStatus.product_count },
    ];

    return (
        <section aria-labelledby="document-index-title" className="flex flex-col gap-4 rounded-lg bg-card p-6">
            <div className="flex flex-wrap items-baseline gap-2.5">
                <h2 id="document-index-title" className="text-2xl leading-snug">
                    {t("admin.documents.index.title")}
                </h2>
                <span className="text-sm text-muted-foreground">{t("admin.documents.index.pending", { count: indexStatus.pending_file_count })}</span>
            </div>
            {runningIndexing !== null && (
                <div className="flex flex-col gap-2">
                    <Progress value={getIndexingPercentage(runningIndexing)} aria-label={t("admin.documents.index.progressLabel")} />
                    <span className="text-sm text-muted-foreground">
                        {t("admin.documents.index.progress", { processedCount: runningIndexing.processed_file_count, totalCount: runningIndexing.total_file_count })}
                    </span>
                </div>
            )}
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {stats.map((stat) => (
                    <div key={stat.key} className="flex flex-col gap-1 rounded-lg bg-background p-4">
                        <dt className="text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase">{stat.label}</dt>
                        <dd className="font-heading text-3xl font-medium text-ink">{stat.count}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
};
