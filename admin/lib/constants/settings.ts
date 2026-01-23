/**
 * Shared constants for store settings
 * These are used across multiple components for consistency
 */

// Currency options with labels
export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'NZD', label: 'NZD - New Zealand Dollar' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
  { value: 'KRW', label: 'KRW - South Korean Won' },
  { value: 'MXN', label: 'MXN - Mexican Peso' },
  { value: 'BRL', label: 'BRL - Brazilian Real' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'SAR', label: 'SAR - Saudi Riyal' },
  { value: 'SEK', label: 'SEK - Swedish Krona' },
  { value: 'NOK', label: 'NOK - Norwegian Krone' },
  { value: 'DKK', label: 'DKK - Danish Krone' },
  { value: 'PLN', label: 'PLN - Polish Zloty' },
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'THB', label: 'THB - Thai Baht' },
  { value: 'IDR', label: 'IDR - Indonesian Rupiah' },
  { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
  { value: 'PHP', label: 'PHP - Philippine Peso' },
] as const;

// Timezone options grouped by region
export const TIMEZONE_OPTIONS = [
  // Americas
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'America/Toronto', label: 'Toronto (EST/EDT)' },
  { value: 'America/Mexico_City', label: 'Mexico City (CST/CDT)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (ART)' },
  // Europe
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
  // Asia
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)' },
  { value: 'Asia/Jakarta', label: 'Jakarta (WIB)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (ICT)' },
  // Oceania
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
  { value: 'Australia/Brisbane', label: 'Brisbane (AEST)' },
  { value: 'Australia/Perth', label: 'Perth (AWST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
  // Other
  { value: 'UTC', label: 'UTC' },
] as const;

// Date format options
export const DATE_FORMAT_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD' },
] as const;

// Country options with flags and names
export const COUNTRY_OPTIONS = [
  // North America
  { value: 'US', label: 'United States', flag: '🇺🇸', name: 'United States' },
  { value: 'CA', label: 'Canada', flag: '🇨🇦', name: 'Canada' },
  { value: 'MX', label: 'Mexico', flag: '🇲🇽', name: 'Mexico' },
  // Europe
  { value: 'GB', label: 'United Kingdom', flag: '🇬🇧', name: 'United Kingdom' },
  { value: 'DE', label: 'Germany', flag: '🇩🇪', name: 'Germany' },
  { value: 'FR', label: 'France', flag: '🇫🇷', name: 'France' },
  { value: 'IT', label: 'Italy', flag: '🇮🇹', name: 'Italy' },
  { value: 'ES', label: 'Spain', flag: '🇪🇸', name: 'Spain' },
  { value: 'NL', label: 'Netherlands', flag: '🇳🇱', name: 'Netherlands' },
  { value: 'CH', label: 'Switzerland', flag: '🇨🇭', name: 'Switzerland' },
  { value: 'SE', label: 'Sweden', flag: '🇸🇪', name: 'Sweden' },
  { value: 'NO', label: 'Norway', flag: '🇳🇴', name: 'Norway' },
  { value: 'DK', label: 'Denmark', flag: '🇩🇰', name: 'Denmark' },
  { value: 'PL', label: 'Poland', flag: '🇵🇱', name: 'Poland' },
  // Asia Pacific
  { value: 'IN', label: 'India', flag: '🇮🇳', name: 'India' },
  { value: 'CN', label: 'China', flag: '🇨🇳', name: 'China' },
  { value: 'JP', label: 'Japan', flag: '🇯🇵', name: 'Japan' },
  { value: 'KR', label: 'South Korea', flag: '🇰🇷', name: 'South Korea' },
  { value: 'AU', label: 'Australia', flag: '🇦🇺', name: 'Australia' },
  { value: 'NZ', label: 'New Zealand', flag: '🇳🇿', name: 'New Zealand' },
  { value: 'SG', label: 'Singapore', flag: '🇸🇬', name: 'Singapore' },
  { value: 'HK', label: 'Hong Kong', flag: '🇭🇰', name: 'Hong Kong' },
  { value: 'MY', label: 'Malaysia', flag: '🇲🇾', name: 'Malaysia' },
  { value: 'TH', label: 'Thailand', flag: '🇹🇭', name: 'Thailand' },
  { value: 'ID', label: 'Indonesia', flag: '🇮🇩', name: 'Indonesia' },
  { value: 'PH', label: 'Philippines', flag: '🇵🇭', name: 'Philippines' },
  // Middle East
  { value: 'AE', label: 'UAE', flag: '🇦🇪', name: 'United Arab Emirates' },
  { value: 'SA', label: 'Saudi Arabia', flag: '🇸🇦', name: 'Saudi Arabia' },
  // South America
  { value: 'BR', label: 'Brazil', flag: '🇧🇷', name: 'Brazil' },
  { value: 'AR', label: 'Argentina', flag: '🇦🇷', name: 'Argentina' },
  // Africa
  { value: 'ZA', label: 'South Africa', flag: '🇿🇦', name: 'South Africa' },
] as const;

