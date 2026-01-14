import { apiClient } from './client';
import {
  Coupon,
  CreateCouponRequest,
  UpdateCouponRequest,
  ApiResponse,
  ApiListResponse,
  CouponsAnalytics,
} from './types';

export class CouponsService {
  /**
   * Get all coupons with pagination
   */
  async getCoupons(params?: {
    page?: number;
    limit?: number;
    status?: string;
    discountType?: string;
  }): Promise<ApiListResponse<Coupon>> {
    return apiClient.get<ApiListResponse<Coupon>>('/coupons', params);
  }

  /**
   * Get a single coupon by ID
   */
  async getCoupon(id: string): Promise<ApiResponse<Coupon>> {
    return apiClient.get<ApiResponse<Coupon>>(`/coupons/${id}`);
  }

  /**
   * Get coupon by code
   */
  async getCouponByCode(code: string): Promise<ApiResponse<Coupon>> {
    return apiClient.get<ApiResponse<Coupon>>(`/coupons/code/${code}`);
  }

  /**
   * Create a new coupon
   */
  async createCoupon(data: CreateCouponRequest): Promise<ApiResponse<Coupon>> {
    return apiClient.post<ApiResponse<Coupon>>('/coupons', data);
  }

  /**
   * Update an existing coupon
   */
  async updateCoupon(
    id: string,
    data: UpdateCouponRequest
  ): Promise<ApiResponse<Coupon>> {
    return apiClient.put<ApiResponse<Coupon>>(`/coupons/${id}`, data);
  }

  /**
   * Delete a coupon
   */
  async deleteCoupon(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<ApiResponse<{ message: string }>>(
      `/coupons/${id}`
    );
  }

  /**
   * Update coupon status
   */
  async updateCouponStatus(
    id: string,
    status: string
  ): Promise<ApiResponse<Coupon>> {
    return apiClient.put<ApiResponse<Coupon>>(`/coupons/${id}/status`, {
      status,
    });
  }

  /**
   * Validate coupon
   */
  async validateCoupon(
    code: string,
    orderTotal: string,
    customerId?: string
  ): Promise<ApiResponse<{ valid: boolean; discount: string; message: string }>> {
    return apiClient.post<ApiResponse<{ valid: boolean; discount: string; message: string }>>(
      '/coupons/validate',
      {
        code,
        orderTotal,
        customerId,
      }
    );
  }

  /**
   * Get coupon usage history
   */
  async getCouponUsageHistory(
    id: string
  ): Promise<ApiListResponse<any>> {
    return apiClient.get<ApiListResponse<any>>(`/coupons/${id}/usage`);
  }

  /**
   * Get coupon analytics
   */
  async getCouponAnalytics(): Promise<ApiResponse<CouponsAnalytics>> {
    return apiClient.get<ApiResponse<CouponsAnalytics>>('/coupons/analytics');
  }

  /**
   * Bulk delete coupons
   */
  async bulkDeleteCoupons(
    ids: string[]
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch('/api/coupons/bulk', {
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
   * Duplicate coupon
   */
  async duplicateCoupon(id: string): Promise<ApiResponse<Coupon>> {
    return apiClient.post<ApiResponse<Coupon>>(`/coupons/${id}/duplicate`, {});
  }
}

export const couponsService = new CouponsService();
