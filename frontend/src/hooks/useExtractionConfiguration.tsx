import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { FunctionComponent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { downloadFile } from "@/lib/download";
import { removeField, replaceField, toConfigurationInput } from "@/lib/extraction-configuration";
import { NoticeTypes } from "@/lib/notice";
import type { Notice } from "@/lib/notice";
import { extractionConfigurationService } from "@/services/extraction-configuration";
import type { ExtractionField, ExtractionConfiguration, ExtractionConfigurationInput, ImportMode, ConfigurationFileFormat } from "@/services/extraction-configuration";

interface ExtractionConfigurationContextValue {
    extractionConfiguration: ExtractionConfiguration | null;
    isLoading: boolean;
    isSaving: boolean;
    notice: Notice | null;
    dismissNotice: () => void;
    updateDetails: (name: string, description: string) => Promise<void>;
    saveField: (originalKey: ExtractionField["key"] | null, field: ExtractionField) => Promise<boolean>;
    deleteField: (key: ExtractionField["key"]) => Promise<boolean>;
    importIntoConfiguration: (file: File, fileFormat: ConfigurationFileFormat, mode: ImportMode) => Promise<boolean>;
    exportConfiguration: (fileFormat: ConfigurationFileFormat) => Promise<void>;
}

const ExtractionConfigurationContext = createContext<ExtractionConfigurationContextValue>({
    extractionConfiguration: null,
    isLoading: true,
    isSaving: false,
    notice: null,
    dismissNotice: () => {},
    updateDetails: async () => {},
    saveField: async () => false,
    deleteField: async () => false,
    importIntoConfiguration: async () => false,
    exportConfiguration: async () => {},
});

const getErrorDetail = (error: unknown): string => (error instanceof Error ? error.message : String(error));

interface Props {
    children: ReactNode;
}

export const ExtractionConfigurationProvider: FunctionComponent<Props> = (props: Props) => {
    const { children } = props;
    const { t } = useTranslation();
    const [extractionConfiguration, setExtractionConfiguration] = useState<ExtractionConfiguration | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);

    useEffect(() => {
        const loadExtractionConfiguration = async () => {
            try {
                setExtractionConfiguration(await extractionConfigurationService.getExtractionConfiguration());
            } catch {
                setNotice({ type: NoticeTypes.ERROR, message: t("admin.notices.loadError") });
            } finally {
                setIsLoading(false);
            }
        };
        void loadExtractionConfiguration();
    }, [t]);

    const dismissNotice = useCallback(() => setNotice(null), []);

    const saveConfiguration = useCallback(
        async (configurationInput: ExtractionConfigurationInput): Promise<boolean> => {
            setIsSaving(true);
            try {
                setExtractionConfiguration(await extractionConfigurationService.updateExtractionConfiguration(configurationInput));
                return true;
            } catch {
                setNotice({ type: NoticeTypes.ERROR, message: t("admin.notices.saveError") });
                return false;
            } finally {
                setIsSaving(false);
            }
        },
        [t],
    );

    const updateDetails = useCallback(
        async (name: string, description: string) => {
            if (extractionConfiguration === null) {
                return;
            }
            await saveConfiguration({ ...toConfigurationInput(extractionConfiguration), name, description });
        },
        [extractionConfiguration, saveConfiguration],
    );

    const saveField = useCallback(
        async (originalKey: ExtractionField["key"] | null, field: ExtractionField): Promise<boolean> => {
            if (extractionConfiguration === null) {
                return false;
            }
            return saveConfiguration({ ...toConfigurationInput(extractionConfiguration), fields: replaceField(extractionConfiguration.fields, originalKey, field) });
        },
        [extractionConfiguration, saveConfiguration],
    );

    const deleteField = useCallback(
        async (key: ExtractionField["key"]): Promise<boolean> => {
            if (extractionConfiguration === null) {
                return false;
            }
            return saveConfiguration({ ...toConfigurationInput(extractionConfiguration), fields: removeField(extractionConfiguration.fields, key) });
        },
        [extractionConfiguration, saveConfiguration],
    );

    const importIntoConfiguration = useCallback(
        async (file: File, fileFormat: ConfigurationFileFormat, mode: ImportMode): Promise<boolean> => {
            setIsSaving(true);
            try {
                setExtractionConfiguration(await extractionConfigurationService.importIntoExtractionConfiguration(file, fileFormat, mode));
                setNotice({ type: NoticeTypes.SUCCESS, message: t("admin.notices.imported") });
                return true;
            } catch (error) {
                setNotice({ type: NoticeTypes.ERROR, message: t("admin.notices.importError", { detail: getErrorDetail(error) }) });
                return false;
            } finally {
                setIsSaving(false);
            }
        },
        [t],
    );

    const exportConfiguration = useCallback(
        async (fileFormat: ConfigurationFileFormat) => {
            try {
                const exportedFile = await extractionConfigurationService.exportExtractionConfiguration(fileFormat);
                downloadFile(exportedFile.blob, exportedFile.fileName);
                setNotice({ type: NoticeTypes.SUCCESS, message: t("admin.notices.exported", { fileName: exportedFile.fileName }) });
            } catch {
                setNotice({ type: NoticeTypes.ERROR, message: t("admin.notices.exportError") });
            }
        },
        [t],
    );

    const value = useMemo(
        () => ({ extractionConfiguration, isLoading, isSaving, notice, dismissNotice, updateDetails, saveField, deleteField, importIntoConfiguration, exportConfiguration }),
        [extractionConfiguration, isLoading, isSaving, notice, dismissNotice, updateDetails, saveField, deleteField, importIntoConfiguration, exportConfiguration],
    );

    return <ExtractionConfigurationContext.Provider value={value}>{children}</ExtractionConfigurationContext.Provider>;
};

export const useExtractionConfiguration = (): ExtractionConfigurationContextValue => useContext(ExtractionConfigurationContext);
