import type { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isOneOf } from "@/lib/guards";
import { DisplayLanguages, Languages } from "@/lib/lang/i18n";

export const LanguageSwitcher: FunctionComponent = () => {
    const { t, i18n } = useTranslation();

    const handleLanguageChange = (value: string) => {
        if (isOneOf(Object.values(Languages), value)) {
            void i18n.changeLanguage(value);
        }
    };

    return (
        <Select value={i18n.resolvedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger aria-label={t("header.languageLabel")}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {Object.values(Languages).map((language) => (
                    <SelectItem key={language} value={language}>
                        {DisplayLanguages[language]}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};
