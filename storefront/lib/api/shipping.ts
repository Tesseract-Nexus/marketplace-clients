// BFF routes - no direct service calls to avoid CSP issues

// ========================================
// Types
// ========================================

export interface ShippingAddress {
  postalCode: string;
  city?: string;
  state?: string;
  country: string;
}

export interface ShippingPackage {
  weight: number;
  weightUnit?: 'kg' | 'lb' | 'g' | 'oz';
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: 'cm' | 'in' | 'm';
}

export interface ShippingRateRequest {
  fromAddress: ShippingAddress;
  toAddress: ShippingAddress;
  packages: ShippingPackage[];
  currency?: string;
}

export interface ShippingRate {
  id: string;
  carrier: string;
  carrierDisplayName: string;
  service: string;
  serviceDisplayName: string;
  rate: number;
  currency: string;
  estimatedDays: number;
  estimatedDeliveryDate?: string;
  isGuaranteed?: boolean;
  trackingSupported: boolean;
  insuranceAvailable?: boolean;
  metadata?: Record<string, unknown>;
  // Rate breakdown (for admin transparency)
  baseRate?: number;      // Original carrier rate before markup
  markupAmount?: number;  // Markup amount applied
  markupPercent?: number; // Markup percentage (e.g., 10 for 10%)
}

export interface ShippingRatesResponse {
  success: boolean;
  data?: ShippingRate[];
  error?: string;
}

export type ShipmentStatus =
  | 'PENDING'
  | 'CREATED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETURNED';

export interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  location?: string;
  timestamp: string;
}

export interface ShipmentTracking {
  trackingNumber: string;
  carrier: string;
  status: ShipmentStatus;
  estimatedDelivery?: string;
  actualDelivery?: string;
  events: TrackingEvent[];
  // Additional shipment info
  orderNumber?: string;
  fromAddress?: {
    city: string;
    state: string;
    country: string;
  };
  toAddress?: {
    city: string;
    state: string;
    country: string;
  };
}

export interface TrackingResponse {
  success: boolean;
  data?: ShipmentTracking;
  error?: string;
  message?: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  baseRate: number;
  freeShippingThreshold?: number;
  countries?: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface ShippingMethodsResponse {
  success: boolean;
  data: ShippingMethod[];
}

// ========================================
// Carrier Discovery Types & API
// ========================================

export interface AvailableShippingCarrier {
  carrierType: string;
  displayName: string;
  isEnabled: boolean;
  isPrimary: boolean;
  isTestMode: boolean;
  supportsRates: boolean;
  supportsTracking: boolean;
}

export async function getAvailableCarriers(
  tenantId: string,
  storefrontId: string,
  countryCode?: string
): Promise<AvailableShippingCarrier[]> {
  let url = '/api/shipping/carriers';
  if (countryCode) {
    url += `?country=${encodeURIComponent(countryCode)}`;
  }

  const response = await fetch(url, {
    headers: {
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || error.message || 'Failed to fetch available carriers');
  }

  const result = await response.json();
  return result.data?.carriers || [];
}

// ========================================
// API Functions
// ========================================

export async function getShippingMethods(
  tenantId: string,
  storefrontId: string,
  countryCode?: string
): Promise<ShippingMethod[]> {
  let url = '/api/shipping/methods';
  if (countryCode) {
    url += `?country=${encodeURIComponent(countryCode)}`;
  }

  const response = await fetch(url, {
    headers: {
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || error.message || 'Failed to fetch shipping methods');
  }

  const result: ShippingMethodsResponse = await response.json();
  return result.data || [];
}

/**
 * Get real-time shipping rates from configured carriers
 */
export async function getShippingRates(
  tenantId: string,
  storefrontId: string,
  request: ShippingRateRequest
): Promise<ShippingRate[]> {
  const response = await fetch('/api/shipping/rates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Failed to fetch shipping rates');
  }

  const result: ShippingRatesResponse = await response.json();
  return result.data || [];
}

/**
 * Get shipping rates for a cart/order
 * Convenience wrapper that builds the request from order details
 */
export async function getShippingRatesForOrder(
  tenantId: string,
  storefrontId: string,
  options: {
    fromCountry: string;
    fromPostalCode: string;
    toCountry: string;
    toPostalCode: string;
    toCity?: string;
    toState?: string;
    totalWeight: number;
    weightUnit?: 'kg' | 'lb' | 'g' | 'oz';
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: 'cm' | 'in' | 'm';
    currency?: string;
  }
): Promise<ShippingRate[]> {
  const request: ShippingRateRequest = {
    fromAddress: {
      country: options.fromCountry,
      postalCode: options.fromPostalCode,
    },
    toAddress: {
      country: options.toCountry,
      postalCode: options.toPostalCode,
      city: options.toCity,
      state: options.toState,
    },
    packages: [
      {
        weight: options.totalWeight,
        weightUnit: options.weightUnit || 'kg',
        length: options.length,
        width: options.width,
        height: options.height,
        dimensionUnit: options.dimensionUnit,
      },
    ],
    currency: options.currency,
  };

  return getShippingRates(tenantId, storefrontId, request);
}

// ========================================
// Helpers
// ========================================

export function formatEstimatedDelivery(method: ShippingMethod): string {
  if (method.estimatedDaysMin === method.estimatedDaysMax) {
    return `${method.estimatedDaysMin} business day${method.estimatedDaysMin === 1 ? '' : 's'}`;
  }
  return `${method.estimatedDaysMin}-${method.estimatedDaysMax} business days`;
}

export function calculateShippingCost(
  method: ShippingMethod,
  orderSubtotal: number
): number {
  if (method.freeShippingThreshold && orderSubtotal >= method.freeShippingThreshold) {
    return 0;
  }
  return method.baseRate;
}

export function getEstimatedDeliveryDate(method: ShippingMethod): { min: Date; max: Date } {
  const now = new Date();

  // Skip weekends for business days calculation
  const addBusinessDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        added++;
      }
    }
    return result;
  };

  return {
    min: addBusinessDays(now, method.estimatedDaysMin),
    max: addBusinessDays(now, method.estimatedDaysMax),
  };
}

