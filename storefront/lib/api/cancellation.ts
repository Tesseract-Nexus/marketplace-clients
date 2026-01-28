// ========================================
// Types
// ========================================

export interface CancellationWindow {
  id: string;
  name: string;
  maxHoursAfterOrder: number;
  feeType: 'percentage' | 'fixed';
  feeValue: number;
  description: string;
}

export interface CancellationPolicy {
  enabled: boolean;
  windows: CancellationWindow[];
  defaultFeeType: 'percentage' | 'fixed';
  defaultFeeValue: number;
  nonCancellableStatuses: string[];
  requireReason: boolean;
  allowPartialCancellation: boolean;
  refundMethod: 'original_payment' | 'store_credit' | 'either';
  policyText: string;
  cancellationReasons?: string[];
}

export interface CancellationFeeResult {
  fee: number;
  feePercent: number;
  windowName: string;
  description: string;
  canCancel: boolean;
}

// ========================================
// Fetch cancellation policy from orders-service
// ========================================

interface CancellationSettingsResponse {
  success: boolean;
  data?: {
    id: string;
    tenantId: string;
    storefrontId?: string;
    enabled: boolean;
    requireReason: boolean;
    allowPartialCancellation: boolean;
    defaultFeeType: string;
    defaultFeeValue: number;
    refundMethod: string;
    autoRefundEnabled: boolean;
    nonCancellableStatuses: string[];
    windows: CancellationWindow[];
    cancellationReasons: string[];
    requireApprovalForPolicyChanges: boolean;
    policyText: string;
  };
  error?: string;
  message?: string;
}

// Default cancellation settings for graceful fallback
const DEFAULT_CANCELLATION_SETTINGS: CancellationSettingsResponse = {
  success: true,
  data: {
    id: 'default',
    tenantId: '',
    enabled: true,
    requireReason: true,
    allowPartialCancellation: false,
    defaultFeeType: 'percentage',
    defaultFeeValue: 15,
    refundMethod: 'original_payment',
    autoRefundEnabled: true,
    nonCancellableStatuses: ['SHIPPED', 'DELIVERED'],
    windows: [
      { id: 'w1', name: 'Free cancellation', maxHoursAfterOrder: 6, feeType: 'percentage', feeValue: 0, description: 'Cancel within 6 hours at no charge.' },
      { id: 'w2', name: 'Low fee', maxHoursAfterOrder: 24, feeType: 'percentage', feeValue: 3, description: 'A small processing fee applies within 24 hours.' },
      { id: 'w3', name: 'Pre-delivery', maxHoursAfterOrder: 72, feeType: 'percentage', feeValue: 10, description: '10% fee for cancellations before delivery.' },
    ],
    cancellationReasons: [
      'I changed my mind',
      'Found a better price elsewhere',
      'Ordered by mistake',
      'Shipping is taking too long',
      'Payment issue',
      'Other reason',
    ],
    requireApprovalForPolicyChanges: false,
    policyText: '',
  },
};

