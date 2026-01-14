import { config } from '@/lib/config';

export interface WishlistItem {
  id?: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  addedAt?: string;
}

interface WishlistResponse {
  items: WishlistItem[];
  count: number;
}

// Get wishlist from backend
export async function getWishlist(
  tenantId: string,
  storefrontId: string,
  customerId: string,
  accessToken: string
): Promise<WishlistResponse> {
  const response = await fetch(
    `${config.api.customersService}/api/v1/customers/${customerId}/wishlist`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch wishlist');
  }

  return response.json();
}

// Add item to wishlist
export async function addToWishlist(
  tenantId: string,
  storefrontId: string,
  customerId: string,
  accessToken: string,
  item: Omit<WishlistItem, 'id' | 'addedAt'>
): Promise<WishlistItem> {
  const response = await fetch(
    `${config.api.customersService}/api/v1/customers/${customerId}/wishlist`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
      body: JSON.stringify(item),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to add to wishlist');
  }

  const data = await response.json();
  return data.item;
}

// Remove item from wishlist
export async function removeFromWishlist(
  tenantId: string,
  storefrontId: string,
  customerId: string,
  accessToken: string,
  productId: string
): Promise<void> {
  const response = await fetch(
    `${config.api.customersService}/api/v1/customers/${customerId}/wishlist/${productId}`,
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
    throw new Error('Failed to remove from wishlist');
  }
}

// Sync entire wishlist to backend
export async function syncWishlist(
  tenantId: string,
  storefrontId: string,
  customerId: string,
  accessToken: string,
  items: Omit<WishlistItem, 'id' | 'addedAt'>[]
): Promise<WishlistResponse> {
  const response = await fetch(
    `${config.api.customersService}/api/v1/customers/${customerId}/wishlist`,
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
    throw new Error('Failed to sync wishlist');
  }

  return response.json();
}

// Clear wishlist
export async function clearWishlist(
  tenantId: string,
  storefrontId: string,
  customerId: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `${config.api.customersService}/api/v1/customers/${customerId}/wishlist`,
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
    throw new Error('Failed to clear wishlist');
  }
}
