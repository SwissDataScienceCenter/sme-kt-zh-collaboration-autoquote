import type { FunctionComponent } from "react";
import { Link } from "@tanstack/react-router";
import { CalculatorIcon, FilesIcon, MailIcon, ScanTextIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionLabel } from "@/components/ui/section-label";

const MODULE_LINK_CLASS_NAME =
    "flex min-h-11 items-center gap-3 rounded-lg bg-surface px-3 font-medium text-ink transition-colors hover:text-primary data-[status=active]:bg-ink data-[status=active]:text-white data-[status=active]:hover:text-white";

const ADMIN_MODULES = [
    { to: "/admin/entity-extraction", icon: ScanTextIcon, labelKey: "entityExtraction" },
    { to: "/admin/document-retrieval", icon: FilesIcon, labelKey: "documents" },
    { to: "/admin/quote-configuration", icon: CalculatorIcon, labelKey: "quoteConfiguration" },
    { to: "/admin/follow-up", icon: MailIcon, labelKey: "followUp" },
] as const;

export const AdminModulesNav: FunctionComponent = () => {
    const { t } = useTranslation();

    return (
        <aside className="flex w-full flex-col gap-4 rounded-lg bg-card p-6 lg:w-64 lg:shrink-0">
            <SectionLabel>{t("admin.modules.title")}</SectionLabel>
            <nav aria-label={t("admin.modules.title")} className="flex flex-col gap-2">
                {ADMIN_MODULES.map((adminModule) => (
                    <Link key={adminModule.to} to={adminModule.to} className={MODULE_LINK_CLASS_NAME}>
                        <adminModule.icon aria-hidden="true" className="size-5" />
                        {t(`admin.modules.${adminModule.labelKey}`)}
                    </Link>
                ))}
            </nav>
        </aside>
    );
};
