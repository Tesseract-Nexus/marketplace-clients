import { apiRequest, serviceUrls } from './client';

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
}

export interface CancellationFeeResult {
  fee: number;
  feePercent: number;
  windowName: string;
  description: string;
  canCancel: boolean;
}

// ========================================
// Fetch cancellation policy from settings
// ========================================

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
}

export async function getCancellationPolicy(
  storefrontId: string,
  tenantId: string,
  adminTenantId?: string
): Promise<CancellationPolicy | null> {
  try {
    const settingsTenantId = adminTenantId || tenantId;
    const queryParams = new URLSearchParams({
      applicationId: 'admin-portal',
      scope: 'application',
      tenantId: settingsTenantId,
    });

    const response = await apiRequest<ApiResponse<any>>(
      `${serviceUrls.settings}/api/v1/public/settings/context?${queryParams.toString()}`,
      { tenantId: settingsTenantId, storefrontId, cache: 'no-store' }
    );

    const data = response.data || response;
    const cancellation = data?.ecommerce?.cancellation;

    if (!cancellation || !cancellation.enabled) {
      return null;
    }

    return cancellation as CancellationPolicy;
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
