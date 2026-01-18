import { apiClient } from './client';
import {
  Shipment,
  CreateShipmentRequest,
  GetRatesRequest,
  ShippingRate,
  TrackShipmentResponse,
  ShipmentListResponse,
  ApiResponse,
  ShipmentStatus,
  ShipmentAddress,
} from './types';

// Use BFF API route (Next.js server-side proxy to shipping-service)
// This avoids CORS issues and keeps shipping-service URL server-side only
const SHIPPING_API_BASE = '/api/shipping';

export interface ShippingSettings {
  general: {
    enabled: boolean;
    enableLocalDelivery: boolean;
    enableStorePickup: boolean;
    enableInternational: boolean;
    defaultMethod: string;
  };
  warehouse?: ShipmentAddress;
  tracking?: {
    enabled: boolean;
    autoSendTracking: boolean;
    trackingUrlTemplate: string;
    enableDeliveryConfirmation: boolean;
  };
}

/**
 * Shipping Service API Client
 * Communicates with the shipping-service via BFF API route
 */
export class ShippingService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || SHIPPING_API_BASE;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Get auth token and tenant ID from localStorage if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }

      // CRITICAL: Add tenant ID for multi-tenant isolation
      // Tenant is stored as JSON object in 'currentTenant' key
      const currentTenantStr = localStorage.getItem('currentTenant');
      if (currentTenantStr) {
        try {
          const currentTenant = JSON.parse(currentTenantStr);
          if (currentTenant?.id) {
            (headers as Record<string, string>)['x-jwt-claim-tenant-id'] = currentTenant.id;
          }
        } catch (e) {
          console.error('Failed to parse currentTenant from localStorage:', e);
        }
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: response.statusText,
        message: `Request failed with status ${response.status}`,
      }));
      throw new Error(error.message || error.error || 'Request failed');
    }

    return response.json();
  }

  /**
   * Create a new shipment
   */
  async createShipment(
    data: CreateShipmentRequest
  ): Promise<ApiResponse<Shipment>> {
    return this.fetch<ApiResponse<Shipment>>('/shipments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get a single shipment by ID
   */
  async getShipment(id: string): Promise<ApiResponse<Shipment>> {
    return this.fetch<ApiResponse<Shipment>>(`/shipments/${id}`);
  }

  /**
   * List all shipments with pagination
   */
  async listShipments(params?: {
    limit?: number;
    offset?: number;
  }): Promise<ShipmentListResponse> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const queryString = query.toString();
    const endpoint = queryString ? `/shipments?${queryString}` : '/shipments';

    return this.fetch<ShipmentListResponse>(endpoint);
  }

  /**
   * Get shipments for a specific order
   */
  async getShipmentsByOrder(orderId: string): Promise<ApiResponse<Shipment[]>> {
    return this.fetch<ApiResponse<Shipment[]>>(`/shipments/order/${orderId}`);
  }

  /**
   * Get shipping rates
   */
  async getRates(data: GetRatesRequest): Promise<{ success: boolean; rates: ShippingRate[] }> {
    return this.fetch<{ success: boolean; rates: ShippingRate[] }>('/rates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Track a shipment by tracking number
   */
  async trackShipment(trackingNumber: string): Promise<ApiResponse<TrackShipmentResponse>> {
    return this.fetch<ApiResponse<TrackShipmentResponse>>(`/track/${trackingNumber}`);
  }

  /**
   * Cancel a shipment
   */
  async cancelShipment(
    id: string,
    reason: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.fetch<ApiResponse<{ message: string }>>(`/shipments/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * Update shipment status
   */
  async updateShipmentStatus(
    id: string,
    status: ShipmentStatus
  ): Promise<ApiResponse<{ message: string }>> {
    return this.fetch<ApiResponse<{ message: string }>>(`/shipments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  /**
   * Generate return label
   */
  async generateReturnLabel(data: {
    orderId: string;
    orderNumber: string;
    returnId: string;
    rmaNumber: string;
    originalShipmentId?: string;
    customerAddress: {
      name: string;
      phone?: string;
      email?: string;
      street: string;
      street2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    returnAddress: {
      name: string;
      phone?: string;
      email?: string;
      street: string;
      street2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    weight: number;
    length: number;
    width: number;
    height: number;
  }): Promise<ApiResponse<{
    shipmentId: string;
    returnId: string;
    rmaNumber: string;
    carrier: string;
    trackingNumber: string;
    labelUrl: string;
    status: ShipmentStatus;
  }>> {
    return this.fetch('/returns/label', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Check if shipping service is healthy
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    return this.fetch<{ status: string; service: string }>('/health');
  }

  /**
   * Get shipping settings for the tenant (includes warehouse address)
   */
  async getShippingSettings(): Promise<{
    warehouse?: ShipmentAddress;
    defaultPackageWeight?: number;
    defaultDimensionUnit?: string;
    defaultWeightUnit?: string;
  } | null> {
    try {
      const response = await this.fetch<{
        success: boolean;
        data: {
          warehouse?: {
            name: string;
            company?: string;
            phone: string;
            email: string;
            street: string;
            street2?: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
          };
          defaultPackageWeight?: number;
          defaultDimensionUnit?: string;
          defaultWeightUnit?: string;
        };
      }>('/shipping-settings');
      if (response.success && response.data) {
        return {
          warehouse: response.data.warehouse,
          defaultPackageWeight: response.data.defaultPackageWeight,
          defaultDimensionUnit: response.data.defaultDimensionUnit,
          defaultWeightUnit: response.data.defaultWeightUnit,
        };
      }
      return null;
    } catch {
      // Settings might not exist yet
      return null;
    }
  }

  /**
   * Quick ship - creates shipment with package dimensions from order or defaults
   * Uses stored package metrics from checkout if available for accurate shipping
   * Fetches warehouse from tenant settings if not provided
   */
  async quickShip(order: {
    id: string;
    orderNumber: string;
    shippingAddress: {
      firstName: string;
      lastName: string;
      phone?: string;
      email?: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
    items: Array<{
      productName: string;
      productSku?: string;
      quantity: number;
      unitPrice: string | number;
    }>;
    // Order subtotal for carrier value declaration
    subtotal?: number;
    // Optional: use carrier and cost from customer's checkout selection
    carrier?: string;
    shippingCost?: number;
    // Package metrics stored from checkout (preferred over defaults)
    packageWeight?: number;
    packageLength?: number;
    packageWidth?: number;
    packageHeight?: number;
  }, warehouseAddress?: ShipmentAddress): Promise<ApiResponse<Shipment>> {
    // Try to get warehouse from settings if not provided
    let fromAddress: ShipmentAddress = warehouseAddress || {
      name: 'Warehouse',
      company: 'Store Warehouse',
      phone: '+1234567890',
      email: 'warehouse@store.com',
      street: '123 Warehouse St',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'IN',
    };

    if (!warehouseAddress) {
      try {
        const settings = await this.getShippingSettings();
        if (settings?.warehouse) {
          fromAddress = settings.warehouse;
        }
      } catch (err) {
        console.warn('Failed to fetch shipping settings, using default warehouse:', err);
      }
    }

    // Use stored package metrics from checkout if available, otherwise use defaults
    const hasStoredMetrics = (order.packageWeight && order.packageWeight > 0) ||
                             (order.packageLength && order.packageLength > 0) ||
                             (order.packageWidth && order.packageWidth > 0) ||
                             (order.packageHeight && order.packageHeight > 0);

    let weight: number, length: number, width: number, height: number;

    if (hasStoredMetrics) {
      // Use stored metrics from checkout (accurate product-based values)
      weight = order.packageWeight && order.packageWeight > 0 ? order.packageWeight : 0.5;
      length = order.packageLength && order.packageLength > 0 ? order.packageLength : 20;
      width = order.packageWidth && order.packageWidth > 0 ? order.packageWidth : 15;
      height = order.packageHeight && order.packageHeight > 0 ? order.packageHeight : 10;
      console.log(`[QuickShip] Using stored package metrics for order ${order.orderNumber}: ${weight}kg, ${length}x${width}x${height}cm`);
    } else {
      // Fallback: calculate default package size based on item count
      const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const packageSize = itemCount <= 2 ? 'small' : itemCount <= 5 ? 'medium' : 'large';

      const packageDimensions = {
        small: { weight: 0.5, length: 20, width: 15, height: 10 },
        medium: { weight: 1.0, length: 30, width: 25, height: 15 },
        large: { weight: 2.0, length: 40, width: 30, height: 20 },
      };

      const dims = packageDimensions[packageSize];
      weight = dims.weight;
      length = dims.length;
      width = dims.width;
      height = dims.height;
      console.log(`[QuickShip] Using default package size '${packageSize}' for order ${order.orderNumber}: ${weight}kg, ${length}x${width}x${height}cm`);
    }

    // Build order items for carrier
    const items = order.items.map(item => ({
      name: item.productName,
      sku: item.productSku || '',
      quantity: item.quantity,
      price: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice,
    }));

    const request: CreateShipmentRequest = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      fromAddress,
      toAddress: {
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        phone: order.shippingAddress.phone,
        email: order.shippingAddress.email,
        street: order.shippingAddress.addressLine1,
        street2: order.shippingAddress.addressLine2,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state || '',
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
      },
      weight,
      length,
      width,
      height,
      serviceType: 'standard',
      // Pass pre-calculated shipping cost from checkout for consistent pricing
      shippingCost: order.shippingCost,
      // Pass order value and items for carrier
      orderValue: order.subtotal,
      items,
    };

    console.log(`[QuickShip] Creating shipment with cost: ${order.shippingCost}, orderValue: ${order.subtotal}`);
    return this.createShipment(request);
  }
}

export const shippingService = new ShippingService();
