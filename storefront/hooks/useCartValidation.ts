'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useTenant } from '@/context/TenantContext';
import type { CartItem, CartItemStatus } from '@/types/storefront';

interface UseCartValidationOptions {
  autoValidate?: boolean; // Auto-validate on mount and periodically
  validateInterval?: number; // Interval in ms (default: 5 minutes)
  validateOnFocus?: boolean; // Re-validate when window regains focus
}

interface CartValidationState {
  isValidating: boolean;
  lastValidatedAt: string | null;
  hasIssues: boolean;
  hasUnavailableItems: boolean;
  hasPriceChanges: boolean;
  unavailableCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  priceChangedCount: number;
  expiresAt: string | null;

  // Filtered item lists
  unavailableItems: CartItem[];
  outOfStockItems: CartItem[];
  lowStockItems: CartItem[];
  priceChangedItems: CartItem[];
  availableItems: CartItem[];

  // Actions
  validate: () => Promise<void>;
  removeUnavailable: () => Promise<void>;
  acceptPriceChanges: () => Promise<void>;
}

const DEFAULT_VALIDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useCartValidation(options: UseCartValidationOptions = {}): CartValidationState {
  const {
    autoValidate = true,
    validateInterval = DEFAULT_VALIDATE_INTERVAL,
    validateOnFocus = true,
  } = options;

  const { customer, accessToken } = useAuthStore();
  const { tenant } = useTenant();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastValidationRef = useRef<number>(0);

  const {
    isValidating,
    lastValidatedAt,
    hasUnavailableItems,
    hasPriceChanges,
    unavailableCount,
    outOfStockCount,
    lowStockCount,
    priceChangedCount,
    expiresAt,
    items,
    validateCart,
    removeUnavailableItems,
    acceptPriceChanges: acceptPriceChangesAction,
    getUnavailableItems,
    getOutOfStockItems,
    getLowStockItems,
    getPriceChangedItems,
    getAvailableItems,
    hasIssues,
  } = useCartStore();

  // Validate cart
  const validate = useCallback(async () => {
    if (!customer?.id || !accessToken || !tenant?.id || !tenant?.storefrontId) {
      return;
    }

    // Prevent too frequent validations (minimum 30 seconds apart)
    const now = Date.now();
    if (now - lastValidationRef.current < 30000) {
      return;
    }
    lastValidationRef.current = now;

    await validateCart(tenant.id, tenant.storefrontId, customer.id, accessToken);
  }, [customer?.id, accessToken, tenant?.id, tenant?.storefrontId, validateCart]);

  // Remove unavailable items
  const removeUnavailable = useCallback(async () => {
    if (!customer?.id || !accessToken || !tenant?.id || !tenant?.storefrontId) {
      return;
    }

    await removeUnavailableItems(tenant.id, tenant.storefrontId, customer.id, accessToken);
  }, [customer?.id, accessToken, tenant?.id, tenant?.storefrontId, removeUnavailableItems]);

  // Accept price changes
  const acceptPriceChanges = useCallback(async () => {
    if (!customer?.id || !accessToken || !tenant?.id || !tenant?.storefrontId) {
      return;
    }

    await acceptPriceChangesAction(tenant.id, tenant.storefrontId, customer.id, accessToken);
  }, [customer?.id, accessToken, tenant?.id, tenant?.storefrontId, acceptPriceChangesAction]);

  // Auto-validate on mount and periodically
  useEffect(() => {
    if (!autoValidate || !customer?.id || !accessToken || items.length === 0) {
      return;
    }

    // Validate on mount if not validated recently
    const shouldValidateOnMount = !lastValidatedAt ||
      Date.now() - new Date(lastValidatedAt).getTime() > validateInterval;

    if (shouldValidateOnMount) {
      validate();
    }

    // Set up periodic validation
    intervalRef.current = setInterval(() => {
      validate();
    }, validateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoValidate, customer?.id, accessToken, items.length, lastValidatedAt, validateInterval, validate]);

  // Re-validate on window focus
  useEffect(() => {
    if (!validateOnFocus || !customer?.id || !accessToken) {
      return;
    }

    const handleFocus = () => {
      // Only validate if it's been more than 1 minute since last validation
      const now = Date.now();
      if (now - lastValidationRef.current > 60000) {
        validate();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [validateOnFocus, customer?.id, accessToken, validate]);

  return {
    isValidating,
    lastValidatedAt,
    hasIssues: hasIssues(),
    hasUnavailableItems,
    hasPriceChanges,
    unavailableCount,
    outOfStockCount,
    lowStockCount,
    priceChangedCount,
    expiresAt,
    unavailableItems: getUnavailableItems(),
    outOfStockItems: getOutOfStockItems(),
    lowStockItems: getLowStockItems(),
    priceChangedItems: getPriceChangedItems(),
    availableItems: getAvailableItems(),
    validate,
    removeUnavailable,
    acceptPriceChanges,
  };
}

// Helper to get status badge info
export function getStatusBadgeInfo(status?: CartItemStatus): {
  label: string;
  variant: 'default' | 'destructive' | 'secondary' | 'outline' | 'warning';
  description: string;
} | null {
  if (!status || status === 'AVAILABLE') {
    return null;
  }

  switch (status) {
    case 'UNAVAILABLE':
      return {
        label: 'Unavailable',
        variant: 'destructive',
        description: 'This product is no longer available',
      };
    case 'OUT_OF_STOCK':
      return {
        label: 'Out of Stock',
        variant: 'destructive',
        description: 'This product is currently out of stock',
      };
    case 'LOW_STOCK':
      return {
        label: 'Low Stock',
        variant: 'warning',
        description: 'Limited quantity available',
      };
    case 'PRICE_CHANGED':
      return {
        label: 'Price Changed',
        variant: 'secondary',
        description: 'The price has changed since you added this item',
      };
    default:
      return null;
  }
}

// Format price change info
export function formatPriceChange(priceChange?: {
  oldPrice: number;
  newPrice: number;
  difference: number;
  isIncrease: boolean;
}): string | null {
  if (!priceChange) return null;

  const diff = Math.abs(priceChange.difference).toFixed(2);
  if (priceChange.isIncrease) {
    return `Price increased by $${diff}`;
  }
  return `Price decreased by $${diff}`;
}
