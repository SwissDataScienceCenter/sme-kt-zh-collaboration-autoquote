import type { FunctionComponent } from "react";
import { PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatUnitPrice } from "@/lib/products";
import { cn } from "@/lib/utils";
import type { Product } from "@/services/product";

const COLUMNS_CLASS_NAME = "grid grid-cols-[minmax(200px,3fr)_80px_120px_96px] gap-x-4";

interface Props {
    products: Product[];
    onSelectProduct: (productId: Product["id"]) => void;
    onAddProduct: () => void;
}

export const ProductsTable: FunctionComponent<Props> = (props: Props) => {
    const { products, onSelectProduct, onAddProduct } = props;
    const { t } = useTranslation();

    return (
        <section aria-labelledby="products-title" className="flex flex-col gap-4 rounded-lg bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-baseline gap-2.5">
                    <h2 id="products-title" className="text-2xl leading-snug">
                        {t("admin.products.title")}
                    </h2>
                    <span className="text-sm text-muted-foreground">{t("admin.products.hint")}</span>
                </div>
                <Button variant="outline" size="sm" onClick={onAddProduct}>
                    <PlusIcon />
                    {t("admin.products.add")}
                </Button>
            </div>
            {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("admin.products.empty")}</p>
            ) : (
                <div className="overflow-x-auto">
                    <div className="min-w-[560px]">
                        <div aria-hidden="true" className={cn(COLUMNS_CLASS_NAME, "px-3 pb-2.5 text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase")}>
                            <span>{t("admin.products.columns.product")}</span>
                            <span>{t("admin.products.columns.unit")}</span>
                            <span>{t("admin.products.columns.unitPrice")}</span>
                            <span>{t("admin.products.columns.spec")}</span>
                        </div>
                        {products.map((product) => (
                            <button
                                key={product.id}
                                type="button"
                                onClick={() => onSelectProduct(product.id)}
                                className={cn(
                                    COLUMNS_CLASS_NAME,
                                    "w-full cursor-pointer items-center border-t border-border p-3 text-left hover:bg-background focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                                )}
                            >
                                <span className="flex min-w-0 flex-col">
                                    <code className="truncate text-[0.8rem] text-ink">{product.product_reference}</code>
                                    <span className="truncate text-sm text-muted-foreground">{product.description}</span>
                                </span>
                                <span className="text-sm">{product.unit === "" ? t("admin.products.emptyValue") : product.unit}</span>
                                <span className="text-sm">
                                    {product.unit_price === null ? <Badge variant="warning">{t("admin.products.noPrice")}</Badge> : formatUnitPrice(product.unit_price)}
                                </span>
                                <span className="text-sm text-muted-foreground">{t("admin.products.specCount", { count: Object.keys(product.spec).length })}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
};
