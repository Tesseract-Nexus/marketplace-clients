import type { Database } from '../index';
import { countryDefaults } from '../schema';

const countryDefaultsData = [
  // North America
  { countryCode: 'US', countryName: 'United States', defaultCurrency: 'USD', defaultTimezone: 'America/New_York' },
  { countryCode: 'CA', countryName: 'Canada', defaultCurrency: 'CAD', defaultTimezone: 'America/Toronto' },
  { countryCode: 'MX', countryName: 'Mexico', defaultCurrency: 'MXN', defaultTimezone: 'America/Mexico_City' },

  // Europe
  { countryCode: 'GB', countryName: 'United Kingdom', defaultCurrency: 'GBP', defaultTimezone: 'Europe/London' },
  { countryCode: 'DE', countryName: 'Germany', defaultCurrency: 'EUR', defaultTimezone: 'Europe/Berlin' },
  { countryCode: 'FR', countryName: 'France', defaultCurrency: 'EUR', defaultTimezone: 'Europe/Paris' },
  { countryCode: 'IT', countryName: 'Italy', defaultCurrency: 'EUR', defaultTimezone: 'Europe/Rome' },
  { countryCode: 'ES', countryName: 'Spain', defaultCurrency: 'EUR', defaultTimezone: 'Europe/Madrid' },
  { countryCode: 'NL', countryName: 'Netherlands', defaultCurrency: 'EUR', defaultTimezone: 'Europe/Amsterdam' },
  { countryCode: 'BE', countryName: 'Belgium', defaultCurrency: 'EUR', defaultTimezone: 'Europe/Brussels' },
  { countryCode: 'AT', countryName: 'Austria', defaultCurrency: 'EUR', defaultTimezone: 'Europe/Vienna' },
  { countryCode: 'CH', countryName: 'Switzerland', defaultCurrency: 'CHF', defaultTimezone: 'Europe/Zurich' },
  { countryCode: 'SE', countryName: 'Sweden', defaultCurrency: 'SEK', defaultTimezone: 'Europe/Stockholm' },
  { countryCode: 'NO', countryName: 'Norway', defaultCurrency: 'NOK', defaultTimezone: 'Europe/Oslo' },
  { countryCode: 'DK', countryName: 'Denmark', defaultCurrency: 'DKK', defaultTimezone: 'Europe/Copenhagen' },
  { countryCode: 'FI', countryName: 'Finland', defaultCurrency: 'EUR', defaultTimezone: 'Europe/Helsinki' },
  { countryCode: 'PL', countryName: 'Poland', defaultCurrency: 'PLN', defaultTimezone: 'Europe/Warsaw' },
  { countryCode: 'PT', countryName: 'Portugal', defaultCurrency: 'EUR', defaultTimezone: 'Europe/Lisbon' },
  { countryCode: 'IE', countryName: 'Ireland', defaultCurrency: 'EUR', defaultTimezone: 'Europe/Dublin' },
  { countryCode: 'GR', countryName: 'Greece', defaultCurrency: 'EUR', defaultTimezone: 'Europe/Athens' },
  { countryCode: 'CZ', countryName: 'Czech Republic', defaultCurrency: 'CZK', defaultTimezone: 'Europe/Prague' },
  { countryCode: 'RO', countryName: 'Romania', defaultCurrency: 'RON', defaultTimezone: 'Europe/Bucharest' },
  { countryCode: 'HU', countryName: 'Hungary', defaultCurrency: 'HUF', defaultTimezone: 'Europe/Budapest' },

  // Asia Pacific
  { countryCode: 'IN', countryName: 'India', defaultCurrency: 'INR', defaultTimezone: 'Asia/Kolkata' },
  { countryCode: 'CN', countryName: 'China', defaultCurrency: 'CNY', defaultTimezone: 'Asia/Shanghai' },
  { countryCode: 'JP', countryName: 'Japan', defaultCurrency: 'JPY', defaultTimezone: 'Asia/Tokyo' },
  { countryCode: 'KR', countryName: 'South Korea', defaultCurrency: 'KRW', defaultTimezone: 'Asia/Seoul' },
  { countryCode: 'AU', countryName: 'Australia', defaultCurrency: 'AUD', defaultTimezone: 'Australia/Sydney' },
  { countryCode: 'NZ', countryName: 'New Zealand', defaultCurrency: 'NZD', defaultTimezone: 'Pacific/Auckland' },
  { countryCode: 'SG', countryName: 'Singapore', defaultCurrency: 'SGD', defaultTimezone: 'Asia/Singapore' },
  { countryCode: 'HK', countryName: 'Hong Kong', defaultCurrency: 'HKD', defaultTimezone: 'Asia/Hong_Kong' },
  { countryCode: 'TW', countryName: 'Taiwan', defaultCurrency: 'TWD', defaultTimezone: 'Asia/Taipei' },
  { countryCode: 'MY', countryName: 'Malaysia', defaultCurrency: 'MYR', defaultTimezone: 'Asia/Kuala_Lumpur' },
  { countryCode: 'TH', countryName: 'Thailand', defaultCurrency: 'THB', defaultTimezone: 'Asia/Bangkok' },
  { countryCode: 'ID', countryName: 'Indonesia', defaultCurrency: 'IDR', defaultTimezone: 'Asia/Jakarta' },
  { countryCode: 'PH', countryName: 'Philippines', defaultCurrency: 'PHP', defaultTimezone: 'Asia/Manila' },
  { countryCode: 'VN', countryName: 'Vietnam', defaultCurrency: 'VND', defaultTimezone: 'Asia/Ho_Chi_Minh' },
  { countryCode: 'PK', countryName: 'Pakistan', defaultCurrency: 'PKR', defaultTimezone: 'Asia/Karachi' },
  { countryCode: 'BD', countryName: 'Bangladesh', defaultCurrency: 'BDT', defaultTimezone: 'Asia/Dhaka' },
  { countryCode: 'LK', countryName: 'Sri Lanka', defaultCurrency: 'LKR', defaultTimezone: 'Asia/Colombo' },
  { countryCode: 'NP', countryName: 'Nepal', defaultCurrency: 'NPR', defaultTimezone: 'Asia/Kathmandu' },

  // Middle East
  { countryCode: 'AE', countryName: 'United Arab Emirates', defaultCurrency: 'AED', defaultTimezone: 'Asia/Dubai' },
  { countryCode: 'SA', countryName: 'Saudi Arabia', defaultCurrency: 'SAR', defaultTimezone: 'Asia/Riyadh' },
  { countryCode: 'IL', countryName: 'Israel', defaultCurrency: 'ILS', defaultTimezone: 'Asia/Jerusalem' },
  { countryCode: 'TR', countryName: 'Turkey', defaultCurrency: 'TRY', defaultTimezone: 'Europe/Istanbul' },
  { countryCode: 'QA', countryName: 'Qatar', defaultCurrency: 'QAR', defaultTimezone: 'Asia/Qatar' },
  { countryCode: 'KW', countryName: 'Kuwait', defaultCurrency: 'KWD', defaultTimezone: 'Asia/Kuwait' },
  { countryCode: 'BH', countryName: 'Bahrain', defaultCurrency: 'BHD', defaultTimezone: 'Asia/Bahrain' },
  { countryCode: 'OM', countryName: 'Oman', defaultCurrency: 'OMR', defaultTimezone: 'Asia/Muscat' },

  // South America
  { countryCode: 'BR', countryName: 'Brazil', defaultCurrency: 'BRL', defaultTimezone: 'America/Sao_Paulo' },
  { countryCode: 'AR', countryName: 'Argentina', defaultCurrency: 'ARS', defaultTimezone: 'America/Argentina/Buenos_Aires' },
  { countryCode: 'CL', countryName: 'Chile', defaultCurrency: 'CLP', defaultTimezone: 'America/Santiago' },
  { countryCode: 'CO', countryName: 'Colombia', defaultCurrency: 'COP', defaultTimezone: 'America/Bogota' },
  { countryCode: 'PE', countryName: 'Peru', defaultCurrency: 'PEN', defaultTimezone: 'America/Lima' },
  { countryCode: 'VE', countryName: 'Venezuela', defaultCurrency: 'VES', defaultTimezone: 'America/Caracas' },
  { countryCode: 'EC', countryName: 'Ecuador', defaultCurrency: 'USD', defaultTimezone: 'America/Guayaquil' },
  { countryCode: 'UY', countryName: 'Uruguay', defaultCurrency: 'UYU', defaultTimezone: 'America/Montevideo' },

  // Africa
  { countryCode: 'ZA', countryName: 'South Africa', defaultCurrency: 'ZAR', defaultTimezone: 'Africa/Johannesburg' },
  { countryCode: 'NG', countryName: 'Nigeria', defaultCurrency: 'NGN', defaultTimezone: 'Africa/Lagos' },
  { countryCode: 'EG', countryName: 'Egypt', defaultCurrency: 'EGP', defaultTimezone: 'Africa/Cairo' },
  { countryCode: 'KE', countryName: 'Kenya', defaultCurrency: 'KES', defaultTimezone: 'Africa/Nairobi' },
  { countryCode: 'MA', countryName: 'Morocco', defaultCurrency: 'MAD', defaultTimezone: 'Africa/Casablanca' },
  { countryCode: 'GH', countryName: 'Ghana', defaultCurrency: 'GHS', defaultTimezone: 'Africa/Accra' },
  { countryCode: 'TZ', countryName: 'Tanzania', defaultCurrency: 'TZS', defaultTimezone: 'Africa/Dar_es_Salaam' },

  // Russia & CIS
  { countryCode: 'RU', countryName: 'Russia', defaultCurrency: 'RUB', defaultTimezone: 'Europe/Moscow' },
  { countryCode: 'UA', countryName: 'Ukraine', defaultCurrency: 'UAH', defaultTimezone: 'Europe/Kyiv' },
  { countryCode: 'KZ', countryName: 'Kazakhstan', defaultCurrency: 'KZT', defaultTimezone: 'Asia/Almaty' },
];

export async function seedCountryDefaults(db: Database) {
  await db.insert(countryDefaults).values(countryDefaultsData).onConflictDoNothing();
  console.log(`  ✓ Seeded ${countryDefaultsData.length} country defaults`);
}
