import { apiClient } from './client';
import {
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  ApiResponse,
  ApiListResponse,
  OrdersAnalytics,
  ValidTransitionsResponse,
} from './types';

export class OrdersService {
  /**
   * Get all orders with pagination
   */
  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
    customerId?: string;
  }): Promise<ApiListResponse<Order>> {
    return apiClient.get<ApiListResponse<Order>>('/orders', params);
  }

  /**
   * Get a single order by ID
   */
  async getOrder(id: string): Promise<ApiResponse<Order>> {
    return apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
  }

  /**
   * Create a new order
   */
  async createOrder(data: CreateOrderRequest): Promise<ApiResponse<Order>> {
    return apiClient.post<ApiResponse<Order>>('/orders', data);
  }

  /**
   * Update an existing order
   */
  async updateOrder(
    id: string,
    data: UpdateOrderRequest
  ): Promise<ApiResponse<Order>> {
    return apiClient.put<ApiResponse<Order>>(`/orders/${id}`, data);
  }

  /**
   * Delete an order
   */
  async deleteOrder(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<ApiResponse<{ message: string }>>(`/orders/${id}`);
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    id: string,
    status: string
  ): Promise<ApiResponse<Order>> {
    return apiClient.put<ApiResponse<Order>>(`/orders/${id}/status`, {
      status,
    });
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    id: string,
    paymentStatus: string
  ): Promise<ApiResponse<Order>> {
    return apiClient.put<ApiResponse<Order>>(`/orders/${id}/payment-status`, {
      paymentStatus,
    });
  }

  /**
   * Update fulfillment status
   */
  async updateFulfillmentStatus(
    id: string,
    fulfillmentStatus: string
  ): Promise<ApiResponse<Order>> {
    return apiClient.put<ApiResponse<Order>>(
      `/orders/${id}/fulfillment-status`,
      {
        fulfillmentStatus,
      }
    );
  }

  /**
   * Get valid status transitions for an order
   */
  async getValidTransitions(
    id: string
  ): Promise<ApiResponse<ValidTransitionsResponse>> {
    return apiClient.get<ApiResponse<ValidTransitionsResponse>>(
      `/orders/${id}/valid-transitions`
    );
  }

  /**
   * Add tracking number
   */
  async addTrackingNumber(
    id: string,
    trackingNumber: string,
    shippingMethod?: string
  ): Promise<ApiResponse<Order>> {
    return apiClient.put<ApiResponse<Order>>(`/orders/${id}/tracking`, {
      trackingNumber,
      shippingMethod,
    });
  }

  /**
   * Get order analytics
   */
  async getOrderAnalytics(): Promise<ApiResponse<OrdersAnalytics>> {
    return apiClient.get<ApiResponse<OrdersAnalytics>>('/orders/analytics');
  }

  /**
   * Bulk update orders
   */
  async bulkUpdateOrders(
    ids: string[],
    updates: Partial<UpdateOrderRequest>
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch('/api/orders/bulk', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids, updates }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: { message: response.statusText },
      }));
      throw new Error(error.error?.message || 'Bulk update failed');
    }

    return response.json();
  }
}

export const ordersService = new OrdersService();
