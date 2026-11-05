import { ApiClient } from "@/services/api";

export interface ProductInput {
    product_reference: string;
    description: string;
    unit: string;
    unit_price: number | null;
    spec: Record<string, string>;
}

export interface Product extends ProductInput {
    id: string;
    create_timestamp: number;
    update_timestamp: number;
}

const PRODUCTS_PATH = "/products";

class ProductService extends ApiClient {
    getProducts(): Promise<Product[]> {
        return this.get<Product[]>(PRODUCTS_PATH);
    }

    createProduct(productInput: ProductInput): Promise<Product> {
        return this.post<Product>(PRODUCTS_PATH, productInput);
    }

    updateProduct(productId: Product["id"], productInput: ProductInput): Promise<Product> {
        return this.put<Product>(`${PRODUCTS_PATH}/${productId}`, productInput);
    }
}

export const productService = new ProductService();
