import type { FunctionComponent } from "react";
import { FollowUpConfigurationEditor } from "@/components/admin/follow-up-configuration-editor";
import { FollowUpConfigurationProvider } from "@/hooks/useFollowUpConfiguration";

export const FollowUpView: FunctionComponent = () => {
    return (
        <FollowUpConfigurationProvider>
            <FollowUpConfigurationEditor />
        </FollowUpConfigurationProvider>
    );
};
