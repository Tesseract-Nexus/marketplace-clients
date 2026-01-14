/**
 * Currency utilities for the admin dashboard
 *
 * This module provides currency formatting and symbol lookup
 * based on tenant settings or country information.
 */

// Currency symbols lookup
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'Fr',
  SGD: 'S$',
  AED: 'د.إ',
  SAR: 'ر.س',
};

// Country to currency mapping
export const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD',
  IN: 'INR',
  GB: 'GBP',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  JP: 'JPY',
  CN: 'CNY',
  AU: 'AUD',
  CA: 'CAD',
  CH: 'CHF',
  SG: 'SGD',
  AE: 'AED',
  SA: 'SAR',
};

// Locale mapping for proper number formatting
export const CURRENCY_LOCALE: Record<string, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  INR: 'en-IN',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  AUD: 'en-AU',
  CAD: 'en-CA',
  CHF: 'de-CH',
  SGD: 'en-SG',
  AED: 'ar-AE',
  SAR: 'ar-SA',
};

/**
 * Get currency code from country code
 */
export function getCurrencyFromCountry(countryCode: string): string {
  return COUNTRY_CURRENCY[countryCode?.toUpperCase()] || 'USD';
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode?.toUpperCase()] || currencyCode || '₹';
}

/**
 * Format amount as currency
 * @param amount - The amount to format
 * @param currencyCode - ISO 4217 currency code (default: INR)
 * @param options - Additional Intl.NumberFormat options
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currencyCode: string = 'INR',
  options?: Partial<Intl.NumberFormatOptions>
): string {
  const numAmount = amount == null ? 0 : (typeof amount === 'string' ? parseFloat(amount) : amount);
  const safeAmount = isNaN(numAmount) ? 0 : numAmount;
  const currency = currencyCode?.toUpperCase() || 'INR';
  const locale = CURRENCY_LOCALE[currency] || 'en-IN';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options,
    }).format(safeAmount);
  } catch {
    // Fallback if currency code is invalid
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${safeAmount.toFixed(2)}`;
  }
}

/**
 * Format amount as compact currency (e.g., ₹1.2k, ₹3.4M)
 */
export function formatCompactCurrency(
  amount: number | string | null | undefined,
  currencyCode: string = 'INR'
): string {
  const numAmount = amount == null ? 0 : (typeof amount === 'string' ? parseFloat(amount) : amount);
  const safeAmount = isNaN(numAmount) ? 0 : numAmount;
  const symbol = getCurrencySymbol(currencyCode);

  if (safeAmount >= 1000000) {
    return `${symbol}${(safeAmount / 1000000).toFixed(1)}M`;
  }
  if (safeAmount >= 1000) {
    return `${symbol}${(safeAmount / 1000).toFixed(1)}k`;
  }
  return `${symbol}${safeAmount.toFixed(0)}`;
}

/**
 * Format amount for chart axis (e.g., ₹1k, ₹10k, ₹1M)
 */
export function formatChartAxisCurrency(
  value: number,
  currencyCode: string = 'INR'
): string {
  const symbol = getCurrencySymbol(currencyCode);

  if (value >= 1000000) {
    return `${symbol}${(value / 1000000).toFixed(0)}M`;
  }
  if (value >= 1000) {
    return `${symbol}${(value / 1000).toFixed(0)}k`;
  }
  return `${symbol}${value}`;
}
