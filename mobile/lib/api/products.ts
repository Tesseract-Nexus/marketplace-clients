import { ENDPOINTS } from '../constants';

import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './client';

import type {
  ApiListResponse,
  CreateProductRequest,
  ProductListParams,
  UpdateProductRequest,
  BatchUpdateInventoryRequest,
} from '@/types/api';
import type { Product } from '@/types/entities';

export interface ProductStats {
  total: number;
  active: number;
  draft: number;
  archived: number;
  out_of_stock: number;
  low_stock: number;
}

export const productsApi = {
  /**
   * List products with pagination and filters
   */
  list: async (params?: ProductListParams): Promise<ApiListResponse<Product>> => {
    const response = await apiGet<Product[]>(ENDPOINTS.PRODUCTS.LIST, { params });
    return response as unknown as ApiListResponse<Product>;
  },

  /**
   * Get a single product by ID
   */
  get: async (id: string): Promise<Product> => {
    const response = await apiGet<Product>(ENDPOINTS.PRODUCTS.GET(id));
    return response.data;
  },

  /**
   * Create a new product
   */
  create: async (data: CreateProductRequest): Promise<Product> => {
    const response = await apiPost<Product>(ENDPOINTS.PRODUCTS.CREATE, data);
    return response.data;
  },

  /**
   * Update a product
   */
  update: async (id: string, data: Partial<UpdateProductRequest>): Promise<Product> => {
    const response = await apiPut<Product>(ENDPOINTS.PRODUCTS.UPDATE(id), data);
    return response.data;
  },

  /**
   * Partially update a product
   */
  patch: async (id: string, data: Partial<UpdateProductRequest>): Promise<Product> => {
    const response = await apiPatch<Product>(ENDPOINTS.PRODUCTS.UPDATE(id), data);
    return response.data;
  },

  /**
   * Delete a product
   */
  delete: async (id: string): Promise<void> => {
    await apiDelete(ENDPOINTS.PRODUCTS.DELETE(id));
  },

  /**
   * Get product statistics
   */
  stats: async (): Promise<ProductStats> => {
    const response = await apiGet<ProductStats>(ENDPOINTS.PRODUCTS.STATS);
    return response.data;
  },

  /**
   * Bulk update products
   */
  bulkUpdate: async (
    products: Array<{ id: string; data: Partial<UpdateProductRequest> }>
  ): Promise<Product[]> => {
    const response = await apiPost<Product[]>(ENDPOINTS.PRODUCTS.BULK_UPDATE, { products });
    return response.data;
  },

  /**
   * Batch update inventory
   */
  batchUpdateInventory: async (data: BatchUpdateInventoryRequest): Promise<void> => {
    await apiPost(ENDPOINTS.PRODUCTS.INVENTORY, data);
  },

  /**
   * Search products
   */
  search: async (query: string, params?: Omit<ProductListParams, 'search'>): Promise<ApiListResponse<Product>> => {
    const response = await apiGet<Product[]>(ENDPOINTS.PRODUCTS.LIST, {
      params: { ...params, search: query },
    });
    return response as unknown as ApiListResponse<Product>;
  },

  /**
   * Get featured products
   */
  featured: async (limit = 10): Promise<Product[]> => {
    const response = await apiGet<Product[]>(ENDPOINTS.PRODUCTS.LIST, {
      params: { is_featured: true, limit, status: 'active' },
    });
    return (response as unknown as ApiListResponse<Product>).data;
  },

  /**
   * Get products by category
   */
  byCategory: async (categoryId: string, params?: Omit<ProductListParams, 'category_id'>): Promise<ApiListResponse<Product>> => {
    const response = await apiGet<Product[]>(ENDPOINTS.PRODUCTS.LIST, {
      params: { ...params, category_id: categoryId },
    });
    return response as unknown as ApiListResponse<Product>;
  },

  /**
   * Duplicate a product
   */
  duplicate: async (id: string): Promise<Product> => {
    const response = await apiPost<Product>(`${ENDPOINTS.PRODUCTS.GET(id)}/duplicate`);
    return response.data;
  },

  /**
   * Update product status
   */
  updateStatus: async (id: string, status: 'active' | 'draft' | 'archived'): Promise<Product> => {
    const response = await apiPatch<Product>(ENDPOINTS.PRODUCTS.UPDATE(id), { status });
    return response.data;
  },

  /**
   * Update product inventory
   */
  updateInventory: async (id: string, quantity: number, variantId?: string): Promise<Product> => {
    const response = await apiPatch<Product>(ENDPOINTS.PRODUCTS.UPDATE(id), {
      inventory_quantity: quantity,
      variant_id: variantId,
    });
    return response.data;
  },
};
