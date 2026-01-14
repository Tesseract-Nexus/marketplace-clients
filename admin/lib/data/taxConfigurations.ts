/**
 * Tax Configuration Templates
 * Pre-configured tax setups for major countries
 */

import { TaxType, JurisdictionType } from '../services/taxService';

// Types
export interface StateConfig {
  name: string;
  code: string;
  stateCode: string;
}

export interface RateConfig {
  name: string;
  rate: number;
  taxTypes: TaxType[];
  appliesToProducts: boolean;
  appliesToShipping: boolean;
}

export interface CountryTaxConfig {
  countryCode: string;
  countryName: string;
  flag: string;
  taxType: 'GST' | 'VAT' | 'SALES_TAX' | 'HST_GST';
  taxTypeLabel: string;
  description: string;
  businessNumberRequired: boolean;
  businessNumberLabel: string;
  businessNumberFormat: string;
  businessNumberPlaceholder: string;
  states: StateConfig[];
  rates: RateConfig[];
  helpLinks: { label: string; url: string }[];
  features: string[];
}

export interface TaxSetupStatus {
  isConfigured: boolean;
  storeCountry: string | null;
  storeCountryCode: string | null;
  jurisdictionsCount: number;
  ratesCount: number;
  exemptionsCount: number;
  hasCountryJurisdiction: boolean;
  hasStateJurisdictions: boolean;
  hasActiveTaxRates: boolean;
  completionPercentage: number;
}

