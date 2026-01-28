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

    const response = await apiRequest<CancellationSettingsResponse>(
      `${serviceUrls.orders}/api/v1/public/settings/cancellation?${queryParams.toString()}`,
      { tenantId: effectiveTenantId, storefrontId, cache: 'no-store' }
    );

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
