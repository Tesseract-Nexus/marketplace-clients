import type { UseFormReturn } from 'react-hook-form';
import type { BusinessInfoForm, ContactDetailsForm, BusinessAddressForm, StoreSetupForm } from '../../lib/validations/onboarding';
import type { Country, State, Currency, Timezone } from '../../lib/api/location';
import type { UploadedDocument } from '../DocumentUpload';
import type { ParsedAddressData } from '../AddressAutocomplete';

// Common step navigation props
export interface StepNavigation {
  setCurrentSection: (section: number) => void;
  isLoading: boolean;
}

// Shared form style classes
export interface FormStyles {
  inputClass: string;
  inputErrorClass: string;
  selectClass: string;
  labelClass: string;
}

// Slug/domain validation state shape
export interface SlugValidationState {
  isChecking: boolean;
  isAvailable: boolean | null;
  message: string;
  suggestions: string[];
}

export interface CustomDomainValidationState {
  isChecking: boolean;
  isValid: boolean | null;
  dnsConfigured: boolean;
  message: string;
  verificationRecord?: { type: string; host: string; value: string };
  verificationRecords?: { type: string; host: string; value: string; purpose?: string }[];
  routingRecords?: { type: string; host: string; value: string; purpose?: string }[];
  proxyTarget?: string;
  cnameDelegationRecord?: { type: string; host: string; value: string; purpose?: string };
  cnameDelegationEnabled?: boolean;
  formatWarning?: string;
  suggestedDomain?: string;
}

export interface DomainVerificationState {
  isVerifying: boolean;
  dnsVerified: boolean;
  dnsRecordFound: boolean;
  sslStatus: 'pending' | 'provisioning' | 'active' | 'failed';
  message: string;
  lastChecked: Date | null;
}

// Step-specific props
export interface BusinessInfoStepProps extends StepNavigation {
  form: UseFormReturn<BusinessInfoForm>;
  onSubmit: (data: BusinessInfoForm) => void;
}

export interface ContactDetailsStepProps extends StepNavigation {
  form: UseFormReturn<ContactDetailsForm>;
  onSubmit: (data: ContactDetailsForm) => void;
  countries: Country[];
}

export interface LocationStepProps extends StepNavigation {
  form: UseFormReturn<BusinessAddressForm>;
  onSubmit: (data: BusinessAddressForm) => void;
  countries: Country[];
  states: State[];
  isLoadingStates: boolean;
  loadStates: (countryId: string) => void;
  onAddressSelect: (address: ParsedAddressData) => void;
}

export interface StoreSetupStepProps extends StepNavigation {
  form: UseFormReturn<StoreSetupForm>;
  onContinue: () => void;
  currencies: Currency[];
  timezones: Timezone[];
  baseDomain: string;
  businessInfo: Record<string, any>;
  slugValidation: SlugValidationState;
  storefrontValidation: SlugValidationState;
  customDomainValidation: CustomDomainValidationState;
  domainVerification: DomainVerificationState;
  showCustomDomainSection: boolean;
  setShowCustomDomainSection: (show: boolean) => void;
  subdomainManuallyEdited: boolean;
  setSubdomainManuallyEdited: (edited: boolean) => void;
  storefrontSlugManuallyEdited: boolean;
  setStorefrontSlugManuallyEdited: (edited: boolean) => void;
  showSensitiveDNS: boolean;
  setShowSensitiveDNS: (show: boolean) => void;
  validateCustomDomain: (domain: string) => void;
  verifyDomainDNS: () => void;
  setCustomDomainValidation: (state: CustomDomainValidationState) => void;
  copiedItem: string | null;
  copyToClipboard: (text: string, itemId: string) => void;
}

export interface DocumentsStepProps extends StepNavigation {
  sessionId: string | null;
  addressForm: UseFormReturn<BusinessAddressForm>;
  storeSetupForm: UseFormReturn<StoreSetupForm>;
  businessInfo: Record<string, any>;
  businessAddress: Record<string, any>;
  addressProofType: string;
  setAddressProofType: (type: string) => void;
  addressProofDocument: UploadedDocument | null;
  setAddressProofDocument: (doc: UploadedDocument | null) => void;
  businessProofType: string;
  setBusinessProofType: (type: string) => void;
  businessProofDocument: UploadedDocument | null;
  setBusinessProofDocument: (doc: UploadedDocument | null) => void;
  logoDocument: UploadedDocument | null;
  setLogoDocument: (doc: UploadedDocument | null) => void;
  onContinue: () => void;
}

export interface LegalStepProps extends StepNavigation {
  legalAccepted: boolean;
  setLegalAccepted: (accepted: boolean) => void;
  hasScrolledToBottom: boolean;
  setHasScrolledToBottom: (scrolled: boolean) => void;
  legalScrollRef: React.RefObject<HTMLDivElement | null>;
  markStepCompleted: (step: number) => void;
  onLegalAccepted: () => void;
}

export interface ReviewLaunchStepProps extends StepNavigation {
  storeSetupForm: UseFormReturn<StoreSetupForm>;
  onSubmit: (data: StoreSetupForm) => void;
  baseDomain: string;
  countries: Country[];
  states: State[];
  // Zustand store data for review display
  businessInfo: Record<string, any>;
  contactDetails: Record<string, any>;
  businessAddress: Record<string, any>;
}
