/**
 * API Contracts for Onboarding Service
 * Local type definitions (previously from @workspace/api-contracts)
 */

// Session types
export interface InitializeSessionRequest {
  source?: string;
  referral_code?: string;
}

export interface StoreSetup {
  subdomain?: string;
  storefront_slug?: string;
  currency?: string;
  timezone?: string;
  language?: string;
  business_model?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  // Custom domain fields
  use_custom_domain?: boolean;
  custom_domain?: string;
  custom_admin_subdomain?: string;
  custom_storefront_subdomain?: string;
}

export interface SessionResponse {
  session_id: string;
  status: OnboardingStatus;
  current_step: OnboardingStep;
  completed_steps: OnboardingStep[];
  business_info?: BusinessInformation;
  contact_info?: ContactInformation;
  contact_details?: ContactInformation;
  contact_information?: ContactInformation[]; // Backend returns array
  address?: BusinessAddress;
  business_address?: BusinessAddress;
  store_setup?: StoreSetup;
  email_verified?: boolean;
  phone_verified?: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

// Business info types
export interface BusinessInfoRequest {
  business_name: string;
  business_type: string;
  industry: string;
  employee_count?: string;
  annual_revenue?: string;
  website?: string;
  business_description?: string;
  registration_number?: string;
  existing_store_platforms?: string[];
  has_existing_store?: boolean;
  migration_interest?: boolean;
}

export interface BusinessInfoResponse {
  success: boolean;
  message: string;
  data?: BusinessInformation;
}

// Contact types
export interface ContactDetailsRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title?: string;
  phone_country_code?: string;
}

export interface ContactDetailsResponse {
  success: boolean;
  message: string;
  data?: ContactInformation;
}

// Address types
export interface BusinessAddressRequest {
  street_address: string;
  address_line_2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  address_type?: string;
  billing_same_as_business?: boolean;
  billing_street_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
}

export interface BusinessAddressResponse {
  success: boolean;
  message: string;
  data?: BusinessAddress;
}

// Tenant service types
export interface OnboardingTemplate {
  id: string;
  name: string;
  steps: OnboardingStep[];
  is_default: boolean;
}

export interface OnboardingSession {
  id: string;
  session_id: string;
  status: OnboardingStatus;
  current_step: OnboardingStep;
  completed_steps: OnboardingStep[];
  template_id?: string;
  business_info?: BusinessInformation;
  contact_info?: ContactInformation;
  contact_details?: ContactInformation;
  address?: BusinessAddress;
  business_address?: BusinessAddress;
  store_setup?: StoreSetup;
  email_verified?: boolean;
  phone_verified?: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface BusinessInformation {
  business_name: string;
  business_type: string;
  industry: string;
  employee_count?: string;
  annual_revenue?: string;
  website?: string;
  business_description?: string;
  registration_number?: string;
  existing_store_platforms?: string[];
  has_existing_store?: boolean;
  migration_interest?: boolean;
}

export interface ContactInformation {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title?: string;
  phone_country_code?: string;
}

export interface BusinessAddress {
  street_address: string;
  address_line_2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  country_name?: string;
  state_name?: string;
}

// Request types for tenant service
export interface CreateOnboardingSessionRequest {
  template_id?: string;
  source?: string;
  referral_code?: string;
}

export interface UpdateOnboardingSessionRequest {
  status?: OnboardingStatus;
  current_step?: OnboardingStep;
  completed_steps?: OnboardingStep[];
}

export interface CreateBusinessInformationRequest {
  session_id: string;
  business_name: string;
  business_type: string;
  industry: string;
  employee_count?: string;
  annual_revenue?: string;
  website?: string;
}

export interface UpdateBusinessInformationRequest extends Partial<CreateBusinessInformationRequest> {
  session_id: string;
}

export interface CreateContactInformationRequest {
  session_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title?: string;
}

export interface UpdateContactInformationRequest extends Partial<CreateContactInformationRequest> {
  session_id: string;
}

export interface CreateBusinessAddressRequest {
  session_id: string;
  street_address: string;
  address_line_2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
}

export interface UpdateBusinessAddressRequest extends Partial<CreateBusinessAddressRequest> {
  session_id: string;
}

// Location types
export interface Country {
  id: string;
  name: string;
  code?: string;
  phone_code: string;
  flag?: string;
  // Extended fields from location service
  calling_code?: string;
  flag_emoji?: string;
  capital?: string;
  currency?: string;
  native_name?: string;
  region?: string;
  subregion?: string;
  active?: boolean;
}

export interface State {
  id: string;
  name: string;
  code: string;
  country_id: string;
  type?: string;
  active?: boolean;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface Timezone {
  id: string;
  name: string;
  offset: string;
}

// Enums
export type OnboardingStatus =
  | 'pending'
  | 'in_progress'
  | 'email_verification'
  | 'completed'
  | 'expired'
  | 'cancelled';

export type OnboardingStep =
  | 'business_info'
  | 'contact_details'
  | 'business_address'
  | 'email_verification'
  | 'store_setup'
  | 'payment'
  | 'complete';

// Address autocomplete types
export interface AddressAutocompleteResult {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

export interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  street_address: string;
  city: string;
  state: string;
  state_code: string;
  postal_code: string;
  country: string;
  country_code: string;
  latitude?: number;
  longitude?: number;
}

// Response wrapper types for location service
export interface CountriesResponse {
  data: Country[];
  total?: number;
}

export interface StatesResponse {
  data: State[];
  total?: number;
}

export interface CurrenciesResponse {
  data: Currency[];
  total?: number;
}

export interface TimezonesResponse {
  data: Timezone[];
  total?: number;
}
