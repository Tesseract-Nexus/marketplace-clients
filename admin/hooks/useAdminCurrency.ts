'use client';

import { useAdminCurrencyContext } from '@/contexts/AdminCurrencyContext';

/**
 * Convenience hook for formatting prices in admin's preferred currency.
 * Use this in any component that displays financial data.
 *
 * @example
 * ```tsx
 * const { formatPrice, isConverted, adminCurrency } = useAdminCurrency();
 *
 * // Format a price (automatically converts from store currency)
 * <span>{formatPrice(order.total)}</span>
 *
 * // Format with specific source currency
 * <span>{formatPrice(amount, 'USD')}</span>
 *
 * // Show indicator when conversion is active
 * {isConverted && <span>Showing in {adminCurrency}</span>}
 * ```
 */
export function useAdminCurrency() {
  const context = useAdminCurrencyContext();

  return {
    // Format a price in admin's preferred currency
    formatPrice: context.formatAdminPrice,

    // Convert amount to admin's preferred currency (returns number)
    convertPrice: context.convertToAdminCurrency,

    // The admin's selected display currency code (e.g., 'AUD')
    adminCurrency: context.adminCurrency,

    // Full currency info (code, symbol, name, flag)
    adminCurrencyInfo: context.adminCurrencyInfo,

    // The store's base currency code
    storeCurrency: context.storeCurrency,

    // Whether conversion is active (admin currency differs from store currency)
    isConverted: context.isConverted,

    // Whether exchange rates are still loading
    isLoadingRates: context.isLoadingRates,
  };
}

export default useAdminCurrency;
