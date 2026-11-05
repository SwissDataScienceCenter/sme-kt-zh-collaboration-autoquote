import type { FollowUpConfiguration, FollowUpConfigurationInput } from "@/services/follow-up-configuration";

export const toConfigurationInput = (followUpConfiguration: FollowUpConfiguration): FollowUpConfigurationInput => ({
    system_prompt: followUpConfiguration.system_prompt,
    missing_information_instructions: followUpConfiguration.missing_information_instructions,
    quote_instructions: followUpConfiguration.quote_instructions,
});
