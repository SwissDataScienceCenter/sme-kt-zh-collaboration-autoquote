import type { FunctionComponent } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
    message: string;
    isError: boolean;
    dismissLabel: string;
    onDismiss: () => void;
}

export const NoticeBanner: FunctionComponent<Props> = (props: Props) => {
    const { message, isError, dismissLabel, onDismiss } = props;

    return (
        <div
            role={isError ? "alert" : "status"}
            className={cn("flex items-center justify-between gap-3 rounded-lg py-1.5 pr-2 pl-4 text-sm", isError ? "bg-destructive/10 text-destructive" : "bg-highlight text-ink")}
        >
            <span>{message}</span>
            <Button variant="ghost" size="icon" aria-label={dismissLabel} onClick={onDismiss} className="text-current">
                <XIcon />
            </Button>
        </div>
    );
};
