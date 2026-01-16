import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet, apiPost } from './client';

// Cache configuration
const CACHE_KEYS = {
  RATES: 'currency:rates',
  SUPPORTED: 'currency:supported',
  LAST_FETCH: 'currency:last_fetch',
} as const;

// Cache TTL in milliseconds (5 minutes for mobile, backend handles the hourly refresh)
const CACHE_TTL = 5 * 60 * 1000;

// In-memory cache for fastest access
let inMemoryRatesCache: Map<string, CachedRate> | null = null;
let inMemoryCacheTime: number = 0;
const IN_MEMORY_TTL = 60 * 1000; // 1 minute for in-memory

interface CachedRate {
  rate: number;
  fetchedAt: string;
}

interface CachedData<T> {
  data: T;
  cachedAt: number;
}

export interface ExchangeRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  date: string;
}

export interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
}

export interface ConvertResponse {
  success: boolean;
  original_amount: number;
  converted_amount: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  rate_date: string;
  message?: string;
}

export interface BulkConvertItem {
  amount: number;
  from: string;
}

export interface BulkConvertResult {
  original_amount: number;
  from_currency: string;
  converted_amount: number;
  rate: number;
}

export interface BulkConvertResponse {
  success: boolean;
  to_currency: string;
  conversions: BulkConvertResult[];
  total_amount: number;
  rate_date: string;
  message?: string;
}

export interface RatesResponse {
  success: boolean;
  base: string;
  date: string;
  rates: Record<string, number>;
  message?: string;
}

export interface SupportedCurrenciesResponse {
  success: boolean;
  currencies: SupportedCurrency[];
  message?: string;
}

// Check if cache is still valid
const isCacheValid = (cachedAt: number, ttl: number = CACHE_TTL): boolean => {
  return Date.now() - cachedAt < ttl;
};

// Get from in-memory cache first (fastest)
const getFromMemoryCache = (key: string): number | null => {
  if (!inMemoryRatesCache || !isCacheValid(inMemoryCacheTime, IN_MEMORY_TTL)) {
    return null;
  }
  const cached = inMemoryRatesCache.get(key);
  return cached?.rate ?? null;
};

// Set to in-memory cache
const setToMemoryCache = (rates: Record<string, number>): void => {
  inMemoryRatesCache = new Map();
  for (const [key, rate] of Object.entries(rates)) {
    inMemoryRatesCache.set(key, { rate, fetchedAt: new Date().toISOString() });
  }
  inMemoryCacheTime = Date.now();
};

// Get from AsyncStorage cache
const getFromAsyncCache = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) {
      return null;
    }

    const parsed: CachedData<T> = JSON.parse(cached);
    if (!isCacheValid(parsed.cachedAt)) {
      // Cache expired, remove it
      await AsyncStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
};