// Country to timezone mapping for auto-detection
export const COUNTRY_TIMEZONE_MAP: Record<string, string> = {
  // North America
  US: 'America/New_York',
  CA: 'America/Toronto',
  MX: 'America/Mexico_City',
  // Europe
  GB: 'Europe/London',
  DE: 'Europe/Berlin',
  FR: 'Europe/Paris',
  IT: 'Europe/Paris',
  ES: 'Europe/Paris',
  NL: 'Europe/Amsterdam',
  CH: 'Europe/Paris',
  SE: 'Europe/Stockholm',
  NO: 'Europe/Stockholm',
  DK: 'Europe/Stockholm',
  PL: 'Europe/Paris',
  // Asia Pacific
  IN: 'Asia/Kolkata',
  CN: 'Asia/Shanghai',
  JP: 'Asia/Tokyo',
  KR: 'Asia/Seoul',
  AU: 'Australia/Sydney',
  NZ: 'Pacific/Auckland',
  SG: 'Asia/Singapore',
  HK: 'Asia/Hong_Kong',
  MY: 'Asia/Singapore',
  TH: 'Asia/Bangkok',
  ID: 'Asia/Jakarta',
  PH: 'Asia/Singapore',
  // Middle East
  AE: 'Asia/Dubai',
  SA: 'Asia/Dubai',
  // South America
  BR: 'America/Sao_Paulo',
  AR: 'America/Argentina/Buenos_Aires',
  // Africa
  ZA: 'Europe/Paris',
};

// Country to currency mapping for auto-detection
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // North America
  US: 'USD',
  CA: 'CAD',
  MX: 'MXN',
  // Europe
  GB: 'GBP',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  CH: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  PL: 'PLN',
  // Asia Pacific
  IN: 'INR',
  CN: 'CNY',
  JP: 'JPY',
  KR: 'KRW',
  AU: 'AUD',
  NZ: 'NZD',
  SG: 'SGD',
  HK: 'HKD',
  MY: 'MYR',
  TH: 'THB',
  ID: 'IDR',
  PH: 'PHP',
  // Middle East
  AE: 'AED',
  SA: 'SAR',
  // South America
  BR: 'BRL',
  AR: 'USD', // ARS is unstable, USD is commonly used
  // Africa
  ZA: 'ZAR',
};

// Required fields for store settings completeness calculation
export const REQUIRED_STORE_FIELDS = [
  { key: 'store.name', label: 'Store Name', section: 'general' },
  { key: 'store.email', label: 'Email', section: 'general' },
  { key: 'store.phone', label: 'Phone', section: 'general' },
  { key: 'store.country', label: 'Country', section: 'address' },
  { key: 'business.currency', label: 'Currency', section: 'regional' },
] as const;

// Type exports
export type CurrencyCode = typeof CURRENCY_OPTIONS[number]['value'];
export type TimezoneValue = typeof TIMEZONE_OPTIONS[number]['value'];
export type DateFormatValue = typeof DATE_FORMAT_OPTIONS[number]['value'];
export type CountryCode = typeof COUNTRY_OPTIONS[number]['value'];

// Helper functions
export function getCountryByCode(code: string) {
  return COUNTRY_OPTIONS.find(c => c.value === code);
}

export function getCurrencyByCode(code: string) {
  return CURRENCY_OPTIONS.find(c => c.value === code);
}

export function getTimezoneByValue(value: string) {
  return TIMEZONE_OPTIONS.find(t => t.value === value);
}

export function getTimezoneLabel(value: string): string {
  const tz = getTimezoneByValue(value);
  return tz?.label || value.split('/').pop()?.replace('_', ' ') || value;
}

export function getAutoSyncedSettings(countryCode: string) {
  return {
    timezone: COUNTRY_TIMEZONE_MAP[countryCode] || 'UTC',
    currency: COUNTRY_CURRENCY_MAP[countryCode] || 'USD',
    dateFormat: countryCode === 'US' ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
  };
}
