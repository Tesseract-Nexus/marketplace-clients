import { ENDPOINTS } from '../constants';

import { apiGet, apiPatch, apiPost } from './client';

import type {
  ApiListResponse,
  CreateOrderRequest,
  FulfillOrderRequest,
  OrderListParams,
  RefundOrderRequest,
  UpdateOrderRequest,
} from '@/types/api';
import type { Order, OrderStatus } from '@/types/entities';

export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refunded: number;
  total_revenue: number;
  average_order_value: number;
}

export const ordersApi = {
  /**
   * List orders with pagination and filters
   */
  list: async (params?: OrderListParams): Promise<ApiListResponse<Order>> => {
    const response = await apiGet<Order[]>(ENDPOINTS.ORDERS.LIST, { params });
    return response as unknown as ApiListResponse<Order>;
  },

  /**
   * Get a single order by ID
   */
  get: async (id: string): Promise<Order> => {
    const response = await apiGet<Order>(ENDPOINTS.ORDERS.GET(id));
    return response.data;
  },

  /**
   * Create a new order
   */
  create: async (data: CreateOrderRequest): Promise<Order> => {
    const response = await apiPost<Order>(ENDPOINTS.ORDERS.CREATE, data);
    return response.data;
  },

  /**
   * Update an order
   */
  update: async (id: string, data: UpdateOrderRequest): Promise<Order> => {
    const response = await apiPatch<Order>(ENDPOINTS.ORDERS.UPDATE(id), data);
    return response.data;
  },

  /**
   * Fulfill an order
   */
  fulfill: async (id: string, data: FulfillOrderRequest): Promise<Order> => {
    const response = await apiPost<Order>(ENDPOINTS.ORDERS.FULFILL(id), data);
    return response.data;
  },

  /**
   * Refund an order
   */
  refund: async (id: string, data: RefundOrderRequest): Promise<Order> => {
    const response = await apiPost<Order>(ENDPOINTS.ORDERS.REFUND(id), data);
    return response.data;
  },

  /**
   * Cancel an order
   */
  cancel: async (id: string, reason?: string): Promise<Order> => {
    const response = await apiPost<Order>(ENDPOINTS.ORDERS.CANCEL(id), { reason });
    return response.data;
  },

  /**
   * Get order statistics
   */
  stats: async (): Promise<OrderStats> => {
    const response = await apiGet<OrderStats>(ENDPOINTS.ORDERS.STATS);
    return response.data;
  },

  /**
   * Update order status
   */
  updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const response = await apiPatch<Order>(ENDPOINTS.ORDERS.UPDATE(id), { status });
    return response.data;
  },

  /**
   * Add note to order
   */
  addNote: async (id: string, note: string, internal = false): Promise<Order> => {
    const key = internal ? 'internal_notes' : 'notes';
    const response = await apiPatch<Order>(ENDPOINTS.ORDERS.UPDATE(id), { [key]: note });
    return response.data;
  },

  /**
   * Add tracking information
   */
  addTracking: async (
    id: string,
    trackingNumber: string,
    carrier?: string,
    trackingUrl?: string
  ): Promise<Order> => {
    const response = await apiPost<Order>(ENDPOINTS.ORDERS.FULFILL(id), {
      tracking_number: trackingNumber,
      carrier,
      tracking_url: trackingUrl,
      notify_customer: true,
    });
    return response.data;
  },

  /**
   * Get orders by customer
   */
  byCustomer: async (
    customerId: string,
    params?: Omit<OrderListParams, 'customer_id'>
  ): Promise<ApiListResponse<Order>> => {
    const response = await apiGet<Order[]>(ENDPOINTS.ORDERS.LIST, {
      params: { ...params, customer_id: customerId },
    });
    return response as unknown as ApiListResponse<Order>;
  },

  /**
   * Get recent orders
   */
  recent: async (limit = 10): Promise<Order[]> => {
    const response = await apiGet<Order[]>(ENDPOINTS.ORDERS.LIST, {
      params: { limit, sort_by: 'created_at', sort_order: 'desc' },
    });
    return (response as unknown as ApiListResponse<Order>).data;
  },

  /**
   * Get orders by status
   */
  byStatus: async (
    status: OrderStatus,
    params?: Omit<OrderListParams, 'status'>
  ): Promise<ApiListResponse<Order>> => {
    const response = await apiGet<Order[]>(ENDPOINTS.ORDERS.LIST, {
      params: { ...params, status },
    });
    return response as unknown as ApiListResponse<Order>;
  },

  /**
   * Resend order confirmation
   */
  resendConfirmation: async (id: string): Promise<void> => {
    await apiPost(`${ENDPOINTS.ORDERS.GET(id)}/resend-confirmation`);
  },

  /**
   * Print packing slip
   */
  getPackingSlip: async (id: string): Promise<string> => {
    const response = await apiGet<{ url: string }>(`${ENDPOINTS.ORDERS.GET(id)}/packing-slip`);
    return response.data.url;
  },

  /**
   * Print invoice
   */
  getInvoice: async (id: string): Promise<string> => {
    const response = await apiGet<{ url: string }>(`${ENDPOINTS.ORDERS.GET(id)}/invoice`);
    return response.data.url;
  },
};
