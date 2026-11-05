import { useState } from "react";
import type { FunctionComponent } from "react";
import { XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionLabel } from "@/components/ui/section-label";
import { useDocuments } from "@/hooks/useDocuments";
import { formatUnitPriceInput, normalizeProductInput, validateProductInput } from "@/lib/products";
import type { ProductError } from "@/lib/products";
import type { Product, ProductInput } from "@/services/product";

const PRICE_STEP = 0.01;

interface Props {
    productId: Product["id"] | null;
    initialProductInput: ProductInput;
    onClose: () => void;
}

export const ProductDialog: FunctionComponent<Props> = (props: Props) => {
    const { productId, initialProductInput, onClose } = props;
    const { t } = useTranslation();
    const { products, isSaving, saveProduct } = useDocuments();
    const [editedProductInput, setEditedProductInput] = useState<ProductInput>(initialProductInput);
    const [unitPriceText, setUnitPriceText] = useState(formatUnitPriceInput(initialProductInput.unit_price));
    const [productError, setProductError] = useState<ProductError | null>(null);

    const isNewProduct = productId === null;
    const title = editedProductInput.product_reference.trim() === "" ? t("admin.productDialog.newProductTitle") : editedProductInput.product_reference;
    const specEntries = Object.entries(editedProductInput.spec);

    const updateProductInput = (patch: Partial<ProductInput>) => setEditedProductInput((currentProductInput) => ({ ...currentProductInput, ...patch }));

    const handleDone = async () => {
        const productInputToSave = normalizeProductInput(editedProductInput, unitPriceText);
        const otherReferences = products.filter((product) => product.id !== productId).map((product) => product.product_reference);
        const validationError = validateProductInput(productInputToSave, unitPriceText, otherReferences);
        setProductError(validationError);
        if (validationError !== null) {
            return;
        }
        const isSaved = await saveProduct(productId, productInputToSave);
        if (isSaved) {
            onClose();
        }
    };

    return (
        <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[680px]">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <SectionLabel>{isNewProduct ? t("admin.productDialog.newSectionLabel") : t("admin.productDialog.sectionLabel")}</SectionLabel>
                        <DialogTitle className="break-all">{title}</DialogTitle>
                        <DialogDescription>{t("admin.productDialog.description")}</DialogDescription>
                    </div>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" aria-label={t("common.close")}>
                            <XIcon />
                        </Button>
                    </DialogClose>
                </div>

                <div className="flex flex-col gap-4.5">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="product-reference">{t("admin.productDialog.reference")}</Label>
                        <Input
                            id="product-reference"
                            value={editedProductInput.product_reference}
                            onChange={(e) => updateProductInput({ product_reference: e.target.value })}
                            className="font-mono text-sm"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="product-description">{t("admin.productDialog.productDescription")}</Label>
                        <Input id="product-description" value={editedProductInput.description} onChange={(e) => updateProductInput({ description: e.target.value })} />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex min-w-0 flex-[1_1_130px] flex-col gap-2">
                            <Label htmlFor="product-unit">{t("admin.productDialog.unit")}</Label>
                            <Input id="product-unit" value={editedProductInput.unit} onChange={(e) => updateProductInput({ unit: e.target.value })} />
                        </div>
                        <div className="flex min-w-0 flex-[1_1_170px] flex-col gap-2">
                            <Label htmlFor="product-unit-price">{t("admin.productDialog.unitPrice")}</Label>
                            <Input
                                id="product-unit-price"
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step={PRICE_STEP}
                                value={unitPriceText}
                                onChange={(e) => setUnitPriceText(e.target.value)}
                            />
                            <span className="text-[0.8rem] text-muted-foreground">{t("admin.productDialog.unitPriceHelp")}</span>
                        </div>
                    </div>
                    {specEntries.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium">{t("admin.productDialog.spec")}</span>
                            <dl className="grid grid-cols-[minmax(120px,1fr)_2fr] gap-x-4 gap-y-1.5 rounded-lg bg-background p-4 text-sm">
                                {specEntries.map(([name, value]) => (
                                    <div key={name} className="contents">
                                        <dt className="text-muted-foreground">{name}</dt>
                                        <dd className="break-words">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}
                </div>

                {productError !== null && (
                    <p role="alert" className="text-sm text-destructive">
                        {t(`admin.productDialog.errors.${productError}`)}
                    </p>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
                    <DialogClose asChild>
                        <Button variant="text">{t("common.cancel")}</Button>
                    </DialogClose>
                    <Button disabled={isSaving} onClick={() => void handleDone()}>
                        {t("common.done")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
