import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { cartApi } from '@/lib/api/cart';

import type { AddToCartRequest, CheckoutRequest } from '@/types/api';
import type {
  Address,
  Cart,
  CartItem,
  CartValidationResult,
  Order,
  Product,
  ProductVariant,
} from '@/types/entities';

interface CartState {
  // State
  cart: Cart | null;
  isLoading: boolean;
  isUpdating: boolean;
  isCheckingOut: boolean;
  isValidating: boolean;
  error: string | null;
  lastValidatedAt: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  fetchValidatedCart: () => Promise<void>;
  addItem: (
    product: Product,
    variant?: ProductVariant,
    quantity?: number,
    properties?: Record<string, string>
  ) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  incrementItem: (itemId: string) => Promise<void>;
  decrementItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: (code: string) => Promise<void>;
  setShippingAddress: (address: Address) => Promise<void>;
  setBillingAddress: (address: Address) => Promise<void>;
  setShippingMethod: (methodId: string) => Promise<void>;
  checkout: (data: CheckoutRequest) => Promise<Order>;

  // Validation actions
  validateCart: () => Promise<CartValidationResult | null>;
  removeUnavailableItems: () => Promise<void>;
  acceptPriceChanges: () => Promise<void>;

  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getUnavailableItems: () => CartItem[];
  getOutOfStockItems: () => CartItem[];
  getLowStockItems: () => CartItem[];
  getPriceChangedItems: () => CartItem[];
  getAvailableItems: () => CartItem[];
  hasIssues: () => boolean;

  clearError: () => void;
  reset: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      cart: null,
      isLoading: false,
      isUpdating: false,
      isCheckingOut: false,
      isValidating: false,
      error: null,
      lastValidatedAt: null,

