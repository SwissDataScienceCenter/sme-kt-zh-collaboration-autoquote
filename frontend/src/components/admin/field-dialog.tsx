import { useState } from "react";
import type { FunctionComponent } from "react";
import { XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionLabel } from "@/components/ui/section-label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useExtractionConfiguration } from "@/hooks/useExtractionConfiguration";
import { formatAllowedValues, normalizeField, validateField } from "@/lib/extraction-configuration";
import type { FieldError } from "@/lib/extraction-configuration";
import { isOneOf } from "@/lib/guards";
import { FieldTypes } from "@/services/extraction-configuration";
import type { ExtractionField, ExtractionConfiguration } from "@/services/extraction-configuration";

interface Props {
    extractionConfiguration: ExtractionConfiguration;
    initialField: ExtractionField;
    originalKey: ExtractionField["key"] | null;
    onClose: () => void;
}

export const FieldDialog: FunctionComponent<Props> = (props: Props) => {
    const { extractionConfiguration, initialField, originalKey, onClose } = props;
    const { t } = useTranslation();
    const { isSaving, saveField, deleteField } = useExtractionConfiguration();
    const [editedField, setEditedField] = useState<ExtractionField>(initialField);
    const [allowedValuesText, setAllowedValuesText] = useState(formatAllowedValues(initialField.allowed_values));
    const [fieldError, setFieldError] = useState<FieldError | null>(null);

    const isNewField = originalKey === null;
    const isLastField = !isNewField && extractionConfiguration.fields.length <= 1;
    const title = editedField.label.trim() === "" ? t("admin.fieldDialog.newFieldTitle") : editedField.label;

    const updateField = (patch: Partial<ExtractionField>) => setEditedField((currentField) => ({ ...currentField, ...patch }));

    const handleTypeChange = (value: string) => {
        if (isOneOf(Object.values(FieldTypes), value)) {
            updateField({ type: value });
        }
    };

    const handleDone = async () => {
        const fieldToSave = normalizeField(editedField, allowedValuesText);
        const otherKeys = extractionConfiguration.fields.map((field) => field.key).filter((key) => key !== originalKey);
        const validationError = validateField(fieldToSave, otherKeys);
        setFieldError(validationError);
        if (validationError !== null) {
            return;
        }
        const isSaved = await saveField(originalKey, fieldToSave);
        if (isSaved) {
            onClose();
        }
    };

    const handleDelete = async () => {
        if (isNewField) {
            onClose();
            return;
        }
        const isDeleted = await deleteField(originalKey);
        if (isDeleted) {
            onClose();
        }
    };

    return (
        <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[680px]">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <SectionLabel>{isNewField ? t("admin.fieldDialog.newSectionLabel") : t("admin.fieldDialog.sectionLabel")}</SectionLabel>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription asChild>
                            <code className="text-xs text-ink">{editedField.key.trim()}</code>
                        </DialogDescription>
                    </div>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" aria-label={t("common.close")}>
                            <XIcon />
                        </Button>
                    </DialogClose>
                </div>

                <div className="flex flex-col gap-4.5">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="field-label">{t("admin.fieldDialog.label")}</Label>
                        <Input id="field-label" value={editedField.label} onChange={(e) => updateField({ label: e.target.value })} />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex min-w-0 flex-[1_1_170px] flex-col gap-2">
                            <Label htmlFor="field-key">{t("admin.fieldDialog.key")}</Label>
                            <Input id="field-key" value={editedField.key} onChange={(e) => updateField({ key: e.target.value })} className="font-mono text-sm" />
                        </div>
                        <div className="flex min-w-0 flex-[1_1_130px] flex-col gap-2">
                            <Label htmlFor="field-type">{t("admin.fieldDialog.type")}</Label>
                            <Select value={editedField.type} onValueChange={handleTypeChange}>
                                <SelectTrigger id="field-type" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(FieldTypes).map((fieldType) => (
                                        <SelectItem key={fieldType} value={fieldType}>
                                            {fieldType}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {editedField.type === FieldTypes.ENUM && (
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="field-allowed-values">{t("admin.fieldDialog.allowedValues")}</Label>
                            <Input id="field-allowed-values" value={allowedValuesText} onChange={(e) => setAllowedValuesText(e.target.value)} />
                            <span className="text-[0.8rem] text-muted-foreground">{t("admin.fieldDialog.allowedValuesHelp")}</span>
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="field-description">{t("admin.fieldDialog.description")}</Label>
                        <Textarea id="field-description" rows={3} value={editedField.description} onChange={(e) => updateField({ description: e.target.value })} />
                    </div>
                    <div className="flex items-start gap-3">
                        <Switch id="field-required" checked={editedField.is_required} onCheckedChange={(isChecked) => updateField({ is_required: isChecked })} className="mt-1" />
                        <div className="flex flex-col gap-0.5">
                            <Label htmlFor="field-required">{t("admin.fieldDialog.required")}</Label>
                            <span className="text-[0.8rem] text-muted-foreground">{t("admin.fieldDialog.requiredHelp")}</span>
                        </div>
                    </div>
                </div>

                {fieldError !== null && (
                    <p role="alert" className="text-sm text-destructive">
                        {t(`admin.fieldDialog.errors.${fieldError}`)}
                    </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <Button variant="text" disabled={isSaving || isLastField} onClick={() => void handleDelete()}>
                        {t("admin.fieldDialog.delete")}
                    </Button>
                    <Button disabled={isSaving} onClick={() => void handleDone()}>
                        {t("common.done")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
