import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { currencyApi, SupportedCurrency, ConvertResponse } from '../api/currency';

interface UseCurrencyOptions {
  /** The user's preferred currency code (e.g., 'AUD', 'INR') */
  preferredCurrency?: string;
  /** Whether to preload rates on mount */
  preloadRates?: boolean;
  /** Base currencies to preload */
  baseCurrencies?: string[];
}

interface UseCurrencyResult {
  /** Convert an amount from one currency to another */
  convert: (amount: number, from: string, to?: string) => Promise<number>;
  /** Convert synchronously using cached rates (returns null if not cached) */
  convertSync: (amount: number, from: string, to?: string) => number | null;
  /** Format an amount in the preferred currency with conversion */
  formatConverted: (amount: number, from: string, options?: FormatOptions) => Promise<string>;
  /** Format synchronously using cached rates */
  formatConvertedSync: (amount: number, from: string, options?: FormatOptions) => string | null;
  /** Get the exchange rate between two currencies */
  getRate: (from: string, to?: string) => Promise<number>;
  /** Get cached rate (returns null if not cached) */
  getCachedRate: (from: string, to?: string) => number | null;
  /** List of supported currencies */
  supportedCurrencies: SupportedCurrency[];
  /** Current preferred currency */
  preferredCurrency: string;
  /** Set the preferred currency */
  setPreferredCurrency: (currency: string) => void;
  /** Whether rates are loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Refresh rates from server */
  refreshRates: () => Promise<void>;
}

interface FormatOptions {
  compact?: boolean;
  locale?: string;
  showOriginal?: boolean;
}

// In-memory rate cache for synchronous access
const rateCache = new Map<string, { rate: number; timestamp: number }>();
const SYNC_CACHE_TTL = 60 * 1000; // 1 minute

const getCacheKey = (from: string, to: string): string =>
  `${from.toUpperCase()}:${to.toUpperCase()}`;

const getCachedRateSync = (from: string, to: string): number | null => {
  const key = getCacheKey(from, to);
  const cached = rateCache.get(key);
  if (cached && Date.now() - cached.timestamp < SYNC_CACHE_TTL) {
    return cached.rate;
  }
  return null;
};

const setCachedRate = (from: string, to: string, rate: number): void => {
  const key = getCacheKey(from, to);
  rateCache.set(key, { rate, timestamp: Date.now() });
};

/**
 * Hook for currency conversion with caching
 *
 * @example
 * ```tsx
 * const { convert, formatConverted, preferredCurrency } = useCurrency({
 *   preferredCurrency: 'AUD',
 * });
 *
 * // Convert INR to AUD
 * const audAmount = await convert(1000, 'INR');
 *
 * // Format with conversion
 * const formatted = await formatConverted(1000, 'INR');
 * // Output: "A$15.50" (or whatever the conversion is)
 * ```
 */