      // Fetch cart from server
      fetchCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const cart = await cartApi.get();
          set({ cart, isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch cart',
          });
        }
      },

      // Fetch cart with validation
      fetchValidatedCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const cart = await cartApi.getValidated();
          set({
            cart,
            isLoading: false,
            lastValidatedAt: cart.last_validated_at || new Date().toISOString(),
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch validated cart',
          });
        }
      },

      // Add item to cart
      addItem: async (
        product: Product,
        variant?: ProductVariant,
        quantity = 1,
        properties?: Record<string, string>
      ) => {
        set({ isUpdating: true, error: null });
        try {
          const request: AddToCartRequest = {
            product_id: product.id,
            variant_id: variant?.id,
            quantity,
            properties,
          };

          const cart = await cartApi.addItem(request);
          set({ cart, isUpdating: false });
        } catch (error) {
          set({
            isUpdating: false,
            error: error instanceof Error ? error.message : 'Failed to add item',
          });
          throw error;
        }
      },

      // Update item quantity
      updateItemQuantity: async (itemId: string, quantity: number) => {
        if (quantity < 1) {
          return get().removeItem(itemId);
        }

        set({ isUpdating: true, error: null });
        try {
          const cart = await cartApi.updateItem(itemId, { item_id: itemId, quantity });
          set({ cart, isUpdating: false });
        } catch (error) {
          set({
            isUpdating: false,
            error: error instanceof Error ? error.message : 'Failed to update item',
          });
          throw error;
        }
      },

      // Remove item
      removeItem: async (itemId: string) => {
        set({ isUpdating: true, error: null });
        try {
          const cart = await cartApi.removeItem(itemId);
          set({ cart, isUpdating: false });
        } catch (error) {
          set({
            isUpdating: false,
            error: error instanceof Error ? error.message : 'Failed to remove item',
          });
          throw error;
        }
      },

      // Increment item quantity
      incrementItem: async (itemId: string) => {
        const { cart } = get();
        const item = cart?.items.find((i) => i.id === itemId);
        if (item) {
          await get().updateItemQuantity(itemId, item.quantity + 1);
        }
      },

      // Decrement item quantity
      decrementItem: async (itemId: string) => {
        const { cart } = get();
        const item = cart?.items.find((i) => i.id === itemId);
        if (item) {
          if (item.quantity <= 1) {
            await get().removeItem(itemId);
          } else {
            await get().updateItemQuantity(itemId, item.quantity - 1);
          }
        }
      },

      // Clear all items
      clearCart: async () => {
        set({ isUpdating: true, error: null });
        try {
          const cart = await cartApi.clear();
          set({ cart, isUpdating: false });
        } catch (error) {
          set({
            isUpdating: false,
            error: error instanceof Error ? error.message : 'Failed to clear cart',
          });
          throw error;
        }
      },

      // Apply coupon
      applyCoupon: async (code: string) => {
        set({ isUpdating: true, error: null });
        try {
          const cart = await cartApi.applyCoupon(code);
          set({ cart, isUpdating: false });
        } catch (error) {
          set({
            isUpdating: false,
            error: error instanceof Error ? error.message : 'Invalid coupon code',
          });
          throw error;
        }
      },

      // Remove coupon
      removeCoupon: async (code: string) => {
        set({ isUpdating: true, error: null });
        try {
          const cart = await cartApi.removeCoupon(code);
          set({ cart, isUpdating: false });
        } catch (error) {
          set({
            isUpdating: false,
            error: error instanceof Error ? error.message : 'Failed to remove coupon',
          });
          throw error;
        }
      },

      // Set shipping address
      setShippingAddress: async (address: Address) => {
        set({ isUpdating: true, error: null });
        try {
          const cart = await cartApi.setShippingAddress(address);
          set({ cart, isUpdating: false });
        } catch (error) {
          set({
            isUpdating: false,
            error: error instanceof Error ? error.message : 'Failed to set shipping address',
          });
          throw error;
        }
      },

      // Set billing address
      setBillingAddress: async (address: Address) => {
        set({ isUpdating: true, error: null });
        try {
          const cart = await cartApi.setBillingAddress(address);
          set({ cart, isUpdating: false });
        } catch (error) {
          set({
            isUpdating: false,
            error: error instanceof Error ? error.message : 'Failed to set billing address',
          });
          throw error;
        }
      },

      // Set shipping method
      setShippingMethod: async (methodId: string) => {
        set({ isUpdating: true, error: null });
        try {
          const cart = await cartApi.setShippingMethod(methodId);
          set({ cart, isUpdating: false });
        } catch (error) {
          set({
            isUpdating: false,
            error: error instanceof Error ? error.message : 'Failed to set shipping method',
          });
          throw error;
        }
      },

      // Checkout
      checkout: async (data: CheckoutRequest) => {
        set({ isCheckingOut: true, error: null });
        try {
          const order = await cartApi.checkout(data);

          // Clear local cart after successful checkout
          set({
            cart: null,
            isCheckingOut: false,
          });

          return order;
        } catch (error) {
          set({
            isCheckingOut: false,
            error: error instanceof Error ? error.message : 'Checkout failed',
          });
          throw error;
        }
      },

      // Get item count
      getItemCount: () => {
        const { cart } = get();
        return cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
      },

      // Get subtotal
      getSubtotal: () => {
        const { cart } = get();
        return cart?.subtotal || 0;
      },

      // Validate cart
      validateCart: async () => {
        const { isValidating } = get();
        if (isValidating) {
          return null;
        }

        set({ isValidating: true, error: null });
        try {
          const result = await cartApi.validateItems();
          set({
            cart: { ...get().cart, items: result.items },
            isValidating: false,
            lastValidatedAt: result.validated_at,
          });
          return result;
        } catch (error) {
          set({
            isValidating: false,
            error: error instanceof Error ? error.message : 'Failed to validate cart',
          });
          return null;
        }
      },

      // Remove unavailable items
      removeUnavailableItems: async () => {
        set({ isUpdating: true, error: null });
        try {
          const cart = await cartApi.removeUnavailableItems();
          set({ cart, isUpdating: false });
        } catch (error) {
          set({
            isUpdating: false,
            error: error instanceof Error ? error.message : 'Failed to remove unavailable items',
          });
          throw error;
        }
      },

      // Accept price changes
      acceptPriceChanges: async () => {
        set({ isUpdating: true, error: null });
        try {
          const cart = await cartApi.acceptPriceChanges();
          set({ cart, isUpdating: false });
        } catch (error) {
          set({
            isUpdating: false,
            error: error instanceof Error ? error.message : 'Failed to accept price changes',
          });
          throw error;
        }
      },

      // Get unavailable items
      getUnavailableItems: () => {
        const { cart } = get();
        return cart?.items.filter((item) => item.status === 'UNAVAILABLE') || [];
      },

      // Get out of stock items
      getOutOfStockItems: () => {
        const { cart } = get();
        return cart?.items.filter((item) => item.status === 'OUT_OF_STOCK') || [];
      },

      // Get low stock items
      getLowStockItems: () => {
        const { cart } = get();
        return cart?.items.filter((item) => item.status === 'LOW_STOCK') || [];
      },

      // Get price changed items
      getPriceChangedItems: () => {
        const { cart } = get();
        return cart?.items.filter((item) => item.status === 'PRICE_CHANGED') || [];
      },

      // Get available items
      getAvailableItems: () => {
        const { cart } = get();
        return (
          cart?.items.filter(
            (item) => !item.status || item.status === 'AVAILABLE' || item.status === 'LOW_STOCK'
          ) || []
        );
      },

      // Check if cart has issues
      hasIssues: () => {
        const { cart } = get();
        return !!(cart?.has_unavailable_items || cart?.has_price_changes);
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Reset store
      reset: () => {
        set({
          cart: null,
          isLoading: false,
          isUpdating: false,
          isCheckingOut: false,
          isValidating: false,
          error: null,
          lastValidatedAt: null,
        });
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cart: state.cart,
        lastValidatedAt: state.lastValidatedAt,
      }),
    }
  )
);

// Selector hooks
export const useCart = () => useCartStore((state) => state.cart);
export const useCartItems = () => useCartStore((state) => state.cart?.items || []);
export const useCartItemCount = () => useCartStore((state) => state.getItemCount());
export const useCartSubtotal = () => useCartStore((state) => state.cart?.subtotal || 0);
export const useCartTotal = () => useCartStore((state) => state.cart?.total || 0);
export const useCartLoading = () => useCartStore((state) => state.isLoading);
export const useCartUpdating = () => useCartStore((state) => state.isUpdating);
export const useCartValidating = () => useCartStore((state) => state.isValidating);
export const useCartHasIssues = () => useCartStore((state) => state.hasIssues());
export const useCartUnavailableItems = () => useCartStore((state) => state.getUnavailableItems());
export const useCartPriceChangedItems = () => useCartStore((state) => state.getPriceChangedItems());
