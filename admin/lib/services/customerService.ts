import { customersService } from '../api/customers';
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  ApiResponse,
  ApiListResponse,
} from '../api/types';

/**
 * Customer service - uses real API
 */
export const customerService = {
  getCustomers: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    customerType?: string;
    search?: string;
  }): Promise<ApiListResponse<Customer>> => {
    return customersService.getCustomers(params);
  },

  getCustomer: async (id: string): Promise<ApiResponse<Customer>> => {
    return customersService.getCustomer(id);
  },

  createCustomer: async (data: CreateCustomerRequest): Promise<ApiResponse<Customer>> => {
    return customersService.createCustomer(data);
  },

  updateCustomer: async (id: string, data: UpdateCustomerRequest): Promise<ApiResponse<Customer>> => {
    return customersService.updateCustomer(id, data);
  },

  deleteCustomer: async (id: string): Promise<ApiResponse<void>> => {
    return customersService.deleteCustomer(id);
  },

  lockCustomer: async (id: string, reason: string): Promise<ApiResponse<Customer>> => {
    return customersService.lockCustomer(id, reason);
  },

  unlockCustomer: async (id: string, reason: string): Promise<ApiResponse<Customer>> => {
    return customersService.unlockCustomer(id, reason);
  },
};
