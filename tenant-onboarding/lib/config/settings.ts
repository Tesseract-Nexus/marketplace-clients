/**
 * Shared constants for store settings
 * These are used across onboarding for country, currency, language selection
 */

// Currency options with labels
export const CURRENCY_OPTIONS = [
  // Major Currencies
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  // Americas
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'MXN', label: 'MXN - Mexican Peso' },
  { value: 'BRL', label: 'BRL - Brazilian Real' },
  { value: 'ARS', label: 'ARS - Argentine Peso' },
  { value: 'CLP', label: 'CLP - Chilean Peso' },
  { value: 'COP', label: 'COP - Colombian Peso' },
  { value: 'PEN', label: 'PEN - Peruvian Sol' },
  // Oceania
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'NZD', label: 'NZD - New Zealand Dollar' },
  // Asia Pacific
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'NPR', label: 'NPR - Nepalese Rupee' },
  { value: 'BDT', label: 'BDT - Bangladeshi Taka' },
  { value: 'LKR', label: 'LKR - Sri Lankan Rupee' },
  { value: 'PKR', label: 'PKR - Pakistani Rupee' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
  { value: 'TWD', label: 'TWD - New Taiwan Dollar' },
  { value: 'KRW', label: 'KRW - South Korean Won' },
  { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
  { value: 'THB', label: 'THB - Thai Baht' },
  { value: 'IDR', label: 'IDR - Indonesian Rupiah' },
  { value: 'PHP', label: 'PHP - Philippine Peso' },
  { value: 'VND', label: 'VND - Vietnamese Dong' },
  // Europe
  { value: 'SEK', label: 'SEK - Swedish Krona' },
  { value: 'NOK', label: 'NOK - Norwegian Krone' },
  { value: 'DKK', label: 'DKK - Danish Krone' },
  { value: 'PLN', label: 'PLN - Polish Zloty' },
  { value: 'CZK', label: 'CZK - Czech Koruna' },
  { value: 'HUF', label: 'HUF - Hungarian Forint' },
  { value: 'RON', label: 'RON - Romanian Leu' },
  { value: 'RUB', label: 'RUB - Russian Ruble' },
  { value: 'UAH', label: 'UAH - Ukrainian Hryvnia' },
  { value: 'TRY', label: 'TRY - Turkish Lira' },
  // Middle East
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'SAR', label: 'SAR - Saudi Riyal' },
  { value: 'QAR', label: 'QAR - Qatari Riyal' },
  { value: 'KWD', label: 'KWD - Kuwaiti Dinar' },
  { value: 'ILS', label: 'ILS - Israeli Shekel' },
  // Africa
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'EGP', label: 'EGP - Egyptian Pound' },
  { value: 'NGN', label: 'NGN - Nigerian Naira' },
  { value: 'KES', label: 'KES - Kenyan Shilling' },
  { value: 'GHS', label: 'GHS - Ghanaian Cedi' },
  { value: 'MAD', label: 'MAD - Moroccan Dirham' },
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
  { value: 'Asia/Kathmandu', label: 'Nepal (NPT)' },
  { value: 'Asia/Dhaka', label: 'Bangladesh (BST)' },
  { value: 'Asia/Colombo', label: 'Sri Lanka (IST)' },
  { value: 'Asia/Karachi', label: 'Pakistan (PKT)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)' },
  { value: 'Asia/Jakarta', label: 'Jakarta (WIB)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (ICT)' },
  { value: 'Asia/Manila', label: 'Manila (PHT)' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh (ICT)' },
  { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur (MYT)' },
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

// Language options with native names
export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', nativeName: 'English' },
  { value: 'es', label: 'Spanish', nativeName: 'Español' },
  { value: 'fr', label: 'French', nativeName: 'Français' },
  { value: 'de', label: 'German', nativeName: 'Deutsch' },
  { value: 'it', label: 'Italian', nativeName: 'Italiano' },
  { value: 'pt', label: 'Portuguese', nativeName: 'Português' },
  { value: 'nl', label: 'Dutch', nativeName: 'Nederlands' },
  { value: 'sv', label: 'Swedish', nativeName: 'Svenska' },
  { value: 'no', label: 'Norwegian', nativeName: 'Norsk' },
  { value: 'da', label: 'Danish', nativeName: 'Dansk' },
  { value: 'pl', label: 'Polish', nativeName: 'Polski' },
  { value: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { value: 'bn', label: 'Bengali', nativeName: 'বাংলা' },
  { value: 'ne', label: 'Nepali', nativeName: 'नेपाली' },
  { value: 'si', label: 'Sinhala', nativeName: 'සිංහල' },
  { value: 'ta', label: 'Tamil', nativeName: 'தமிழ்' },
  { value: 'ur', label: 'Urdu', nativeName: 'اردو' },
  { value: 'zh', label: 'Chinese', nativeName: '中文' },
  { value: 'ja', label: 'Japanese', nativeName: '日本語' },
  { value: 'ko', label: 'Korean', nativeName: '한국어' },
  { value: 'th', label: 'Thai', nativeName: 'ไทย' },
  { value: 'vi', label: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { value: 'id', label: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { value: 'ms', label: 'Malay', nativeName: 'Bahasa Melayu' },
  { value: 'tl', label: 'Filipino', nativeName: 'Tagalog' },
  { value: 'ar', label: 'Arabic', nativeName: 'العربية' },
  { value: 'he', label: 'Hebrew', nativeName: 'עברית' },
  { value: 'tr', label: 'Turkish', nativeName: 'Türkçe' },
  { value: 'ru', label: 'Russian', nativeName: 'Русский' },
  { value: 'el', label: 'Greek', nativeName: 'Ελληνικά' },
  { value: 'af', label: 'Afrikaans', nativeName: 'Afrikaans' },
  { value: 'sw', label: 'Swahili', nativeName: 'Kiswahili' },
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
  { value: 'GR', label: 'Greece', flag: '🇬🇷', name: 'Greece' },
  { value: 'CZ', label: 'Czech Republic', flag: '🇨🇿', name: 'Czech Republic' },
  { value: 'HU', label: 'Hungary', flag: '🇭🇺', name: 'Hungary' },
  { value: 'RO', label: 'Romania', flag: '🇷🇴', name: 'Romania' },
  { value: 'PT', label: 'Portugal', flag: '🇵🇹', name: 'Portugal' },
  { value: 'IE', label: 'Ireland', flag: '🇮🇪', name: 'Ireland' },
  { value: 'AT', label: 'Austria', flag: '🇦🇹', name: 'Austria' },
  { value: 'BE', label: 'Belgium', flag: '🇧🇪', name: 'Belgium' },
  { value: 'FI', label: 'Finland', flag: '🇫🇮', name: 'Finland' },
  { value: 'RU', label: 'Russia', flag: '🇷🇺', name: 'Russia' },
  { value: 'UA', label: 'Ukraine', flag: '🇺🇦', name: 'Ukraine' },
  { value: 'TR', label: 'Turkey', flag: '🇹🇷', name: 'Turkey' },
  // South Asia
  { value: 'IN', label: 'India', flag: '🇮🇳', name: 'India' },
  { value: 'NP', label: 'Nepal', flag: '🇳🇵', name: 'Nepal' },
  { value: 'BD', label: 'Bangladesh', flag: '🇧🇩', name: 'Bangladesh' },
  { value: 'LK', label: 'Sri Lanka', flag: '🇱🇰', name: 'Sri Lanka' },
  { value: 'PK', label: 'Pakistan', flag: '🇵🇰', name: 'Pakistan' },
  // East Asia
  { value: 'CN', label: 'China', flag: '🇨🇳', name: 'China' },
  { value: 'JP', label: 'Japan', flag: '🇯🇵', name: 'Japan' },
  { value: 'KR', label: 'South Korea', flag: '🇰🇷', name: 'South Korea' },
  { value: 'TW', label: 'Taiwan', flag: '🇹🇼', name: 'Taiwan' },
  { value: 'HK', label: 'Hong Kong', flag: '🇭🇰', name: 'Hong Kong' },
  // Southeast Asia
  { value: 'SG', label: 'Singapore', flag: '🇸🇬', name: 'Singapore' },
  { value: 'MY', label: 'Malaysia', flag: '🇲🇾', name: 'Malaysia' },
  { value: 'TH', label: 'Thailand', flag: '🇹🇭', name: 'Thailand' },
  { value: 'ID', label: 'Indonesia', flag: '🇮🇩', name: 'Indonesia' },
  { value: 'PH', label: 'Philippines', flag: '🇵🇭', name: 'Philippines' },
  { value: 'VN', label: 'Vietnam', flag: '🇻🇳', name: 'Vietnam' },
  // Oceania
  { value: 'AU', label: 'Australia', flag: '🇦🇺', name: 'Australia' },
  { value: 'NZ', label: 'New Zealand', flag: '🇳🇿', name: 'New Zealand' },
  // Middle East
  { value: 'AE', label: 'UAE', flag: '🇦🇪', name: 'United Arab Emirates' },
  { value: 'SA', label: 'Saudi Arabia', flag: '🇸🇦', name: 'Saudi Arabia' },
  { value: 'QA', label: 'Qatar', flag: '🇶🇦', name: 'Qatar' },
  { value: 'KW', label: 'Kuwait', flag: '🇰🇼', name: 'Kuwait' },
  { value: 'IL', label: 'Israel', flag: '🇮🇱', name: 'Israel' },
  // South America
  { value: 'BR', label: 'Brazil', flag: '🇧🇷', name: 'Brazil' },
  { value: 'AR', label: 'Argentina', flag: '🇦🇷', name: 'Argentina' },
  { value: 'CL', label: 'Chile', flag: '🇨🇱', name: 'Chile' },
  { value: 'CO', label: 'Colombia', flag: '🇨🇴', name: 'Colombia' },
  { value: 'PE', label: 'Peru', flag: '🇵🇪', name: 'Peru' },
  // Central America & Caribbean
  { value: 'PA', label: 'Panama', flag: '🇵🇦', name: 'Panama' },
  { value: 'CR', label: 'Costa Rica', flag: '🇨🇷', name: 'Costa Rica' },
  { value: 'JM', label: 'Jamaica', flag: '🇯🇲', name: 'Jamaica' },
  // Africa
  { value: 'ZA', label: 'South Africa', flag: '🇿🇦', name: 'South Africa' },
  { value: 'EG', label: 'Egypt', flag: '🇪🇬', name: 'Egypt' },
  { value: 'NG', label: 'Nigeria', flag: '🇳🇬', name: 'Nigeria' },
  { value: 'KE', label: 'Kenya', flag: '🇰🇪', name: 'Kenya' },
  { value: 'GH', label: 'Ghana', flag: '🇬🇭', name: 'Ghana' },
  { value: 'MA', label: 'Morocco', flag: '🇲🇦', name: 'Morocco' },
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
  GR: 'Europe/Paris',
  CZ: 'Europe/Paris',
  HU: 'Europe/Paris',
  RO: 'Europe/Paris',
  PT: 'Europe/London',
  IE: 'Europe/London',
  AT: 'Europe/Paris',
  BE: 'Europe/Paris',
  FI: 'Europe/Stockholm',
  RU: 'Europe/Moscow',
  UA: 'Europe/Paris',
  TR: 'Europe/Paris',
  // South Asia
  IN: 'Asia/Kolkata',
  NP: 'Asia/Kathmandu',
  BD: 'Asia/Dhaka',
  LK: 'Asia/Colombo',
  PK: 'Asia/Karachi',
  // East Asia
  CN: 'Asia/Shanghai',
  JP: 'Asia/Tokyo',
  KR: 'Asia/Seoul',
  TW: 'Asia/Shanghai',
  HK: 'Asia/Hong_Kong',
  // Southeast Asia
  SG: 'Asia/Singapore',
  MY: 'Asia/Kuala_Lumpur',
  TH: 'Asia/Bangkok',
  ID: 'Asia/Jakarta',
  PH: 'Asia/Manila',
  VN: 'Asia/Ho_Chi_Minh',
  // Oceania
  AU: 'Australia/Sydney',
  NZ: 'Pacific/Auckland',
  // Middle East
  AE: 'Asia/Dubai',
  SA: 'Asia/Dubai',
  QA: 'Asia/Dubai',
  KW: 'Asia/Dubai',
  IL: 'Asia/Dubai',
  // South America
  BR: 'America/Sao_Paulo',
  AR: 'America/Argentina/Buenos_Aires',
  CL: 'America/Sao_Paulo',
  CO: 'America/New_York',
  PE: 'America/New_York',
  // Central America & Caribbean
  PA: 'America/New_York',
  CR: 'America/New_York',
  JM: 'America/New_York',
  // Africa
  ZA: 'Europe/Paris',
  EG: 'Europe/Paris',
  NG: 'Europe/London',
  KE: 'Europe/Paris',
  GH: 'Europe/London',
  MA: 'Europe/London',
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
  GR: 'EUR',
  CZ: 'EUR',
  HU: 'EUR',
  RO: 'EUR',
  PT: 'EUR',
  IE: 'EUR',
  AT: 'EUR',
  BE: 'EUR',
  FI: 'EUR',
  RU: 'USD',
  UA: 'USD',
  TR: 'USD',
  // South Asia
  IN: 'INR',
  NP: 'NPR',
  BD: 'BDT',
  LK: 'LKR',
  PK: 'PKR',
  // East Asia
  CN: 'CNY',
  JP: 'JPY',
  KR: 'KRW',
  TW: 'TWD',
  HK: 'HKD',
  // Southeast Asia
  SG: 'SGD',
  MY: 'MYR',
  TH: 'THB',
  ID: 'IDR',
  PH: 'PHP',
  VN: 'VND',
  // Oceania
  AU: 'AUD',
  NZ: 'NZD',
  // Middle East
  AE: 'AED',
  SA: 'SAR',
  QA: 'QAR',
  KW: 'KWD',
  IL: 'ILS',
  // South America
  BR: 'BRL',
  AR: 'USD',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',
  // Central America & Caribbean
  PA: 'USD',
  CR: 'USD',
  JM: 'USD',
  // Africa
  ZA: 'ZAR',
  EG: 'EGP',
  NG: 'NGN',
  KE: 'KES',
  GH: 'GHS',
  MA: 'MAD',
};

// Country to language mapping - primary language + English if different
// Returns array where first is always English (default), followed by regional language(s)
export const COUNTRY_LANGUAGE_MAP: Record<string, string[]> = {
  // North America
  US: ['en'],
  CA: ['en', 'fr'],
  MX: ['en', 'es'],
  // Europe
  GB: ['en'],
  DE: ['en', 'de'],
  FR: ['en', 'fr'],
  IT: ['en', 'it'],
  ES: ['en', 'es'],
  NL: ['en', 'nl'],
  CH: ['en', 'de', 'fr', 'it'],
  SE: ['en', 'sv'],
  NO: ['en', 'no'],
  DK: ['en', 'da'],
  PL: ['en', 'pl'],
  GR: ['en', 'el'],
  CZ: ['en'],
  HU: ['en'],
  RO: ['en'],
  PT: ['en', 'pt'],
  IE: ['en'],
  AT: ['en', 'de'],
  BE: ['en', 'nl', 'fr', 'de'],
  FI: ['en'],
  RU: ['en', 'ru'],
  UA: ['en'],
  TR: ['en', 'tr'],
  // South Asia
  IN: ['en', 'hi'],
  NP: ['en', 'ne'],
  BD: ['en', 'bn'],
  LK: ['en', 'si', 'ta'],
  PK: ['en', 'ur'],
  // East Asia
  CN: ['en', 'zh'],
  JP: ['en', 'ja'],
  KR: ['en', 'ko'],
  TW: ['en', 'zh'],
  HK: ['en', 'zh'],
  // Southeast Asia
  SG: ['en', 'zh', 'ms', 'ta'],
  MY: ['en', 'ms'],
  TH: ['en', 'th'],
  ID: ['en', 'id'],
  PH: ['en', 'tl'],
  VN: ['en', 'vi'],
  // Oceania
  AU: ['en'],
  NZ: ['en'],
  // Middle East
  AE: ['en', 'ar'],
  SA: ['en', 'ar'],
  QA: ['en', 'ar'],
  KW: ['en', 'ar'],
  IL: ['en', 'he', 'ar'],
  // South America
  BR: ['en', 'pt'],
  AR: ['en', 'es'],
  CL: ['en', 'es'],
  CO: ['en', 'es'],
  PE: ['en', 'es'],
  // Central America & Caribbean
  PA: ['en', 'es'],
  CR: ['en', 'es'],
  JM: ['en'],
  // Africa
  ZA: ['en', 'af'],
  EG: ['en', 'ar'],
  NG: ['en'],
  KE: ['en', 'sw'],
  GH: ['en'],
  MA: ['en', 'ar', 'fr'],
};

// Type exports
export type CurrencyCode = typeof CURRENCY_OPTIONS[number]['value'];
export type TimezoneValue = typeof TIMEZONE_OPTIONS[number]['value'];
export type DateFormatValue = typeof DATE_FORMAT_OPTIONS[number]['value'];
export type CountryCode = typeof COUNTRY_OPTIONS[number]['value'];
export type LanguageCode = typeof LANGUAGE_OPTIONS[number]['value'];

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

export function getLanguageByCode(code: string) {
  return LANGUAGE_OPTIONS.find(l => l.value === code);
}

export function getLanguageLabel(code: string): string {
  const lang = getLanguageByCode(code);
  return lang ? `${lang.label} (${lang.nativeName})` : code;
}

// Get languages available for a country - English is always first (default)
export function getLanguagesForCountry(countryCode: string): string[] {
  return COUNTRY_LANGUAGE_MAP[countryCode] || ['en'];
}

// Get language options filtered by country - English always included first
export function getLanguageOptionsForCountry(countryCode: string) {
  const countryLanguages = getLanguagesForCountry(countryCode);
  return LANGUAGE_OPTIONS.filter(lang => countryLanguages.includes(lang.value));
}

export function getAutoSyncedSettings(countryCode: string) {
  const languages = getLanguagesForCountry(countryCode);
  return {
    timezone: COUNTRY_TIMEZONE_MAP[countryCode] || 'UTC',
    currency: COUNTRY_CURRENCY_MAP[countryCode] || 'USD',
    dateFormat: countryCode === 'US' ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
    // Primary language is always English (first in array), regional language is second if exists
    primaryLanguage: 'en',
    // Additional languages available for the country (excluding English which is already primary)
    availableLanguages: languages,
  };
}
