// ========================================
// Types
// ========================================

export type DiscountType = 'percentage' | 'fixed' | 'free_shipping';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  displayText?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
}

export interface ValidateCouponRequest {
  code: string;
  orderValue: number;
  userId?: string;
  productIds?: string[];
  categoryIds?: string[];
}

export interface ValidateCouponResponse {
  success: boolean;
  valid: boolean;
  reasonCode?: string;
  message?: string;
  discountAmount?: number;
  coupon?: Coupon;
}

export interface AppliedCoupon {
  coupon: Coupon;
  discountAmount: number;
}

// ========================================
// API Functions
// ========================================

export async function validateCoupon(
  tenantId: string,
  storefrontId: string,
  request: ValidateCouponRequest
): Promise<ValidateCouponResponse> {
  console.log('[Coupons API] validateCoupon called', { tenantId, storefrontId, request });

  const response = await fetch('/api/coupons/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
    body: JSON.stringify(request),
  });

  console.log('[Coupons API] Response status:', response.status);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('[Coupons API] Error response:', error);
    throw new Error(error.error?.message || error.message || 'Failed to validate coupon');
  }

  const data = await response.json();
  console.log('[Coupons API] Success response:', data);
  return data;
}

export async function applyCoupon(
  tenantId: string,
  storefrontId: string,
  couponId: string,
  data: {
    orderId: string;
    userId?: string;
    orderValue: number;
    paymentMethod?: string;
  }
): Promise<{ success: boolean; data: { discountAmount: number } }> {
  const response = await fetch(`/api/coupons/${couponId}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || error.message || 'Failed to apply coupon');
  }

  return response.json();
}

// Helper to format discount display
export function formatDiscount(coupon: Coupon): string {
  switch (coupon.discountType) {
    case 'percentage':
      return `${coupon.discountValue}% off`;
    case 'fixed':
      return `$${coupon.discountValue.toFixed(2)} off`;
    case 'free_shipping':
      return 'Free Shipping';
    default:
      return '';
  }
}
