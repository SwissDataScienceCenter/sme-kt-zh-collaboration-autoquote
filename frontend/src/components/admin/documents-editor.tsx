import { useState } from "react";
import type { FunctionComponent } from "react";
import { DatabaseZapIcon, LoaderCircleIcon, Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DocumentIndexPanel } from "@/components/admin/document-index-panel";
import { ProductDialog } from "@/components/admin/product-dialog";
import { ProductsTable } from "@/components/admin/products-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { useDocuments } from "@/hooks/useDocuments";
import { NoticeTypes } from "@/lib/notice";
import { formatIsoDate } from "@/lib/dates";
import { getIndexingPercentage } from "@/lib/document-index";
import { createEmptyProductInput, toProductInput } from "@/lib/products";
import type { Product, ProductInput } from "@/services/product";

const NEW_PRODUCT_DIALOG_KEY = "new-product";

interface EditingProduct {
    productId: Product["id"] | null;
    productInput: ProductInput;
}

export const DocumentsEditor: FunctionComponent = () => {
    const { t } = useTranslation();
    const { indexStatus, products, isLoading, isIndexing, isSaving, notice, dismissNotice, startIndexing, deleteIndex } = useDocuments();
    const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    if (isLoading) {
        return <p className="text-muted-foreground">{t("common.loading")}</p>;
    }

    const handleSelectProduct = (productId: Product["id"]) => {
        const product = products.find((existingProduct) => existingProduct.id === productId);
        if (product !== undefined) {
            setEditingProduct({ productId, productInput: toProductInput(product) });
        }
    };

    const handleConfirmDelete = async () => {
        await deleteIndex();
        setIsDeleteDialogOpen(false);
    };

    const createTimestamp = indexStatus?.create_timestamp ?? null;
    const updateTimestamp = indexStatus?.update_timestamp ?? null;
    const meta =
        createTimestamp === null || updateTimestamp === null
            ? t("admin.documents.notIndexed")
            : t("admin.documents.indexDates", { createDate: formatIsoDate(createTimestamp), updateDate: formatIsoDate(updateTimestamp) });
    const isBusy = isIndexing || isSaving;
    const hasIndex = createTimestamp !== null || products.length > 0;
    const indexing = indexStatus?.indexing ?? null;
    const indexingPercentage = indexing === null ? 0 : getIndexingPercentage(indexing);

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-6">
            {notice !== null && <NoticeBanner message={notice.message} isError={notice.type === NoticeTypes.ERROR} dismissLabel={t("common.dismiss")} onDismiss={dismissNotice} />}
            {indexStatus !== null && (
                <>
                    <AdminPageHeader
                        sectionLabel={t("admin.documents.sectionLabel")}
                        title={t("admin.documents.title")}
                        description={t("admin.documents.description")}
                        meta={meta}
                        actions={
                            <>
                                <Button variant="text" disabled={isBusy || !hasIndex} onClick={() => setIsDeleteDialogOpen(true)}>
                                    <Trash2Icon />
                                    {t("admin.documents.deleteIndex")}
                                </Button>
                                <Button disabled={isBusy} onClick={() => void startIndexing()}>
                                    {isIndexing ? <LoaderCircleIcon aria-hidden="true" className="animate-spin" /> : <DatabaseZapIcon />}
                                    {isIndexing ? t("admin.documents.indexing", { percentage: indexingPercentage }) : t("admin.documents.index.run")}
                                </Button>
                            </>
                        }
                    />
                    <DocumentIndexPanel indexStatus={indexStatus} />
                    <ProductsTable
                        products={products}
                        onSelectProduct={handleSelectProduct}
                        onAddProduct={() => setEditingProduct({ productId: null, productInput: createEmptyProductInput() })}
                    />
                    {editingProduct !== null && (
                        <ProductDialog
                            key={editingProduct.productId ?? NEW_PRODUCT_DIALOG_KEY}
                            productId={editingProduct.productId}
                            initialProductInput={editingProduct.productInput}
                            onClose={() => setEditingProduct(null)}
                        />
                    )}
                    {isDeleteDialogOpen && (
                        <ConfirmDialog
                            title={t("admin.documents.deleteDialog.title")}
                            description={t("admin.documents.deleteDialog.description")}
                            confirmLabel={t("admin.documents.deleteDialog.confirm")}
                            cancelLabel={t("common.cancel")}
                            isDisabled={isSaving}
                            onConfirm={() => void handleConfirmDelete()}
                            onClose={() => setIsDeleteDialogOpen(false)}
                        />
                    )}
                </>
            )}
        </div>
    );
};
