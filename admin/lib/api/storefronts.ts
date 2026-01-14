import { apiClient } from './client';
import type {
  Storefront,
  CreateStorefrontRequest,
  UpdateStorefrontRequest,
  StorefrontResolutionData,
  ApiResponse,
  ApiListResponse,
} from './types';

// Use the singleton apiClient to ensure tenant context is shared

export class StorefrontsService {
  /**
   * List all storefronts with optional pagination and filters
   */
  async getStorefronts(params?: {
    page?: number;
    limit?: number;
    vendorId?: string;
    isActive?: boolean;
  }): Promise<ApiListResponse<Storefront>> {
    return apiClient.get<ApiListResponse<Storefront>>('/storefronts', params);
  }

  /**
   * Get a single storefront by ID
   */
  async getStorefront(id: string): Promise<ApiResponse<Storefront>> {
    return apiClient.get<ApiResponse<Storefront>>(`/storefronts/${id}`);
  }

  /**
   * Create a new storefront
   */
  async createStorefront(data: CreateStorefrontRequest): Promise<ApiResponse<Storefront>> {
    return apiClient.post<ApiResponse<Storefront>>('/storefronts', data);
  }

  /**
   * Update an existing storefront
   */
  async updateStorefront(id: string, data: UpdateStorefrontRequest): Promise<ApiResponse<Storefront>> {
    return apiClient.put<ApiResponse<Storefront>>(`/storefronts/${id}`, data);
  }

  /**
   * Delete a storefront (soft delete)
   */
  async deleteStorefront(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/storefronts/${id}`);
  }

  /**
   * Get all storefronts for a specific vendor
   */
  async getVendorStorefronts(vendorId: string): Promise<ApiListResponse<Storefront>> {
    return apiClient.get<ApiListResponse<Storefront>>(`/vendors/${vendorId}/storefronts`);
  }

  /**
   * Check if a slug is available
   * Returns true if available, false if taken
   */
  async checkSlugAvailability(slug: string): Promise<boolean> {
    try {
      await apiClient.get<ApiResponse<StorefrontResolutionData>>(
        `/storefronts/resolve/by-slug/${encodeURIComponent(slug)}`
      );
      // If we get a response, the slug is taken
      return false;
    } catch {
      // If we get a 404 or error, the slug is available
      return true;
    }
  }

  /**
   * Resolve a storefront by slug (for tenant identification)
   */
  async resolveBySlug(slug: string): Promise<ApiResponse<StorefrontResolutionData>> {
    return apiClient.get<ApiResponse<StorefrontResolutionData>>(
      `/storefronts/resolve/by-slug/${encodeURIComponent(slug)}`
    );
  }

  /**
   * Resolve a storefront by custom domain
   */
  async resolveByDomain(domain: string): Promise<ApiResponse<StorefrontResolutionData>> {
    return apiClient.get<ApiResponse<StorefrontResolutionData>>(
      `/storefronts/resolve/by-domain/${encodeURIComponent(domain)}`
    );
  }
}

export const storefrontsService = new StorefrontsService();