// Set to AsyncStorage cache
const setToAsyncCache = async <T>(key: string, data: T): Promise<void> => {
  try {
    const cacheData: CachedData<T> = {
      data,
      cachedAt: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('[Currency Cache] Failed to cache data:', error);
  }
};

/**
 * Currency API module with multi-layer caching
 */
export const currencyApi = {
  /**
   * Convert an amount from one currency to another
   * Uses cached rates when available for faster conversion
   */
  async convert(amount: number, from: string, to: string): Promise<ConvertResponse> {
    // Same currency, no conversion needed
    if (from.toUpperCase() === to.toUpperCase()) {
      return {
        success: true,
        original_amount: amount,
        converted_amount: amount,
        from_currency: from.toUpperCase(),
        to_currency: to.toUpperCase(),
        rate: 1,
        rate_date: new Date().toISOString().split('T')[0],
      };
    }

    // Try to get rate from memory cache first
    const cacheKey = `${from.toUpperCase()}:${to.toUpperCase()}`;
    const cachedRate = getFromMemoryCache(cacheKey);
    if (cachedRate !== null) {
      return {
        success: true,
        original_amount: amount,
        converted_amount: amount * cachedRate,
        from_currency: from.toUpperCase(),
        to_currency: to.toUpperCase(),
        rate: cachedRate,
        rate_date: new Date().toISOString().split('T')[0],
      };
    }

    // Try to get from cached rates in AsyncStorage
    const cachedRates = await getFromAsyncCache<Record<string, number>>(CACHE_KEYS.RATES);
    if (cachedRates && cachedRates[cacheKey]) {
      return {
        success: true,
        original_amount: amount,
        converted_amount: amount * cachedRates[cacheKey],
        from_currency: from.toUpperCase(),
        to_currency: to.toUpperCase(),
        rate: cachedRates[cacheKey],
        rate_date: new Date().toISOString().split('T')[0],
      };
    }

    // Fall back to API call
    const response = await apiGet<ConvertResponse>(
      `/currency/convert?amount=${amount}&from=${from}&to=${to}`
    );
    return response.data;
  },

  /**
   * Bulk convert multiple amounts to a single currency
   */
  async bulkConvert(items: BulkConvertItem[], to: string): Promise<BulkConvertResponse> {
    // Try to use cached rates for local calculation
    const cachedRates = await getFromAsyncCache<Record<string, number>>(CACHE_KEYS.RATES);

    if (cachedRates) {
      const conversions: BulkConvertResult[] = [];
      let totalAmount = 0;
      let allCached = true;

      for (const item of items) {
        const cacheKey = `${item.from.toUpperCase()}:${to.toUpperCase()}`;
        const rate = cachedRates[cacheKey];

        if (rate !== undefined) {
          const convertedAmount = item.amount * rate;
          totalAmount += convertedAmount;
          conversions.push({
            original_amount: item.amount,
            from_currency: item.from.toUpperCase(),
            converted_amount: convertedAmount,
            rate,
          });
        } else {
          allCached = false;
          break;
        }
      }

      if (allCached) {
        return {
          success: true,
          to_currency: to.toUpperCase(),
          conversions,
          total_amount: totalAmount,
          rate_date: new Date().toISOString().split('T')[0],
        };
      }
    }

    // Fall back to API call
    const response = await apiPost<BulkConvertResponse>('/currency/bulk-convert', {
      amounts: items,
      to,
    });
    return response.data;
  },

  /**
   * Get exchange rates for a base currency
   * Caches rates for future conversions
   */
  async getRates(baseCurrency: string = 'EUR'): Promise<RatesResponse> {
    // Check AsyncStorage cache first
    const cachedRates = await getFromAsyncCache<RatesResponse>(
      `${CACHE_KEYS.RATES}:${baseCurrency}`
    );
    if (cachedRates) {
      // Also populate in-memory cache
      const ratesMap: Record<string, number> = {};
      for (const [targetCurrency, rate] of Object.entries(cachedRates.rates)) {
        ratesMap[`${baseCurrency}:${targetCurrency}`] = rate;
      }
      setToMemoryCache(ratesMap);
      return cachedRates;
    }

    // Fetch from API
    const apiResponse = await apiGet<RatesResponse>(`/currency/rates?base=${baseCurrency}`);
    const response = apiResponse.data;

    if (response.success) {
      // Cache the rates
      await setToAsyncCache(`${CACHE_KEYS.RATES}:${baseCurrency}`, response);

      // Also cache individual rate pairs for convert function
      const ratesMap: Record<string, number> = {};
      for (const [targetCurrency, rate] of Object.entries(response.rates)) {
        const numericRate = Number(rate);
        ratesMap[`${baseCurrency}:${targetCurrency}`] = numericRate;
        // Also store inverse rates
        if (numericRate > 0) {
          ratesMap[`${targetCurrency}:${baseCurrency}`] = 1 / numericRate;
        }
      }
      await setToAsyncCache(CACHE_KEYS.RATES, ratesMap);
      setToMemoryCache(ratesMap);
    }

    return response;
  },

  /**
   * Get the exchange rate between two currencies
   */
  async getRate(from: string, to: string): Promise<ExchangeRate> {
    // Try memory cache first
    const cacheKey = `${from.toUpperCase()}:${to.toUpperCase()}`;
    const cachedRate = getFromMemoryCache(cacheKey);
    if (cachedRate !== null) {
      return {
        from_currency: from.toUpperCase(),
        to_currency: to.toUpperCase(),
        rate: cachedRate,
        date: new Date().toISOString().split('T')[0],
      };
    }

    // Try AsyncStorage cache
    const cachedRates = await getFromAsyncCache<Record<string, number>>(CACHE_KEYS.RATES);
    if (cachedRates && cachedRates[cacheKey]) {
      return {
        from_currency: from.toUpperCase(),
        to_currency: to.toUpperCase(),
        rate: cachedRates[cacheKey],
        date: new Date().toISOString().split('T')[0],
      };
    }

    // Fetch from API
    const response = await apiGet<ExchangeRate>(`/currency/rate?from=${from}&to=${to}`);
    return response.data;
  },

  /**
   * Get list of supported currencies
   * Heavily cached since this rarely changes
   */
  async getSupportedCurrencies(): Promise<SupportedCurrenciesResponse> {
    // Check AsyncStorage cache first (long TTL since currencies don't change often)
    const cached = await getFromAsyncCache<SupportedCurrenciesResponse>(CACHE_KEYS.SUPPORTED);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const apiResponse = await apiGet<SupportedCurrenciesResponse>('/currency/supported');
    const response = apiResponse.data;

    if (response.success) {
      // Cache with longer TTL (stored in the cache data)
      await setToAsyncCache(CACHE_KEYS.SUPPORTED, response);
    }

    return response;
  },

  /**
   * Preload rates for common currencies
   * Call this on app startup for faster conversions
   */
  async preloadRates(baseCurrencies: string[] = ['EUR', 'USD', 'AUD', 'INR']): Promise<void> {
    console.log('[Currency] Preloading rates for:', baseCurrencies);

    // Load rates for each base currency in parallel
    await Promise.all(
      baseCurrencies.map(async (base) => {
        try {
          await this.getRates(base);
        } catch (error) {
          console.warn(`[Currency] Failed to preload rates for ${base}:`, error);
        }
      })
    );
  },

  /**
   * Clear all cached rates
   * Call this when user switches tenant or logs out
   */
  async clearCache(): Promise<void> {
    inMemoryRatesCache = null;
    inMemoryCacheTime = 0;

    await Promise.all([
      AsyncStorage.removeItem(CACHE_KEYS.RATES),
      AsyncStorage.removeItem(CACHE_KEYS.SUPPORTED),
      AsyncStorage.removeItem(CACHE_KEYS.LAST_FETCH),
    ]);

    console.log('[Currency] Cache cleared');
  },

  /**
   * Force refresh rates from the server
   */
  async refreshRates(): Promise<void> {
    await this.clearCache();
    await this.preloadRates();
  },
};

export default currencyApi;
