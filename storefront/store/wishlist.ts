/**
 * Wishlist Store
 *
 * KNOWN GAP: Variant support
 * Currently, wishlist items are keyed by productId only. If a product has multiple
 * variants (e.g., size, color), adding the same product in different variants will
 * be treated as duplicates. To support variants, WishlistItem needs a variantId field,
 * and deduplication logic (addItem, isInWishlist, mergeGuestWishlist) must key on
 * (productId, variantId) pairs instead of productId alone. The backend wishlist
 * endpoint also needs to support variantId. See GitHub issue #43.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  getWishlist,
  addToWishlist as addToWishlistApi,
  removeFromWishlist as removeFromWishlistApi,
  syncWishlist,
  mergeWishlist,
  clearWishlist as clearWishlistApi,
} from '@/lib/api/wishlist';
import { createSessionAwareStorage } from '@/lib/session-storage';

interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  addedAt: string;
}

interface WishlistState {
  items: WishlistItem[];
  isSyncing: boolean;
  lastSyncedAt: string | null;

  // Actions
  addItem: (item: Omit<WishlistItem, 'addedAt'>) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: Omit<WishlistItem, 'addedAt'>) => void;
  clearWishlist: () => void;

  // Sync actions
  loadFromBackend: (tenantId: string, storefrontId: string, customerId: string, accessToken: string) => Promise<void>;
  syncToBackend: (tenantId: string, storefrontId: string, customerId: string, accessToken: string) => Promise<void>;
  mergeGuestWishlist: (tenantId: string, storefrontId: string, customerId: string, accessToken: string) => Promise<void>;
  addAndSync: (tenantId: string, storefrontId: string, customerId: string, accessToken: string, item: Omit<WishlistItem, 'addedAt'>) => Promise<void>;
  removeAndSync: (tenantId: string, storefrontId: string, customerId: string, accessToken: string, productId: string) => Promise<void>;

  // Queries
  isInWishlist: (productId: string) => boolean;
  getItemCount: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isSyncing: false,
      lastSyncedAt: null,

      addItem: (item) => {
        set((state) => {
          if (state.items.some((i) => i.productId === item.productId)) {
            return state;
          }
          return {
            items: [
              ...state.items,
              { ...item, addedAt: new Date().toISOString() },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      toggleItem: (item) => {
        const exists = get().isInWishlist(item.productId);
        if (exists) {
          get().removeItem(item.productId);
        } else {
          get().addItem(item);
        }
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      // Load wishlist from backend
      loadFromBackend: async (tenantId, storefrontId, customerId, accessToken) => {
        set({ isSyncing: true });
        try {
          const data = await getWishlist(tenantId, storefrontId, customerId, accessToken);
          const items = (data.items || []).map((item) => ({
            productId: item.productId,
            name: item.productName,
            price: item.productPrice,
            image: item.productImage,
            addedAt: item.addedAt || new Date().toISOString(),
          }));
          set({
            items,
            lastSyncedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to load wishlist from backend:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // Sync entire wishlist to backend
      syncToBackend: async (tenantId, storefrontId, customerId, accessToken) => {
        const { items, isSyncing } = get();
        if (isSyncing) return;

        set({ isSyncing: true });
        try {
          const apiItems = items.map((item) => ({
            productId: item.productId,
            productName: item.name,
            productPrice: item.price,
            productImage: item.image,
          }));
          await syncWishlist(tenantId, storefrontId, customerId, accessToken, apiItems);
          set({ lastSyncedAt: new Date().toISOString() });
        } catch (error) {
          console.error('Failed to sync wishlist to backend:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // Merge guest wishlist with backend on login
      mergeGuestWishlist: async (tenantId, storefrontId, customerId, accessToken) => {
        const { items, isSyncing } = get();
        if (isSyncing || items.length === 0) {
          // No guest items to merge, just load from backend
          await get().loadFromBackend(tenantId, storefrontId, customerId, accessToken);
          return;
        }

        set({ isSyncing: true });
        try {
          const guestItems = items.map((item) => ({
            productId: item.productId,
            productName: item.name,
            productPrice: item.price,
            productImage: item.image,
          }));
          const data = await mergeWishlist(tenantId, storefrontId, customerId, accessToken, guestItems);
          const mergedItems = (data.items || []).map((item) => ({
            productId: item.productId,
            name: item.productName,
            price: item.productPrice,
            image: item.productImage,
            addedAt: item.addedAt || new Date().toISOString(),
          }));
          set({
            items: mergedItems,
            lastSyncedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to merge wishlist:', error);
          // Fallback: try to load from backend
          try {
            await get().loadFromBackend(tenantId, storefrontId, customerId, accessToken);
          } catch {
            // Keep local wishlist if everything fails
          }
        } finally {
          set({ isSyncing: false });
        }
      },

      // Add item and sync to backend
      addAndSync: async (tenantId, storefrontId, customerId, accessToken, item) => {
        // Add locally first for instant feedback
        get().addItem(item);

        // Then sync to backend
        set({ isSyncing: true });
        try {
          await addToWishlistApi(tenantId, storefrontId, customerId, accessToken, {
            productId: item.productId,
            productName: item.name,
            productPrice: item.price,
            productImage: item.image,
          });
          set({ lastSyncedAt: new Date().toISOString() });
        } catch (error) {
          console.error('Failed to add to wishlist on backend:', error);
          // Keep local change even if backend fails
        } finally {
          set({ isSyncing: false });
        }
      },

      // Remove item and sync to backend
      removeAndSync: async (tenantId, storefrontId, customerId, accessToken, productId) => {
        // Remove locally first for instant feedback
        get().removeItem(productId);

        // Then sync to backend
        set({ isSyncing: true });
        try {
          await removeFromWishlistApi(tenantId, storefrontId, customerId, accessToken, productId);
          set({ lastSyncedAt: new Date().toISOString() });
        } catch (error) {
          console.error('Failed to remove from wishlist on backend:', error);
          // Keep local change even if backend fails
        } finally {
          set({ isSyncing: false });
        }
      },

      isInWishlist: (productId) => {
        return get().items.some((item) => item.productId === productId);
      },

      getItemCount: () => {
        return get().items.length;
      },
    }),
    {
      name: 'storefront-wishlist',
      // Use session-aware storage: sessionStorage + TTL for anonymous, localStorage for authenticated
      storage: createJSONStorage(() => createSessionAwareStorage('storefront-wishlist')),
      partialize: (state): Partial<WishlistState> => ({ items: state.items, lastSyncedAt: state.lastSyncedAt }) as WishlistState,
    }
  )
);
