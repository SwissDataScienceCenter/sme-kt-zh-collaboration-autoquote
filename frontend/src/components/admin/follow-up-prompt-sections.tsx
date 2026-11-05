import { useState } from "react";
import type { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFollowUpConfiguration } from "@/hooks/useFollowUpConfiguration";
import { toConfigurationInput } from "@/lib/follow-up-configuration";
import type { FollowUpConfiguration, FollowUpConfigurationInput } from "@/services/follow-up-configuration";

const PromptSections = {
    SYSTEM_PROMPT: "system_prompt",
    MISSING_INFORMATION_INSTRUCTIONS: "missing_information_instructions",
    QUOTE_INSTRUCTIONS: "quote_instructions",
} as const satisfies Record<string, keyof FollowUpConfigurationInput>;

type PromptSection = (typeof PromptSections)[keyof typeof PromptSections];

const PROMPT_SECTION_TRANSLATION_KEYS = {
    [PromptSections.SYSTEM_PROMPT]: "systemPrompt",
    [PromptSections.MISSING_INFORMATION_INSTRUCTIONS]: "missingInformationInstructions",
    [PromptSections.QUOTE_INSTRUCTIONS]: "quoteInstructions",
} as const satisfies Record<PromptSection, string>;

interface Props {
    followUpConfiguration: FollowUpConfiguration;
}

export const FollowUpPromptSections: FunctionComponent<Props> = (props: Props) => {
    const { followUpConfiguration } = props;
    const { t } = useTranslation();
    const { updateConfiguration } = useFollowUpConfiguration();
    const [editedInput, setEditedInput] = useState<FollowUpConfigurationInput>(toConfigurationInput(followUpConfiguration));

    const updateSection = (section: PromptSection, text: string) => setEditedInput((currentInput) => ({ ...currentInput, [section]: text }));

    const handleSectionBlur = (section: PromptSection) => {
        const trimmedText = editedInput[section].trim();
        if (trimmedText === "") {
            updateSection(section, followUpConfiguration[section]);
            return;
        }
        updateSection(section, trimmedText);
        if (trimmedText !== followUpConfiguration[section]) {
            void updateConfiguration({ ...toConfigurationInput(followUpConfiguration), [section]: trimmedText });
        }
    };

    return (
        <section aria-labelledby="prompt-sections-title" className="flex flex-col gap-4 rounded-lg bg-card p-6">
            <div className="flex flex-wrap items-baseline gap-2.5">
                <h2 id="prompt-sections-title" className="text-2xl leading-snug">
                    {t("admin.followUp.sections.title")}
                </h2>
                <span className="text-sm text-muted-foreground">{t("admin.followUp.sections.hint")}</span>
            </div>
            <div className="flex flex-col gap-4.5">
                {Object.values(PromptSections).map((section) => (
                    <div key={section} className="flex flex-col gap-2">
                        <Label htmlFor={`prompt-section-${section}`}>{t(`admin.followUp.sections.${PROMPT_SECTION_TRANSLATION_KEYS[section]}.label`)}</Label>
                        <Textarea
                            id={`prompt-section-${section}`}
                            value={editedInput[section]}
                            onChange={(e) => updateSection(section, e.target.value)}
                            onBlur={() => handleSectionBlur(section)}
                        />
                        <span className="text-[0.8rem] text-muted-foreground">{t(`admin.followUp.sections.${PROMPT_SECTION_TRANSLATION_KEYS[section]}.help`)}</span>
                    </div>
                ))}
            </div>
        </section>
    );
};
