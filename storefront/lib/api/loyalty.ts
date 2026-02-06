// ========================================
// Types
// ========================================

export interface LoyaltyTier {
  name: string;
  minimumPoints: number;
  discountPercent: number;
  benefits: string;
}

export interface LoyaltyProgram {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  pointsPerDollar: number;
  pointsRedemptionRate: number; // e.g., 100 points = $1
  minimumRedemption: number;
  pointsExpiration: number; // days, 0 = never
  isActive: boolean;
  tiers: LoyaltyTier[];
  signupBonus: number;
  birthdayBonus: number;
  referralBonus: number;
}

export interface CustomerLoyalty {
  id: string;
  customerId: string;
  programId: string;
  pointsBalance: number;
  lifetimePoints: number;
  currentTier: string;
  tierProgress: number; // percentage to next tier
  nextTier?: string;
  pointsToNextTier?: number;
  referralCode?: string;
  referredBy?: string;
  enrolledAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST' | 'BONUS';
  points: number;
  description: string;
  orderId?: string;
  orderNumber?: string;
  createdAt: string;
}

export interface PointsRedemption {
  points: number;
  dollarValue: number;
  orderId?: string;
}

export interface RedemptionResult {
  success: boolean;
  pointsRedeemed: number;
  dollarValue: number;
  newBalance: number;
  message?: string;
}

// ========================================
// API Functions
// ========================================

export async function getLoyaltyProgram(
  tenantId: string,
  storefrontId: string
): Promise<LoyaltyProgram | null> {
  try {
    const response = await fetch('/api/loyalty/program', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No program configured
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || error.message || 'Failed to fetch loyalty program');
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch loyalty program:', error);
    return null;
  }
}

export async function getCustomerLoyalty(
  tenantId: string,
  storefrontId: string,
  customerId: string,
  accessToken: string
): Promise<CustomerLoyalty | null> {
  try {
    const response = await fetch('/api/loyalty/customer', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Customer not enrolled
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || error.message || 'Failed to fetch customer loyalty');
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch customer loyalty:', error);
    return null;
  }
}

export async function enrollInLoyalty(
  tenantId: string,
  storefrontId: string,
  accessToken: string,
  referralCode?: string,
  dateOfBirth?: string
): Promise<CustomerLoyalty> {
  const body: Record<string, string | undefined> = {};
  if (referralCode) body.referralCode = referralCode;
  if (dateOfBirth) body.dateOfBirth = dateOfBirth;

  const response = await fetch('/api/loyalty/enroll', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || error.message || 'Failed to enroll in loyalty program');
  }

  return response.json();
}

export async function getLoyaltyTransactions(
  tenantId: string,
  storefrontId: string,
  accessToken: string,
  options?: { limit?: number; offset?: number }
): Promise<{ transactions: LoyaltyTransaction[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());

  const response = await fetch(`/api/loyalty/transactions?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || error.message || 'Failed to fetch transactions');
  }

  return response.json();
}

export async function redeemPoints(
  tenantId: string,
  storefrontId: string,
  points: number,
  orderId: string,
  accessToken: string
): Promise<RedemptionResult> {
  const response = await fetch('/api/loyalty/redeem', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ points, orderId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || error.message || 'Failed to redeem points');
  }

  return response.json();
}

export async function calculatePointsValue(
  tenantId: string,
  storefrontId: string,
  points: number
): Promise<{ dollarValue: number }> {
  const response = await fetch(`/api/loyalty/calculate?points=${points}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
  });

  if (!response.ok) {
    // Return default calculation if endpoint not available
    return { dollarValue: points / 100 };
  }

  return response.json();
}

// ========================================
// Helpers
// ========================================

export function formatPoints(points: number): string {
  return points.toLocaleString();
}

export function getTierColor(tier: string): string {
  const tierLower = tier.toLowerCase();
  if (tierLower.includes('gold') || tierLower.includes('vip')) {
    return 'text-yellow-600 bg-yellow-100';
  }
  if (tierLower.includes('silver') || tierLower.includes('platinum')) {
    return 'text-gray-600 bg-gray-100';
  }
  if (tierLower.includes('bronze')) {
    return 'text-orange-600 bg-orange-100';
  }
  return 'text-tenant-primary bg-tenant-primary/10';
}

export function calculatePointsForPurchase(amount: number, pointsPerDollar: number): number {
  return Math.floor(amount * pointsPerDollar);
}

export function calculateRedemptionValue(points: number, redemptionRate: number): number {
  return points / redemptionRate;
}
