import type { FunctionComponent } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";
import { APP_CONFIG } from "@/config";

const NAV_LINK_CLASS_NAME =
    "inline-flex min-h-11 items-center border-b-2 border-transparent px-1 text-[0.8rem] font-medium tracking-[0.05em] text-muted-foreground uppercase transition-colors hover:text-primary data-[status=active]:border-primary data-[status=active]:text-ink";

export const Header: FunctionComponent = () => {
    const { t } = useTranslation();

    return (
        <header className="bg-card">
            <div className="page-container flex min-h-18 flex-wrap items-center gap-x-6 gap-y-2 py-2">
                <img src={APP_CONFIG.logo} alt={APP_CONFIG.logoAlt} className="h-5 w-auto max-w-full" />
                <span aria-hidden="true" className="h-7 w-px bg-input" />
                <span className="font-heading text-xl font-semibold tracking-[-0.02em] text-ink">{APP_CONFIG.name}</span>
                <nav aria-label={t("header.mainNavigation")} className="ml-auto flex flex-wrap gap-6">
                    <Link to="/" activeOptions={{ exact: true }} className={NAV_LINK_CLASS_NAME}>
                        {t("navigation.playground")}
                    </Link>
                    <Link to="/admin" className={NAV_LINK_CLASS_NAME}>
                        {t("navigation.admin")}
                    </Link>
                </nav>
                <LanguageSwitcher />
            </div>
        </header>
    );
};
