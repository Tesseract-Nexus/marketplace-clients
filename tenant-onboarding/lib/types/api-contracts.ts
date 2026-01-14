/**
 * API Contracts for Onboarding Service
 * Local type definitions (previously from @workspace/api-contracts)
 */

// Session types
export interface InitializeSessionRequest {
  source?: string;
  referral_code?: string;
}

export interface SessionResponse {
  session_id: string;
  status: OnboardingStatus;
  current_step: OnboardingStep;
  completed_steps: OnboardingStep[];
  business_info?: BusinessInformation;
  contact_info?: ContactInformation;
  address?: BusinessAddress;
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
}

export interface ContactDetailsResponse {
  success: boolean;
  message: string;
  data?: ContactInformation;
}

// Address types
export interface BusinessAddressRequest {
  street_address: string;
  street_address_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
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
  address?: BusinessAddress;
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
}

export interface ContactInformation {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title?: string;
}

export interface BusinessAddress {
  street_address: string;
  street_address_2?: string;
  city: string;
  state: string;
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
  street_address_2?: string;
  city: string;
  state: string;
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
  code: string;
  phone_code: string;
  flag?: string;
}

export interface State {
  id: string;
  name: string;
  code: string;
  country_id: string;
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
