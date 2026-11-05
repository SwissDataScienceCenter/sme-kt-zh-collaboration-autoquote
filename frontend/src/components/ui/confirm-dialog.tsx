import type { FunctionComponent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface Props {
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    isDisabled: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export const ConfirmDialog: FunctionComponent<Props> = (props: Props) => {
    const { title, description, confirmLabel, cancelLabel, isDisabled, onConfirm, onClose } = props;

    return (
        <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[480px]">
                <div className="flex flex-col gap-1.5">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
                    <DialogClose asChild>
                        <Button variant="text">{cancelLabel}</Button>
                    </DialogClose>
                    <Button disabled={isDisabled} onClick={onConfirm}>
                        {confirmLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
