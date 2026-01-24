import { apiClient } from './client';
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ApiResponse,
  ApiListResponse,
  ProductsAnalytics,
  ProductStatus,
} from './types';
import type {
  CascadeDeleteOptions,
  CascadeValidationResult,
  CascadeDeleteResult,
} from '../types/cascade-delete';

/**
 * Request to update product status
 */
export interface UpdateProductStatusRequest {
  status: ProductStatus;
  notes?: string;
}

/**
 * Request to bulk update product status
 */
export interface BulkUpdateProductStatusRequest {
  productIds: string[];
  status: ProductStatus;
  notes?: string;
}

/**
 * Response for bulk status update
 */
export interface BulkStatusUpdateResponse {
  success: boolean;
  updatedCount: number;
  failedIds?: string[];
  message?: string;
}

// Use the singleton apiClient to ensure tenant context is shared

export class ProductsService {
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    vendorId?: string;
    status?: string;
    inventoryStatus?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
  }): Promise<ApiListResponse<Product>> {
    return apiClient.get<ApiListResponse<Product>>('/products', params);
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return apiClient.get<ApiResponse<Product>>(`/products/${id}`);
  }

  async createProduct(
    data: CreateProductRequest
  ): Promise<ApiResponse<Product>> {
    return apiClient.post<ApiResponse<Product>>('/products', data);
  }

  async updateProduct(
    id: string,
    data: UpdateProductRequest
  ): Promise<ApiResponse<Product>> {
    return apiClient.put<ApiResponse<Product>>(`/products/${id}`, data);
  }

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/products/${id}`);
  }

  async bulkDeleteProducts(ids: string[]): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>('/products/bulk', { ids });
  }

  // ============================================================================
  // Product Status Operations
  // ============================================================================

  /**
   * Update status for a single product
   * Used for approve, reject, publish, archive, etc.
   */
  async updateProductStatus(
    id: string,
    status: ProductStatus,
    notes?: string
  ): Promise<ApiResponse<Product>> {
    return apiClient.put<ApiResponse<Product>>(`/products/${id}/status`, {
      status,
      notes,
    });
  }

  /**
   * Bulk update status for multiple products
   * Used for bulk approve, reject, publish, archive operations
   */
  async bulkUpdateProductStatus(
    productIds: string[],
    status: ProductStatus,
    notes?: string
  ): Promise<ApiResponse<BulkStatusUpdateResponse>> {
    return apiClient.post<ApiResponse<BulkStatusUpdateResponse>>(
      '/products/bulk/status',
      {
        productIds,
        status,
        notes,
      }
    );
  }

  async getProductsAnalytics(): Promise<ApiResponse<ProductsAnalytics>> {
    return apiClient.get<ApiResponse<ProductsAnalytics>>('/products/analytics');
  }

  /**
   * Submit a draft product for approval
   * Creates an approval request for the product to be published
   */
  async submitForApproval(
    id: string
  ): Promise<ApiResponse<{ approvalId: string; message: string }>> {
    return apiClient.post<ApiResponse<{ approvalId: string; message: string }>>(
      `/products/${id}/submit-for-approval`,
      {}
    );
  }

  /**
   * Bulk submit draft products for approval
   * Creates approval requests for multiple products
   */
  async bulkSubmitForApproval(
    productIds: string[]
  ): Promise<ApiResponse<{ submitted: number; failed: number; approvalIds: string[] }>> {
    // Submit each product individually and aggregate results
    const results = await Promise.allSettled(
      productIds.map(id => this.submitForApproval(id))
    );

    const approvalIds: string[] = [];
    let submitted = 0;
    let failed = 0;

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        submitted++;
        if (result.value.data?.approvalId) {
          approvalIds.push(result.value.data.approvalId);
        }
      } else {
        failed++;
      }
    });

    return {
      success: submitted > 0,
      data: { submitted, failed, approvalIds },
      message: `Submitted ${submitted} product(s) for approval${failed > 0 ? `, ${failed} failed` : ''}`,
    };
  }

  // ============================================================================
  // Cascade Delete Operations
  // ============================================================================

  /**
   * Validate cascade delete for a single product
   * Returns validation result with blocked entities and affected summary
   */
  async validateCascadeDelete(
    id: string,
    options: CascadeDeleteOptions
  ): Promise<ApiResponse<CascadeValidationResult>> {
    return apiClient.post<ApiResponse<CascadeValidationResult>>(
      `/products/${id}/cascade/validate`,
      { options }
    );
  }

  /**
   * Delete a product with cascade options
   * Optionally deletes variants, category, warehouse, and supplier
   */
  async deleteWithCascade(
    id: string,
    options: CascadeDeleteOptions
  ): Promise<ApiResponse<CascadeDeleteResult>> {
    const queryParams = new URLSearchParams({
      deleteVariants: options.deleteVariants.toString(),
      deleteCategory: options.deleteCategory.toString(),
      deleteWarehouse: options.deleteWarehouse.toString(),
      deleteSupplier: options.deleteSupplier.toString(),
    });
    return apiClient.delete<ApiResponse<CascadeDeleteResult>>(
      `/products/${id}?${queryParams.toString()}`
    );
  }

  /**
   * Validate cascade delete for multiple products
   * Returns validation result with blocked entities and affected summary
   */
  async validateBulkCascadeDelete(
    ids: string[],
    options: CascadeDeleteOptions
  ): Promise<ApiResponse<CascadeValidationResult>> {
    return apiClient.post<ApiResponse<CascadeValidationResult>>(
      '/products/bulk/cascade/validate',
      { ids, options }
    );
  }

  /**
   * Bulk delete products with cascade options
   * Optionally deletes variants, categories, warehouses, and suppliers
   */
  async bulkDeleteWithCascade(
    ids: string[],
    options: CascadeDeleteOptions
  ): Promise<ApiResponse<CascadeDeleteResult>> {
    return apiClient.delete<ApiResponse<CascadeDeleteResult>>(
      '/products/bulk',
      { ids, options }
    );
  }
}

export const productsService = new ProductsService();
