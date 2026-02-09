import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, CartItemStatus } from '@/types/storefront';
import { createSessionAwareStorage } from '@/lib/session-storage';
import {
  getCart,
  syncCart,
  mergeCart,
  clearCart as clearCartApi,
  validateCart as validateCartApi,
  getValidatedCart,
  removeUnavailableItems as removeUnavailableItemsApi,
  acceptPriceChanges as acceptPriceChangesApi,
  CartValidationResult,
} from '@/lib/api/cart';
import type { AppliedCoupon } from '@/lib/api/coupons';
import type { AppliedGiftCard } from '@/lib/api/gift-cards';
import { storefrontToast } from '@/components/ui/sonner';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isSyncing: boolean;
  isValidating: boolean;
  lastSyncedAt: string | null;
  lastValidatedAt: string | null;
  appliedCoupon: AppliedCoupon | null;
  appliedGiftCards: AppliedGiftCard[];

  // Validation state
  hasUnavailableItems: boolean;
  hasPriceChanges: boolean;
  unavailableCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  priceChangedCount: number;
  expiresAt: string | null;

  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Coupon actions
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
  clearAppliedCoupon: () => void;

  // Gift card actions
  addGiftCard: (giftCard: AppliedGiftCard) => void;
  removeGiftCard: (code: string) => void;
  updateGiftCardAmount: (code: string, amount: number) => void;
  clearGiftCards: () => void;
  getGiftCardTotal: () => number;

  // Selection actions (for selective checkout)
  toggleItemSelection: (itemId: string) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;
  removeSelectedItems: () => void;

  // Sync actions — auth is handled by session cookies, no accessToken needed
  loadFromBackend: (tenantId: string, storefrontId: string, customerId: string) => Promise<void>;
  syncToBackend: (tenantId: string, storefrontId: string, customerId: string) => Promise<void>;
  mergeGuestCart: (tenantId: string, storefrontId: string, customerId: string) => Promise<void>;
  clearBackendCart: (tenantId: string, storefrontId: string, customerId: string) => Promise<void>;

  // Validation actions
  validateCart: (tenantId: string, storefrontId: string, customerId: string) => Promise<void>;
  loadValidatedCart: (tenantId: string, storefrontId: string, customerId: string) => Promise<void>;
  removeUnavailableItems: (tenantId: string, storefrontId: string, customerId: string) => Promise<void>;
  acceptPriceChanges: (tenantId: string, storefrontId: string, customerId: string) => Promise<void>;

  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getSelectedItems: () => CartItem[];
  getSelectedCount: () => number;
  getSelectedTotal: () => number;
  areAllSelected: () => boolean;
  getDiscount: () => number;

  // Validation computed
  getUnavailableItems: () => CartItem[];
  getOutOfStockItems: () => CartItem[];
  getLowStockItems: () => CartItem[];
  getPriceChangedItems: () => CartItem[];
  getAvailableItems: () => CartItem[];
  hasIssues: () => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isSyncing: false,
      isValidating: false,
      lastSyncedAt: null,
      lastValidatedAt: null,
      appliedCoupon: null,
      appliedGiftCards: [],

      // Validation state
      hasUnavailableItems: false,
      hasPriceChanges: false,
      unavailableCount: 0,
      outOfStockCount: 0,
      lowStockCount: 0,
      priceChangedCount: 0,
      expiresAt: null,

      addItem: (item) => {
        let isUpdate = false;
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (i) => i.productId === item.productId && i.variantId === item.variantId
          );

          if (existingItemIndex > -1) {
            // Update quantity if item exists
            isUpdate = true;
            const updatedItems = [...state.items];
            const existingItem = updatedItems[existingItemIndex];
            if (existingItem) {
              const shippingUpdates = {
                weight: item.weight ?? existingItem.weight,
                weightUnit: item.weightUnit ?? existingItem.weightUnit,
                length: item.length ?? existingItem.length,
                width: item.width ?? existingItem.width,
                height: item.height ?? existingItem.height,
                dimensionUnit: item.dimensionUnit ?? existingItem.dimensionUnit,
              };
              updatedItems[existingItemIndex] = {
                ...existingItem,
                ...shippingUpdates,
                quantity: existingItem.quantity + item.quantity,
              };
            }
            return { items: updatedItems, isOpen: true };
          }

          // Add new item with selected: true by default and track price/time
          const newItem: CartItem = {
            ...item,
            id: `${item.productId}-${item.variantId || 'default'}-${Date.now()}`,
            selected: item.selected !== false, // Default to true unless explicitly false
            status: item.status || 'AVAILABLE',
            priceAtAdd: item.priceAtAdd || item.price,
            addedAt: item.addedAt || new Date().toISOString(),
          };
          return { items: [...state.items, newItem], isOpen: true };
        });
        // Show toast notification
        const itemName = item.name.length > 30 ? item.name.substring(0, 30) + '...' : item.name;
        const viewCartAction = { label: 'View Cart', onClick: () => { window.location.href = '/cart'; } };
        if (isUpdate) {
          storefrontToast.cart('Cart updated', `${itemName} quantity increased`, viewCartAction);
        } else {
          storefrontToast.cart('Added to cart', itemName, viewCartAction);
        }
      },

      removeItem: (itemId) => {
        const removedItem = get().items.find((item) => item.id === itemId);
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== itemId);
          // Recalculate validation counts after removing item
          const unavailableItems = newItems.filter((item) => item.status === 'UNAVAILABLE');
          const outOfStockItems = newItems.filter((item) => item.status === 'OUT_OF_STOCK');
          const lowStockItems = newItems.filter((item) => item.status === 'LOW_STOCK');
          const priceChangedItems = newItems.filter((item) => item.status === 'PRICE_CHANGED');

          return {
            items: newItems,
            hasUnavailableItems: unavailableItems.length > 0 || outOfStockItems.length > 0,
            hasPriceChanges: priceChangedItems.length > 0,
            unavailableCount: unavailableItems.length,
            outOfStockCount: outOfStockItems.length,
            lowStockCount: lowStockItems.length,
            priceChangedCount: priceChangedItems.length,
          };
        });
        // Show toast notification
        if (removedItem) {
          const itemName = removedItem.name.length > 30 ? removedItem.name.substring(0, 30) + '...' : removedItem.name;
          storefrontToast.info('Removed from cart', itemName);
        }
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity < 1) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        const hadItems = get().items.length > 0;
        set({ items: [] });
        if (hadItems) {
          storefrontToast.info('Cart cleared');
        }
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      // Coupon actions
      setAppliedCoupon: (coupon) => {
        set({ appliedCoupon: coupon });
        if (coupon) {
          storefrontToast.coupon('Coupon applied', `${coupon.coupon.code} - Save $${coupon.discountAmount.toFixed(2)}`);
        }
      },

      clearAppliedCoupon: () => {
        const hadCoupon = get().appliedCoupon !== null;
        set({ appliedCoupon: null });
        if (hadCoupon) {
          storefrontToast.info('Coupon removed');
        }
      },

      // Gift card actions
      addGiftCard: (giftCard) => {
        const isDuplicate = get().appliedGiftCards.some(gc => gc.code === giftCard.code);
        if (isDuplicate) {
          storefrontToast.warning('Gift card already applied');
          return;
        }
        set((state) => ({
          appliedGiftCards: [...state.appliedGiftCards, giftCard],
        }));
        storefrontToast.giftCard('Gift card applied', `$${giftCard.amountToUse.toFixed(2)} applied to order`);
      },

      removeGiftCard: (code) => {
        set((state) => ({
          appliedGiftCards: state.appliedGiftCards.filter(gc => gc.code !== code),
        }));
        storefrontToast.info('Gift card removed');
      },

      updateGiftCardAmount: (code, amount) => {
        set((state) => ({
          appliedGiftCards: state.appliedGiftCards.map(gc =>
            gc.code === code ? { ...gc, amountToUse: Math.min(amount, gc.balance) } : gc
          ),
        }));
      },

      clearGiftCards: () => {
        set({ appliedGiftCards: [] });
      },

      getGiftCardTotal: () => {
        return get().appliedGiftCards.reduce((sum, gc) => sum + gc.amountToUse, 0);
      },

      // Selection actions for selective checkout
      toggleItemSelection: (itemId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, selected: !(item.selected !== false) } : item
          ),
        }));
      },

      selectAllItems: () => {
        set((state) => ({
          items: state.items.map((item) => ({ ...item, selected: true })),
        }));
      },

      deselectAllItems: () => {
        set((state) => ({
          items: state.items.map((item) => ({ ...item, selected: false })),
        }));
      },

      removeSelectedItems: () => {
        set((state) => ({
          items: state.items.filter((item) => item.selected === false),
        }));
      },

      // Load cart from backend (on login or page load when authenticated)
      loadFromBackend: async (tenantId, storefrontId, customerId) => {
        set({ isSyncing: true });
        try {
          const data = await getCart(tenantId, storefrontId, customerId);
          set({
            items: data.items || [],
            lastSyncedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to load cart from backend:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // Sync local cart to backend
      syncToBackend: async (tenantId, storefrontId, customerId) => {
        const { items, isSyncing } = get();
        if (isSyncing) return;

        set({ isSyncing: true });
        try {
          await syncCart(tenantId, storefrontId, customerId, items);
          set({ lastSyncedAt: new Date().toISOString() });
        } catch (error) {
          console.error('Failed to sync cart to backend:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // Merge guest cart with backend cart on login
      mergeGuestCart: async (tenantId, storefrontId, customerId) => {
        const { items, isSyncing } = get();
        if (isSyncing || items.length === 0) {
          // No guest items to merge, just load from backend
          await get().loadFromBackend(tenantId, storefrontId, customerId);
          return;
        }

        set({ isSyncing: true });
        try {
          const data = await mergeCart(tenantId, storefrontId, customerId, items);
          set({
            items: data.items || [],
            lastSyncedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to merge cart:', error);
          // Fallback: try to load from backend
          try {
            await get().loadFromBackend(tenantId, storefrontId, customerId);
          } catch {
            // Keep local cart if everything fails
          }
        } finally {
          set({ isSyncing: false });
        }
      },

      // Clear cart on backend
      clearBackendCart: async (tenantId, storefrontId, customerId) => {
        set({ isSyncing: true });
        try {
          await clearCartApi(tenantId, storefrontId, customerId);
          set({ items: [], lastSyncedAt: new Date().toISOString() });
        } catch (error) {
          console.error('Failed to clear backend cart:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      },

      // Selection computed values
      getSelectedItems: () => {
        return get().items.filter((item) => item.selected !== false);
      },

      getSelectedCount: () => {
        return get().items.filter((item) => item.selected !== false)
          .reduce((sum, item) => sum + item.quantity, 0);
      },

      getSelectedTotal: () => {
        return get().items.filter((item) => item.selected !== false)
          .reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      areAllSelected: () => {
        const items = get().items;
        return items.length > 0 && items.every((item) => item.selected !== false);
      },

      getDiscount: () => {
        const coupon = get().appliedCoupon;
        return coupon?.discountAmount || 0;
      },

      // Validation actions
      validateCart: async (tenantId, storefrontId, customerId) => {
        const { isValidating } = get();
        if (isValidating) return;

        set({ isValidating: true });
        try {
          const result = await validateCartApi(tenantId, storefrontId, customerId);
          set({
            items: result.items || [],
            hasUnavailableItems: result.hasUnavailableItems,
            hasPriceChanges: result.hasPriceChanges,
            unavailableCount: result.unavailableCount,
            outOfStockCount: result.outOfStockCount,
            lowStockCount: result.lowStockCount,
            priceChangedCount: result.priceChangedCount,
            lastValidatedAt: result.validatedAt,
            expiresAt: result.expiresAt || null,
          });
        } catch (error) {
          console.error('Failed to validate cart:', error);
        } finally {
          set({ isValidating: false });
        }
      },

      loadValidatedCart: async (tenantId, storefrontId, customerId) => {
        set({ isSyncing: true });
        try {
          const data = await getValidatedCart(tenantId, storefrontId, customerId);
          set({
            items: data.items || [],
            hasUnavailableItems: data.hasUnavailableItems || false,
            hasPriceChanges: data.hasPriceChanges || false,
            unavailableCount: data.unavailableCount || 0,
            outOfStockCount: data.outOfStockCount || 0,
            lowStockCount: data.lowStockCount || 0,
            priceChangedCount: data.priceChangedCount || 0,
            lastValidatedAt: data.lastValidatedAt || null,
            expiresAt: data.expiresAt || null,
            lastSyncedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to load validated cart:', error);
          // Fallback to regular load
          await get().loadFromBackend(tenantId, storefrontId, customerId);
        } finally {
          set({ isSyncing: false });
        }
      },

      removeUnavailableItems: async (tenantId, storefrontId, customerId) => {
        set({ isSyncing: true });
        try {
          const data = await removeUnavailableItemsApi(tenantId, storefrontId, customerId);
          set({
            items: data.items || [],
            hasUnavailableItems: false,
            unavailableCount: 0,
            outOfStockCount: 0,
            lastSyncedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to remove unavailable items:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      acceptPriceChanges: async (tenantId, storefrontId, customerId) => {
        set({ isSyncing: true });
        try {
          const data = await acceptPriceChangesApi(tenantId, storefrontId, customerId);
          set({
            items: data.items || [],
            hasPriceChanges: false,
            priceChangedCount: 0,
            lastSyncedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to accept price changes:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // Validation computed values
      getUnavailableItems: () => {
        return get().items.filter((item) => item.status === 'UNAVAILABLE');
      },

      getOutOfStockItems: () => {
        return get().items.filter((item) => item.status === 'OUT_OF_STOCK');
      },

      getLowStockItems: () => {
        return get().items.filter((item) => item.status === 'LOW_STOCK');
      },

      getPriceChangedItems: () => {
        return get().items.filter((item) => item.status === 'PRICE_CHANGED');
      },

      getAvailableItems: () => {
        return get().items.filter((item) =>
          !item.status || item.status === 'AVAILABLE' || item.status === 'LOW_STOCK'
        );
      },

      hasIssues: () => {
        const state = get();
        return state.hasUnavailableItems || state.hasPriceChanges;
      },
    }),
    {
      name: 'storefront-cart',
      // Use session-aware storage: sessionStorage + TTL for anonymous, localStorage for authenticated
      storage: createJSONStorage(() => createSessionAwareStorage('storefront-cart')),
      partialize: (state) => ({
        items: state.items,
        lastSyncedAt: state.lastSyncedAt,
        lastValidatedAt: state.lastValidatedAt,
        appliedCoupon: state.appliedCoupon,
        appliedGiftCards: state.appliedGiftCards,
        hasUnavailableItems: state.hasUnavailableItems,
        hasPriceChanges: state.hasPriceChanges,
        expiresAt: state.expiresAt,
      }),
    }
  )
);
