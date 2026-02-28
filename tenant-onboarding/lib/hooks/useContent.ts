import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
});

// Cache configuration - content rarely changes
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // 1 minute
  refreshInterval: 0, // No auto refresh
};

export interface ContentResponse<T> {
  data: T;
  source: 'database' | 'fallback';
}

// FAQs
export interface FAQ {
  id?: string;
  question: string;
  answer: string;
  pageContext?: string;
  sortOrder?: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export function useFaqs(pageContext?: string) {
  const url = pageContext ? `/api/content/faqs?page=${pageContext}` : '/api/content/faqs';
  return useSWR<ContentResponse<FAQ[]>>(url, fetcher, swrConfig);
}

// Testimonials
export interface Testimonial {
  id?: string;
  quote: string;
  name: string;
  role?: string;
  company?: string;
  initials?: string;
  avatarUrl?: string;
  rating?: number;
  featured?: boolean;
  pageContext?: string;
}

export function useTestimonials(pageContext?: string, featured?: boolean) {
  let url = '/api/content/testimonials';
  const params = new URLSearchParams();
  if (pageContext) params.set('page', pageContext);
  if (featured) params.set('featured', 'true');
  if (params.toString()) url += `?${params.toString()}`;

  return useSWR<ContentResponse<Testimonial[]>>(url, fetcher, swrConfig);
}

// Features
export interface Feature {
  id?: string;
  title: string;
  description: string;
  iconName?: string;
  category?: string;
  pageContext?: string;
}

export function useFeatures(pageContext?: string) {
  const url = pageContext ? `/api/content/features?page=${pageContext}` : '/api/content/features';
  return useSWR<ContentResponse<Feature[]>>(url, fetcher, swrConfig);
}

// Trust Badges
export interface TrustBadge {
  id?: string;
  label: string;
  iconName?: string;
  description?: string;
  pageContext?: string;
}

export function useTrustBadges(pageContext?: string) {
  const url = pageContext ? `/api/content/trust-badges?page=${pageContext}` : '/api/content/trust-badges';
  return useSWR<ContentResponse<TrustBadge[]>>(url, fetcher, swrConfig);
}

// Payment Plans
export interface PlanFeature {
  id?: string;
  feature: string;
  highlighted?: boolean;
}

export interface PaymentPlan {
  id?: string;
  name: string;
  slug: string;
  price: string;
  currency: string;
  billingCycle: string;
  trialDays?: number;
  description?: string;
  tagline?: string;
  featured?: boolean;
  features?: PlanFeature[];
}

export function usePaymentPlans(countryCode?: string) {
  const url = countryCode
    ? `/api/content/payment-plans?country=${countryCode}`
    : '/api/content/payment-plans';
  return useSWR<ContentResponse<PaymentPlan[]>>(url, fetcher, swrConfig);
}

// Contacts
export interface Contact {
  id?: string;
  type: string;
  label: string;
  email?: string;
  phone?: string;
  description?: string;
  responseTime?: string;
}

export interface SocialLink {
  id?: string;
  platform: string;
  url: string;
  iconName?: string;
}

export interface CompanyLocation {
  id?: string;
  name: string;
  address: string;
  city?: string;
  country?: string;
  isPrimary?: boolean;
}

export interface ContactsData {
  contacts: Contact[];
  socialLinks: SocialLink[];
  locations: CompanyLocation[];
}

export function useContacts() {
  return useSWR<ContentResponse<ContactsData>>('/api/content/contacts', fetcher, swrConfig);
}

// Integrations
export interface IntegrationFeature {
  id?: string;
  feature: string;
}

export interface Integration {
  id?: string;
  name: string;
  category: string;
  description?: string;
  logoUrl?: string;
  status: 'active' | 'coming_soon' | 'beta';
  features?: IntegrationFeature[];
}

export interface IntegrationsData {
  all: Integration[];
  byCategory: Record<string, Integration[]>;
}

export function useIntegrations(category?: string, status?: string) {
  let url = '/api/content/integrations';
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (status) params.set('status', status);
  if (params.toString()) url += `?${params.toString()}`;

  return useSWR<ContentResponse<IntegrationsData>>(url, fetcher, swrConfig);
}

// Country Defaults
export interface CountryDefault {
  id?: string;
  countryCode: string;
  countryName: string;
  defaultCurrency: string;
  defaultTimezone: string;
  defaultLanguage?: string;
}

export function useCountryDefaults() {
  return useSWR<ContentResponse<CountryDefault[]>>('/api/content/country-defaults', fetcher, swrConfig);
}
