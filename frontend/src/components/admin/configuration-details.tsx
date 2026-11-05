import { useState } from "react";
import type { FunctionComponent } from "react";
import { DownloadIcon, ScanEyeIcon, UploadIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FileFormatMenuButton } from "@/components/admin/file-format-menu-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { useExtractionConfiguration } from "@/hooks/useExtractionConfiguration";
import { formatIsoDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { ExtractionConfiguration, ConfigurationFileFormat } from "@/services/extraction-configuration";

const INLINE_EDIT_CLASS_NAME = "-ml-2.5 max-w-2xl border-transparent bg-transparent px-2.5 hover:bg-card focus-visible:bg-card focus-visible:ring-0";

interface Props {
    extractionConfiguration: ExtractionConfiguration;
    onImport: (fileFormat: ConfigurationFileFormat) => void;
    onPreview: () => void;
}

export const ConfigurationDetails: FunctionComponent<Props> = (props: Props) => {
    const { extractionConfiguration, onImport, onPreview } = props;
    const { t } = useTranslation();
    const { isSaving, updateDetails, exportConfiguration } = useExtractionConfiguration();
    const [name, setName] = useState(extractionConfiguration.name);
    const [description, setDescription] = useState(extractionConfiguration.description);

    const requiredCount = extractionConfiguration.fields.filter((field) => field.is_required).length;

    const handleDetailsBlur = () => {
        const trimmedName = name.trim();
        const trimmedDescription = description.trim();
        if (trimmedName === "") {
            setName(extractionConfiguration.name);
            return;
        }
        setName(trimmedName);
        setDescription(trimmedDescription);
        const hasChanged = trimmedName !== extractionConfiguration.name || trimmedDescription !== extractionConfiguration.description;
        if (hasChanged) {
            void updateDetails(trimmedName, trimmedDescription);
        }
    };

    return (
        <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-1.5">
                <SectionLabel>{t("admin.details.sectionLabel")}</SectionLabel>
                <label htmlFor="configuration-name" className="sr-only">
                    {t("admin.details.nameLabel")}
                </label>
                <Input
                    id="configuration-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleDetailsBlur}
                    className={cn(INLINE_EDIT_CLASS_NAME, "h-auto py-0.5 font-heading text-4xl font-medium tracking-[-0.02em] text-ink")}
                />
                <label htmlFor="configuration-description" className="sr-only">
                    {t("admin.details.descriptionLabel")}
                </label>
                <Input
                    id="configuration-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleDetailsBlur}
                    placeholder={t("admin.details.descriptionPlaceholder")}
                    className={cn(INLINE_EDIT_CLASS_NAME, "h-9 text-[0.95rem] text-muted-foreground focus-visible:text-foreground")}
                />
                <div className="flex flex-wrap items-center gap-3 text-[0.8rem] text-muted-foreground">
                    <span>{t("admin.details.lastEdited", { date: formatIsoDate(extractionConfiguration.update_timestamp) })}</span>
                    <span>{t("admin.details.summary", { count: extractionConfiguration.fields.length, requiredCount })}</span>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <FileFormatMenuButton
                    label={t("admin.details.import")}
                    menuLabel={t("admin.details.chooseImportFormat")}
                    icon={<UploadIcon />}
                    isDisabled={isSaving}
                    onSelect={onImport}
                />
                <FileFormatMenuButton
                    label={t("admin.details.export")}
                    menuLabel={t("admin.details.chooseExportFormat")}
                    icon={<DownloadIcon />}
                    isDisabled={isSaving}
                    onSelect={(fileFormat) => void exportConfiguration(fileFormat)}
                />
                <Button variant="outline" onClick={onPreview}>
                    <ScanEyeIcon />
                    {t("admin.details.preview")}
                </Button>
            </div>
        </div>
    );
};
