import { apiClient } from './client';
import {
  Category,
  CategoryImage,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ApiResponse,
  ApiListResponse,
  MediaLimits,
} from './types';

/**
 * Response type for category image operations
 */
export interface CategoryImageResponse {
  success: boolean;
  image?: {
    id: string;
    url: string;
    path: string;
    fileName: string;
    contentType: string;
    size: number;
    imageType: string;
    position: number;
    uploadedAt: string;
  };
  message?: string;
}

/**
 * Response type for listing category images
 */
export interface ListCategoryImagesResponse {
  success: boolean;
  images: Array<{
    id: string;
    name: string;
    url: string;
    path: string;
    position: number;
    metadata: Record<string, string>;
  }>;
  count: number;
  maxAllowed: number;
}

export class CategoriesService {
  /**
   * Get all categories with pagination
   */
  async getCategories(params?: {
    page?: number;
    limit?: number;
    status?: string;
    isActive?: boolean;
  }): Promise<ApiListResponse<Category>> {
    return apiClient.get<ApiListResponse<Category>>('/categories', params);
  }

  /**
   * Get category tree (hierarchical structure)
   */
  async getCategoryTree(): Promise<ApiResponse<Category[]>> {
    return apiClient.get<ApiResponse<Category[]>>('/categories/tree');
  }

  /**
   * Get a single category by ID
   */
  async getCategory(id: string): Promise<ApiResponse<Category>> {
    return apiClient.get<ApiResponse<Category>>(`/categories/${id}`);
  }

  /**
   * Create a new category
   */
  async createCategory(
    data: CreateCategoryRequest
  ): Promise<ApiResponse<Category>> {
    return apiClient.post<ApiResponse<Category>>('/categories', data);
  }

  /**
   * Update an existing category
   */
  async updateCategory(
    id: string,
    data: UpdateCategoryRequest
  ): Promise<ApiResponse<Category>> {
    return apiClient.put<ApiResponse<Category>>(`/categories/${id}`, data);
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<ApiResponse<{ message: string }>>(
      `/categories/${id}`
    );
  }

  /**
   * Update category status
   */
  async updateCategoryStatus(
    id: string,
    status: string
  ): Promise<ApiResponse<Category>> {
    return apiClient.put<ApiResponse<Category>>(`/categories/${id}/status`, {
      status,
    });
  }

  /**
   * Bulk delete categories
   */
  async bulkDeleteCategories(
    ids: string[]
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch('/api/categories/bulk', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: { message: response.statusText },
      }));
      throw new Error(error.error?.message || 'Bulk delete failed');
    }

    return response.json();
  }

  /**
   * Bulk update category isActive status (activate/deactivate)
   */
  async bulkUpdateCategoryActiveStatus(
    ids: string[],
    isActive: boolean
  ): Promise<ApiResponse<{ updatedCount: number; message: string }>> {
    return apiClient.patch<ApiResponse<{ updatedCount: number; message: string }>>(
      '/categories/bulk/status',
      { ids, isActive }
    );
  }

  /**
   * Bulk update category approval status
   * Used for bulk approve, reject, draft, pending operations
   */
  async bulkUpdateCategoryStatus(
    ids: string[],
    status: string
  ): Promise<ApiResponse<{ success: boolean; updatedCount: number; failedIds?: string[]; message: string }>> {
    return apiClient.put<ApiResponse<{ success: boolean; updatedCount: number; failedIds?: string[]; message: string }>>(
      '/categories/bulk/status',
      { ids, status }
    );
  }

  /**
   * Reorder categories
   */
  async reorderCategories(
    categoryId: string,
    position: number,
    parentId?: string | null
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<ApiResponse<{ message: string }>>(
      '/categories/reorder',
      {
        categoryId,
        position,
        parentId,
      }
    );
  }

  /**
   * Get category analytics
   */
  async getCategoryAnalytics(): Promise<
    ApiResponse<{ total: number; active: number }>
  > {
    return apiClient.get<ApiResponse<{ total: number; active: number }>>(
      '/categories/analytics'
    );
  }

  /**
   * Upload a category image
   * Supports icon, banner, and gallery image types
   * Maximum 3 images per category
   */
  async uploadCategoryImage(
    categoryId: string,
    file: File,
    options?: {
      imageType?: 'icon' | 'banner' | 'gallery';
      position?: number;
    }
  ): Promise<CategoryImageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoryId', categoryId);
    formData.append('imageType', options?.imageType || 'gallery');
    formData.append('position', String(options?.position || 0));

    const response = await fetch('/api/categories/images', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || 'Failed to upload category image');
    }

    return response.json();
  }

  /**
   * List all images for a category
   */
  async listCategoryImages(categoryId: string): Promise<ListCategoryImagesResponse> {
    const response = await fetch(`/api/categories/images?categoryId=${encodeURIComponent(categoryId)}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || 'Failed to list category images');
    }

    return response.json();
  }

  /**
   * Delete a category image by its storage path
   */
  async deleteCategoryImage(path: string): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch(`/api/categories/images?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || 'Failed to delete category image');
    }

    return response.json();
  }

  /**
   * Get the maximum number of images allowed per category
   */
  getMaxCategoryImages(): number {
    return MediaLimits.maxCategoryImages;
  }
}

export const categoriesService = new CategoriesService();
