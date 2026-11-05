import { ApiClient } from "@/services/api";

export interface FollowUpConfigurationInput {
    system_prompt: string;
    missing_information_instructions: string;
    quote_instructions: string;
}

export interface FollowUpConfiguration extends FollowUpConfigurationInput {
    id: string;
    create_timestamp: number;
    update_timestamp: number;
}

export interface FollowUpConfigurationPreview {
    system_prompt: string;
    missing_information_prompt: string;
    quote_prompt: string;
}

const FOLLOW_UP_CONFIGURATION_PATH = "/follow-up-configuration";
const RESET_PATH = `${FOLLOW_UP_CONFIGURATION_PATH}/reset`;
const PREVIEW_PATH = `${FOLLOW_UP_CONFIGURATION_PATH}/preview`;

class FollowUpConfigurationService extends ApiClient {
    getFollowUpConfiguration(): Promise<FollowUpConfiguration> {
        return this.get<FollowUpConfiguration>(FOLLOW_UP_CONFIGURATION_PATH);
    }

    updateFollowUpConfiguration(configurationInput: FollowUpConfigurationInput): Promise<FollowUpConfiguration> {
        return this.put<FollowUpConfiguration>(FOLLOW_UP_CONFIGURATION_PATH, configurationInput);
    }

    resetFollowUpConfiguration(): Promise<FollowUpConfiguration> {
        return this.post<FollowUpConfiguration>(RESET_PATH);
    }

    previewFollowUpConfiguration(): Promise<FollowUpConfigurationPreview> {
        return this.get<FollowUpConfigurationPreview>(PREVIEW_PATH);
    }
}

export const followUpConfigurationService = new FollowUpConfigurationService();
