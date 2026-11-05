import { useState } from "react";
import type { FunctionComponent } from "react";
import { Link } from "@tanstack/react-router";
import { SettingsIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SectionLabel } from "@/components/ui/section-label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExtraction } from "@/hooks/useExtraction";
import { isOneOf } from "@/lib/guards";
import { ReplyLanguages } from "@/services/extraction";
import type { ReplyLanguage } from "@/services/extraction";

const REPLY_LANGUAGE_TRANSLATION_KEYS = {
    [ReplyLanguages.SAME_AS_MESSAGE]: "sameAsMessage",
    [ReplyLanguages.ENGLISH]: "english",
    [ReplyLanguages.FRENCH]: "french",
    [ReplyLanguages.GERMAN]: "german",
} as const satisfies Record<ReplyLanguage, string>;

export const PipelineSettings: FunctionComponent = () => {
    const { t } = useTranslation();
    const { replyLanguage, setReplyLanguage } = useExtraction();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleReplyLanguageChange = (value: string) => {
        if (isOneOf(Object.values(ReplyLanguages), value)) {
            setReplyLanguage(value);
        }
    };

    return (
        <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("playground.settings.title")}>
                    <SettingsIcon className="size-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-4 p-5">
                <SectionLabel>{t("playground.settings.title")}</SectionLabel>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="settings-language">{t("playground.settings.languageLabel")}</Label>
                    <Select value={replyLanguage} onValueChange={handleReplyLanguageChange}>
                        <SelectTrigger id="settings-language" className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(ReplyLanguages).map((language) => (
                                <SelectItem key={language} value={language}>
                                    {t(`playground.settings.languages.${REPLY_LANGUAGE_TRANSLATION_KEYS[language]}`)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link to="/admin" className="text-sm font-medium text-primary underline hover:text-ink">
                        {t("playground.settings.manageInAdmin")}
                    </Link>
                    <Button size="sm" onClick={() => setIsSettingsOpen(false)}>
                        {t("common.done")}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
