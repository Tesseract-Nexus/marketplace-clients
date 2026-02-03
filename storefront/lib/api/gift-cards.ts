// ========================================
// Types
// ========================================

export type GiftCardStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';

export interface GiftCard {
  id: string;
  tenantId: string;
  code: string;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  status: GiftCardStatus;
  recipientEmail?: string;
  recipientName?: string;
  senderName?: string;
  message?: string;
  expiresAt?: string;
  issuedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface GiftCardTemplate {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  amounts: number[];
  allowCustomAmount: boolean;
  minAmount?: number;
  maxAmount?: number;
}

export interface PurchaseGiftCardRequest {
  amount: number;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  message?: string;
  deliveryDate?: string;
}

export interface PurchaseGiftCardResponse {
  success: boolean;
  giftCard: GiftCard;
  paymentUrl?: string;
}

export interface CheckBalanceResponse {
  success: boolean;
  balance: number;
  currency: string;
  status: GiftCardStatus;
  expiresAt?: string;
}

// ========================================
// API Functions
// ========================================

export async function getGiftCardTemplates(
  tenantId: string,
  storefrontId: string
): Promise<GiftCardTemplate[]> {
  const response = await fetch('/api/gift-cards/templates', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
  });

  if (!response.ok) {
    // Return default templates if endpoint doesn't exist yet
    if (response.status === 404) {
      return getDefaultTemplates();
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || error.message || 'Failed to fetch gift card templates');
  }

  const data = await response.json();
  return data.templates || data;
}

export async function purchaseGiftCard(
  tenantId: string,
  storefrontId: string,
  request: PurchaseGiftCardRequest
): Promise<PurchaseGiftCardResponse> {
  const response = await fetch('/api/gift-cards/purchase', {
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
    throw new Error(error.error?.message || error.message || 'Failed to purchase gift card');
  }

  return response.json();
}

export async function checkGiftCardBalance(
  tenantId: string,
  storefrontId: string,
  code: string
): Promise<CheckBalanceResponse> {
  const response = await fetch(`/api/gift-cards/balance?code=${encodeURIComponent(code)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || error.message || 'Gift card not found');
  }

  return response.json();
}

export async function redeemGiftCard(
  tenantId: string,
  storefrontId: string,
  code: string,
  amount: number,
  orderId: string
): Promise<{ success: boolean; newBalance: number }> {
  const response = await fetch('/api/gift-cards/redeem', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
    body: JSON.stringify({ code, amount, orderId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || error.message || 'Failed to redeem gift card');
  }

  return response.json();
}

export interface AppliedGiftCard {
  code: string;
  balance: number;
  currency: string;
  status: GiftCardStatus;
  expiresAt?: string;
  amountToUse: number; // Amount the user wants to apply from this gift card
}

export interface ApplyGiftCardResponse {
  success: boolean;
  valid: boolean;
  giftCard?: {
    code: string;
    balance: number;
    currency: string;
    status: GiftCardStatus;
    expiresAt?: string;
  };
  error?: string;
  message?: string;
}

export async function applyGiftCard(
  tenantId: string,
  storefrontId: string,
  code: string
): Promise<ApplyGiftCardResponse> {
  const response = await fetch('/api/gift-cards/apply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
    body: JSON.stringify({ code }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      valid: false,
      error: data.error || 'Failed to apply gift card',
    };
  }

  return data;
}

// ========================================
// Helpers
// ========================================

function getDefaultTemplates(): GiftCardTemplate[] {
  return [
    {
      id: 'default-1',
      name: 'Classic Gift Card',
      description: 'A timeless gift for any occasion',
      amounts: [100, 500, 1000, 2000, 5000],
      allowCustomAmount: false,
      minAmount: 100,
      maxAmount: 50000,
    },
  ];
}

export function formatGiftCardCode(code: string): string {
  // Format as XXXX-XXXX-XXXX-XXXX
  const cleaned = code.replace(/-/g, '').toUpperCase();
  const parts = cleaned.match(/.{1,4}/g) || [];
  return parts.join('-');
}
