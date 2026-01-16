import { ENDPOINTS } from '../constants';

import { apiDelete, apiGet, apiPost, apiPut } from './client';

import type { AddToCartRequest, CheckoutRequest, UpdateCartItemRequest } from '@/types/api';
import type { Cart, CartValidationResult, Order, Address } from '@/types/entities';

export interface ShippingRate {
  id: string;
  name: string;
  description?: string;
  carrier: string;
  price: number;
  estimated_days: number;
  is_default?: boolean;
}

export const cartApi = {
  /**
   * Get current cart
   */
  get: async (): Promise<Cart> => {
    const response = await apiGet<Cart>(ENDPOINTS.CART.GET);
    return response.data;
  },

  /**
   * Add item to cart
   */
  addItem: async (data: AddToCartRequest): Promise<Cart> => {
    const response = await apiPost<Cart>(ENDPOINTS.CART.ADD_ITEM, data);
    return response.data;
  },

  /**
   * Update cart item quantity
   */
  updateItem: async (itemId: string, data: UpdateCartItemRequest): Promise<Cart> => {
    const response = await apiPut<Cart>(ENDPOINTS.CART.UPDATE_ITEM(itemId), data);
    return response.data;
  },

  /**
   * Remove item from cart
   */
  removeItem: async (itemId: string): Promise<Cart> => {
    const response = await apiDelete<Cart>(ENDPOINTS.CART.REMOVE_ITEM(itemId));
    return response.data;
  },

  /**
   * Clear all items from cart
   */
  clear: async (): Promise<Cart> => {
    const response = await apiPost<Cart>(ENDPOINTS.CART.CLEAR);
    return response.data;
  },

  /**
   * Apply coupon code
   */
  applyCoupon: async (code: string): Promise<Cart> => {
    const response = await apiPost<Cart>(ENDPOINTS.CART.APPLY_COUPON, { code });
    return response.data;
  },

  /**
   * Remove coupon code
   */
  removeCoupon: async (code: string): Promise<Cart> => {
    const response = await apiDelete<Cart>(`${ENDPOINTS.CART.REMOVE_COUPON}/${code}`);
    return response.data;
  },

  /**
   * Set shipping address
   */
  setShippingAddress: async (address: Address): Promise<Cart> => {
    const response = await apiPost<Cart>(ENDPOINTS.CART.SET_SHIPPING, { address });
    return response.data;
  },

  /**
   * Set billing address
   */
  setBillingAddress: async (address: Address): Promise<Cart> => {
    const response = await apiPost<Cart>(ENDPOINTS.CART.SET_BILLING, { address });
    return response.data;
  },

  /**
   * Get available shipping rates
   */
  getShippingRates: async (): Promise<ShippingRate[]> => {
    const response = await apiGet<ShippingRate[]>(`${ENDPOINTS.CART.GET}/shipping-rates`);
    return response.data;
  },

  /**
   * Set shipping method
   */
  setShippingMethod: async (shippingMethodId: string): Promise<Cart> => {
    const response = await apiPost<Cart>(`${ENDPOINTS.CART.GET}/shipping-method`, {
      shipping_method_id: shippingMethodId,
    });
    return response.data;
  },

  /**
   * Checkout - create order from cart
   */
  checkout: async (data: CheckoutRequest): Promise<Order> => {
    const response = await apiPost<Order>(ENDPOINTS.CART.CHECKOUT, data);
    return response.data;
  },

  /**
   * Validate cart before checkout
   */
  validate: async (): Promise<{
    valid: boolean;
    errors: { field: string; message: string }[];
  }> => {
    const response = await apiPost<{
      valid: boolean;
      errors: { field: string; message: string }[];
    }>(`${ENDPOINTS.CART.GET}/validate`);
    return response.data;
  },

  /**
   * Validate cart items against current product state
   */
  validateItems: async (): Promise<CartValidationResult> => {
    const response = await apiPost<CartValidationResult>(`${ENDPOINTS.CART.GET}/validate-items`);
    return response.data;
  },

  /**
   * Get cart with validation (combines get + validate)
   */
  getValidated: async (): Promise<Cart> => {
    const response = await apiGet<Cart>(`${ENDPOINTS.CART.GET}?validate=true`);
    return response.data;
  },

  /**
   * Remove all unavailable items from cart
   */
  removeUnavailableItems: async (): Promise<Cart> => {
    const response = await apiDelete<Cart>(`${ENDPOINTS.CART.GET}/unavailable`);
    return response.data;
  },

  /**
   * Accept all price changes in cart
   */
  acceptPriceChanges: async (): Promise<Cart> => {
    const response = await apiPost<Cart>(`${ENDPOINTS.CART.GET}/accept-prices`);
    return response.data;
  },

  /**
   * Update item properties
   */
  updateItemProperties: async (
    itemId: string,
    properties: Record<string, string>
  ): Promise<Cart> => {
    const response = await apiPut<Cart>(ENDPOINTS.CART.UPDATE_ITEM(itemId), { properties });
    return response.data;
  },

  /**
   * Increment item quantity
   */
  incrementItem: async (itemId: string): Promise<Cart> => {
    const cart = await cartApi.get();
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw new Error('Item not found in cart');
    }
    return cartApi.updateItem(itemId, { item_id: itemId, quantity: item.quantity + 1 });
  },

  /**
   * Decrement item quantity
   */
  decrementItem: async (itemId: string): Promise<Cart> => {
    const cart = await cartApi.get();
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw new Error('Item not found in cart');
    }
    if (item.quantity <= 1) {
      return cartApi.removeItem(itemId);
    }
    return cartApi.updateItem(itemId, { item_id: itemId, quantity: item.quantity - 1 });
  },
};
