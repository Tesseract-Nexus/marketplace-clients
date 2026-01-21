'use client';

import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart';
import { CartItem } from '@/types/storefront';

interface AddToCartOptions {
  /** Show success toast */
  showToast?: boolean;
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Callback on success */
  onSuccess?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

interface UpdateQuantityOptions {
  showToast?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface RemoveItemOptions {
  showToast?: boolean;
  undoDuration?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onUndo?: () => void;
}

/**
 * Hook for optimistic cart operations with toast feedback
 *
 * Provides:
 * - Immediate UI updates (optimistic)
 * - Toast notifications for feedback
 * - Undo functionality for removals
 * - Error recovery
 */
export function useOptimisticCart() {
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const items = useCartStore((state) => state.items);

  // Store removed items for undo
  const removedItemsRef = useRef<Map<string, CartItem>>(new Map());

  /**
   * Add item to cart with optimistic update and toast feedback
   */
  const addToCart = useCallback(
    (
      item: Omit<CartItem, 'id'>,
      options: AddToCartOptions = {}
    ) => {
      const {
        showToast = true,
        successMessage,
        onSuccess,
        onError,
      } = options;

      try {
        // Optimistically add item (happens immediately)
        addItem(item);

        // Show success feedback
        if (showToast) {
          const message = successMessage || `${item.name} added to cart`;
          toast.success(message, {
            action: {
              label: 'View Cart',
              onClick: () => {
                useCartStore.getState().openCart();
              },
            },
            duration: 3000,
          });
        }

        onSuccess?.();
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to add item');

        if (showToast) {
          toast.error('Failed to add item to cart', {
            description: 'Please try again',
          });
        }

        onError?.(err);
      }
    },
    [addItem]
  );

  /**
   * Update item quantity with optimistic update
   */
  const updateItemQuantity = useCallback(
    (
      itemId: string,
      quantity: number,
      options: UpdateQuantityOptions = {}
    ) => {
      const { showToast = false, onSuccess, onError } = options;

      // Find current item for potential rollback
      const currentItem = items.find((i) => i.id === itemId);
      const previousQuantity = currentItem?.quantity;

      try {
        // Optimistically update quantity
        updateQuantity(itemId, quantity);

        if (showToast && currentItem) {
          toast.success(`Updated quantity to ${quantity}`);
        }

        onSuccess?.();
      } catch (error) {
        // Rollback on error
        if (previousQuantity !== undefined) {
          updateQuantity(itemId, previousQuantity);
        }

        const err = error instanceof Error ? error : new Error('Failed to update quantity');

        if (showToast) {
          toast.error('Failed to update quantity');
        }

        onError?.(err);
      }
    },
    [items, updateQuantity]
  );

  /**
   * Remove item from cart with undo capability
   */
  const removeFromCart = useCallback(
    (
      itemId: string,
      options: RemoveItemOptions = {}
    ) => {
      const {
        showToast = true,
        undoDuration = 5000,
        onSuccess,
        onError,
        onUndo,
      } = options;

      // Find the item before removing
      const itemToRemove = items.find((i) => i.id === itemId);
      if (!itemToRemove) return;

      try {
        // Store for potential undo
        removedItemsRef.current.set(itemId, { ...itemToRemove });

        // Optimistically remove item
        removeItem(itemId);

        // Show toast with undo option
        if (showToast) {
          toast.success(`${itemToRemove.name} removed from cart`, {
            action: {
              label: 'Undo',
              onClick: () => {
                // Restore the item
                const storedItem = removedItemsRef.current.get(itemId);
                if (storedItem) {
                  // Re-add the item with same properties
                  addItem({
                    productId: storedItem.productId,
                    variantId: storedItem.variantId,
                    name: storedItem.name,
                    price: storedItem.price,
                    quantity: storedItem.quantity,
                    image: storedItem.image,
                    variant: storedItem.variant,
                    selected: storedItem.selected,
                    status: storedItem.status,
                    weight: storedItem.weight,
                    weightUnit: storedItem.weightUnit,
                    length: storedItem.length,
                    width: storedItem.width,
                    height: storedItem.height,
                    dimensionUnit: storedItem.dimensionUnit,
                  });
                  removedItemsRef.current.delete(itemId);
                  toast.success(`${storedItem.name} restored to cart`);
                  onUndo?.();
                }
              },
            },
            duration: undoDuration,
            onDismiss: () => {
              // Clean up stored item after toast dismisses
              removedItemsRef.current.delete(itemId);
            },
          });
        }

        onSuccess?.();
      } catch (error) {
        // Restore item on error
        const storedItem = removedItemsRef.current.get(itemId);
        if (storedItem) {
          addItem(storedItem);
          removedItemsRef.current.delete(itemId);
        }

        const err = error instanceof Error ? error : new Error('Failed to remove item');

        if (showToast) {
          toast.error('Failed to remove item');
        }

        onError?.(err);
      }
    },
    [items, removeItem, addItem]
  );

  /**
   * Increment item quantity by 1
   */
  const incrementQuantity = useCallback(
    (itemId: string, options?: UpdateQuantityOptions) => {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        updateItemQuantity(itemId, item.quantity + 1, options);
      }
    },
    [items, updateItemQuantity]
  );

  /**
   * Decrement item quantity by 1 (removes if quantity becomes 0)
   */
  const decrementQuantity = useCallback(
    (itemId: string, options?: UpdateQuantityOptions & RemoveItemOptions) => {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        if (item.quantity <= 1) {
          removeFromCart(itemId, options);
        } else {
          updateItemQuantity(itemId, item.quantity - 1, options);
        }
      }
    },
    [items, updateItemQuantity, removeFromCart]
  );

  return {
    addToCart,
    removeFromCart,
    updateItemQuantity,
    incrementQuantity,
    decrementQuantity,
    items,
  };
}

export default useOptimisticCart;
