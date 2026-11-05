import type { FunctionComponent, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
    children: ReactNode;
    className?: string;
}

export const SectionLabel: FunctionComponent<Props> = (props: Props) => {
    const { children, className } = props;

    return (
        <span className={cn("text-[0.8rem] font-medium tracking-[0.05em] text-muted-foreground uppercase", className)}>
            <span aria-hidden="true">〇 </span>
            {children}
        </span>
    );
};
