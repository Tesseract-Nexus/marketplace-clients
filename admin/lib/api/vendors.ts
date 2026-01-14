import { apiClient } from './client';
import type { Vendor, CreateVendorRequest, UpdateVendorRequest, ApiResponse, ApiListResponse } from './types';

// Use the singleton apiClient to ensure tenant context is shared

export class VendorsService {
  async getVendors(params?: { page?: number; limit?: number; status?: string }): Promise<ApiListResponse<Vendor>> {
    return apiClient.get<ApiListResponse<Vendor>>('/vendors', params);
  }

  async getVendor(id: string): Promise<ApiResponse<Vendor>> {
    return apiClient.get<ApiResponse<Vendor>>(`/vendors/${id}`);
  }

  async createVendor(data: CreateVendorRequest): Promise<ApiResponse<Vendor>> {
    return apiClient.post<ApiResponse<Vendor>>('/vendors', data);
  }

  async updateVendor(id: string, data: UpdateVendorRequest): Promise<ApiResponse<Vendor>> {
    return apiClient.put<ApiResponse<Vendor>>(`/vendors/${id}`, data);
  }

  async deleteVendor(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/vendors/${id}`);
  }
}

export const vendorsService = new VendorsService();
