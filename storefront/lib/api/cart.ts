import { CartItem, CartItemStatus } from '@/types/storefront';

export interface CartResponse {
  id?: string;
  items: CartItem[];
  subtotal: number;
  originalSubtotal?: number;
  itemCount: number;
  hasUnavailableItems?: boolean;
  hasPriceChanges?: boolean;
  unavailableCount?: number;
  outOfStockCount?: number;
  lowStockCount?: number;
  priceChangedCount?: number;
  expiresAt?: string;
  lastValidatedAt?: string;
}

export interface CartValidationResult {
  cartId: string;
  items: CartItem[];
  subtotal: number;
  originalSubtotal: number;
  hasUnavailableItems: boolean;
  hasPriceChanges: boolean;
  unavailableCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  priceChangedCount: number;
  validatedAt: string;
  expiresAt?: string;
}

// Get cart from backend via API route
// Note: customerId is extracted from accessToken on the server (IDOR protection)
export async function getCart(
  tenantId: string,
  storefrontId: string,
  _customerId: string, // Kept for API compatibility, but server extracts from token
  accessToken: string
): Promise<CartResponse> {
  const response = await fetch(
    `/api/cart`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch cart');
  }

  return response.json();
}

// Sync entire cart to backend via API route
// Note: customerId is extracted from accessToken on the server (IDOR protection)
export async function syncCart(
  tenantId: string,
  storefrontId: string,
  _customerId: string, // Kept for API compatibility, but server extracts from token
  accessToken: string,
  items: CartItem[]
): Promise<CartResponse> {
  const response = await fetch(
    `/api/cart`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
      body: JSON.stringify({ items }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to sync cart');
  }

  return response.json();
}

// Merge guest cart with customer cart on login via API route
// Note: customerId is extracted from accessToken on the server (IDOR protection)
export async function mergeCart(
  tenantId: string,
  storefrontId: string,
  _customerId: string, // Kept for API compatibility, but server extracts from token
  accessToken: string,
  guestItems: CartItem[]
): Promise<CartResponse> {
  const response = await fetch(
    `/api/cart/merge`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
      body: JSON.stringify({ guestItems }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to merge cart');
  }

  return response.json();
}

// Clear cart via API route
// Note: customerId is extracted from accessToken on the server (IDOR protection)
export async function clearCart(
  tenantId: string,
  storefrontId: string,
  _customerId: string, // Kept for API compatibility, but server extracts from token
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `/api/cart`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to clear cart');
  }
}

// Validate cart items against current product data
// Note: customerId is extracted from accessToken on the server (IDOR protection)
export async function validateCart(
  tenantId: string,
  storefrontId: string,
  _customerId: string, // Kept for API compatibility, but server extracts from token
  accessToken: string
): Promise<CartValidationResult> {
  const response = await fetch(
    `/api/cart/validate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to validate cart');
  }

  return response.json();
}

// Get cart with validation (combines get + validate)
// Note: customerId is extracted from accessToken on the server (IDOR protection)
export async function getValidatedCart(
  tenantId: string,
  storefrontId: string,
  _customerId: string, // Kept for API compatibility, but server extracts from token
  accessToken: string
): Promise<CartResponse> {
  const response = await fetch(
    `/api/cart?validate=true`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch validated cart');
  }

  return response.json();
}

// Remove all unavailable items from cart
// Note: customerId is extracted from accessToken on the server (IDOR protection)
export async function removeUnavailableItems(
  tenantId: string,
  storefrontId: string,
  _customerId: string, // Kept for API compatibility, but server extracts from token
  accessToken: string
): Promise<CartResponse> {
  const response = await fetch(
    `/api/cart/unavailable`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to remove unavailable items');
  }

  return response.json();
}

// Accept all price changes in cart
// Note: customerId is extracted from accessToken on the server (IDOR protection)
export async function acceptPriceChanges(
  tenantId: string,
  storefrontId: string,
  _customerId: string, // Kept for API compatibility, but server extracts from token
  accessToken: string
): Promise<CartResponse> {
  const response = await fetch(
    `/api/cart/accept-prices`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to accept price changes');
  }

  return response.json();
}