export async function getCancellationPolicy(
  storefrontId: string,
  tenantId: string,
  adminTenantId?: string
): Promise<CancellationPolicy | null> {
  try {
    const effectiveTenantId = adminTenantId || tenantId;
    const queryParams = new URLSearchParams({
      tenantId: effectiveTenantId,
    });
    if (storefrontId) {
      queryParams.set('storefrontId', storefrontId);
    }

    let response: CancellationSettingsResponse;

    // Server-side: call orders-service directly
    // Client-side: use BFF route to avoid CORS issues
    if (typeof window === 'undefined') {
      // Server-side rendering - call orders-service directly
      const ORDERS_SERVICE_URL = (process.env.ORDERS_SERVICE_URL || 'http://localhost:3108').replace(/\/api\/v1\/?$/, '');
      const fetchResponse = await fetch(
        `${ORDERS_SERVICE_URL}/api/v1/public/settings/cancellation?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': effectiveTenantId,
            'X-Internal-Service': 'storefront',
            ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
          },
          cache: 'no-store',
        }
      );

      if (!fetchResponse.ok) {
        if (fetchResponse.status === 404) {
          // No settings found, use defaults
          console.log('[Cancellation] No settings found, using defaults');
          response = DEFAULT_CANCELLATION_SETTINGS;
        } else {
          console.error('[Cancellation] Server fetch error:', fetchResponse.status);
          return null;
        }
      } else {
        response = await fetchResponse.json();
      }
    } else {
      // Client-side - use BFF route
      const fetchResponse = await fetch(
        `/api/cancellation/settings?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': effectiveTenantId,
            ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
          },
          cache: 'no-store',
        }
      );

      if (!fetchResponse.ok) {
        console.error('[Cancellation] Client fetch error:', fetchResponse.status);
        return null;
      }

      response = await fetchResponse.json();
    }

    if (!response.success || !response.data) {
      console.error('Failed to fetch cancellation settings:', response.error || response.message);
      return null;
    }

    const settings = response.data;

    if (!settings.enabled) {
      return null;
    }

    // Map orders-service response to CancellationPolicy interface
    return {
      enabled: settings.enabled,
      windows: settings.windows || [],
      defaultFeeType: settings.defaultFeeType as 'percentage' | 'fixed',
      defaultFeeValue: settings.defaultFeeValue,
      nonCancellableStatuses: settings.nonCancellableStatuses || [],
      requireReason: settings.requireReason,
      allowPartialCancellation: settings.allowPartialCancellation,
      refundMethod: settings.refundMethod as 'original_payment' | 'store_credit' | 'either',
      policyText: settings.policyText || '',
      cancellationReasons: settings.cancellationReasons || [],
    };
  } catch (error) {
    console.error('Failed to fetch cancellation policy:', error);
    return null;
  }
}

// ========================================
// Calculate fee for a specific order
// ========================================

export function calculateCancellationFee(
  policy: CancellationPolicy,
  orderTotal: number,
  orderCreatedAt: string,
  orderStatus?: string,
  scheduledDeliveryDate?: string
): CancellationFeeResult {
  // Check non-cancellable statuses
  if (orderStatus && policy.nonCancellableStatuses.includes(orderStatus)) {
    return {
      fee: 0,
      feePercent: 0,
      windowName: '',
      description: `Orders with status "${orderStatus}" cannot be cancelled.`,
      canCancel: false,
    };
  }

  const now = new Date();
  const orderDate = new Date(orderCreatedAt);
  const hoursElapsed = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);

  // Sort windows by maxHoursAfterOrder ascending to match the earliest applicable window
  const sortedWindows = [...policy.windows].sort(
    (a, b) => a.maxHoursAfterOrder - b.maxHoursAfterOrder
  );

  // Find the applicable window
  for (const window of sortedWindows) {
    if (hoursElapsed <= window.maxHoursAfterOrder) {
      const fee =
        window.feeType === 'percentage'
          ? (orderTotal * window.feeValue) / 100
          : window.feeValue;
      const feePercent =
        window.feeType === 'percentage'
          ? window.feeValue
          : orderTotal > 0
            ? (window.feeValue / orderTotal) * 100
            : 0;

      return {
        fee: Math.round(fee * 100) / 100,
        feePercent: Math.round(feePercent * 100) / 100,
        windowName: window.name,
        description: window.description,
        canCancel: true,
      };
    }
  }

  // No window matched — apply default fee
  const fee =
    policy.defaultFeeType === 'percentage'
      ? (orderTotal * policy.defaultFeeValue) / 100
      : policy.defaultFeeValue;
  const feePercent =
    policy.defaultFeeType === 'percentage'
      ? policy.defaultFeeValue
      : orderTotal > 0
        ? (policy.defaultFeeValue / orderTotal) * 100
        : 0;

  return {
    fee: Math.round(fee * 100) / 100,
    feePercent: Math.round(feePercent * 100) / 100,
    windowName: 'Default',
    description: 'Standard cancellation fee applies.',
    canCancel: true,
  };
}
