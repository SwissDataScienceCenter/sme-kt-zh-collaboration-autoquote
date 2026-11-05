import type { FunctionComponent, ReactNode } from "react";
import { SectionLabel } from "@/components/ui/section-label";

interface Props {
    sectionLabel: string;
    title: string;
    description: string;
    meta?: string;
    actions?: ReactNode;
}

export const AdminPageHeader: FunctionComponent<Props> = (props: Props) => {
    const { sectionLabel, title, description, meta, actions } = props;

    return (
        <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-1.5">
                <SectionLabel>{sectionLabel}</SectionLabel>
                <h1 className="py-0.5 text-4xl">{title}</h1>
                <p className="max-w-2xl text-[0.95rem] text-muted-foreground">{description}</p>
                {meta !== undefined && <span className="text-[0.8rem] text-muted-foreground">{meta}</span>}
            </div>
            {actions !== undefined && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
    );
};
