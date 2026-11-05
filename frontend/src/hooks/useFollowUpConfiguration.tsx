import { createContext, useContext } from "react";
import type { FunctionComponent, ReactNode } from "react";
import { createEditableConfigurationDefault, useEditableConfiguration } from "@/hooks/useEditableConfiguration";
import type { ConfigurationOperations, EditableConfiguration } from "@/hooks/useEditableConfiguration";
import { followUpConfigurationService } from "@/services/follow-up-configuration";
import type { FollowUpConfiguration, FollowUpConfigurationInput } from "@/services/follow-up-configuration";

type FollowUpConfigurationContextValue = EditableConfiguration<FollowUpConfiguration, FollowUpConfigurationInput>;

const FOLLOW_UP_CONFIGURATION_OPERATIONS: ConfigurationOperations<FollowUpConfiguration, FollowUpConfigurationInput> = {
    getConfiguration: () => followUpConfigurationService.getFollowUpConfiguration(),
    updateConfiguration: (configurationInput) => followUpConfigurationService.updateFollowUpConfiguration(configurationInput),
    resetConfiguration: () => followUpConfigurationService.resetFollowUpConfiguration(),
};

const FollowUpConfigurationContext = createContext<FollowUpConfigurationContextValue>(createEditableConfigurationDefault());

interface Props {
    children: ReactNode;
}

export const FollowUpConfigurationProvider: FunctionComponent<Props> = (props: Props) => {
    const { children } = props;
    const value = useEditableConfiguration(FOLLOW_UP_CONFIGURATION_OPERATIONS, "admin.followUp.notices");

    return <FollowUpConfigurationContext.Provider value={value}>{children}</FollowUpConfigurationContext.Provider>;
};

export const useFollowUpConfiguration = (): FollowUpConfigurationContextValue => useContext(FollowUpConfigurationContext);
