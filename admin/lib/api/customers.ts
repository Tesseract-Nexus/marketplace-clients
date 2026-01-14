import { apiClient } from './client';
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest, ApiResponse, ApiListResponse } from './types';

// Use the singleton apiClient to ensure tenant context is shared

export class CustomersService {
  async getCustomers(params?: { page?: number; limit?: number; status?: string; customerType?: string }): Promise<ApiListResponse<Customer>> {
    return apiClient.get<ApiListResponse<Customer>>('/customers', params);
  }

  async getCustomer(id: string): Promise<ApiResponse<Customer>> {
    return apiClient.get<ApiResponse<Customer>>(`/customers/${id}`);
  }

  async createCustomer(data: CreateCustomerRequest): Promise<ApiResponse<Customer>> {
    return apiClient.post<ApiResponse<Customer>>('/customers', data);
  }

  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<ApiResponse<Customer>> {
    return apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, data);
  }

  async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/customers/${id}`);
  }
}

export const customersService = new CustomersService();
