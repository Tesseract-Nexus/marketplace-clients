// Country to currency and timezone defaults
// Maps ISO country codes to their default currency and timezone

export interface CountryDefaults {
  currency: string;
  timezone: string;
}

// Common country defaults for currency and timezone
const countryDefaults: Record<string, CountryDefaults> = {
  // North America
  US: { currency: 'USD', timezone: 'America/New_York' },
  CA: { currency: 'CAD', timezone: 'America/Toronto' },
  MX: { currency: 'MXN', timezone: 'America/Mexico_City' },

  // Europe
  GB: { currency: 'GBP', timezone: 'Europe/London' },
  DE: { currency: 'EUR', timezone: 'Europe/Berlin' },
  FR: { currency: 'EUR', timezone: 'Europe/Paris' },
  IT: { currency: 'EUR', timezone: 'Europe/Rome' },
  ES: { currency: 'EUR', timezone: 'Europe/Madrid' },
  NL: { currency: 'EUR', timezone: 'Europe/Amsterdam' },
  BE: { currency: 'EUR', timezone: 'Europe/Brussels' },
  AT: { currency: 'EUR', timezone: 'Europe/Vienna' },
  CH: { currency: 'CHF', timezone: 'Europe/Zurich' },
  SE: { currency: 'SEK', timezone: 'Europe/Stockholm' },
  NO: { currency: 'NOK', timezone: 'Europe/Oslo' },
  DK: { currency: 'DKK', timezone: 'Europe/Copenhagen' },
  FI: { currency: 'EUR', timezone: 'Europe/Helsinki' },
  PL: { currency: 'PLN', timezone: 'Europe/Warsaw' },
  PT: { currency: 'EUR', timezone: 'Europe/Lisbon' },
  IE: { currency: 'EUR', timezone: 'Europe/Dublin' },
  GR: { currency: 'EUR', timezone: 'Europe/Athens' },
  CZ: { currency: 'CZK', timezone: 'Europe/Prague' },
  RO: { currency: 'RON', timezone: 'Europe/Bucharest' },
  HU: { currency: 'HUF', timezone: 'Europe/Budapest' },

  // Asia Pacific
  IN: { currency: 'INR', timezone: 'Asia/Kolkata' },
  CN: { currency: 'CNY', timezone: 'Asia/Shanghai' },
  JP: { currency: 'JPY', timezone: 'Asia/Tokyo' },
  KR: { currency: 'KRW', timezone: 'Asia/Seoul' },
  AU: { currency: 'AUD', timezone: 'Australia/Sydney' },
  NZ: { currency: 'NZD', timezone: 'Pacific/Auckland' },
  SG: { currency: 'SGD', timezone: 'Asia/Singapore' },
  HK: { currency: 'HKD', timezone: 'Asia/Hong_Kong' },
  TW: { currency: 'TWD', timezone: 'Asia/Taipei' },
  MY: { currency: 'MYR', timezone: 'Asia/Kuala_Lumpur' },
  TH: { currency: 'THB', timezone: 'Asia/Bangkok' },
  ID: { currency: 'IDR', timezone: 'Asia/Jakarta' },
  PH: { currency: 'PHP', timezone: 'Asia/Manila' },
  VN: { currency: 'VND', timezone: 'Asia/Ho_Chi_Minh' },
  PK: { currency: 'PKR', timezone: 'Asia/Karachi' },
  BD: { currency: 'BDT', timezone: 'Asia/Dhaka' },
  LK: { currency: 'LKR', timezone: 'Asia/Colombo' },
  NP: { currency: 'NPR', timezone: 'Asia/Kathmandu' },

  // Middle East
  AE: { currency: 'AED', timezone: 'Asia/Dubai' },
  SA: { currency: 'SAR', timezone: 'Asia/Riyadh' },
  IL: { currency: 'ILS', timezone: 'Asia/Jerusalem' },
  TR: { currency: 'TRY', timezone: 'Europe/Istanbul' },
  QA: { currency: 'QAR', timezone: 'Asia/Qatar' },
  KW: { currency: 'KWD', timezone: 'Asia/Kuwait' },
  BH: { currency: 'BHD', timezone: 'Asia/Bahrain' },
  OM: { currency: 'OMR', timezone: 'Asia/Muscat' },

  // South America
  BR: { currency: 'BRL', timezone: 'America/Sao_Paulo' },
  AR: { currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires' },
  CL: { currency: 'CLP', timezone: 'America/Santiago' },
  CO: { currency: 'COP', timezone: 'America/Bogota' },
  PE: { currency: 'PEN', timezone: 'America/Lima' },
  VE: { currency: 'VES', timezone: 'America/Caracas' },
  EC: { currency: 'USD', timezone: 'America/Guayaquil' },
  UY: { currency: 'UYU', timezone: 'America/Montevideo' },

  // Africa
  ZA: { currency: 'ZAR', timezone: 'Africa/Johannesburg' },
  NG: { currency: 'NGN', timezone: 'Africa/Lagos' },
  EG: { currency: 'EGP', timezone: 'Africa/Cairo' },
  KE: { currency: 'KES', timezone: 'Africa/Nairobi' },
  MA: { currency: 'MAD', timezone: 'Africa/Casablanca' },
  GH: { currency: 'GHS', timezone: 'Africa/Accra' },
  TZ: { currency: 'TZS', timezone: 'Africa/Dar_es_Salaam' },

  // Russia & CIS
  RU: { currency: 'RUB', timezone: 'Europe/Moscow' },
  UA: { currency: 'UAH', timezone: 'Europe/Kyiv' },
  KZ: { currency: 'KZT', timezone: 'Asia/Almaty' },
};

/**
 * Get default currency and timezone for a country
 * Falls back to USD and UTC if country not found
 */
export function getCountryDefaults(countryCode: string): CountryDefaults {
  const code = countryCode?.toUpperCase();
  return countryDefaults[code] || { currency: 'USD', timezone: 'UTC' };
}

/**
 * Get default currency for a country
 */
export function getDefaultCurrency(countryCode: string): string {
  return getCountryDefaults(countryCode).currency;
}

/**
 * Get default timezone for a country
 */
export function getDefaultTimezone(countryCode: string): string {
  return getCountryDefaults(countryCode).timezone;
}