// ========================================
// Tracking API Functions
// ========================================

export async function trackShipment(
  tenantId: string,
  storefrontId: string,
  trackingNumber: string
): Promise<ShipmentTracking | null> {
  const response = await fetch(`/api/shipping/track/${encodeURIComponent(trackingNumber)}`, {
    headers: {
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || error.message || 'Failed to track shipment');
  }

  const result: TrackingResponse = await response.json();
  return result.data || null;
}

// ========================================
// Status Display Helpers
// ========================================

export function getStatusLabel(status: ShipmentStatus): string {
  const labels: Record<ShipmentStatus, string> = {
    PENDING: 'Pending',
    CREATED: 'Label Created',
    PICKED_UP: 'Picked Up',
    IN_TRANSIT: 'In Transit',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    FAILED: 'Delivery Failed',
    CANCELLED: 'Cancelled',
    RETURNED: 'Returned to Sender',
  };
  return labels[status] || status;
}

export function getStatusColor(status: ShipmentStatus): string {
  const colors: Record<ShipmentStatus, string> = {
    PENDING: 'bg-gray-100 text-gray-800',
    CREATED: 'bg-blue-100 text-blue-800',
    PICKED_UP: 'bg-indigo-100 text-indigo-800',
    IN_TRANSIT: 'bg-yellow-100 text-yellow-800',
    OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    RETURNED: 'bg-purple-100 text-purple-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusProgress(status: ShipmentStatus): number {
  const progress: Record<ShipmentStatus, number> = {
    PENDING: 0,
    CREATED: 20,
    PICKED_UP: 40,
    IN_TRANSIT: 60,
    OUT_FOR_DELIVERY: 80,
    DELIVERED: 100,
    FAILED: 80,
    CANCELLED: 0,
    RETURNED: 100,
  };
  return progress[status] || 0;
}

// ========================================
// Rate Display Helpers
// ========================================

export function formatShippingRate(rate: ShippingRate, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: rate.currency || 'USD',
  }).format(rate.rate);
}

export function formatRateDelivery(rate: ShippingRate): string {
  if (rate.estimatedDeliveryDate) {
    const date = new Date(rate.estimatedDeliveryDate);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  if (rate.estimatedDays === 1) {
    return '1 business day';
  }
  return `${rate.estimatedDays} business days`;
}

export function sortRatesByCheapest(rates: ShippingRate[]): ShippingRate[] {
  return [...rates].sort((a, b) => a.rate - b.rate);
}

export function sortRatesByFastest(rates: ShippingRate[]): ShippingRate[] {
  return [...rates].sort((a, b) => a.estimatedDays - b.estimatedDays);
}

export function getCheapestRate(rates: ShippingRate[]): ShippingRate | undefined {
  const first = rates[0];
  if (rates.length === 0 || !first) return undefined;
  return rates.reduce((min, rate) => (rate.rate < min.rate ? rate : min), first);
}

export function getFastestRate(rates: ShippingRate[]): ShippingRate | undefined {
  const first = rates[0];
  if (rates.length === 0 || !first) return undefined;
  return rates.reduce((min, rate) => (rate.estimatedDays < min.estimatedDays ? rate : min), first);
}

// ========================================
// Shipping Settings
// ========================================

export interface WarehouseAddress {
  name?: string;
  company?: string;
  phone?: string;
  email?: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface ShippingSettings {
  warehouse: WarehouseAddress | null;
  freeShippingEnabled?: boolean;
  freeShippingMinimum?: number;
  handlingFee?: number;
}

export async function getShippingSettings(
  tenantId: string,
  storefrontId: string
): Promise<ShippingSettings | null> {
  try {
    const response = await fetch('/api/shipping/settings', {
      headers: {
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    });

    if (!response.ok) {
      console.error('[Shipping] Failed to fetch settings:', response.status);
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('[Shipping] Error fetching settings:', error);
    return null;
  }
}
