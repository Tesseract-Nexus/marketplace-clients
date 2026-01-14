/**
 * Currency Exchange Rate Service
 *
 * Uses frankfurter.app - a free, open-source exchange rate API
 * Rates are cached for 1 hour to minimize API calls
 */

export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
  lastUpdated: number;
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag?: string;
}

// Supported currencies for display
export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
];

// Currency symbols mapping
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  NZD: 'NZ$',
  JPY: '¥',
  CHF: 'CHF',
  AED: 'د.إ',
  CNY: '¥',
  HKD: 'HK$',
  MXN: 'MX$',
  BRL: 'R$',
};

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

// In-memory cache for exchange rates
let ratesCache: ExchangeRates | null = null;

/**
 * Fetch exchange rates from frankfurter.app
 * Uses USD as base currency for simplicity
 */
export async function fetchExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
  // Check cache first
  if (ratesCache && ratesCache.base === baseCurrency) {
    const age = Date.now() - ratesCache.lastUpdated;
    if (age < CACHE_DURATION) {
      return ratesCache;
    }
  }

  try {
    // Frankfurter.app is free and doesn't require API key
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${baseCurrency}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour in Next.js
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.status}`);
    }

    const data = await response.json();

    // Add the base currency with rate 1
    const rates: Record<string, number> = {
      [baseCurrency]: 1,
      ...data.rates,
    };

    ratesCache = {
      base: baseCurrency,
      date: data.date,
      rates,
      lastUpdated: Date.now(),
    };

    return ratesCache;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);

    // Return cached rates if available, even if stale
    if (ratesCache) {
      return ratesCache;
    }

    // Return fallback rates if no cache
    return getFallbackRates(baseCurrency);
  }
}

/**
 * Fallback rates in case API fails (approximate rates as of Dec 2024)
 * These are updated periodically as a backup
 */
function getFallbackRates(baseCurrency: string): ExchangeRates {
  // Approximate rates based on USD (updated Dec 2024)
  const usdRates: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    INR: 83.5,
    AUD: 1.56,
    CAD: 1.44,
    SGD: 1.35,
    NZD: 1.77,
    JPY: 157.0,
    CHF: 0.90,
    AED: 3.67,
    CNY: 7.30,
    HKD: 7.79,
    MXN: 20.50,
    BRL: 6.10,
  };

  const today = new Date().toISOString().slice(0, 10);

  // If base is not USD, convert rates to use that base
  if (baseCurrency !== 'USD') {
    const baseRateInUsd = usdRates[baseCurrency];

    // If we don't have the base currency, default to USD base
    if (!baseRateInUsd) {
      return {
        base: 'USD',
        date: today,
        rates: usdRates,
        lastUpdated: Date.now(),
      };
    }

    // Convert all rates relative to the new base
    const rates: Record<string, number> = {};
    for (const [currency, rateInUsd] of Object.entries(usdRates)) {
      // rate = how many units of target currency per 1 unit of base currency
      rates[currency] = rateInUsd / baseRateInUsd;
    }
    return {
      base: baseCurrency,
      date: today,
      rates,
      lastUpdated: Date.now(),
    };
  }

  return {
    base: 'USD',
    date: today,
    rates: usdRates,
    lastUpdated: Date.now(),
  };
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // If base currency is the source, directly multiply
  if (fromCurrency === rates.base) {
    const rate = rates.rates[toCurrency];
    if (rate) {
      return amount * rate;
    }
  }

  // If base currency is the target, divide
  if (toCurrency === rates.base) {
    const rate = rates.rates[fromCurrency];
    if (rate) {
      return amount / rate;
    }
  }

  // Cross-rate conversion through base currency
  const fromRate = rates.rates[fromCurrency] || 1;
  const toRate = rates.rates[toCurrency] || 1;

  // Convert to base currency first, then to target
  const amountInBase = amount / fromRate;
  return amountInBase * toRate;
}

/**
 * Format price with currency symbol
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
      maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
    }).format(amount);
  } catch {
    // Fallback formatting
    const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
    return `${symbol}${(amount ?? 0).toFixed(2)}`;
  }
}

/**
 * Get currency info by code
 */
export function getCurrencyInfo(code: string): CurrencyInfo | undefined {
  return SUPPORTED_CURRENCIES.find(c => c.code === code);
}

/**
 * Detect customer's preferred currency based on locale/country
 */
export function detectPreferredCurrency(countryCode?: string): string {
  const countryToCurrency: Record<string, string> = {
    US: 'USD',
    GB: 'GBP',
    AU: 'AUD',
    CA: 'CAD',
    IN: 'INR',
    SG: 'SGD',
    NZ: 'NZD',
    JP: 'JPY',
    CH: 'CHF',
    AE: 'AED',
    CN: 'CNY',
    HK: 'HKD',
    MX: 'MXN',
    BR: 'BRL',
    // EU countries
    DE: 'EUR',
    FR: 'EUR',
    IT: 'EUR',
    ES: 'EUR',
    NL: 'EUR',
    BE: 'EUR',
    AT: 'EUR',
    IE: 'EUR',
    PT: 'EUR',
    FI: 'EUR',
    GR: 'EUR',
  };

  if (countryCode) {
    const currency = countryToCurrency[countryCode.toUpperCase()];
    if (currency) {
      return currency;
    }
  }

  return 'USD'; // Default fallback
}
