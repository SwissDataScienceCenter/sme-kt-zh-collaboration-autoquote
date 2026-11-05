import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NoticeTypes } from "@/lib/notice";
import type { Notice } from "@/lib/notice";

export interface ConfigurationOperations<TConfiguration, TInput> {
    getConfiguration: () => Promise<TConfiguration>;
    updateConfiguration: (configurationInput: TInput) => Promise<TConfiguration>;
    resetConfiguration: () => Promise<TConfiguration>;
}

export interface EditableConfiguration<TConfiguration, TInput> {
    configuration: TConfiguration | null;
    isLoading: boolean;
    isSaving: boolean;
    notice: Notice | null;
    dismissNotice: () => void;
    updateConfiguration: (configurationInput: TInput) => Promise<void>;
    resetConfiguration: () => Promise<boolean>;
}

export type ConfigurationNoticesKey = "admin.quoteConfiguration.notices" | "admin.followUp.notices";

export const createEditableConfigurationDefault = <TConfiguration, TInput>(): EditableConfiguration<TConfiguration, TInput> => ({
    configuration: null,
    isLoading: true,
    isSaving: false,
    notice: null,
    dismissNotice: () => {},
    updateConfiguration: async () => {},
    resetConfiguration: async () => false,
});

// Shared by the configurations edited as a whole in Admin; operations must be stable (defined outside the component).
export const useEditableConfiguration = <TConfiguration, TInput>(
    operations: ConfigurationOperations<TConfiguration, TInput>,
    noticesKey: ConfigurationNoticesKey,
): EditableConfiguration<TConfiguration, TInput> => {
    const { t } = useTranslation();
    const [configuration, setConfiguration] = useState<TConfiguration | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);

    useEffect(() => {
        const loadConfiguration = async () => {
            try {
                setConfiguration(await operations.getConfiguration());
            } catch {
                setNotice({ type: NoticeTypes.ERROR, message: t(`${noticesKey}.loadError`) });
            } finally {
                setIsLoading(false);
            }
        };
        void loadConfiguration();
    }, [operations, noticesKey, t]);

    const dismissNotice = useCallback(() => setNotice(null), []);

    const updateConfiguration = useCallback(
        async (configurationInput: TInput) => {
            setIsSaving(true);
            try {
                setConfiguration(await operations.updateConfiguration(configurationInput));
            } catch {
                setNotice({ type: NoticeTypes.ERROR, message: t(`${noticesKey}.saveError`) });
            } finally {
                setIsSaving(false);
            }
        },
        [operations, noticesKey, t],
    );

    const resetConfiguration = useCallback(async (): Promise<boolean> => {
        setIsSaving(true);
        try {
            setConfiguration(await operations.resetConfiguration());
            setNotice({ type: NoticeTypes.SUCCESS, message: t(`${noticesKey}.reset`) });
            return true;
        } catch {
            setNotice({ type: NoticeTypes.ERROR, message: t(`${noticesKey}.resetError`) });
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [operations, noticesKey, t]);

    return useMemo(
        () => ({ configuration, isLoading, isSaving, notice, dismissNotice, updateConfiguration, resetConfiguration }),
        [configuration, isLoading, isSaving, notice, dismissNotice, updateConfiguration, resetConfiguration],
    );
};
