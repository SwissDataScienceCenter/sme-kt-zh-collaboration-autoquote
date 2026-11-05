import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { FunctionComponent, ReactNode } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { NoticeTypes } from "@/lib/notice";
import type { Notice } from "@/lib/notice";
import { ApiError } from "@/services/api";
import { IndexingStates, documentIndexService } from "@/services/document-index";
import type { DocumentIndexStatus, DocumentIndexing } from "@/services/document-index";
import { productService } from "@/services/product";
import type { Product, ProductInput } from "@/services/product";

const CONFLICT_STATUS = 409;
const FILE_NAMES_SEPARATOR = ", ";
const INDEXING_POLL_INTERVAL_MS = 10_000;

interface DocumentsContextValue {
    indexStatus: DocumentIndexStatus | null;
    products: Product[];
    isLoading: boolean;
    isIndexing: boolean;
    isSaving: boolean;
    notice: Notice | null;
    dismissNotice: () => void;
    startIndexing: () => Promise<void>;
    deleteIndex: () => Promise<boolean>;
    saveProduct: (productId: Product["id"] | null, productInput: ProductInput) => Promise<boolean>;
}

const DocumentsContext = createContext<DocumentsContextValue>({
    indexStatus: null,
    products: [],
    isLoading: true,
    isIndexing: false,
    isSaving: false,
    notice: null,
    dismissNotice: () => {},
    startIndexing: async () => {},
    deleteIndex: async () => false,
    saveProduct: async () => false,
});

const toIndexingNotice = (indexing: DocumentIndexing, t: TFunction): Notice => {
    if (indexing.state === IndexingStates.FAILED) {
        return { type: NoticeTypes.ERROR, message: t("admin.documents.notices.indexError") };
    }
    if (indexing.failed_file_names.length > 0) {
        return {
            type: NoticeTypes.ERROR,
            message: t("admin.documents.notices.indexFailed", {
                indexedCount: indexing.indexed_file_names.length,
                failedCount: indexing.failed_file_names.length,
                fileNames: indexing.failed_file_names.join(FILE_NAMES_SEPARATOR),
            }),
        };
    }
    if (indexing.indexed_file_names.length === 0) {
        return { type: NoticeTypes.SUCCESS, message: t("admin.documents.notices.nothingToIndex") };
    }
    return { type: NoticeTypes.SUCCESS, message: t("admin.documents.notices.indexed", { count: indexing.indexed_file_names.length }) };
};

interface Props {
    children: ReactNode;
}

export const DocumentsProvider: FunctionComponent<Props> = (props: Props) => {
    const { children } = props;
    const { t } = useTranslation();
    const [indexStatus, setIndexStatus] = useState<DocumentIndexStatus | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);

    const isIndexing = indexStatus?.indexing?.state === IndexingStates.RUNNING;

    const reload = useCallback(async () => {
        const [loadedIndexStatus, loadedProducts] = await Promise.all([documentIndexService.getDocumentIndexStatus(), productService.getProducts()]);
        setIndexStatus(loadedIndexStatus);
        setProducts(loadedProducts);
    }, []);

    useEffect(() => {
        const loadDocuments = async () => {
            try {
                await reload();
            } catch {
                setNotice({ type: NoticeTypes.ERROR, message: t("admin.documents.notices.loadError") });
            } finally {
                setIsLoading(false);
            }
        };
        void loadDocuments();
    }, [reload, t]);

    const dismissNotice = useCallback(() => setNotice(null), []);

    const refreshIndexing = useCallback(async () => {
        try {
            const loadedIndexStatus = await documentIndexService.getDocumentIndexStatus();
            setIndexStatus(loadedIndexStatus);
            const indexing = loadedIndexStatus.indexing;
            if (indexing === null || indexing.state === IndexingStates.RUNNING) {
                return;
            }
            setProducts(await productService.getProducts());
            setNotice(toIndexingNotice(indexing, t));
        } catch {
            setNotice({ type: NoticeTypes.ERROR, message: t("admin.documents.notices.loadError") });
        }
    }, [t]);

    // Also resumes polling when the page is opened while a run started earlier is still going.
    useEffect(() => {
        if (!isIndexing) {
            return;
        }
        const intervalId = window.setInterval(() => void refreshIndexing(), INDEXING_POLL_INTERVAL_MS);
        return () => window.clearInterval(intervalId);
    }, [isIndexing, refreshIndexing]);

    const startIndexing = useCallback(async () => {
        // Busy until the run is reported, so a second click cannot start another one.
        setIsSaving(true);
        try {
            const indexing = await documentIndexService.startDocumentIndexing();
            setIndexStatus((currentIndexStatus) => (currentIndexStatus === null ? null : { ...currentIndexStatus, indexing }));
        } catch {
            setNotice({ type: NoticeTypes.ERROR, message: t("admin.documents.notices.indexError") });
        } finally {
            setIsSaving(false);
        }
    }, [t]);

    const deleteIndex = useCallback(async (): Promise<boolean> => {
        setIsSaving(true);
        try {
            setIndexStatus(await documentIndexService.deleteDocumentIndex());
            setProducts([]);
            setNotice({ type: NoticeTypes.SUCCESS, message: t("admin.documents.notices.indexDeleted") });
            return true;
        } catch {
            setNotice({ type: NoticeTypes.ERROR, message: t("admin.documents.notices.deleteError") });
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [t]);

    const saveProduct = useCallback(
        async (productId: Product["id"] | null, productInput: ProductInput): Promise<boolean> => {
            setIsSaving(true);
            try {
                if (productId === null) {
                    await productService.createProduct(productInput);
                } else {
                    await productService.updateProduct(productId, productInput);
                }
                await reload();
                return true;
            } catch (error) {
                const isDuplicate = error instanceof ApiError && error.status === CONFLICT_STATUS;
                setNotice({ type: NoticeTypes.ERROR, message: isDuplicate ? t("admin.documents.notices.productDuplicate") : t("admin.documents.notices.saveError") });
                return false;
            } finally {
                setIsSaving(false);
            }
        },
        [reload, t],
    );

    const value = useMemo(
        () => ({ indexStatus, products, isLoading, isIndexing, isSaving, notice, dismissNotice, startIndexing, deleteIndex, saveProduct }),
        [indexStatus, products, isLoading, isIndexing, isSaving, notice, dismissNotice, startIndexing, deleteIndex, saveProduct],
    );

    return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>;
};

export const useDocuments = (): DocumentsContextValue => useContext(DocumentsContext);
