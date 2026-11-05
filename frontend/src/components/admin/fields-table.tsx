import type { FunctionComponent } from "react";
import { PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExtractionField } from "@/services/extraction-configuration";

const COLUMNS_CLASS_NAME = "grid grid-cols-[minmax(170px,2fr)_96px_96px_minmax(160px,3fr)] gap-x-4";

interface Props {
    fields: ExtractionField[];
    onSelectField: (key: ExtractionField["key"]) => void;
    onAddField: () => void;
}

export const FieldsTable: FunctionComponent<Props> = (props: Props) => {
    const { fields, onSelectField, onAddField } = props;
    const { t } = useTranslation();

    return (
        <section aria-labelledby="fields-title" className="flex flex-col gap-4 rounded-lg bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-baseline gap-2.5">
                    <h2 id="fields-title" className="text-2xl leading-snug">
                        {t("admin.fields.title")}
                    </h2>
                    <span className="text-sm text-muted-foreground">{t("admin.fields.hint")}</span>
                </div>
                <Button variant="outline" size="sm" onClick={onAddField}>
                    <PlusIcon />
                    {t("admin.fields.add")}
                </Button>
            </div>
            <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                    <div aria-hidden="true" className={cn(COLUMNS_CLASS_NAME, "px-3 pb-2.5 text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase")}>
                        <span>{t("admin.fields.columns.field")}</span>
                        <span>{t("admin.fields.columns.type")}</span>
                        <span>{t("admin.fields.columns.required")}</span>
                        <span>{t("admin.fields.columns.description")}</span>
                    </div>
                    {fields.map((field) => (
                        <button
                            key={field.key}
                            type="button"
                            onClick={() => onSelectField(field.key)}
                            className={cn(
                                COLUMNS_CLASS_NAME,
                                "w-full cursor-pointer items-center border-t border-border p-3 text-left hover:bg-background focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                            )}
                        >
                            <span className="flex min-w-0 flex-col">
                                <code className="text-[0.8rem] text-ink">{field.key}</code>
                                <span className="text-sm">{field.label}</span>
                            </span>
                            <span>
                                <Badge variant="highlight">{field.type}</Badge>
                            </span>
                            <span className="text-sm">{field.is_required ? t("common.yes") : t("common.no")}</span>
                            <span className="truncate text-sm text-muted-foreground">{field.description}</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
};
