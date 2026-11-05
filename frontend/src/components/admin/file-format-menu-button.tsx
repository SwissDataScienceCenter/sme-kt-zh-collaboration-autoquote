import type { FunctionComponent, ReactNode } from "react";
import { ChevronDownIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfigurationFileFormats } from "@/services/extraction-configuration";
import type { ConfigurationFileFormat } from "@/services/extraction-configuration";

interface Props {
    label: string;
    menuLabel: string;
    icon: ReactNode;
    isDisabled: boolean;
    onSelect: (fileFormat: ConfigurationFileFormat) => void;
}

export const FileFormatMenuButton: FunctionComponent<Props> = (props: Props) => {
    const { label, menuLabel, icon, isDisabled, onSelect } = props;
    const { t } = useTranslation();

    return (
        <ButtonGroup>
            <Button variant="outline" disabled={isDisabled} onClick={() => onSelect(ConfigurationFileFormats.XLSX)}>
                {icon}
                {label}
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" disabled={isDisabled} aria-label={menuLabel}>
                        <ChevronDownIcon />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-56">
                    <DropdownMenuItem onSelect={() => onSelect(ConfigurationFileFormats.XLSX)} className="min-h-11 justify-between">
                        {t("admin.fileFormats.xlsx")}
                        <Badge variant="highlight">{t("admin.fileFormats.default")}</Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onSelect(ConfigurationFileFormats.JSON)} className="min-h-11">
                        {t("admin.fileFormats.json")}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </ButtonGroup>
    );
};
