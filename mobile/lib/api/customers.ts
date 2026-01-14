import { ENDPOINTS } from '../constants';

import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './client';

import type {
  ApiListResponse,
  CreateCustomerRequest,
  CustomerListParams,
  UpdateCustomerRequest,
} from '@/types/api';
import type { Customer, Order, Address } from '@/types/entities';

export interface CustomerStats {
  total: number;
  active: number;
  new_this_month: number;
  returning: number;
  average_lifetime_value: number;
  average_order_value: number;
}

export const customersApi = {
  /**
   * List customers with pagination and filters
   */
  list: async (params?: CustomerListParams): Promise<ApiListResponse<Customer>> => {
    const response = await apiGet<Customer[]>(ENDPOINTS.CUSTOMERS.LIST, { params });
    return response as unknown as ApiListResponse<Customer>;
  },

  /**
   * Get a single customer by ID
   */
  get: async (id: string): Promise<Customer> => {
    const response = await apiGet<Customer>(ENDPOINTS.CUSTOMERS.GET(id));
    return response.data;
  },

  /**
   * Create a new customer
   */
  create: async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await apiPost<Customer>(ENDPOINTS.CUSTOMERS.CREATE, data);
    return response.data;
  },

  /**
   * Update a customer
   */
  update: async (id: string, data: Partial<UpdateCustomerRequest>): Promise<Customer> => {
    const response = await apiPut<Customer>(ENDPOINTS.CUSTOMERS.UPDATE(id), data);
    return response.data;
  },

  /**
   * Partially update a customer
   */
  patch: async (id: string, data: Partial<UpdateCustomerRequest>): Promise<Customer> => {
    const response = await apiPatch<Customer>(ENDPOINTS.CUSTOMERS.UPDATE(id), data);
    return response.data;
  },

  /**
   * Delete a customer
   */
  delete: async (id: string): Promise<void> => {
    await apiDelete(ENDPOINTS.CUSTOMERS.DELETE(id));
  },

  /**
   * Get customer's orders
   */
  getOrders: async (id: string): Promise<Order[]> => {
    const response = await apiGet<Order[]>(ENDPOINTS.CUSTOMERS.ORDERS(id));
    return response.data;
  },

  /**
   * Get customer statistics
   */
  stats: async (): Promise<CustomerStats> => {
    const response = await apiGet<CustomerStats>(ENDPOINTS.CUSTOMERS.STATS);
    return response.data;
  },

  /**
   * Search customers
   */
  search: async (query: string, params?: Omit<CustomerListParams, 'search'>): Promise<ApiListResponse<Customer>> => {
    const response = await apiGet<Customer[]>(ENDPOINTS.CUSTOMERS.LIST, {
      params: { ...params, search: query },
    });
    return response as unknown as ApiListResponse<Customer>;
  },

  /**
   * Add address to customer
   */
  addAddress: async (id: string, address: Address): Promise<Customer> => {
    const response = await apiPost<Customer>(`${ENDPOINTS.CUSTOMERS.GET(id)}/addresses`, address);
    return response.data;
  },

  /**
   * Update customer address
   */
  updateAddress: async (id: string, addressId: string, address: Partial<Address>): Promise<Customer> => {
    const response = await apiPatch<Customer>(
      `${ENDPOINTS.CUSTOMERS.GET(id)}/addresses/${addressId}`,
      address
    );
    return response.data;
  },

  /**
   * Delete customer address
   */
  deleteAddress: async (id: string, addressId: string): Promise<void> => {
    await apiDelete(`${ENDPOINTS.CUSTOMERS.GET(id)}/addresses/${addressId}`);
  },

  /**
   * Set default address
   */
  setDefaultAddress: async (id: string, addressId: string): Promise<Customer> => {
    const response = await apiPost<Customer>(
      `${ENDPOINTS.CUSTOMERS.GET(id)}/addresses/${addressId}/default`
    );
    return response.data;
  },

  /**
   * Update customer tags
   */
  updateTags: async (id: string, tags: string[]): Promise<Customer> => {
    const response = await apiPatch<Customer>(ENDPOINTS.CUSTOMERS.UPDATE(id), { tags });
    return response.data;
  },

  /**
   * Update customer notes
   */
  updateNotes: async (id: string, notes: string): Promise<Customer> => {
    const response = await apiPatch<Customer>(ENDPOINTS.CUSTOMERS.UPDATE(id), { notes });
    return response.data;
  },

  /**
   * Get top customers
   */
  top: async (limit = 10): Promise<Customer[]> => {
    const response = await apiGet<Customer[]>(ENDPOINTS.CUSTOMERS.LIST, {
      params: { limit, sort_by: 'total_spent', sort_order: 'desc' },
    });
    return (response as unknown as ApiListResponse<Customer>).data;
  },

  /**
   * Get recent customers
   */
  recent: async (limit = 10): Promise<Customer[]> => {
    const response = await apiGet<Customer[]>(ENDPOINTS.CUSTOMERS.LIST, {
      params: { limit, sort_by: 'created_at', sort_order: 'desc' },
    });
    return (response as unknown as ApiListResponse<Customer>).data;
  },

  /**
   * Block a customer
   */
  block: async (id: string): Promise<Customer> => {
    const response = await apiPatch<Customer>(ENDPOINTS.CUSTOMERS.UPDATE(id), { status: 'blocked' });
    return response.data;
  },

  /**
   * Unblock a customer
   */
  unblock: async (id: string): Promise<Customer> => {
    const response = await apiPatch<Customer>(ENDPOINTS.CUSTOMERS.UPDATE(id), { status: 'active' });
    return response.data;
  },
};
