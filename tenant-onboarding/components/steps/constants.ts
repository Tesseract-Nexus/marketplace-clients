import { Building2, User, MapPin, Store, FileText, Scale, Rocket } from 'lucide-react';

export const BUSINESS_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llc', label: 'LLC' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'non_profit', label: 'Non-Profit' },
  { value: 'other', label: 'Other' }
] as const;

export const INDUSTRY_CATEGORIES = [
  'Fashion & Apparel',
  'Electronics & Technology',
  'Food & Beverage',
  'Health & Beauty',
  'Home & Garden',
  'Sports & Recreation',
  'Books & Media',
  'Automotive',
  'Arts & Crafts',
  'Other'
];

export const JOB_TITLES = [
  'CEO/Founder',
  'CTO',
  'Marketing Manager',
  'Operations Manager',
  'Sales Manager',
  'Product Manager',
  'Other'
];

export const steps = [
  { id: 0, label: 'Business', icon: Building2 },
  { id: 1, label: 'Personal', icon: User },
  { id: 2, label: 'Location', icon: MapPin },
  { id: 3, label: 'Store Setup', icon: Store },
  { id: 4, label: 'Documents', icon: FileText, optional: true },
  { id: 5, label: 'Legal', icon: Scale },
  { id: 6, label: 'Launch', icon: Rocket },
];

// CSS class constants
export const inputClass = "w-full h-14 px-5 text-base bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors";
export const inputErrorClass = "w-full h-14 px-5 text-base bg-destructive/5 border border-destructive/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-destructive focus:ring-2 focus:ring-destructive/20";
export const selectClass = "w-full h-14 px-5 text-base bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors appearance-none cursor-pointer";
export const labelClass = "block text-sm font-medium text-foreground-secondary mb-2";

// Display formatting helpers (#21)
export function getBusinessTypeLabel(value: string): string {
  const found = BUSINESS_TYPES.find(bt => bt.value === value);
  return found?.label || value;
}

export function getCountryName(code: string, countries: { id: string; name: string }[]): string {
  const found = countries.find(c => c.id === code);
  return found?.name || code;
}

export function getStateName(code: string, states: { id: string; name: string }[]): string {
  const found = states.find(s => s.id === code);
  return found?.name || code;
}

export function formatPhoneDisplay(
  phoneCountryCode: string,
  phoneNumber: string,
  countries: { id: string; phone_code?: string; calling_code?: string }[]
): string {
  if (!phoneNumber) return '';
  const country = countries.find(c => c.id === phoneCountryCode);
  const dialCode = country?.calling_code || country?.phone_code || phoneCountryCode;
  return `${dialCode} ${phoneNumber}`;
}

/**
 * Generate a URL-friendly slug from business name
 * Example: "My Amazing Store" -> "my-amazing-store"
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')        // Remove leading/trailing hyphens
    .slice(0, 50);                // Max 50 chars
}
