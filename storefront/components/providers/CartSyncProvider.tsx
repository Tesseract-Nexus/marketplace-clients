'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { useTenant } from '@/context/TenantContext';
import {
  hasAnonymousSessionData,
  clearAnonymousSessionData,
  cleanupExpiredSessionData,
  getRemainingTTL,
  startPeriodicTTLCleanup,
  stopPeriodicTTLCleanup,
} from '@/lib/session-storage';

// Debounce delay for cart sync (5 seconds after last change)
const SYNC_DEBOUNCE_MS = 5000;

// Store names for session data
const CART_STORE_NAME = 'storefront-cart';
const WISHLIST_STORE_NAME = 'storefront-wishlist';

interface CartSyncProviderProps {
  children: React.ReactNode;
}

export function CartSyncProvider({ children }: CartSyncProviderProps) {
  const { tenant } = useTenant();
  const { customer, accessToken, isAuthenticated } = useAuthStore();
  const { items, mergeGuestCart, syncToBackend, loadFromBackend } = useCartStore();
  const { items: wishlistItems, syncToBackend: syncWishlistToBackend, loadFromBackend: loadWishlistFromBackend } = useWishlistStore();

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedItemsRef = useRef<string>('');
  const hasHandledSessionMigrationRef = useRef(false);

  // Cleanup expired session data on mount and start periodic cleanup
  useEffect(() => {
    cleanupExpiredSessionData();

    // Log remaining TTL for debugging
    const cartTTL = getRemainingTTL(CART_STORE_NAME);
    const wishlistTTL = getRemainingTTL(WISHLIST_STORE_NAME);

    if (cartTTL > 0) {
      console.log(`[CartSyncProvider] Anonymous cart expires in ${Math.round(cartTTL / 60000)} minutes`);
    }
    if (wishlistTTL > 0) {
      console.log(`[CartSyncProvider] Anonymous wishlist expires in ${Math.round(wishlistTTL / 60000)} minutes`);
    }

    // Start periodic cleanup for anonymous sessions
    startPeriodicTTLCleanup(
      (storeName) => {
        // On expiration, clear local store state
        if (storeName === CART_STORE_NAME) {
          console.log('[CartSyncProvider] Cart session expired, clearing local state');
        } else if (storeName === WISHLIST_STORE_NAME) {
          console.log('[CartSyncProvider] Wishlist session expired, clearing local state');
        }
      },
      (storeName, remainingMs) => {
        // On expiration warning (30 min before)
        const minutes = Math.round(remainingMs / 60000);
        console.log(`[CartSyncProvider] Warning: ${storeName} session expires in ${minutes} minutes. Sign in to save your data.`);
      }
    );

    // Cleanup on unmount
    return () => {
      stopPeriodicTTLCleanup();
    };
  }, []);

  // Handle session data migration when user becomes authenticated
  useEffect(() => {
    if (hasHandledSessionMigrationRef.current) return;
    if (!isAuthenticated || !customer?.id || !accessToken || !tenant?.id || !tenant?.storefrontId) return;

    const migrateSessionData = async () => {
      console.log('[CartSyncProvider] Checking for anonymous session data to migrate...');

      const hasCartData = hasAnonymousSessionData(CART_STORE_NAME);
      const hasWishlistData = hasAnonymousSessionData(WISHLIST_STORE_NAME);

      if (hasCartData || hasWishlistData) {
        console.log('[CartSyncProvider] Found anonymous session data, migrating to authenticated storage...');

        try {
          // Merge cart data with backend
          if (hasCartData && items.length > 0) {
            console.log(`[CartSyncProvider] Merging ${items.length} cart items...`);
            await mergeGuestCart(tenant.id, tenant.storefrontId, customer.id, accessToken);
            // Clear session data after successful merge
            clearAnonymousSessionData(CART_STORE_NAME);
            console.log('[CartSyncProvider] Cart data migrated successfully');
          }

          // Sync wishlist data to backend
          if (hasWishlistData && wishlistItems.length > 0) {
            console.log(`[CartSyncProvider] Syncing ${wishlistItems.length} wishlist items...`);
            await syncWishlistToBackend(tenant.id, tenant.storefrontId, customer.id, accessToken);
            // Clear session data after successful sync
            clearAnonymousSessionData(WISHLIST_STORE_NAME);
            console.log('[CartSyncProvider] Wishlist data migrated successfully');
          }
        } catch (error) {
          console.error('[CartSyncProvider] Failed to migrate session data:', error);
          // Don't clear session data on error - let user retry
        }
      } else {
        // No anonymous session data, load from backend instead
        console.log('[CartSyncProvider] No anonymous session data, loading from backend...');
        try {
          await loadFromBackend(tenant.id, tenant.storefrontId, customer.id, accessToken);
          await loadWishlistFromBackend(tenant.id, tenant.storefrontId, customer.id, accessToken);
        } catch (error) {
          console.error('[CartSyncProvider] Failed to load data from backend:', error);
        }
      }

      hasHandledSessionMigrationRef.current = true;
    };

    migrateSessionData();
  }, [
    isAuthenticated,
    customer?.id,
    accessToken,
    tenant?.id,
    tenant?.storefrontId,
    items,
    wishlistItems,
    mergeGuestCart,
    syncWishlistToBackend,
    loadFromBackend,
    loadWishlistFromBackend,
  ]);

  // Debounced sync on cart changes
  const syncCart = useCallback(async () => {
    if (!isAuthenticated || !customer?.id || !accessToken || !tenant?.id || !tenant?.storefrontId) {
      return;
    }

    const itemsJson = JSON.stringify(items);

    // Skip if items haven't changed since last sync
    if (itemsJson === lastSyncedItemsRef.current) {
      return;
    }

    try {
      await syncToBackend(tenant.id, tenant.storefrontId, customer.id, accessToken);
      lastSyncedItemsRef.current = itemsJson;
      console.log('[CartSyncProvider] Cart synced to backend');
    } catch (error) {
      console.error('[CartSyncProvider] Failed to sync cart:', error);
    }
  }, [isAuthenticated, customer?.id, accessToken, tenant?.id, tenant?.storefrontId, items, syncToBackend]);

  // Watch for cart changes and sync with debounce
  useEffect(() => {
    if (!isAuthenticated || !customer?.id) {
      return;
    }

    // Clear any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Schedule sync after debounce period
    syncTimeoutRef.current = setTimeout(() => {
      syncCart();
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [items, isAuthenticated, customer?.id, syncCart]);

  // Sync on page unload (best effort)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isAuthenticated && customer?.id && accessToken && tenant?.id && tenant?.storefrontId) {
        // Use sendBeacon for reliable sync on page unload
        const itemsJson = JSON.stringify(items);
        if (itemsJson !== lastSyncedItemsRef.current) {
          navigator.sendBeacon?.(
            `/api/cart/sync`,
            JSON.stringify({
              tenantId: tenant.id,
              storefrontId: tenant.storefrontId,
              customerId: customer.id,
              items,
            })
          );
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated, customer?.id, accessToken, tenant?.id, tenant?.storefrontId, items]);

  return <>{children}</>;
}
