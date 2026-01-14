import { apiClient } from './client';
import type { Staff, CreateStaffRequest, UpdateStaffRequest, ApiResponse, ApiListResponse } from './types';

// Use the singleton apiClient to ensure tenant context is shared

export class StaffService {
  async getStaff(params?: { page?: number; limit?: number; role?: string }): Promise<ApiListResponse<Staff>> {
    return apiClient.get<ApiListResponse<Staff>>('/staff', params);
  }

  async getStaffMember(id: string): Promise<ApiResponse<Staff>> {
    return apiClient.get<ApiResponse<Staff>>(`/staff/${id}`);
  }

  async createStaff(data: CreateStaffRequest): Promise<ApiResponse<Staff>> {
    return apiClient.post<ApiResponse<Staff>>('/staff', data);
  }

  async updateStaff(id: string, data: UpdateStaffRequest): Promise<ApiResponse<Staff>> {
    return apiClient.put<ApiResponse<Staff>>(`/staff/${id}`, data);
  }

  async deleteStaff(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/staff/${id}`);
  }
}

export const staffService = new StaffService();