// India GST States and Union Territories with GST State Codes
export const INDIA_STATES: StateConfig[] = [
  // States
  { name: 'Andhra Pradesh', code: 'AP', stateCode: '37' },
  { name: 'Arunachal Pradesh', code: 'AR', stateCode: '12' },
  { name: 'Assam', code: 'AS', stateCode: '18' },
  { name: 'Bihar', code: 'BR', stateCode: '10' },
  { name: 'Chhattisgarh', code: 'CG', stateCode: '22' },
  { name: 'Goa', code: 'GA', stateCode: '30' },
  { name: 'Gujarat', code: 'GJ', stateCode: '24' },
  { name: 'Haryana', code: 'HR', stateCode: '06' },
  { name: 'Himachal Pradesh', code: 'HP', stateCode: '02' },
  { name: 'Jharkhand', code: 'JH', stateCode: '20' },
  { name: 'Karnataka', code: 'KA', stateCode: '29' },
  { name: 'Kerala', code: 'KL', stateCode: '32' },
  { name: 'Madhya Pradesh', code: 'MP', stateCode: '23' },
  { name: 'Maharashtra', code: 'MH', stateCode: '27' },
  { name: 'Manipur', code: 'MN', stateCode: '14' },
  { name: 'Meghalaya', code: 'ML', stateCode: '17' },
  { name: 'Mizoram', code: 'MZ', stateCode: '15' },
  { name: 'Nagaland', code: 'NL', stateCode: '13' },
  { name: 'Odisha', code: 'OD', stateCode: '21' },
  { name: 'Punjab', code: 'PB', stateCode: '03' },
  { name: 'Rajasthan', code: 'RJ', stateCode: '08' },
  { name: 'Sikkim', code: 'SK', stateCode: '11' },
  { name: 'Tamil Nadu', code: 'TN', stateCode: '33' },
  { name: 'Telangana', code: 'TS', stateCode: '36' },
  { name: 'Tripura', code: 'TR', stateCode: '16' },
  { name: 'Uttar Pradesh', code: 'UP', stateCode: '09' },
  { name: 'Uttarakhand', code: 'UK', stateCode: '05' },
  { name: 'West Bengal', code: 'WB', stateCode: '19' },
  // Union Territories
  { name: 'Andaman and Nicobar Islands', code: 'AN', stateCode: '35' },
  { name: 'Chandigarh', code: 'CH', stateCode: '04' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DD', stateCode: '26' },
  { name: 'Delhi', code: 'DL', stateCode: '07' },
  { name: 'Jammu and Kashmir', code: 'JK', stateCode: '01' },
  { name: 'Ladakh', code: 'LA', stateCode: '38' },
  { name: 'Lakshadweep', code: 'LD', stateCode: '31' },
  { name: 'Puducherry', code: 'PY', stateCode: '34' },
];

// India GST Rate Slabs
export const INDIA_GST_RATES: RateConfig[] = [
  {
    name: 'GST 5%',
    rate: 5,
    taxTypes: ['CGST', 'SGST', 'IGST'],
    appliesToProducts: true,
    appliesToShipping: true,
  },
  {
    name: 'GST 12%',
    rate: 12,
    taxTypes: ['CGST', 'SGST', 'IGST'],
    appliesToProducts: true,
    appliesToShipping: true,
  },
  {
    name: 'GST 18%',
    rate: 18,
    taxTypes: ['CGST', 'SGST', 'IGST'],
    appliesToProducts: true,
    appliesToShipping: true,
  },
  {
    name: 'GST 28%',
    rate: 28,
    taxTypes: ['CGST', 'SGST', 'IGST'],
    appliesToProducts: true,
    appliesToShipping: true,
  },
];

// Country Tax Configurations
export const TAX_CONFIGURATIONS: Record<string, CountryTaxConfig> = {
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    flag: '🇮🇳',
    taxType: 'GST',
    taxTypeLabel: 'Goods and Services Tax (GST)',
    description: 'Set up India GST with CGST, SGST for intrastate and IGST for interstate transactions.',
    businessNumberRequired: false,
    businessNumberLabel: 'GSTIN (GST Identification Number)',
    businessNumberFormat: '00XXXXX0000X0XX',
    businessNumberPlaceholder: '27AABCU9603R1ZM',
    states: INDIA_STATES,
    rates: INDIA_GST_RATES,
    helpLinks: [
      { label: 'GST Portal', url: 'https://www.gst.gov.in/' },
      { label: 'HSN Code Search', url: 'https://services.gst.gov.in/services/searchhsnsac' },
      { label: 'GST Rate Finder', url: 'https://cbic-gst.gov.in/gst-goods-services-rates.html' },
    ],
    features: [
      'CGST + SGST for intrastate sales',
      'IGST for interstate sales',
      'All 28 states and 8 UTs supported',
      'HSN/SAC code integration',
      'GST slab rates: 0%, 5%, 12%, 18%, 28%',
    ],
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    taxType: 'SALES_TAX',
    taxTypeLabel: 'Sales Tax',
    description: 'Set up US sales tax with state and local tax rates.',
    businessNumberRequired: false,
    businessNumberLabel: 'Sales Tax Permit Number',
    businessNumberFormat: 'Varies by state',
    businessNumberPlaceholder: 'XX-XXXXXXX',
    states: [
      { name: 'California', code: 'CA', stateCode: 'CA' },
      { name: 'New York', code: 'NY', stateCode: 'NY' },
      { name: 'Texas', code: 'TX', stateCode: 'TX' },
      { name: 'Florida', code: 'FL', stateCode: 'FL' },
    ],
    rates: [
      { name: 'State Sales Tax', rate: 6, taxTypes: ['SALES'], appliesToProducts: true, appliesToShipping: false },
    ],
    helpLinks: [
      { label: 'Sales Tax Institute', url: 'https://www.salestaxinstitute.com/' },
    ],
    features: [
      'State-level sales tax',
      'County and city tax support',
      'Nexus tracking',
      'Economic nexus thresholds',
    ],
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    taxType: 'VAT',
    taxTypeLabel: 'Value Added Tax (VAT)',
    description: 'Set up UK VAT with standard, reduced, and zero rates.',
    businessNumberRequired: true,
    businessNumberLabel: 'VAT Registration Number',
    businessNumberFormat: 'GB000000000',
    businessNumberPlaceholder: 'GB123456789',
    states: [
      { name: 'England', code: 'ENG', stateCode: 'ENG' },
      { name: 'Scotland', code: 'SCO', stateCode: 'SCO' },
      { name: 'Wales', code: 'WAL', stateCode: 'WAL' },
      { name: 'Northern Ireland', code: 'NIR', stateCode: 'NIR' },
    ],
    rates: [
      { name: 'Standard VAT', rate: 20, taxTypes: ['VAT'], appliesToProducts: true, appliesToShipping: true },
      { name: 'Reduced VAT', rate: 5, taxTypes: ['VAT'], appliesToProducts: true, appliesToShipping: false },
    ],
    helpLinks: [
      { label: 'HMRC VAT', url: 'https://www.gov.uk/vat-rates' },
    ],
    features: [
      'Standard rate 20%',
      'Reduced rate 5%',
      'Zero-rated goods support',
      'Post-Brexit compliance',
    ],
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    taxType: 'GST',
    taxTypeLabel: 'Goods and Services Tax (GST)',
    description: 'Set up Australian GST at 10% for goods and services.',
    businessNumberRequired: true,
    businessNumberLabel: 'Australian Business Number (ABN)',
    businessNumberFormat: '00 000 000 000',
    businessNumberPlaceholder: '51 824 753 556',
    states: [
      { name: 'New South Wales', code: 'NSW', stateCode: 'NSW' },
      { name: 'Victoria', code: 'VIC', stateCode: 'VIC' },
      { name: 'Queensland', code: 'QLD', stateCode: 'QLD' },
      { name: 'South Australia', code: 'SA', stateCode: 'SA' },
      { name: 'Western Australia', code: 'WA', stateCode: 'WA' },
      { name: 'Tasmania', code: 'TAS', stateCode: 'TAS' },
      { name: 'Northern Territory', code: 'NT', stateCode: 'NT' },
      { name: 'Australian Capital Territory', code: 'ACT', stateCode: 'ACT' },
    ],
    rates: [
      { name: 'GST', rate: 10, taxTypes: ['GST'], appliesToProducts: true, appliesToShipping: true },
    ],
    helpLinks: [
      { label: 'ATO GST', url: 'https://www.ato.gov.au/Business/GST/' },
    ],
    features: [
      'Flat 10% GST rate',
      'All states and territories',
      'GST-free goods support',
      'Input tax credits',
    ],
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    flag: '🇨🇦',
    taxType: 'HST_GST',
    taxTypeLabel: 'GST/HST/PST/QST',
    description: 'Set up Canadian taxes including Federal GST, Provincial HST/PST, and Quebec QST.',
    businessNumberRequired: true,
    businessNumberLabel: 'Business Number (BN)',
    businessNumberFormat: '000000000RT0000',
    businessNumberPlaceholder: '123456789RT0001',
    states: [
      { name: 'Ontario', code: 'ON', stateCode: 'ON' },
      { name: 'Quebec', code: 'QC', stateCode: 'QC' },
      { name: 'British Columbia', code: 'BC', stateCode: 'BC' },
      { name: 'Alberta', code: 'AB', stateCode: 'AB' },
    ],
    rates: [
      { name: 'Federal GST', rate: 5, taxTypes: ['GST'], appliesToProducts: true, appliesToShipping: true },
      { name: 'HST', rate: 13, taxTypes: ['HST'], appliesToProducts: true, appliesToShipping: true },
    ],
    helpLinks: [
      { label: 'CRA GST/HST', url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses.html' },
    ],
    features: [
      'Federal GST 5%',
      'Provincial HST (ON, NS, NB, PE, NL)',
      'Provincial PST (BC, SK, MB)',
      'Quebec QST with compound tax',
    ],
  },
};

// Country name to code mapping
export const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'India': 'IN',
  'United States': 'US',
  'United States of America': 'US',
  'USA': 'US',
  'United Kingdom': 'GB',
  'UK': 'GB',
  'Great Britain': 'GB',
  'Australia': 'AU',
  'Canada': 'CA',
  'Germany': 'DE',
  'France': 'FR',
  'Italy': 'IT',
  'Spain': 'ES',
  'Netherlands': 'NL',
  'New Zealand': 'NZ',
  'Singapore': 'SG',
};

