import type { Product, ProductInput } from "@/services/product";

const PRICE_LOCALE = "de-CH";
const PRICE_FRACTION_DIGITS = 2;

export const ProductErrors = {
    REFERENCE_REQUIRED: "referenceRequired",
    REFERENCE_DUPLICATE: "referenceDuplicate",
    PRICE_INVALID: "priceInvalid",
} as const;

export type ProductError = (typeof ProductErrors)[keyof typeof ProductErrors];

const priceFormatter = new Intl.NumberFormat(PRICE_LOCALE, { minimumFractionDigits: PRICE_FRACTION_DIGITS, maximumFractionDigits: PRICE_FRACTION_DIGITS });

export const createEmptyProductInput = (): ProductInput => ({
    product_reference: "",
    description: "",
    unit: "",
    unit_price: null,
    spec: {},
});

export const toProductInput = (product: Product): ProductInput => ({
    product_reference: product.product_reference,
    description: product.description,
    unit: product.unit,
    unit_price: product.unit_price,
    spec: product.spec,
});

export const formatUnitPrice = (unitPrice: number): string => priceFormatter.format(unitPrice);

export const formatUnitPriceInput = (unitPrice: number | null): string => (unitPrice === null ? "" : String(unitPrice));

// Mirrors the backend matching, so a duplicate is caught before saving.
const normalizeReference = (productReference: string): string => productReference.trim().toLowerCase();

const parseUnitPrice = (text: string): number | null => {
    const unitPrice = Number(text.trim());
    return Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : null;
};

export const normalizeProductInput = (productInput: ProductInput, unitPriceText: string): ProductInput => ({
    ...productInput,
    product_reference: productInput.product_reference.trim(),
    description: productInput.description.trim(),
    unit: productInput.unit.trim(),
    unit_price: unitPriceText.trim() === "" ? null : parseUnitPrice(unitPriceText),
});

export const validateProductInput = (productInput: ProductInput, unitPriceText: string, otherReferences: Product["product_reference"][]): ProductError | null => {
    if (productInput.product_reference === "") {
        return ProductErrors.REFERENCE_REQUIRED;
    }
    const normalizedReference = normalizeReference(productInput.product_reference);
    if (otherReferences.some((reference) => normalizeReference(reference) === normalizedReference)) {
        return ProductErrors.REFERENCE_DUPLICATE;
    }
    const isPriceInvalid = unitPriceText.trim() !== "" && parseUnitPrice(unitPriceText) === null;
    if (isPriceInvalid) {
        return ProductErrors.PRICE_INVALID;
    }
    return null;
};
