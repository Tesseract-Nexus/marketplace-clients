import { ordersService } from '../api/orders';
import {
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  ApiResponse,
  ApiListResponse,
  OrdersAnalytics,
  ValidTransitionsResponse,
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
} from '../api/types';
import { mockOrders } from '../data/mockOrders';

const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ||
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === '1';

/**
 * Mock service implementation
 */
class MockOrderService {
  private orders: Order[] = [...mockOrders];
  private nextId = 6;

  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
    customerId?: string;
  }): Promise<ApiListResponse<Order>> {
    let filtered = [...this.orders];

    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter((order) => order.status === params.status);
    }

    if (params?.paymentStatus && params.paymentStatus !== 'ALL') {
      filtered = filtered.filter(
        (order) => order.paymentStatus === params.paymentStatus
      );
    }

    if (params?.fulfillmentStatus && params.fulfillmentStatus !== 'ALL') {
      filtered = filtered.filter(
        (order) => order.fulfillmentStatus === params.fulfillmentStatus
      );
    }

    if (params?.customerId) {
      filtered = filtered.filter(
        (order) => order.customerId === params.customerId
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);

    // Sort by order date descending
    filtered.sort(
      (a, b) =>
        new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );

    return {
      success: true,
      data: filtered,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    const order = this.orders.find((o) => o.id === id);
    if (!order) {
      throw new Error('Order not found');
    }
    return {
      success: true,
      data: order,
    };
  }

  async createOrder(data: CreateOrderRequest): Promise<ApiResponse<Order>> {
    const subtotal = data.items.reduce(
      (sum, item) => sum + parseFloat(item.unitPrice) * item.quantity,
      0
    );

    const newOrder: Order = {
      id: `ORD-${String(this.nextId++).padStart(3, '0')}`,
      tenantId: '00000000-0000-0000-0000-000000000001',
      customerId: data.customerId,
      customerName: 'New Customer',
      customerEmail: 'customer@example.com',
      orderNumber: `ORD-2024-${String(this.nextId).padStart(3, '0')}`,
      status: 'PLACED',
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'UNFULFILLED',
      subtotal: subtotal.toFixed(2),
      discount: '0.00',
      tax: (subtotal * 0.08).toFixed(2),
      shippingCost: '10.00',
      total: (subtotal * 1.08 + 10).toFixed(2),
      currencyCode: 'USD',
      items: data.items.map((item, index) => ({
        id: `ITEM-${Date.now()}-${index}`,
        orderId: `ORD-${String(this.nextId).padStart(3, '0')}`,
        productId: item.productId,
        productName: 'Product Name',
        productSku: 'SKU-000',
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
      })),
      totalItems: data.items.reduce((sum, item) => sum + item.quantity, 0),
      shippingAddress: data.shippingAddress,
      billingAddress: data.billingAddress || data.shippingAddress,
      shippingMethod: data.shippingMethod,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      tags: data.tags || [],
      metadata: data.metadata,
      orderDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orders.push(newOrder);

    return {
      success: true,
      data: newOrder,
    };
  }

  async updateOrder(
    id: string,
    data: UpdateOrderRequest
  ): Promise<ApiResponse<Order>> {
    const index = this.orders.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error('Order not found');
    }

    const updated = {
      ...this.orders[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.orders[index] = updated;

    return {
      success: true,
      data: updated,
    };
  }

  async deleteOrder(id: string): Promise<ApiResponse<{ message: string }>> {
    this.orders = this.orders.filter((o) => o.id !== id);
    return {
      success: true,
      data: { message: 'Order deleted successfully' },
    };
  }

  async updateOrderStatus(
    id: string,
    status: string
  ): Promise<ApiResponse<Order>> {
    return this.updateOrder(id, { status: status as any });
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: string
  ): Promise<ApiResponse<Order>> {
    return this.updateOrder(id, { paymentStatus: paymentStatus as any });
  }

  async updateFulfillmentStatus(
    id: string,
    fulfillmentStatus: string
  ): Promise<ApiResponse<Order>> {
    return this.updateOrder(id, {
      fulfillmentStatus: fulfillmentStatus as any,
    });
  }

  async addTrackingNumber(
    id: string,
    trackingNumber: string,
    shippingMethod?: string
  ): Promise<ApiResponse<Order>> {
    return this.updateOrder(id, { trackingNumber, shippingMethod });
  }

  async getOrderAnalytics(): Promise<ApiResponse<OrdersAnalytics>> {
    const totalRevenue = this.orders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + parseFloat(o.total), 0);

    const totalOrders = this.orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      success: true,
      data: {
        overview: {
          totalOrders,
          pendingOrders: this.orders.filter((o) => o.status === 'PLACED')
            .length,
          processingOrders: this.orders.filter((o) => o.status === 'PROCESSING')
            .length,
          shippedOrders: this.orders.filter(
            (o) =>
              o.fulfillmentStatus === 'DISPATCHED' ||
              o.fulfillmentStatus === 'IN_TRANSIT' ||
              o.fulfillmentStatus === 'OUT_FOR_DELIVERY'
          ).length,
          deliveredOrders: this.orders.filter(
            (o) => o.fulfillmentStatus === 'DELIVERED'
          ).length,
          cancelledOrders: this.orders.filter((o) => o.status === 'CANCELLED')
            .length,
          totalRevenue,
          averageOrderValue,
        },
      },
    };
  }

  async getValidTransitions(
    id: string
  ): Promise<ApiResponse<ValidTransitionsResponse>> {
    const order = this.orders.find((o) => o.id === id);
    if (!order) {
      throw new Error('Order not found');
    }

    // Define valid transitions based on current status
    const orderTransitions: Record<OrderStatus, OrderStatus[]> = {
      PLACED: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED', 'CANCELLED'],
      DELIVERED: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    const paymentTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      PENDING: ['PAID', 'FAILED'],
      PAID: ['PARTIALLY_REFUNDED', 'REFUNDED'],
      FAILED: ['PENDING'],
      PARTIALLY_REFUNDED: ['REFUNDED'],
      REFUNDED: [],
    };

    const fulfillmentTransitions: Record<FulfillmentStatus, FulfillmentStatus[]> = {
      UNFULFILLED: ['PROCESSING'],
      PROCESSING: ['PACKED'],
      PACKED: ['DISPATCHED'],
      DISPATCHED: ['IN_TRANSIT'],
      IN_TRANSIT: ['OUT_FOR_DELIVERY', 'FAILED_DELIVERY'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED_DELIVERY'],
      DELIVERED: ['RETURNED'],
      FAILED_DELIVERY: ['IN_TRANSIT', 'RETURNED'],
      RETURNED: [],
    };

    return {
      success: true,
      data: {
        orderId: order.id,
        currentOrderStatus: order.status,
        currentPaymentStatus: order.paymentStatus,
        currentFulfillmentStatus: order.fulfillmentStatus,
        validOrderStatuses: orderTransitions[order.status] || [],
        validPaymentStatuses: paymentTransitions[order.paymentStatus] || [],
        validFulfillmentStatuses:
          fulfillmentTransitions[order.fulfillmentStatus] || [],
      },
    };
  }
}

const mockService = new MockOrderService();

/**
 * Unified order service that switches between mock and API
 */
export const orderService = {
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
    customerId?: string;
  }) => {
    if (USE_MOCK_DATA) {
      return mockService.getOrders(params);
    }
    return ordersService.getOrders(params);
  },

  getOrder: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockService.getOrder(id);
    }
    return ordersService.getOrder(id);
  },

  createOrder: async (data: CreateOrderRequest) => {
    if (USE_MOCK_DATA) {
      return mockService.createOrder(data);
    }
    return ordersService.createOrder(data);
  },

  updateOrder: async (id: string, data: UpdateOrderRequest) => {
    if (USE_MOCK_DATA) {
      return mockService.updateOrder(id, data);
    }
    return ordersService.updateOrder(id, data);
  },

  deleteOrder: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockService.deleteOrder(id);
    }
    return ordersService.deleteOrder(id);
  },

  updateOrderStatus: async (id: string, status: string) => {
    if (USE_MOCK_DATA) {
      return mockService.updateOrderStatus(id, status);
    }
    return ordersService.updateOrderStatus(id, status);
  },

  updatePaymentStatus: async (id: string, paymentStatus: string) => {
    if (USE_MOCK_DATA) {
      return mockService.updatePaymentStatus(id, paymentStatus);
    }
    return ordersService.updatePaymentStatus(id, paymentStatus);
  },

  updateFulfillmentStatus: async (id: string, fulfillmentStatus: string) => {
    if (USE_MOCK_DATA) {
      return mockService.updateFulfillmentStatus(id, fulfillmentStatus);
    }
    return ordersService.updateFulfillmentStatus(id, fulfillmentStatus);
  },

  addTrackingNumber: async (
    id: string,
    trackingNumber: string,
    shippingMethod?: string
  ) => {
    if (USE_MOCK_DATA) {
      return mockService.addTrackingNumber(id, trackingNumber, shippingMethod);
    }
    return ordersService.addTrackingNumber(id, trackingNumber, shippingMethod);
  },

  getOrderAnalytics: async () => {
    if (USE_MOCK_DATA) {
      return mockService.getOrderAnalytics();
    }
    return ordersService.getOrderAnalytics();
  },

  getValidTransitions: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockService.getValidTransitions(id);
    }
    return ordersService.getValidTransitions(id);
  },

  isMockMode: () => USE_MOCK_DATA,
};