// Get country config by name or code
export function getCountryConfig(countryNameOrCode: string): CountryTaxConfig | null {
  // Try direct code lookup
  if (TAX_CONFIGURATIONS[countryNameOrCode]) {
    return TAX_CONFIGURATIONS[countryNameOrCode];
  }
  // Try name to code mapping
  const code = COUNTRY_NAME_TO_CODE[countryNameOrCode];
  if (code && TAX_CONFIGURATIONS[code]) {
    return TAX_CONFIGURATIONS[code];
  }
  return null;
}

// Get country code from name
export function getCountryCode(countryName: string): string | null {
  if (TAX_CONFIGURATIONS[countryName]) {
    return countryName;
  }
  return COUNTRY_NAME_TO_CODE[countryName] || null;
}

// GSTIN validation (India)
export function validateGSTIN(gstin: string): { valid: boolean; stateCode?: string; error?: string } {
  if (!gstin) {
    return { valid: true }; // Optional field
  }

  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (gstin.length !== 15) {
    return { valid: false, error: 'GSTIN must be 15 characters' };
  }

  if (!gstinRegex.test(gstin.toUpperCase())) {
    return { valid: false, error: 'Invalid GSTIN format' };
  }

  const stateCode = gstin.substring(0, 2);
  const validState = INDIA_STATES.find(s => s.stateCode === stateCode);

  if (!validState) {
    return { valid: false, error: 'Invalid state code in GSTIN' };
  }

  return { valid: true, stateCode };
}

// Get state from GSTIN
export function getStateFromGSTIN(gstin: string): StateConfig | null {
  if (!gstin || gstin.length < 2) return null;
  const stateCode = gstin.substring(0, 2);
  return INDIA_STATES.find(s => s.stateCode === stateCode) || null;
}

// Calculate setup completion percentage
export function calculateSetupCompletion(
  jurisdictionsCount: number,
  ratesCount: number,
  hasCountryJurisdiction: boolean
): number {
  let score = 0;

  // Country jurisdiction exists (40%)
  if (hasCountryJurisdiction) score += 40;

  // Has at least one state jurisdiction (20%)
  if (jurisdictionsCount > 1) score += 20;

  // Has at least one tax rate (30%)
  if (ratesCount > 0) score += 30;

  // Has multiple tax rates (10%)
  if (ratesCount > 4) score += 10;

  return Math.min(score, 100);
}