export function useCurrency(options: UseCurrencyOptions = {}): UseCurrencyResult {
  const {
    preferredCurrency: initialCurrency = 'USD',
    preloadRates = true,
    baseCurrencies = ['EUR', 'USD', 'AUD', 'INR', 'GBP'],
  } = options;

  const [preferredCurrency, setPreferredCurrency] = useState(initialCurrency);
  const [supportedCurrencies, setSupportedCurrencies] = useState<SupportedCurrency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadedRef = useRef(false);

  // Preload rates on mount
  useEffect(() => {
    if (preloadRates && !loadedRef.current) {
      loadedRef.current = true;
      setIsLoading(true);

      Promise.all([
        currencyApi.preloadRates(baseCurrencies),
        currencyApi.getSupportedCurrencies(),
      ])
        .then(([, currenciesResponse]) => {
          if (currenciesResponse.success) {
            setSupportedCurrencies(currenciesResponse.currencies);
          }
        })
        .catch((err) => {
          console.warn('[useCurrency] Failed to preload:', err);
          setError(err instanceof Error ? err : new Error(String(err)));
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [preloadRates, baseCurrencies]);

  // Convert amount with caching
  const convert = useCallback(
    async (amount: number, from: string, to?: string): Promise<number> => {
      const targetCurrency = to || preferredCurrency;
      const fromUpper = from.toUpperCase();
      const toUpper = targetCurrency.toUpperCase();

      // Same currency
      if (fromUpper === toUpper) {
        return amount;
      }

      try {
        const response = await currencyApi.convert(amount, fromUpper, toUpper);
        if (response.success) {
          // Cache the rate for sync access
          setCachedRate(fromUpper, toUpper, response.rate);
          return response.converted_amount;
        }
        throw new Error(response.message || 'Conversion failed');
      } catch (err) {
        console.error('[useCurrency] Conversion error:', err);
        throw err;
      }
    },
    [preferredCurrency]
  );

  // Synchronous conversion using cached rate
  const convertSync = useCallback(
    (amount: number, from: string, to?: string): number | null => {
      const targetCurrency = to || preferredCurrency;
      const fromUpper = from.toUpperCase();
      const toUpper = targetCurrency.toUpperCase();

      // Same currency
      if (fromUpper === toUpper) {
        return amount;
      }

      const rate = getCachedRateSync(fromUpper, toUpper);
      if (rate !== null) {
        return amount * rate;
      }

      return null;
    },
    [preferredCurrency]
  );

  // Get exchange rate
  const getRate = useCallback(
    async (from: string, to?: string): Promise<number> => {
      const targetCurrency = to || preferredCurrency;
      const fromUpper = from.toUpperCase();
      const toUpper = targetCurrency.toUpperCase();

      // Same currency
      if (fromUpper === toUpper) {
        return 1;
      }

      try {
        const rateData = await currencyApi.getRate(fromUpper, toUpper);
        setCachedRate(fromUpper, toUpper, rateData.rate);
        return rateData.rate;
      } catch (err) {
        console.error('[useCurrency] Get rate error:', err);
        throw err;
      }
    },
    [preferredCurrency]
  );

  // Get cached rate synchronously
  const getCachedRate = useCallback(
    (from: string, to?: string): number | null => {
      const targetCurrency = to || preferredCurrency;
      return getCachedRateSync(from.toUpperCase(), targetCurrency.toUpperCase());
    },
    [preferredCurrency]
  );

  // Format converted amount
  const formatConverted = useCallback(
    async (
      amount: number,
      from: string,
      options: FormatOptions = {}
    ): Promise<string> => {
      const { compact = false, locale = 'en-US', showOriginal = false } = options;
      const fromUpper = from.toUpperCase();
      const toUpper = preferredCurrency.toUpperCase();

      // Same currency, just format
      if (fromUpper === toUpper) {
        return formatCurrencyIntl(amount, toUpper, locale, compact);
      }

      try {
        const converted = await convert(amount, fromUpper, toUpper);
        const formatted = formatCurrencyIntl(converted, toUpper, locale, compact);

        if (showOriginal) {
          const original = formatCurrencyIntl(amount, fromUpper, locale, compact);
          return `${formatted} (${original})`;
        }

        return formatted;
      } catch {
        // Fallback to original currency if conversion fails
        return formatCurrencyIntl(amount, fromUpper, locale, compact);
      }
    },
    [preferredCurrency, convert]
  );

  // Format converted amount synchronously
  const formatConvertedSync = useCallback(
    (amount: number, from: string, options: FormatOptions = {}): string | null => {
      const { compact = false, locale = 'en-US', showOriginal = false } = options;
      const fromUpper = from.toUpperCase();
      const toUpper = preferredCurrency.toUpperCase();

      // Same currency, just format
      if (fromUpper === toUpper) {
        return formatCurrencyIntl(amount, toUpper, locale, compact);
      }

      const converted = convertSync(amount, fromUpper, toUpper);
      if (converted === null) {
        return null; // Rate not cached
      }

      const formatted = formatCurrencyIntl(converted, toUpper, locale, compact);

      if (showOriginal) {
        const original = formatCurrencyIntl(amount, fromUpper, locale, compact);
        return `${formatted} (${original})`;
      }

      return formatted;
    },
    [preferredCurrency, convertSync]
  );

  // Refresh rates
  const refreshRates = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await currencyApi.refreshRates();
      // Clear sync cache to force refresh
      rateCache.clear();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return useMemo(
    () => ({
      convert,
      convertSync,
      formatConverted,
      formatConvertedSync,
      getRate,
      getCachedRate,
      supportedCurrencies,
      preferredCurrency,
      setPreferredCurrency,
      isLoading,
      error,
      refreshRates,
    }),
    [
      convert,
      convertSync,
      formatConverted,
      formatConvertedSync,
      getRate,
      getCachedRate,
      supportedCurrencies,
      preferredCurrency,
      isLoading,
      error,
      refreshRates,
    ]
  );
}

// Helper function for Intl formatting
function formatCurrencyIntl(
  amount: number,
  currency: string,
  locale: string,
  compact: boolean
): string {
  try {
    if (compact) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(amount);
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback for unsupported currencies
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export default useCurrency;
