import type { FunctionComponent } from "react";
import { XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SectionLabel } from "@/components/ui/section-label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const PREVIEW_JSON_INDENT = 2;
const PREVIEW_CLASS_NAME = "max-h-[60vh] overflow-auto rounded-lg bg-ink p-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-highlight";

export interface PreviewTab {
    value: string;
    label: string;
    text: string;
}

interface Props {
    sectionLabel: string;
    title: string;
    description: string;
    tabs: PreviewTab[];
    defaultTab: PreviewTab["value"];
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
}

export const PreviewDialog: FunctionComponent<Props> = (props: Props) => {
    const { sectionLabel, title, description, tabs, defaultTab, isLoading, error, onClose } = props;
    const { t } = useTranslation();

    return (
        <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[760px]">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <SectionLabel>{sectionLabel}</SectionLabel>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </div>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" aria-label={t("common.close")}>
                            <XIcon />
                        </Button>
                    </DialogClose>
                </div>

                {error !== null ? (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                ) : (
                    <Tabs defaultValue={defaultTab} className="gap-4">
                        <TabsList>
                            {tabs.map((tab) => (
                                <TabsTrigger key={tab.value} value={tab.value}>
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {tabs.map((tab) => (
                            <TabsContent key={tab.value} value={tab.value}>
                                <pre tabIndex={0} aria-label={tab.label} className={PREVIEW_CLASS_NAME}>
                                    {isLoading ? t("common.loading") : tab.text}
                                </pre>
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
};
