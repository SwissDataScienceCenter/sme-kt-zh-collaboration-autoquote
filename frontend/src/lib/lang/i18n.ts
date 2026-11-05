import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { isOneOf } from "@/lib/guards";
import * as en from "./en";
import * as fr from "./fr";
import * as de from "./de";
import * as it from "./it";

export const Languages = {
    EN: "en",
    FR: "fr",
    DE: "de",
    IT: "it",
} as const;

export type Language = (typeof Languages)[keyof typeof Languages];

export const DisplayLanguages: Record<Language, string> = {
    [Languages.EN]: "English",
    [Languages.FR]: "Français",
    [Languages.DE]: "Deutsch",
    [Languages.IT]: "Italiano",
};

export const defaultNS = "app";

export const resources = {
    en,
    fr,
    de,
    it,
};

export const initTranslation = () => {
    // Keeps <html lang> in step with the switcher, so screen readers pronounce the text in the right language.
    i18n.on("languageChanged", (language) => {
        document.documentElement.lang = language;
    });
    i18n.use(LanguageDetector)
        .use(initReactI18next)
        .init({
            detection: {
                caches: ["localStorage"],
                convertDetectedLanguage: (language) => {
                    const shortLanguage = language.split("-")[0];
                    return isOneOf(Object.values(Languages), shortLanguage) ? shortLanguage : Languages.EN;
                },
            },
            defaultNS,
            resources,
            ns: [defaultNS],
            fallbackLng: Languages.EN,
            returnEmptyString: false,
            returnNull: false,
            interpolation: {
                escapeValue: false,
            },
        });
};
