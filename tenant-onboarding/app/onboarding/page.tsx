'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddressAutocomplete, type ParsedAddressData } from '../../components/AddressAutocomplete';
import { SearchableSelect, type SelectOption } from '../../components/SearchableSelect';
import { DocumentsSection } from '../../components/DocumentsSection';
import { VerificationScore, useVerificationScore } from '../../components/VerificationScore';
import { type UploadedDocument } from '../../components/DocumentUpload';
import { Loader2, Building2, User, MapPin, Check, AlertCircle, ArrowLeft, ArrowRight, Globe, Settings, Sparkles, Store, Palette, Clock, FileText, Link2, Copy, ExternalLink, RefreshCw, ShieldCheck, ShieldAlert, Pencil, X } from 'lucide-react';
import { useOnboardingStore, type DetectedLocation, type PersistedDocument } from '../../lib/store/onboarding-store';
import { businessInfoSchema, contactDetailsSchema, businessAddressSchema, storeSetupSchema, MARKETPLACE_PLATFORMS, type BusinessInfoForm, type ContactDetailsForm, type BusinessAddressForm, type StoreSetupForm } from '../../lib/validations/onboarding';
import { onboardingApi, OnboardingAPIError } from '../../lib/api/onboarding';
import { locationApi, type Country, type State, type Currency, type Timezone } from '../../lib/api/location';
import { useRouter } from 'next/navigation';
import { analytics } from '../../lib/analytics/posthog';
import { getBrowserGeolocation, reverseGeocode, checkGeolocationPermission } from '../../lib/utils/geolocation';
import { useAutoSave, useBrowserClose, useDraftRecovery, type DraftFormData } from '../../lib/hooks';
import { config } from '../../lib/config/app';
import { getCountryDefaults } from '../../lib/utils/country-defaults';
import { normalizeDomain, validateDomain, generateUrls, validateStorefrontSubdomain, DEFAULT_STOREFRONT_SUBDOMAIN, type DomainValidationResult } from '../../lib/utils/domain';

// Development-only logging utility
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args: unknown[]) => isDev && console.log(...args);
const devWarn = (...args: unknown[]) => isDev && console.warn(...args);
const devError = (...args: unknown[]) => isDev && console.error(...args);

// Default base domain for subdomain-based URLs (will be updated from runtime config)
// URL format: {subdomain}-admin.{baseDomain}
const DEFAULT_BASE_DOMAIN = 'tesserix.app';

/**
 * Generate a URL-friendly slug from business name
 * Example: "My Amazing Store" -> "my-amazing-store"
 */
function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')        // Remove leading/trailing hyphens
    .slice(0, 50);                // Max 50 chars
}

const BUSINESS_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llc', label: 'LLC' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'non_profit', label: 'Non-Profit' },
  { value: 'other', label: 'Other' }
] as const;

const INDUSTRY_CATEGORIES = [
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

const JOB_TITLES = [
  'CEO/Founder',
  'CTO',
  'Marketing Manager',
  'Operations Manager',
  'Sales Manager',
  'Product Manager',
  'Other'
];

const steps = [
  { id: 0, label: 'Your Business', icon: Building2 },
  { id: 1, label: 'About You', icon: User },
  { id: 2, label: 'Location', icon: MapPin },
  { id: 3, label: 'Launch', icon: Settings },
];

export default function OnboardingPage() {
  const router = useRouter();
  const {
    sessionId,
    setSessionId,
    businessInfo,
    contactDetails,
    businessAddress,
    storeSetup,
    setBusinessInfo,
    setContactDetails,
    setBusinessAddress,
    setStoreSetup,
    currentStep,
    setCurrentStep,
    nextStep,
    setDetectedLocation,
    resetOnboarding,
    // Document state from store
    documents,
    setAddressProofType: setStoreAddressProofType,
    setBusinessProofType: setStoreBusinessProofType,
    setAddressProofDocument: setStoreAddressProofDocument,
    setBusinessProofDocument: setStoreBusinessProofDocument,
    setLogoDocument: setStoreLogoDocument,
  } = useOnboardingStore();

  const [currentSection, setCurrentSection] = useState(0);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [timezones, setTimezones] = useState<Timezone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasAutoFilledForms, setHasAutoFilledForms] = useState(false);
  const [selectedAddressFromAutocomplete, setSelectedAddressFromAutocomplete] = useState<ParsedAddressData | null>(null);
  const [isStoreHydrated, setIsStoreHydrated] = useState(false);

  // Slug validation state (for admin URL)
  const [slugValidation, setSlugValidation] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    message: string;
    suggestions: string[];
  }>({
    isChecking: false,
    isAvailable: null,
    message: '',
    suggestions: [],
  });
  const slugValidationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Storefront slug validation state
  const [storefrontValidation, setStorefrontValidation] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    message: string;
    suggestions: string[];
  }>({
    isChecking: false,
    isAvailable: null,
    message: '',
    suggestions: [],
  });
  const storefrontValidationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Custom domain validation state
  const [showCustomDomainSection, setShowCustomDomainSection] = useState(false);
  const [selectedVerificationMethod, setSelectedVerificationMethod] = useState<'CNAME' | 'TXT'>('CNAME');
  const [customDomainValidation, setCustomDomainValidation] = useState<{
    isChecking: boolean;
    isValid: boolean | null;
    dnsConfigured: boolean;
    message: string;
    verificationRecord?: { type: string; host: string; value: string };
    verificationRecords?: { type: string; host: string; value: string; purpose?: string }[];
    formatWarning?: string;
    suggestedDomain?: string;
  }>({
    isChecking: false,
    isValid: null,
    dnsConfigured: false,
    message: '',
  });
  const customDomainValidationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Domain verification state (for checking DNS propagation)
  const [domainVerification, setDomainVerification] = useState<{
    isVerifying: boolean;
    dnsVerified: boolean;
    dnsRecordFound: boolean;
    sslStatus: 'pending' | 'provisioning' | 'active' | 'failed';
    message: string;
    lastChecked: Date | null;
  }>({
    isVerifying: false,
    dnsVerified: false,
    dnsRecordFound: false,
    sslStatus: 'pending',
    message: '',
    lastChecked: null,
  });

  // Document upload state - derives from store but uses local state for UploadedDocument objects
  // The store persists serializable PersistedDocument, but UI needs UploadedDocument with potential File refs
  const [addressProofDocument, setAddressProofDocumentLocal] = useState<UploadedDocument | null>(null);
  const [businessProofDocument, setBusinessProofDocumentLocal] = useState<UploadedDocument | null>(null);
  const [logoDocument, setLogoDocumentLocal] = useState<UploadedDocument | null>(null);
  const [showDocumentsSection, setShowDocumentsSection] = useState(false);

  // Base domain for subdomain-based store URL display (fetched from runtime config)
  // URL format: {subdomain}-admin.{baseDomain}
  const [baseDomain, setBaseDomain] = useState(DEFAULT_BASE_DOMAIN);

  // Derive proof types from store
  const addressProofType = documents.addressProofType;
  const businessProofType = documents.businessProofType;

  // Wrapper functions to update both local state and store
  const setAddressProofType = useCallback((type: string) => {
    setStoreAddressProofType(type);
  }, [setStoreAddressProofType]);

  const setBusinessProofType = useCallback((type: string) => {
    setStoreBusinessProofType(type);
  }, [setStoreBusinessProofType]);

  const setAddressProofDocument = useCallback((doc: UploadedDocument | null) => {
    setAddressProofDocumentLocal(doc);
    // Persist to store (extract file info since File object can't be serialized)
    if (doc) {
      setStoreAddressProofDocument({
        id: doc.id,
        fileName: doc.file?.name || 'document',
        fileSize: doc.file?.size || 0,
        fileType: doc.file?.type || 'application/octet-stream',
        remotePath: doc.remotePath,
        remoteUrl: doc.remoteUrl,
        status: doc.status,
        uploadedAt: new Date().toISOString(),
      });
    } else {
      setStoreAddressProofDocument(null);
    }
  }, [setStoreAddressProofDocument]);

  const setBusinessProofDocument = useCallback((doc: UploadedDocument | null) => {
    setBusinessProofDocumentLocal(doc);
    // Persist to store (extract file info since File object can't be serialized)
    if (doc) {
      setStoreBusinessProofDocument({
        id: doc.id,
        fileName: doc.file?.name || 'document',
        fileSize: doc.file?.size || 0,
        fileType: doc.file?.type || 'application/octet-stream',
        remotePath: doc.remotePath,
        remoteUrl: doc.remoteUrl,
        status: doc.status,
        uploadedAt: new Date().toISOString(),
      });
    } else {
      setStoreBusinessProofDocument(null);
    }
  }, [setStoreBusinessProofDocument]);

  const setLogoDocument = useCallback((doc: UploadedDocument | null) => {
    setLogoDocumentLocal(doc);
    // Persist to store (extract file info since File object can't be serialized)
    if (doc) {
      setStoreLogoDocument({
        id: doc.id,
        fileName: doc.file?.name || 'document',
        fileSize: doc.file?.size || 0,
        fileType: doc.file?.type || 'application/octet-stream',
        remotePath: doc.remotePath,
        remoteUrl: doc.remoteUrl,
        status: doc.status,
        uploadedAt: new Date().toISOString(),
      });
    } else {
      setStoreLogoDocument(null);
    }
  }, [setStoreLogoDocument]);

  // Form instances
  const businessForm = useForm<BusinessInfoForm>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      businessName: '',
      businessType: undefined as unknown as BusinessInfoForm['businessType'],
      industryCategory: '',
      businessDescription: '',
      companyWebsite: '',
      businessRegistrationNumber: '',
      hasExistingStore: false,
      existingStorePlatforms: [],
      migrationInterest: false,
      ...businessInfo,
    },
  });

  // Track if slugs were manually edited
  const [subdomainManuallyEdited, setSubdomainManuallyEdited] = useState(false);

  const contactForm = useForm<ContactDetailsForm>({
    resolver: zodResolver(contactDetailsSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneCountryCode: 'US',
      phoneNumber: '',
      jobTitle: '',
      ...contactDetails,
    },
  });

  const addressForm = useForm<BusinessAddressForm>({
    resolver: zodResolver(businessAddressSchema) as any,
    defaultValues: {
      streetAddress: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      addressConfirmed: false,
      billingAddressSameAsBusiness: true,
      billingStreetAddress: '',
      billingCity: '',
      billingState: '',
      billingPostalCode: '',
      billingCountry: '',
      billingAddressConfirmed: false,
      ...businessAddress,
    },
  });

  const storeSetupForm = useForm<StoreSetupForm>({
    resolver: zodResolver(storeSetupSchema),
    defaultValues: {
      businessModel: 'ONLINE_STORE',
      subdomain: '',
      storefrontSlug: '',
      useCustomDomain: false,
      customDomain: '',
      customDomainVerified: false,
      customAdminSubdomain: 'admin',
      customStorefrontSubdomain: DEFAULT_STOREFRONT_SUBDOMAIN, // 'www' - apex domains not supported
      currency: '',
      timezone: '',
      language: 'en',
      logo: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#8B5CF6',
      ...storeSetup,
    },
  });

  // Track if custom domain URLs are being edited
  const [isEditingCustomUrls, setIsEditingCustomUrls] = useState(false);

  // Track if storefrontSlug was manually edited
  const [storefrontSlugManuallyEdited, setStorefrontSlugManuallyEdited] = useState(false);

  // Store hydration
  useEffect(() => {
    if (sessionId && !isStoreHydrated) {
      setIsStoreHydrated(true);
      if (businessInfo && Object.keys(businessInfo).length > 0) {
        const formData: Partial<BusinessInfoForm> = {
          businessName: (businessInfo as any).business_name || '',
          businessType: (businessInfo as any).business_type || '',
          industryCategory: (businessInfo as any).industry || '',
          businessDescription: (businessInfo as any).business_description || '',
          companyWebsite: (businessInfo as any).website || '',
          businessRegistrationNumber: (businessInfo as any).registration_number || '',
        };
        Object.entries(formData).forEach(([key, value]) => {
          if (value) businessForm.setValue(key as keyof BusinessInfoForm, value as any);
        });
      }
      if (contactDetails && Object.keys(contactDetails).length > 0) {
        const formData: Partial<ContactDetailsForm> = {
          firstName: (contactDetails as any).first_name || '',
          lastName: (contactDetails as any).last_name || '',
          email: (contactDetails as any).email || '',
          phoneCountryCode: (contactDetails as any).phone_country_code || 'US',
          phoneNumber: (contactDetails as any).phone_number || '',
          jobTitle: (contactDetails as any).job_title || '',
        };
        Object.entries(formData).forEach(([key, value]) => {
          if (value) contactForm.setValue(key as keyof ContactDetailsForm, value as any);
        });
      }
      if (businessAddress && Object.keys(businessAddress).length > 0) {
        const formData: Partial<BusinessAddressForm> = {
          streetAddress: (businessAddress as any).street_address || '',
          city: (businessAddress as any).city || '',
          state: (businessAddress as any).state || '',
          postalCode: (businessAddress as any).postal_code || '',
          country: (businessAddress as any).country || '',
          addressConfirmed: (businessAddress as any).address_confirmed || false,
        };
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== undefined && value !== '') addressForm.setValue(key as keyof BusinessAddressForm, value as any);
        });
      }
      if (storeSetup && Object.keys(storeSetup).length > 0) {
        Object.entries(storeSetup).forEach(([key, value]) => {
          if (value) storeSetupForm.setValue(key as keyof StoreSetupForm, value as any);
        });
      }
      // Restore document state from store
      if (documents) {
        // Restore documents as UploadedDocument
        // Create a placeholder File object since we can't restore the actual file from localStorage
        // The file was already uploaded to GCS, so we just need the metadata for display
        if (documents.addressProofDocument && documents.addressProofDocument.status === 'success') {
          const persistedDoc = documents.addressProofDocument;
          // Create a placeholder Blob/File for type compatibility
          const placeholderFile = new File([], persistedDoc.fileName, { type: persistedDoc.fileType });
          setAddressProofDocumentLocal({
            id: persistedDoc.id,
            file: placeholderFile,
            remotePath: persistedDoc.remotePath,
            remoteUrl: persistedDoc.remoteUrl,
            status: persistedDoc.status,
            progress: 100,
          });
          setShowDocumentsSection(true);
        }
        if (documents.businessProofDocument && documents.businessProofDocument.status === 'success') {
          const persistedDoc = documents.businessProofDocument;
          const placeholderFile = new File([], persistedDoc.fileName, { type: persistedDoc.fileType });
          setBusinessProofDocumentLocal({
            id: persistedDoc.id,
            file: placeholderFile,
            remotePath: persistedDoc.remotePath,
            remoteUrl: persistedDoc.remoteUrl,
            status: persistedDoc.status,
            progress: 100,
          });
          setShowDocumentsSection(true);
        }
        if (documents.logoDocument && documents.logoDocument.status === 'success') {
          const persistedDoc = documents.logoDocument;
          const placeholderFile = new File([], persistedDoc.fileName, { type: persistedDoc.fileType });
          setLogoDocumentLocal({
            id: persistedDoc.id,
            file: placeholderFile,
            remotePath: persistedDoc.remotePath,
            remoteUrl: persistedDoc.remoteUrl,
            status: persistedDoc.status,
            progress: 100,
          });
          setShowDocumentsSection(true);
        }
      }
      const storedCurrentStep = useOnboardingStore.getState().currentStep;
      if (storedCurrentStep > 0) setCurrentSection(storedCurrentStep);
    }
  }, [sessionId, businessInfo, contactDetails, businessAddress, storeSetup, documents, isStoreHydrated, businessForm, contactForm, addressForm, storeSetupForm]);

  useEffect(() => {
    if (isStoreHydrated && currentSection !== currentStep) setCurrentStep(currentSection);
  }, [currentSection, currentStep, isStoreHydrated, setCurrentStep]);

  // Fetch base domain from runtime config for subdomain-based URLs
  useEffect(() => {
    const fetchDomainConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const config = await response.json();
          // Extract base domain from admin hostname (e.g., "dev-admin.tesserix.app" -> "tesserix.app")
          if (config.admin?.hostname) {
            const hostname = config.admin.hostname;
            // Remove the environment prefix (dev-admin., prod-admin., admin.) to get base domain
            const baseDomainMatch = hostname.match(/(?:dev-|prod-|staging-)?admin\.(.+)/);
            if (baseDomainMatch && baseDomainMatch[1]) {
              setBaseDomain(baseDomainMatch[1]);
            }
          }
          // Also check for explicit baseDomain config
          if (config.baseDomain) {
            setBaseDomain(config.baseDomain);
          }
        }
      } catch (error) {
        devWarn('[Config] Failed to fetch domain config, using default:', error);
      }
    };
    fetchDomainConfig();
  }, []);

  // Auto-save
  const formDataForDraft: DraftFormData = useMemo(() => ({
    currentStep: currentSection,
    businessInfo: businessForm.getValues(),
    contactDetails: contactForm.getValues(),
    businessAddress: addressForm.getValues(),
    storeSetup: storeSetupForm.getValues(),
  }), [currentSection, businessForm.watch(), contactForm.watch(), addressForm.watch(), storeSetupForm.watch()]);

  const handleDraftRecovery = useCallback((draftData: DraftFormData, step: number) => {
    if (draftData.businessInfo) Object.entries(draftData.businessInfo).forEach(([k, v]) => businessForm.setValue(k as keyof BusinessInfoForm, v as any));
    if (draftData.contactDetails) Object.entries(draftData.contactDetails).forEach(([k, v]) => contactForm.setValue(k as keyof ContactDetailsForm, v as any));
    if (draftData.businessAddress) Object.entries(draftData.businessAddress).forEach(([k, v]) => addressForm.setValue(k as keyof BusinessAddressForm, v as any));
    if (draftData.storeSetup) Object.entries(draftData.storeSetup).forEach(([k, v]) => storeSetupForm.setValue(k as keyof StoreSetupForm, v as any));
    setCurrentSection(step);
  }, [businessForm, contactForm, addressForm, storeSetupForm]);

  // Ref to prevent multiple cleanup calls (race condition prevention)
  const cleanupInProgressRef = useRef(false);

  // Handle stale/invalid session - clear and start fresh
  const handleSessionNotFound = useCallback(() => {
    // Prevent multiple simultaneous cleanup attempts
    if (cleanupInProgressRef.current) return;
    cleanupInProgressRef.current = true;

    devWarn('[Onboarding] Session not found, clearing stale session data');
    // Clear the stale session from localStorage
    localStorage.removeItem('tenant-onboarding-store');
    // Reset the Zustand store completely (clears in-memory state)
    resetOnboarding();
    // Reset UI state to start fresh
    setCurrentSection(0);
    // Reset all forms to empty values
    businessForm.reset({
      businessName: '',
      businessType: undefined as unknown as BusinessInfoForm['businessType'],
      industryCategory: '',
      businessDescription: '',
      companyWebsite: '',
      businessRegistrationNumber: '',
    });
    contactForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      phoneCountryCode: '',
      phoneNumber: '',
      jobTitle: '',
    });
    addressForm.reset({
      streetAddress: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      addressConfirmed: false,
      billingAddressSameAsBusiness: true,
    });
    storeSetupForm.reset({
      subdomain: '',
      storefrontSlug: '',
      currency: '',
      timezone: '',
      language: 'en',
    });
    setStorefrontSlugManuallyEdited(false);
    // Reset document local state (store is reset via resetOnboarding)
    setAddressProofDocumentLocal(null);
    setBusinessProofDocumentLocal(null);
    setLogoDocumentLocal(null);
    setShowDocumentsSection(false);

    // Reset the flag after a delay to allow new cleanup if needed
    setTimeout(() => {
      cleanupInProgressRef.current = false;
    }, 1000);
  }, [resetOnboarding, businessForm, contactForm, addressForm, storeSetupForm]);

  const { state: autoSaveState } = useAutoSave(formDataForDraft, currentSection, {
    sessionId,
    debounceMs: 3000,
    heartbeatIntervalMs: 60000,
    enabled: !!sessionId,
    onSessionNotFound: handleSessionNotFound,
  });
  useBrowserClose({ sessionId, enabled: !!sessionId, hasUnsavedChanges: false });
  const { state: draftRecoveryState, recoverDraft, dismissDraft, deleteDraft } = useDraftRecovery({
    sessionId,
    enabled: !!sessionId,
    onRecoveryComplete: handleDraftRecovery,
    onSessionNotFound: handleSessionNotFound,
  });

  // Handle "Start Fresh" - delete draft from DB and reset everything
  const handleStartFresh = useCallback(async () => {
    try {
      // Delete draft from database
      if (sessionId) {
        await deleteDraft();
      }
      // Clear localStorage
      localStorage.removeItem('tenant-onboarding-store');
      // Reset the Zustand store completely
      resetOnboarding();
      // Reset UI state
      setCurrentSection(0);
      // Reset all forms
      businessForm.reset({
        businessName: '',
        businessType: undefined as unknown as BusinessInfoForm['businessType'],
        industryCategory: '',
        businessDescription: '',
        companyWebsite: '',
        businessRegistrationNumber: '',
      });
      contactForm.reset({
        firstName: '',
        lastName: '',
        email: '',
        phoneCountryCode: '',
        phoneNumber: '',
        jobTitle: '',
      });
      addressForm.reset({
        streetAddress: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        addressConfirmed: false,
        billingAddressSameAsBusiness: true,
      });
      storeSetupForm.reset({
        subdomain: '',
        storefrontSlug: '',
        currency: '',
        timezone: '',
        language: 'en',
      });
      setStorefrontSlugManuallyEdited(false);
      // Reset document states
      setAddressProofType('');
      setAddressProofDocument(null);
      setBusinessProofType('');
      setBusinessProofDocument(null);
      setLogoDocument(null);
      setShowDocumentsSection(false);
      // Clear selected address
      setSelectedAddressFromAutocomplete(null);
      // Reset slug validation
      setSlugValidation({
        isChecking: false,
        isAvailable: null,
        message: '',
        suggestions: [],
      });
      // Reset storefront validation
      setStorefrontValidation({
        isChecking: false,
        isAvailable: null,
        message: '',
        suggestions: [],
      });
      devLog('[Onboarding] Started fresh - all data cleared');
    } catch (error) {
      devError('[Onboarding] Failed to start fresh:', error);
    }
  }, [sessionId, deleteDraft, resetOnboarding, businessForm, contactForm, addressForm, storeSetupForm, setAddressProofType, setAddressProofDocument, setBusinessProofType, setBusinessProofDocument, setLogoDocument]);

  // Load states
  const loadStates = useCallback(async (countryId: string) => {
    if (!countryId) { setStates([]); return; }
    setIsLoadingStates(true);
    try {
      const response = await locationApi.getStates(countryId);
      setStates(Array.isArray(response) ? response : []);
    } catch { setStates([]); }
    finally { setIsLoadingStates(false); }
  }, []);

  // Address selection
  const handleAddressSelect = useCallback(async (address: ParsedAddressData) => {
    setSelectedAddressFromAutocomplete(address);
    addressForm.setValue('streetAddress', address.streetAddress);
    addressForm.setValue('city', address.city);
    addressForm.setValue('postalCode', address.postalCode);
    addressForm.setValue('addressConfirmed', true);
    if (address.countryCode) {
      addressForm.setValue('country', address.countryCode);
      await loadStates(address.countryCode);
      if (address.stateCode || address.state) {
        const stateValue = address.stateCode ? `${address.countryCode}-${address.stateCode}` : address.state;
        addressForm.setValue('state', stateValue);
      }
    }
  }, [addressForm, loadStates]);

  // Initial data loading
  useEffect(() => {
    analytics.onboarding.started({ timestamp: new Date().toISOString() });

    const detectLocation = async () => {
      try {
        let browserLocation: { latitude: number; longitude: number } | null = null;
        let reverseGeocodeData: any = null;
        try {
          const permission = await checkGeolocationPermission();
          if (permission !== 'denied') {
            const coords = await getBrowserGeolocation(8000);
            browserLocation = { latitude: coords.latitude, longitude: coords.longitude };
            reverseGeocodeData = await reverseGeocode(coords.latitude, coords.longitude);
          }
        } catch {}
        const location = await locationApi.detectLocation();
        let browserCountryDetails: any = null;
        if (reverseGeocodeData?.countryCode && reverseGeocodeData.countryCode !== location.country) {
          try {
            const countryData = await locationApi.getCountry(reverseGeocodeData.countryCode);
            if (countryData) browserCountryDetails = { calling_code: countryData.phone_code, flag_emoji: countryData.flag };
          } catch {}
        }
        const detectedLoc: DetectedLocation = {
          ip: location.ip,
          country: reverseGeocodeData?.countryCode || location.country,
          country_name: reverseGeocodeData?.country || location.country_name,
          calling_code: browserCountryDetails?.calling_code || location.calling_code,
          flag_emoji: browserCountryDetails?.flag_emoji || location.flag_emoji,
          state: reverseGeocodeData?.stateCode ? `${reverseGeocodeData.countryCode}-${reverseGeocodeData.stateCode}` : location.state,
          state_name: reverseGeocodeData?.state || location.state_name,
          city: reverseGeocodeData?.city || location.city,
          postal_code: reverseGeocodeData?.postalCode || location.postal_code,
          latitude: browserLocation?.latitude || location.latitude,
          longitude: browserLocation?.longitude || location.longitude,
          timezone: location.timezone,
          currency: browserCountryDetails?.currency || location.currency,
          locale: location.locale,
          source: browserLocation ? 'browser' : 'ip',
          confirmed: false,
        };
        setDetectedLocation(detectedLoc);
        return detectedLoc;
      } catch { return null; }
    };

    const loadCountries = async () => {
      try {
        const response = await locationApi.getCountries();
        setCountries(Array.isArray(response) ? response : []);
        return Array.isArray(response) ? response : [];
      } catch { setCountries([]); return []; }
    };

    const loadCurrencies = async () => {
      try {
        const response = await locationApi.getCurrencies();
        setCurrencies(Array.isArray(response) ? response : []);
      } catch { setCurrencies([]); }
    };

    const loadTimezones = async () => {
      try {
        const response = await locationApi.getTimezones();
        setTimezones(Array.isArray(response) ? response : []);
      } catch { setTimezones([]); }
    };

    const autoFillForms = async (location: DetectedLocation, countriesList: Country[]) => {
      const country = countriesList.find(c => c.id === location.country);
      if (country) contactForm.setValue('phoneCountryCode', country.id);
      addressForm.setValue('country', location.country);
      try {
        const statesResponse = await locationApi.getStates(location.country);
        setStates(Array.isArray(statesResponse) ? statesResponse : []);
        if (location.state) addressForm.setValue('state', location.state);
      } catch { setStates([]); }
      if (location.city) addressForm.setValue('city', location.city);
      if (location.postal_code) addressForm.setValue('postalCode', location.postal_code);
      storeSetupForm.setValue('currency', location.currency, { shouldValidate: true, shouldDirty: true });
      storeSetupForm.setValue('timezone', location.timezone, { shouldValidate: true, shouldDirty: true });
    };

    Promise.all([detectLocation(), loadCountries(), loadCurrencies(), loadTimezones()])
      .then(async ([location, countriesList]) => {
        if (location && !hasAutoFilledForms) {
          await autoFillForms(location, countriesList);
          setHasAutoFilledForms(true);
        } else if (!location) loadStates('US');
      });
  }, []);

  useEffect(() => {
    const subscription = addressForm.watch((value, { name }) => {
      if (name === 'country' && value.country) loadStates(value.country);
    });
    return () => subscription.unsubscribe();
  }, [addressForm, loadStates]);

  // Validation
  const validateEmail = async (email: string) => {
    try {
      const result = await onboardingApi.validateEmail(email);
      if (!result.available) { setValidationErrors({ email: 'This email is already registered.' }); return false; }
      return true;
    } catch (error) {
      setValidationErrors({ email: error instanceof Error ? error.message : 'Unable to validate email.' });
      return false;
    }
  };

  const validateBusinessName = async (businessName: string) => {
    try {
      const result = await onboardingApi.validateBusiness(businessName);
      if (!result.available) { setValidationErrors({ businessName: 'This business name is already taken.' }); return false; }
      return true;
    } catch (error) {
      setValidationErrors({ businessName: error instanceof Error ? error.message : 'Unable to validate business name.' });
      return false;
    }
  };

  // Real-time slug validation with debouncing
  // When sessionId is available, the slug will be reserved to prevent race conditions
  const validateSlug = useCallback(async (slug: string, storefrontSlug?: string) => {
    // Clear any pending validation
    if (slugValidationTimerRef.current) {
      clearTimeout(slugValidationTimerRef.current);
    }

    // Reset if empty
    if (!slug || slug.length < 3) {
      setSlugValidation({
        isChecking: false,
        isAvailable: null,
        message: slug.length > 0 && slug.length < 3 ? 'Minimum 3 characters required' : '',
        suggestions: [],
      });
      return;
    }

    // Show checking state immediately
    setSlugValidation(prev => ({ ...prev, isChecking: true, message: '' }));

    // Debounce the actual API call
    slugValidationTimerRef.current = setTimeout(async () => {
      try {
        // Pass sessionId to reserve the slug and storefrontSlug to save storefront URL
        const result = await onboardingApi.validateSubdomain(slug, sessionId || undefined, storefrontSlug || slug);
        setSlugValidation({
          isChecking: false,
          isAvailable: result.available,
          message: result.available
            ? 'This name is available!'
            : result.message || 'This name is already taken',
          suggestions: result.suggestions || [],
        });
      } catch (error) {
        setSlugValidation({
          isChecking: false,
          isAvailable: null,
          message: 'Unable to check availability',
          suggestions: [],
        });
      }
    }, 500);
  }, [sessionId]);

  // Real-time storefront slug validation with debouncing
  const validateStorefrontSlug = useCallback(async (slug: string) => {
    // Clear any pending validation
    if (storefrontValidationTimerRef.current) {
      clearTimeout(storefrontValidationTimerRef.current);
    }

    // Reset if empty
    if (!slug || slug.length < 3) {
      setStorefrontValidation({
        isChecking: false,
        isAvailable: null,
        message: slug.length > 0 && slug.length < 3 ? 'Minimum 3 characters required' : '',
        suggestions: [],
      });
      return;
    }

    // Show checking state immediately
    setStorefrontValidation(prev => ({ ...prev, isChecking: true, message: '' }));

    // Debounce the actual API call
    storefrontValidationTimerRef.current = setTimeout(async () => {
      try {
        const result = await onboardingApi.validateStorefrontSlug(slug, sessionId || undefined);
        setStorefrontValidation({
          isChecking: false,
          isAvailable: result.available,
          message: result.available
            ? 'This name is available!'
            : result.message || 'This name is already taken',
          suggestions: result.suggestions || [],
        });
      } catch (error) {
        setStorefrontValidation({
          isChecking: false,
          isAvailable: null,
          message: 'Unable to check availability',
          suggestions: [],
        });
      }
    }, 500);
  }, [sessionId]);

  // Real-time custom domain validation with debouncing
  const validateCustomDomain = useCallback(async (domain: string) => {
    // Clear any pending validation
    if (customDomainValidationTimerRef.current) {
      clearTimeout(customDomainValidationTimerRef.current);
    }

    // Normalize the domain first
    const normalized = normalizeDomain(domain);

    // Reset if empty
    if (!normalized || normalized.length < 4) {
      setCustomDomainValidation({
        isChecking: false,
        isValid: null,
        dnsConfigured: false,
        message: normalized.length > 0 && normalized.length < 4 ? 'Minimum 4 characters required' : '',
        formatWarning: undefined,
        suggestedDomain: undefined,
      });
      return;
    }

    // Run client-side format validation first
    const formatValidation = validateDomain(normalized);

    // If format is invalid, show error immediately without API call
    if (!formatValidation.isValid) {
      setCustomDomainValidation({
        isChecking: false,
        isValid: false,
        dnsConfigured: false,
        message: formatValidation.error || 'Invalid domain format',
        formatWarning: undefined,
        suggestedDomain: undefined,
      });
      return;
    }

    // Show checking state with any format warnings
    setCustomDomainValidation(prev => ({
      ...prev,
      isChecking: true,
      message: '',
      formatWarning: formatValidation.warning,
      suggestedDomain: formatValidation.suggestedRootDomain,
    }));

    // Debounce the actual API call
    customDomainValidationTimerRef.current = setTimeout(async () => {
      try {
        // Check if we have a stored verification token for this domain
        const storageKey = `domain_verification_${normalized}`;
        let storedToken = '';
        try {
          storedToken = localStorage.getItem(storageKey) || '';
        } catch (e) {
          // localStorage not available
        }

        const response = await fetch('/api/onboarding/validate/custom-domain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: normalized,
            session_id: sessionId,
            verification_token: storedToken, // Pass stored token so backend can reuse it
          }),
        });
        const result = await response.json();
        const data = result.data;

        // Domain is only valid if format is valid AND domain exists AND is available
        // available=false means the domain is already registered with another store
        const domainIsValid = data.valid && (data.domain_exists !== false) && (data.available !== false);

        // Store the verification token for future use
        if (domainIsValid && data.verification_token) {
          try {
            localStorage.setItem(storageKey, data.verification_token);
          } catch (e) {
            // localStorage not available
          }
        }

        // Determine the appropriate message based on validation result
        let validationMessage = '';
        if (!data.valid) {
          validationMessage = data.message || 'Invalid domain format';
        } else if (data.domain_exists === false) {
          validationMessage = data.message || 'This domain does not appear to be registered.';
        } else if (data.available === false) {
          validationMessage = data.message || 'This domain is already registered with another store.';
        } else if (data.dns_configured) {
          validationMessage = 'Domain verified and ready!';
        } else {
          validationMessage = 'Domain is valid. Configure DNS to complete setup.';
        }

        setCustomDomainValidation({
          isChecking: false,
          isValid: domainIsValid,
          dnsConfigured: data.dns_configured || false,
          message: validationMessage,
          verificationRecord: domainIsValid ? data.verification_record : undefined,
          verificationRecords: domainIsValid ? data.verification_records : undefined,
          formatWarning: formatValidation.warning,
          suggestedDomain: formatValidation.suggestedRootDomain,
        });
      } catch (error) {
        setCustomDomainValidation({
          isChecking: false,
          isValid: null,
          dnsConfigured: false,
          message: 'Unable to validate domain',
          formatWarning: formatValidation.warning,
          suggestedDomain: formatValidation.suggestedRootDomain,
        });
      }
    }, 500);
  }, [sessionId]);

  // Verify domain DNS propagation
  const verifyDomainDNS = useCallback(async () => {
    // Get the currently selected verification record based on user's method choice
    const selectedRecord = customDomainValidation.verificationRecords?.find(
      r => r.type === selectedVerificationMethod
    ) || customDomainValidation.verificationRecord;

    if (!selectedRecord) {
      return;
    }

    setDomainVerification(prev => ({
      ...prev,
      isVerifying: true,
      message: 'Checking DNS propagation...',
    }));

    try {
      const response = await fetch('/api/onboarding/verify-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: storeSetupForm.watch('customDomain'),
          verification_host: selectedRecord.host,
          verification_value: selectedRecord.value,
        }),
      });

      const result = await response.json();
      const data = result.data;

      setDomainVerification({
        isVerifying: false,
        dnsVerified: data.dns_verified || false,
        dnsRecordFound: data.dns_record_found || false,
        sslStatus: data.ssl_status || 'pending',
        message: data.message || '',
        lastChecked: new Date(),
      });

      // Update the main validation state if DNS is verified
      if (data.dns_verified) {
        setCustomDomainValidation(prev => ({
          ...prev,
          dnsConfigured: true,
          message: 'Domain verified! SSL certificate is being provisioned.',
        }));
      }
    } catch (error) {
      setDomainVerification(prev => ({
        ...prev,
        isVerifying: false,
        message: 'Failed to check DNS. Please try again.',
        lastChecked: new Date(),
      }));
    }
  }, [customDomainValidation.verificationRecord, customDomainValidation.verificationRecords, selectedVerificationMethod, storeSetupForm]);

  // Watch subdomain changes and validate, also sync storefrontSlug if not manually edited
  useEffect(() => {
    const subscription = storeSetupForm.watch((value, { name }) => {
      if (name === 'subdomain') {
        // Get the storefront slug - use subdomain if not manually edited
        const effectiveStorefrontSlug = storefrontSlugManuallyEdited ? value.storefrontSlug : value.subdomain;
        validateSlug(value.subdomain || '', effectiveStorefrontSlug || undefined);
        // Auto-sync storefrontSlug to match subdomain if not manually edited
        if (!storefrontSlugManuallyEdited && value.subdomain) {
          storeSetupForm.setValue('storefrontSlug', value.subdomain);
          // Also validate the storefront slug (same as subdomain when synced)
          validateStorefrontSlug(value.subdomain);
        }
      }
      // Track if storefrontSlug was manually edited (different from subdomain)
      if (name === 'storefrontSlug') {
        if (value.storefrontSlug !== value.subdomain) {
          setStorefrontSlugManuallyEdited(true);
        }
        // Re-validate to save the updated storefront slug when manually edited
        if (value.subdomain && value.storefrontSlug) {
          validateSlug(value.subdomain, value.storefrontSlug);
        }
        // Validate the storefront slug independently
        if (value.storefrontSlug) {
          validateStorefrontSlug(value.storefrontSlug);
        }
      }
      // Validate custom domain when it changes
      if (name === 'customDomain' && value.useCustomDomain) {
        validateCustomDomain(value.customDomain || '');
      }
      // CRITICAL FIX: Also validate when useCustomDomain is toggled to true
      // and there's already a customDomain value (e.g., from session restore)
      if (name === 'useCustomDomain' && value.useCustomDomain && value.customDomain) {
        validateCustomDomain(value.customDomain);
      }
      // When custom domain toggle is enabled, trigger storefront slug validation
      // (since custom domains still need a unique storefront slug)
      if (name === 'useCustomDomain' && value.useCustomDomain && value.storefrontSlug) {
        validateStorefrontSlug(value.storefrontSlug);
      }
    });
    return () => subscription.unsubscribe();
  }, [storeSetupForm, validateSlug, validateStorefrontSlug, validateCustomDomain, storefrontSlugManuallyEdited]);

  // CRITICAL FIX: Initial validation when page loads with restored custom domain
  // This handles the case where both useCustomDomain and customDomain are restored from server session
  // We watch storeSetup changes because when server data is fetched, storeSetup is updated,
  // which triggers the form setValue calls, and then this effect re-runs
  const initialCustomDomainValidationDone = useRef(false);
  useEffect(() => {
    // Only run once to avoid infinite loops
    if (initialCustomDomainValidationDone.current) return;

    const useCustomDomain = storeSetupForm.getValues('useCustomDomain');
    const customDomain = storeSetupForm.getValues('customDomain');

    // If custom domain is enabled and has a value, trigger validation
    if (useCustomDomain && customDomain) {
      initialCustomDomainValidationDone.current = true;
      validateCustomDomain(customDomain);
      setShowCustomDomainSection(true);
    }
  }, [storeSetup, storeSetupForm, validateCustomDomain]);

  // Form handlers
  const handleBusinessSubmit = async (data: BusinessInfoForm) => {
    setIsLoading(true);
    setValidationErrors({});
    const isValid = await validateBusinessName(data.businessName);
    if (!isValid) { setIsLoading(false); return; }
    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const session = await onboardingApi.startOnboarding('ecommerce');
        currentSessionId = ((session as any).id || (session as any).session_id) as string;
        setSessionId(currentSessionId);
      }
      await onboardingApi.updateBusinessInformation(currentSessionId, {
        business_name: data.businessName,
        business_type: data.businessType,
        industry: data.industryCategory,
        website: data.companyWebsite || undefined,
        business_description: data.businessDescription || undefined,
        existing_store_platforms: data.existingStorePlatforms || [],
        has_existing_store: data.hasExistingStore || false,
        migration_interest: data.migrationInterest || false,
      });
      analytics.onboarding.businessInfoCompleted({
        business_type: data.businessType,
        industry: data.industryCategory,
        has_website: !!data.companyWebsite,
        has_existing_store: data.hasExistingStore || false,
        existing_platforms: data.existingStorePlatforms?.join(',') || '',
      });
      setBusinessInfo({
        business_name: data.businessName,
        business_type: data.businessType as any,
        industry: data.industryCategory,
        business_description: data.businessDescription,
        website: data.companyWebsite,
        registration_number: data.businessRegistrationNumber,
        existing_store_platforms: data.existingStorePlatforms,
        has_existing_store: data.hasExistingStore,
        migration_interest: data.migrationInterest,
      });

      // Auto-generate slugs from business name if not already set
      const generatedSlug = generateSlugFromName(data.businessName);
      if (!subdomainManuallyEdited && generatedSlug) {
        storeSetupForm.setValue('subdomain', generatedSlug);
        storeSetupForm.setValue('storefrontSlug', generatedSlug);
      }

      setCurrentSection(1);
    } catch (error) {
      // Use OnboardingAPIError for better error handling
      if (error instanceof OnboardingAPIError) {
        if (error.isSessionError()) {
          handleSessionNotFound();
          return;
        }
        // Show specific error message from API
        setValidationErrors({ businessName: error.message });
      } else {
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.toLowerCase().includes('session not found') || errorMessage.toLowerCase().includes('not found')) {
          handleSessionNotFound();
          return;
        }
        setValidationErrors({ businessName: 'Unable to save business information. Please check your connection and try again.' });
      }
    }
    finally { setIsLoading(false); }
  };

  const handleContactSubmit = async (data: ContactDetailsForm) => {
    setIsLoading(true);
    setValidationErrors({});
    const isValid = await validateEmail(data.email);
    if (!isValid) { setIsLoading(false); return; }
    try {
      if (!sessionId) throw new Error('No active session');
      // Look up the calling code (e.g., +61) from the country ID (e.g., AU)
      const selectedCountry = countries.find(c => c.id === data.phoneCountryCode);
      const callingCode = selectedCountry?.calling_code || data.phoneCountryCode;
      await onboardingApi.updateContactDetails(sessionId, {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phoneNumber,
        phone_country_code: callingCode,
        job_title: data.jobTitle || undefined,
      });
      analytics.onboarding.contactInfoCompleted({ job_title: data.jobTitle, has_phone: !!data.phoneNumber });
      setContactDetails({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phoneNumber,
        phone_country_code: callingCode,
        job_title: data.jobTitle,
      });
      // Pre-fill address country based on phone country code
      // Always set the country to help users - they can still change it
      const phoneCountry = data.phoneCountryCode;
      const currentCountry = addressForm.getValues('country');
      if (phoneCountry) {
        // If country is different or not set, update it and clear all address fields
        if (currentCountry !== phoneCountry) {
          addressForm.setValue('country', phoneCountry, { shouldValidate: true });
          addressForm.setValue('state', '');
          addressForm.setValue('city', '');
          addressForm.setValue('postalCode', '');
          addressForm.setValue('streetAddress', '');
          loadStates(phoneCountry); // Don't await - let it load in background
        } else if (!states.length) {
          // Same country but states not loaded yet
          loadStates(phoneCountry);
        }
      }
      setCurrentSection(2);
    } catch (error) {
      // Use OnboardingAPIError for better error handling
      if (error instanceof OnboardingAPIError) {
        if (error.isSessionError()) {
          handleSessionNotFound();
          return;
        }
        setValidationErrors({ email: error.message });
      } else {
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.toLowerCase().includes('session not found') || errorMessage.toLowerCase().includes('not found')) {
          handleSessionNotFound();
          return;
        }
        setValidationErrors({ email: 'Unable to save contact details. Please check your connection and try again.' });
      }
    }
    finally { setIsLoading(false); }
  };

  const handleAddressSubmit = async (data: BusinessAddressForm) => {
    setIsLoading(true);
    setValidationErrors({});
    try {
      if (!sessionId) throw new Error('No active session');

      // Save business address
      await onboardingApi.updateBusinessAddress(sessionId, {
        street_address: data.streetAddress,
        address_line_2: undefined,
        city: data.city,
        state_province: data.state,
        postal_code: data.postalCode,
        country: data.country,
        address_type: 'business',
        billing_same_as_business: data.billingAddressSameAsBusiness,
        // Include billing address if different
        ...(data.billingAddressSameAsBusiness ? {} : {
          billing_street_address: data.billingStreetAddress,
          billing_city: data.billingCity,
          billing_state: data.billingState,
          billing_postal_code: data.billingPostalCode,
          billing_country: data.billingCountry,
        }),
      } as any);

      analytics.onboarding.addressCompleted({ country: data.country, state: data.state });
      // Store the address data in the Zustand store (uses snake_case for API compatibility)
      setBusinessAddress({
        street_address: data.streetAddress,
        city: data.city,
        state_province: data.state,
        postal_code: data.postalCode,
        country: data.country,
      } as any);
      // Pre-fill currency and timezone based on address country
      // Always set them to match the selected country - user can still change on next page
      const countryDefaults = getCountryDefaults(data.country);
      storeSetupForm.setValue('currency', countryDefaults.currency, { shouldValidate: true, shouldDirty: true });
      storeSetupForm.setValue('timezone', countryDefaults.timezone, { shouldValidate: true, shouldDirty: true });
      setCurrentSection(3);
    } catch (error) {
      // Use OnboardingAPIError for better error handling
      if (error instanceof OnboardingAPIError) {
        if (error.isSessionError()) {
          handleSessionNotFound();
          return;
        }
        setValidationErrors({ verification: error.message });
      } else {
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.toLowerCase().includes('session not found') || errorMessage.toLowerCase().includes('not found')) {
          handleSessionNotFound();
          return;
        }
        setValidationErrors({ verification: 'Unable to save address. Please check your connection and try again.' });
      }
    } finally { setIsLoading(false); }
  };

  const handleStoreSetupSubmit = async (data: StoreSetupForm) => {
    setIsLoading(true);
    setValidationErrors({});
    try {
      if (!sessionId) throw new Error('No active session');

      // Using custom domain - need to validate storefront slug separately
      const usingCustomDomain = data.useCustomDomain && data.customDomain;

      if (usingCustomDomain) {
        // When using custom domain, we still need to validate the storefront slug
        // (it's used as internal identifier even with custom domains)
        if (storefrontValidation.isChecking) {
          setValidationErrors({ storeSetup: 'Please wait for store name validation to complete.' });
          setIsLoading(false);
          return;
        }
        if (storefrontValidation.isAvailable === false) {
          setValidationErrors({ storeSetup: storefrontValidation.message || 'This store name is already taken. Please choose a different one.' });
          setIsLoading(false);
          return;
        }
        // If validation hasn't run yet, trigger it now and wait
        if (storefrontValidation.isAvailable === null && data.storefrontSlug) {
          const result = await onboardingApi.validateStorefrontSlug(data.storefrontSlug, sessionId);
          if (!result.available) {
            setStorefrontValidation({
              isChecking: false,
              isAvailable: false,
              message: result.message || 'This store name is already taken.',
              suggestions: result.suggestions || [],
            });
            setValidationErrors({ storeSetup: result.message || 'This store name is already taken. Please choose a different one.' });
            setIsLoading(false);
            return;
          }
          setStorefrontValidation({
            isChecking: false,
            isAvailable: true,
            message: 'This store name is available!',
            suggestions: [],
          });
        }
      } else {
        // Not using custom domain - validate subdomain slug as before
        if (!slugValidation.isAvailable) {
          // If validation is still checking, wait for it
          if (slugValidation.isChecking) {
            setValidationErrors({ storeSetup: 'Please wait for URL validation to complete.' });
            setIsLoading(false);
            return;
          }
          // If slug is not available, show error
          if (slugValidation.isAvailable === false) {
            setValidationErrors({ storeSetup: slugValidation.message || 'The selected URL is not available. Please choose a different one.' });
            setIsLoading(false);
            return;
          }
          // If validation hasn't run yet (no result), trigger it now and wait
          if (slugValidation.isAvailable === null && data.subdomain && data.subdomain.length >= 3) {
            // Trigger final validation which also reserves the slug
            const result = await onboardingApi.validateSubdomain(data.subdomain, sessionId, data.storefrontSlug || data.subdomain);
            if (!result.available) {
              setSlugValidation({
                isChecking: false,
                isAvailable: false,
                message: result.message || 'This URL is not available.',
                suggestions: result.suggestions || [],
              });
              setValidationErrors({ storeSetup: result.message || 'The selected URL is not available. Please choose a different one.' });
              setIsLoading(false);
              return;
            }
            // Update validation state
            setSlugValidation({
              isChecking: false,
              isAvailable: true,
              message: 'This name is available!',
              suggestions: [],
            });
          }
        }
      }

      // Save store setup to backend (persists to application_configurations)
      const storeSetupPayload = {
        subdomain: data.subdomain,
        storefront_slug: data.storefrontSlug,
        currency: data.currency,
        timezone: data.timezone,
        language: data.language,
        business_model: data.businessModel,
        logo_url: data.logo,
        primary_color: data.primaryColor,
        secondary_color: data.secondaryColor,
        // Custom domain fields
        use_custom_domain: data.useCustomDomain || false,
        custom_domain: data.useCustomDomain ? data.customDomain : undefined,
        custom_admin_subdomain: data.useCustomDomain ? (data.customAdminSubdomain || 'admin') : undefined,
        custom_storefront_subdomain: data.useCustomDomain ? (data.customStorefrontSubdomain || DEFAULT_STOREFRONT_SUBDOMAIN) : undefined,
      };

      const storeSetupResponse = await fetch(`/api/onboarding/${sessionId}/store-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeSetupPayload),
      });

      if (!storeSetupResponse.ok) {
        const errorData = await storeSetupResponse.json();
        throw new Error(errorData.error?.message || 'Failed to save store setup');
      }

      analytics.onboarding.storeSetupCompleted({ subdomain: data.subdomain, storefrontSlug: data.storefrontSlug, currency: data.currency, timezone: data.timezone, businessModel: data.businessModel });
      setStoreSetup({
        business_model: data.businessModel,
        subdomain: data.subdomain,
        storefront_slug: data.storefrontSlug,
        currency: data.currency,
        timezone: data.timezone,
        language: data.language,
        logo: data.logo,
        primary_color: data.primaryColor,
        secondary_color: data.secondaryColor,
      });
      nextStep();
      // Pass session and email as URL params for the verify page
      // This ensures the verify page works even before store rehydration completes
      // Priority: store > form values > fetch from session API (most reliable fallback)
      const verifyParams = new URLSearchParams();
      if (sessionId) verifyParams.set('session', sessionId);

      let emailForVerify = contactDetails.email || contactForm.getValues('email');

      // If email is still not available, fetch from session API as final fallback
      // This handles cases where store rehydration hasn't completed after page refresh
      if (!emailForVerify && sessionId) {
        try {
          const session = await onboardingApi.getOnboardingSession(sessionId);
          // Handle both legacy (contact_details/contact_info) and new (contact_information array) formats
          emailForVerify = session.contact_details?.email || session.contact_info?.email || session.contact_information?.[0]?.email || '';
        } catch (fetchError) {
          console.error('Failed to fetch email from session:', fetchError);
        }
      }

      if (emailForVerify) verifyParams.set('email', emailForVerify as string);
      router.push(`/onboarding/verify?${verifyParams.toString()}`);
    } catch (error) {
      // Use OnboardingAPIError for better error handling
      if (error instanceof OnboardingAPIError) {
        if (error.isSessionError()) {
          handleSessionNotFound();
          return;
        }
        setValidationErrors({ storeSetup: error.message });
      } else {
        setValidationErrors({ storeSetup: error instanceof Error ? error.message : 'Unable to save store setup. Please check your connection and try again.' });
      }
    } finally { setIsLoading(false); }
  };

  const progress = ((currentSection + 1) / steps.length) * 100;

  // Styles
  const inputClass = "w-full h-14 px-5 text-base bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors";
  const inputErrorClass = "w-full h-14 px-5 text-base bg-destructive/5 border border-destructive/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-destructive focus:ring-2 focus:ring-destructive/20";
  const selectClass = "w-full h-14 px-5 text-base bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors appearance-none cursor-pointer";
  const labelClass = "block text-sm font-medium text-foreground-secondary mb-2";

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-lg">T</span>
            </div>
            <span className="text-lg font-serif font-medium text-foreground">Tesserix</span>
          </button>

          <div className="flex items-center gap-4">
            {autoSaveState.lastSavedAt && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                {autoSaveState.isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></>
                ) : (
                  <><Check className="w-4 h-4 text-sage-500" /><span>Progress saved</span></>
                )}
              </div>
            )}
            <a
              href="mailto:support@tesseract.com"
              className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
            >
              Need Help?
            </a>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-foreground-secondary hover:text-foreground transition-colors hidden sm:block"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      {/* Draft Recovery Banner */}
      {draftRecoveryState.hasDraft && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-warm-100 border-b border-warm-200 py-4 px-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-warm-600" />
              <p className="text-sm text-foreground">We found your saved progress!</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleStartFresh} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Start fresh
              </button>
              <button
                onClick={recoverDraft}
                className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-medium hover:bg-primary-hover transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`pt-32 pb-20 px-6 ${draftRecoveryState.hasDraft ? 'pt-44' : ''}`}>
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-start justify-center gap-4 sm:gap-6 mb-8">
              {steps.map((step, index) => {
                const isCompleted = index < currentSection;
                const isActive = index === currentSection;
                const Icon = step.icon;
                return (
                  <div key={step.id} className="flex items-start">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-sage-500'
                          : isActive
                            ? 'bg-primary'
                            : 'bg-warm-100 border border-warm-200'
                      }`}>
                        {isCompleted ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-warm-500'}`} />
                        )}
                      </div>
                      <span className={`text-xs font-medium mt-2.5 text-center ${
                        isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex items-center h-12 w-10 sm:w-16 md:w-20 px-2">
                        <div className="w-full h-0.5 rounded-full overflow-hidden bg-warm-200">
                          <div
                            className="h-full bg-sage-500 transition-all duration-500"
                            style={{ width: index < currentSection ? '100%' : '0%' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="h-1.5 bg-warm-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="absolute -top-0.5 transition-all duration-700" style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}>
                <div className="w-2.5 h-2.5 bg-primary rounded-full border-2 border-white shadow-sm" />
              </div>
            </div>
          </div>

          {/* Error Display - Made more visible with stronger background */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="mb-8 p-5 bg-red-50 border-2 border-red-200 rounded-xl shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-red-700 mb-2">Please fix the following:</h4>
                  <ul className="space-y-1">
                    {Object.values(validationErrors).map((error, i) => (
                      <li key={i} className="text-sm text-red-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="relative">
            <div className="bg-card border border-border rounded-2xl p-8 sm:p-10 shadow-card">

              {/* Step 1: Business Information */}
              {currentSection === 0 && (
                <form onSubmit={businessForm.handleSubmit(handleBusinessSubmit)} className="space-y-6" noValidate>
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-warm-100 border border-warm-200 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-warm-600" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-serif font-medium text-foreground">Tell us about your business</h1>
                        <p className="text-muted-foreground">We&apos;ll use this to set up your store</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>Business Name *</label>
                      <input
                        {...businessForm.register('businessName')}
                        placeholder="Your amazing business"
                        className={businessForm.formState.errors.businessName ? inputErrorClass : inputClass}
                      />
                      {businessForm.formState.errors.businessName && (
                        <p className="mt-2 text-sm text-red-400">{businessForm.formState.errors.businessName.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Business Type *</label>
                        <SearchableSelect
                          options={BUSINESS_TYPES.map(type => ({
                            value: type.value,
                            label: type.label,
                          }))}
                          value={businessForm.watch('businessType')}
                          onChange={(value) => businessForm.setValue('businessType', value as BusinessInfoForm['businessType'])}
                          placeholder="Select type"
                          searchPlaceholder="Search business types..."
                          error={!!businessForm.formState.errors.businessType}
                          enableSearch={false}
                        />
                        {businessForm.formState.errors.businessType && (
                          <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{businessForm.formState.errors.businessType.message}</p>
                        )}
                      </div>
                      <div>
                        <label className={labelClass}>Industry *</label>
                        <SearchableSelect
                          options={INDUSTRY_CATEGORIES.map(cat => ({
                            value: cat,
                            label: cat,
                          }))}
                          value={businessForm.watch('industryCategory')}
                          onChange={(value) => businessForm.setValue('industryCategory', value)}
                          placeholder="Select industry"
                          searchPlaceholder="Search industries..."
                          error={!!businessForm.formState.errors.industryCategory}
                        />
                        {businessForm.formState.errors.industryCategory && (
                          <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{businessForm.formState.errors.industryCategory.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Website (optional)</label>
                      <input
                        {...businessForm.register('companyWebsite')}
                        type="url"
                        placeholder="https://yourwebsite.com"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Business Description (optional)</label>
                      <textarea
                        {...businessForm.register('businessDescription')}
                        placeholder="Tell us what makes your business unique..."
                        rows={3}
                        className="w-full px-5 py-4 text-base bg-warm-50 border border-warm-200 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      />
                    </div>

                    {/* Existing Store Migration Section */}
                    <div className="pt-4 border-t border-warm-200">
                      <div className="flex items-center gap-3 mb-4">
                        <input
                          type="checkbox"
                          id="hasExistingStore"
                          {...businessForm.register('hasExistingStore')}
                          className="w-5 h-5 rounded border-warm-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="hasExistingStore" className="text-base font-medium text-foreground cursor-pointer">
                          I already sell on other platforms
                        </label>
                      </div>

                      {businessForm.watch('hasExistingStore') && (
                        <div className="ml-8 space-y-4 animate-in slide-in-from-top-2">
                          <p className="text-sm text-muted-foreground mb-3">
                            Select all platforms where you currently sell (we can help migrate your data later)
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {MARKETPLACE_PLATFORMS.map((platform) => {
                              const isSelected = businessForm.watch('existingStorePlatforms')?.includes(platform.id);
                              return (
                                <label
                                  key={platform.id}
                                  className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                    isSelected
                                      ? 'border-primary bg-warm-50'
                                      : 'border-warm-200 hover:border-warm-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    value={platform.id}
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const current = businessForm.getValues('existingStorePlatforms') || [];
                                      if (e.target.checked) {
                                        businessForm.setValue('existingStorePlatforms', [...current, platform.id]);
                                      } else {
                                        businessForm.setValue('existingStorePlatforms', current.filter((p: string) => p !== platform.id));
                                      }
                                    }}
                                    className="sr-only"
                                  />
                                  <span className="text-lg">{platform.icon}</span>
                                  <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-warm-700'}`}>
                                    {platform.name}
                                  </span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-primary ml-auto" />
                                  )}
                                </label>
                              );
                            })}
                          </div>

                          {(businessForm.watch('existingStorePlatforms')?.length || 0) > 0 && (
                            <div className="flex items-center gap-3 mt-4 p-3 bg-warm-50 rounded-xl border border-warm-200">
                              <input
                                type="checkbox"
                                id="migrationInterest"
                                {...businessForm.register('migrationInterest')}
                                className="w-5 h-5 rounded border-warm-300 text-primary focus:ring-primary"
                              />
                              <label htmlFor="migrationInterest" className="text-sm text-warm-700 cursor-pointer">
                                I&apos;m interested in migrating my products & categories to Tesserix
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-14 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Contact Details */}
              {currentSection === 1 && (
                <form onSubmit={contactForm.handleSubmit(handleContactSubmit)} className="space-y-6" noValidate>
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-sage-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-sage-600" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-serif font-medium text-foreground">Now, a bit about you</h1>
                        <p className="text-muted-foreground">So we know who we're working with</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>First Name *</label>
                        <input
                          {...contactForm.register('firstName')}
                          placeholder="John"
                          className={contactForm.formState.errors.firstName ? inputErrorClass : inputClass}
                        />
                        {contactForm.formState.errors.firstName && (
                          <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{contactForm.formState.errors.firstName.message}</p>
                        )}
                      </div>
                      <div>
                        <label className={labelClass}>Last Name *</label>
                        <input
                          {...contactForm.register('lastName')}
                          placeholder="Doe"
                          className={contactForm.formState.errors.lastName ? inputErrorClass : inputClass}
                        />
                        {contactForm.formState.errors.lastName && (
                          <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{contactForm.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Email Address *</label>
                      <input
                        {...contactForm.register('email')}
                        type="email"
                        placeholder="john@example.com"
                        className={contactForm.formState.errors.email ? inputErrorClass : inputClass}
                      />
                      {contactForm.formState.errors.email && (
                        <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{contactForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>Country</label>
                        <SearchableSelect
                          options={countries.map(c => ({
                            value: c.id,
                            label: c.calling_code || c.id,
                            icon: <span className="text-base">{c.flag_emoji}</span>,
                            description: c.name,
                            searchTerms: [c.name, c.calling_code].filter((s): s is string => !!s),
                          }))}
                          value={contactForm.watch('phoneCountryCode')}
                          onChange={(value) => contactForm.setValue('phoneCountryCode', value)}
                          placeholder="Code"
                          searchPlaceholder="Search country..."
                        />
                      </div>
                      <div className="col-span-2">
                        <label className={labelClass}>Phone Number</label>
                        <input
                          {...contactForm.register('phoneNumber')}
                          type="tel"
                          placeholder="(555) 123-4567"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Your Role *</label>
                      <SearchableSelect
                        options={JOB_TITLES.map(title => ({
                          value: title,
                          label: title,
                        }))}
                        value={contactForm.watch('jobTitle')}
                        onChange={(value) => contactForm.setValue('jobTitle', value)}
                        placeholder="Select your role"
                        searchPlaceholder="Search roles..."
                        error={!!contactForm.formState.errors.jobTitle}
                        enableSearch={false}
                      />
                      {contactForm.formState.errors.jobTitle && (
                        <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{contactForm.formState.errors.jobTitle.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentSection(0)}
                      className="flex-1 h-14 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 h-14 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" /></>}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Business Address */}
              {currentSection === 2 && (
                <form onSubmit={addressForm.handleSubmit(handleAddressSubmit)} className="space-y-6" noValidate>
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-warm-600" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-serif font-medium text-foreground">Where are you based?</h1>
                        <p className="text-muted-foreground">This helps with taxes and shipping</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>Search Address</label>
                      <AddressAutocomplete
                        onAddressSelect={handleAddressSelect}
                        onManualEntryToggle={() => {}}
                        placeholder="Start typing your address..."
                      />
                      <p className="mt-1 text-xs text-[var(--foreground-tertiary)]">
                        Search for any address worldwide. The country and other fields will be auto-filled.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Country *</label>
                        <SearchableSelect
                          options={countries.map(c => ({
                            value: c.id,
                            label: c.name,
                            icon: <span className="text-base">{c.flag_emoji}</span>,
                            searchTerms: [c.name, c.id],
                          }))}
                          value={addressForm.watch('country')}
                          onChange={(value) => {
                            addressForm.setValue('country', value);
                            addressForm.setValue('state', '');
                            loadStates(value);
                          }}
                          placeholder="Select country"
                          searchPlaceholder="Search countries..."
                          error={!!addressForm.formState.errors.country}
                        />
                        {addressForm.formState.errors.country && (
                          <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{addressForm.formState.errors.country.message}</p>
                        )}
                      </div>
                      <div>
                        <label className={labelClass}>State/Province *</label>
                        <SearchableSelect
                          options={states.map(s => ({
                            value: s.id,
                            label: s.name,
                            searchTerms: [s.name, s.id],
                          }))}
                          value={addressForm.watch('state')}
                          onChange={(value) => addressForm.setValue('state', value)}
                          placeholder={isLoadingStates ? 'Loading...' : 'Select state'}
                          searchPlaceholder="Search states..."
                          disabled={isLoadingStates || !addressForm.watch('country')}
                          loading={isLoadingStates}
                          error={!!addressForm.formState.errors.state}
                          emptyMessage={addressForm.watch('country') ? 'No states found' : 'Select a country first'}
                        />
                        {addressForm.formState.errors.state && (
                          <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{addressForm.formState.errors.state.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>City *</label>
                        <input {...addressForm.register('city')} placeholder="City" className={addressForm.formState.errors.city ? inputErrorClass : inputClass} />
                        {addressForm.formState.errors.city && (
                          <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{addressForm.formState.errors.city.message}</p>
                        )}
                      </div>
                      <div>
                        <label className={labelClass}>Postal Code *</label>
                        <input {...addressForm.register('postalCode')} placeholder="12345" className={addressForm.formState.errors.postalCode ? inputErrorClass : inputClass} />
                        {addressForm.formState.errors.postalCode && (
                          <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{addressForm.formState.errors.postalCode.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Street Address *</label>
                      <input {...addressForm.register('streetAddress')} placeholder="123 Main Street" className={addressForm.formState.errors.streetAddress ? inputErrorClass : inputClass} />
                      {addressForm.formState.errors.streetAddress && (
                        <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{addressForm.formState.errors.streetAddress.message}</p>
                      )}
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-muted rounded-lg border border-border hover:border-border-strong transition-colors">
                      <input
                        type="checkbox"
                        checked={addressForm.watch('billingAddressSameAsBusiness') ?? true}
                        onChange={(e) => addressForm.setValue('billingAddressSameAsBusiness', e.target.checked)}
                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground-secondary">Billing address is the same as business address</span>
                    </label>
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentSection(1)}
                      className="flex-1 h-14 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 h-14 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" /></>}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 4: Store Setup */}
              {currentSection === 3 && (
                <form onSubmit={storeSetupForm.handleSubmit(handleStoreSetupSubmit, (errors) => devError('[StoreSetup] Validation errors:', errors))} className="space-y-6" noValidate>
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-warm-100 border border-warm-200 flex items-center justify-center">
                        <Store className="w-6 h-6 text-warm-600" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-serif font-medium text-foreground">Almost there!</h1>
                        <p className="text-muted-foreground">Just a few more details to get you live</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Business Model Selection */}
                    <div>
                      <label className={labelClass}>Business Model *</label>
                      <p className="text-xs text-muted-foreground mb-3">Choose how you want to sell</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label
                          className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                            storeSetupForm.watch('businessModel') === 'ONLINE_STORE'
                              ? 'border-primary bg-warm-50'
                              : 'border-border hover:border-warm-300'
                          }`}
                        >
                          <input
                            type="radio"
                            {...storeSetupForm.register('businessModel')}
                            value="ONLINE_STORE"
                            className="sr-only"
                          />
                          <div className="w-10 h-10 rounded-lg bg-warm-100 flex items-center justify-center flex-shrink-0">
                            <Store className="w-5 h-5 text-warm-600" />
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-foreground block">Online Store</span>
                            <span className="text-sm text-muted-foreground">Sell your own products directly to customers (D2C)</span>
                          </div>
                          {storeSetupForm.watch('businessModel') === 'ONLINE_STORE' && (
                            <div className="absolute top-3 right-3">
                              <Check className="w-5 h-5 text-primary" />
                            </div>
                          )}
                        </label>

                        <label
                          className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                            storeSetupForm.watch('businessModel') === 'MARKETPLACE'
                              ? 'border-primary bg-warm-50'
                              : 'border-border hover:border-warm-300'
                          }`}
                        >
                          <input
                            type="radio"
                            {...storeSetupForm.register('businessModel')}
                            value="MARKETPLACE"
                            className="sr-only"
                          />
                          <div className="w-10 h-10 rounded-lg bg-warm-100 flex items-center justify-center flex-shrink-0">
                            <Globe className="w-5 h-5 text-warm-600" />
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-foreground block">Marketplace</span>
                            <span className="text-sm text-muted-foreground">Multi-vendor platform with commission-based sales</span>
                          </div>
                          {storeSetupForm.watch('businessModel') === 'MARKETPLACE' && (
                            <div className="absolute top-3 right-3">
                              <Check className="w-5 h-5 text-primary" />
                            </div>
                          )}
                        </label>
                      </div>
                      {storeSetupForm.formState.errors.businessModel && (
                        <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{storeSetupForm.formState.errors.businessModel.message}</p>
                      )}
                    </div>

                    <div className={`transition-all duration-200 ${showCustomDomainSection ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="flex items-center justify-between mb-1">
                        <label className={labelClass}>
                          Store Admin URL *
                          {showCustomDomainSection && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">(Secondary - using custom domain)</span>
                          )}
                        </label>
                        {!showCustomDomainSection && businessInfo?.business_name && (
                          <button
                            type="button"
                            onClick={() => {
                              const slug = generateSlugFromName(businessInfo.business_name || '');
                              storeSetupForm.setValue('subdomain', slug);
                              setSubdomainManuallyEdited(false);
                            }}
                            className="text-xs text-primary hover:text-foreground font-medium"
                          >
                            Reset to auto-generated
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {showCustomDomainSection
                          ? 'This will be your backup admin URL. Your custom domain will be primary.'
                          : 'Auto-generated from your business name. Edit if you prefer a different URL.'
                        }
                      </p>
                      <div className="relative">
                        <div className="flex">
                          <div className="relative flex-1">
                            <input
                              {...storeSetupForm.register('subdomain')}
                              placeholder="mystore"
                              disabled={showCustomDomainSection}
                              onChange={(e) => {
                                storeSetupForm.setValue('subdomain', e.target.value);
                                setSubdomainManuallyEdited(true);
                              }}
                              className={`w-full h-14 px-5 pr-12 text-base bg-warm-50 border rounded-l-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                                showCustomDomainSection
                                  ? 'border-warm-200 bg-warm-100 cursor-not-allowed'
                                  : slugValidation.isAvailable === true
                                    ? 'border-sage-500 focus:border-sage-500 focus:ring-sage-500/20'
                                    : slugValidation.isAvailable === false
                                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                                      : 'border-warm-200 focus:border-primary focus:ring-primary/20'
                              }`}
                            />
                            {/* Validation status icon */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              {!showCustomDomainSection && (
                                slugValidation.isChecking ? (
                                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                ) : slugValidation.isAvailable === true ? (
                                  <Check className="w-5 h-5 text-sage-600" />
                                ) : slugValidation.isAvailable === false ? (
                                  <AlertCircle className="w-5 h-5 text-red-500" />
                                ) : null
                              )}
                            </div>
                          </div>
                          <span className="h-14 px-5 bg-warm-100 border border-warm-200 border-l-0 rounded-r-xl flex items-center text-sm text-muted-foreground whitespace-nowrap">
                            -admin.{baseDomain}
                          </span>
                        </div>

                        {/* Validation message */}
                        {!showCustomDomainSection && slugValidation.message && (
                          <p className={`mt-2 text-sm font-medium flex items-center gap-1.5 ${
                            slugValidation.isAvailable === true
                              ? 'text-emerald-600'
                              : slugValidation.isAvailable === false
                                ? 'text-red-500'
                                : 'text-muted-foreground'
                          }`}>
                            {slugValidation.isAvailable === true && <Check className="w-4 h-4" />}
                            {slugValidation.isAvailable === false && <AlertCircle className="w-4 h-4" />}
                            {slugValidation.message}
                          </p>
                        )}

                        {/* Suggestions when not available */}
                        {!showCustomDomainSection && slugValidation.isAvailable === false && slugValidation.suggestions.length > 0 && (
                          <div className="mt-3 p-3 bg-warm-50 rounded-lg border border-warm-200">
                            <p className="text-xs text-muted-foreground mb-2">Try one of these available names:</p>
                            <div className="flex flex-wrap gap-2">
                              {slugValidation.suggestions.slice(0, 3).map((suggestion) => (
                                <button
                                  key={suggestion}
                                  type="button"
                                  onClick={() => storeSetupForm.setValue('subdomain', suggestion)}
                                  className="px-3 py-1.5 text-sm bg-card border border-warm-200 rounded-lg hover:border-primary hover:bg-warm-50 transition-colors"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Storefront URL */}
                    <div className={`transition-all duration-200 ${showCustomDomainSection ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="flex items-center justify-between mb-1">
                        <label className={labelClass}>
                          Storefront URL *
                          {showCustomDomainSection && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">(Secondary - using custom domain)</span>
                          )}
                        </label>
                        {!showCustomDomainSection && storefrontSlugManuallyEdited && (
                          <button
                            type="button"
                            onClick={() => {
                              const slug = storeSetupForm.getValues('subdomain') || generateSlugFromName(businessInfo.business_name || '');
                              storeSetupForm.setValue('storefrontSlug', slug);
                              setStorefrontSlugManuallyEdited(false);
                            }}
                            className="text-xs text-primary hover:text-foreground font-medium"
                          >
                            Reset to match admin URL
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {showCustomDomainSection
                          ? 'This will be your backup storefront URL. Your custom domain will be primary.'
                          : 'Auto-synced with your admin URL. Edit if you prefer a different storefront URL.'
                        }
                      </p>
                      <div className="relative">
                        <div className="flex">
                          <div className="relative flex-1">
                            <input
                              {...storeSetupForm.register('storefrontSlug')}
                              placeholder="mystore"
                              disabled={showCustomDomainSection}
                              onChange={(e) => {
                                storeSetupForm.setValue('storefrontSlug', e.target.value);
                                setStorefrontSlugManuallyEdited(true);
                              }}
                              className={`w-full h-14 px-5 pr-12 text-base bg-warm-50 border rounded-l-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                                showCustomDomainSection
                                  ? 'border-warm-200 bg-warm-100 cursor-not-allowed'
                                  : storefrontValidation.isAvailable === true
                                    ? 'border-sage-500 focus:border-sage-500 focus:ring-sage-500/20'
                                    : storefrontValidation.isAvailable === false
                                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                                      : 'border-warm-200 focus:border-primary focus:ring-primary/20'
                              }`}
                            />
                            {/* Validation status icon */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              {!showCustomDomainSection && (
                                storefrontValidation.isChecking ? (
                                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                ) : storefrontValidation.isAvailable === true ? (
                                  <Check className="w-5 h-5 text-sage-600" />
                                ) : storefrontValidation.isAvailable === false ? (
                                  <AlertCircle className="w-5 h-5 text-red-500" />
                                ) : null
                              )}
                            </div>
                          </div>
                          <span className="h-14 px-5 bg-warm-100 border border-warm-200 border-l-0 rounded-r-xl flex items-center text-sm text-muted-foreground whitespace-nowrap">
                            .{baseDomain}
                          </span>
                        </div>

                        {/* Validation message */}
                        {!showCustomDomainSection && storefrontValidation.message && (
                          <p className={`mt-2 text-sm font-medium flex items-center gap-1.5 ${
                            storefrontValidation.isAvailable === true
                              ? 'text-emerald-600'
                              : storefrontValidation.isAvailable === false
                                ? 'text-red-500'
                                : 'text-muted-foreground'
                          }`}>
                            {storefrontValidation.isAvailable === true && <Check className="w-4 h-4" />}
                            {storefrontValidation.isAvailable === false && <AlertCircle className="w-4 h-4" />}
                            {storefrontValidation.message}
                          </p>
                        )}

                        {/* Suggestions when not available */}
                        {!showCustomDomainSection && storefrontValidation.isAvailable === false && storefrontValidation.suggestions.length > 0 && (
                          <div className="mt-3 p-3 bg-warm-50 rounded-lg border border-warm-200">
                            <p className="text-xs text-muted-foreground mb-2">Try one of these available names:</p>
                            <div className="flex flex-wrap gap-2">
                              {storefrontValidation.suggestions.slice(0, 3).map((suggestion) => (
                                <button
                                  key={suggestion}
                                  type="button"
                                  onClick={() => storeSetupForm.setValue('storefrontSlug', suggestion)}
                                  className="px-3 py-1.5 text-sm bg-card border border-warm-200 rounded-lg hover:border-primary hover:bg-warm-50 transition-colors"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Helper text - only show when no validation message */}
                        {!showCustomDomainSection && !storefrontValidation.message && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            This is your customer-facing store URL. Synced with admin URL by default.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Custom Domain Section Toggle */}
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          const wasOpen = showCustomDomainSection;
                          setShowCustomDomainSection(!showCustomDomainSection);
                          if (!wasOpen) {
                            // Opening the section - set useCustomDomain to true
                            storeSetupForm.setValue('useCustomDomain', true);
                            // CRITICAL FIX: Trigger validation if there's already a domain value
                            const existingDomain = storeSetupForm.getValues('customDomain');
                            if (existingDomain) {
                              validateCustomDomain(existingDomain);
                            }
                          } else {
                            // Closing the section - reset custom domain state
                            storeSetupForm.setValue('useCustomDomain', false);
                            storeSetupForm.setValue('customDomain', '');
                            setCustomDomainValidation({
                              isChecking: false,
                              isValid: null,
                              dnsConfigured: false,
                              message: '',
                              formatWarning: undefined,
                              suggestedDomain: undefined,
                            });
                          }
                        }}
                        className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-200 group ${
                          showCustomDomainSection
                            ? 'bg-gradient-to-r from-primary/10 to-sage-50 border-primary shadow-sm'
                            : 'bg-card hover:bg-warm-50 border-warm-200 hover:border-primary/50 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                            showCustomDomainSection
                              ? 'bg-gradient-to-br from-primary to-emerald-600 shadow-md'
                              : 'bg-gradient-to-br from-warm-300 to-warm-400 group-hover:from-primary/80 group-hover:to-primary'
                          }`}>
                            <Link2 className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-foreground text-base">Connect Your Own Domain</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              Use a custom domain like <span className="font-medium text-primary">store.yourbrand.com</span>
                            </p>
                          </div>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          showCustomDomainSection
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-warm-100 group-hover:bg-primary/20'
                        }`}>
                          {showCustomDomainSection ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <ArrowRight className="w-5 h-5 text-warm-500 group-hover:text-primary transition-colors" />
                          )}
                        </div>
                      </button>

                      {/* Expandable Custom Domain Section */}
                      {showCustomDomainSection && (
                        <div className="mt-4 p-6 bg-gradient-to-br from-primary/5 to-sage-50/50 rounded-2xl border-2 border-primary/20 animate-in slide-in-from-top-2 duration-200 shadow-sm">
                          <div className="space-y-5">
                            {/* Custom Domain Input */}
                            <div>
                              <label className={labelClass}>Your Domain</label>
                              <p className="text-sm text-muted-foreground mb-3">
                                Enter your root domain (e.g., yourbrand.com). We'll automatically configure admin and storefront URLs.
                              </p>
                              <div className="relative">
                                <input
                                  {...storeSetupForm.register('customDomain')}
                                  placeholder="yourbrand.com"
                                  onBlur={(e) => {
                                    // Normalize the domain on blur
                                    const normalized = normalizeDomain(e.target.value);
                                    if (normalized !== e.target.value) {
                                      storeSetupForm.setValue('customDomain', normalized);
                                    }
                                  }}
                                  className={`w-full h-14 px-5 pr-12 text-base bg-white border-2 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all ${
                                    customDomainValidation.isValid === true
                                      ? 'border-sage-500 focus:border-sage-500 focus:ring-sage-500/20'
                                      : customDomainValidation.isValid === false
                                        ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                                        : 'border-warm-200 focus:border-primary focus:ring-primary/20'
                                  }`}
                                />
                                {/* Validation status icon */}
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                  {customDomainValidation.isChecking ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                  ) : customDomainValidation.isValid === true ? (
                                    customDomainValidation.dnsConfigured ? (
                                      <Check className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                      <AlertCircle className="w-5 h-5 text-amber-500" />
                                    )
                                  ) : customDomainValidation.isValid === false ? (
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                  ) : null}
                                </div>
                              </div>

                              {/* Validation message */}
                              {customDomainValidation.message && (
                                <p className={`mt-2 text-sm font-medium flex items-center gap-1.5 ${
                                  customDomainValidation.isValid === true
                                    ? 'text-sage-600'
                                    : customDomainValidation.isValid === false
                                      ? 'text-red-500'
                                      : 'text-muted-foreground'
                                }`}>
                                  {customDomainValidation.isValid === true && <Check className="w-4 h-4" />}
                                  {customDomainValidation.isValid === false && <AlertCircle className="w-4 h-4" />}
                                  {customDomainValidation.message}
                                </p>
                              )}

                              {/* Format warning (e.g., subdomain detection) */}
                              {customDomainValidation.formatWarning && (
                                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm text-amber-700">
                                        {customDomainValidation.formatWarning}
                                      </p>
                                      {customDomainValidation.suggestedDomain && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            storeSetupForm.setValue('customDomain', customDomainValidation.suggestedDomain || '');
                                            validateCustomDomain(customDomainValidation.suggestedDomain || '');
                                          }}
                                          className="mt-2 text-sm font-medium text-amber-600 hover:text-amber-800 underline underline-offset-2"
                                        >
                                          Use {customDomainValidation.suggestedDomain} instead
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Generated URLs Preview */}
                            {(() => {
                              const domainInput = storeSetupForm.watch('customDomain');
                              const customAdminSubdomain = storeSetupForm.watch('customAdminSubdomain') || 'admin';
                              // Default to 'www' - apex domains are NOT supported
                              const customStorefrontSubdomain = storeSetupForm.watch('customStorefrontSubdomain') || DEFAULT_STOREFRONT_SUBDOMAIN;
                              const storefrontSubdomainError = validateStorefrontSubdomain(customStorefrontSubdomain);
                              const urls = domainInput ? generateUrls(domainInput, {
                                adminSubdomain: customAdminSubdomain,
                                storefrontSubdomain: customStorefrontSubdomain,
                              }) : null;
                              if (!urls || !domainInput || domainInput.length < 4) return null;

                              return (
                                <div className="p-4 bg-white rounded-xl border-2 border-warm-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Store URLs</p>
                                    <button
                                      type="button"
                                      onClick={() => setIsEditingCustomUrls(!isEditingCustomUrls)}
                                      className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                    >
                                      {isEditingCustomUrls ? (
                                        <>
                                          <X className="w-3.5 h-3.5" />
                                          Done
                                        </>
                                      ) : (
                                        <>
                                          <Pencil className="w-3.5 h-3.5" />
                                          Customize
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <div className="space-y-3">
                                    {/* Admin URL */}
                                    <div className="p-3 bg-warm-50 rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs text-muted-foreground">Admin Dashboard</p>
                                          {isEditingCustomUrls ? (
                                            <div className="flex items-center gap-1 mt-1">
                                              <span className="text-sm text-muted-foreground">https://</span>
                                              <input
                                                type="text"
                                                {...storeSetupForm.register('customAdminSubdomain')}
                                                placeholder="admin"
                                                className="w-24 px-2 py-1 text-sm font-semibold bg-white border border-warm-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                              />
                                              <span className="text-sm text-muted-foreground">.{urls.baseDomain}</span>
                                            </div>
                                          ) : (
                                            <p className="text-sm font-semibold text-foreground truncate">
                                              {urls.admin}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {/* Storefront URLs */}
                                    <div className="p-3 bg-warm-50 rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                          </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs text-muted-foreground">Storefront (Customer-facing)</p>
                                          {isEditingCustomUrls ? (
                                            <div className="mt-1 space-y-2">
                                              <div className="flex items-center gap-1">
                                                <span className="text-sm text-muted-foreground">https://</span>
                                                <input
                                                  type="text"
                                                  {...storeSetupForm.register('customStorefrontSubdomain')}
                                                  placeholder="www"
                                                  className={`w-32 px-2 py-1 text-sm font-semibold bg-white border rounded focus:outline-none focus:ring-1 focus:ring-primary ${storefrontSubdomainError ? 'border-red-400' : 'border-warm-300'}`}
                                                />
                                                <span className="text-sm text-muted-foreground">.{urls.baseDomain}</span>
                                              </div>
                                              {storefrontSubdomainError ? (
                                                <p className="text-xs text-red-500">
                                                  {storefrontSubdomainError}
                                                </p>
                                              ) : (
                                                <p className="text-xs text-muted-foreground">
                                                  Enter a subdomain like &quot;www&quot; or &quot;store&quot;, or leave empty for apex domain.
                                                </p>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="space-y-1">
                                              <p className="text-sm font-semibold text-foreground">
                                                https://{urls.baseDomain}
                                              </p>
                                              <p className="text-sm font-semibold text-foreground">
                                                https://www.{urls.baseDomain}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {!isEditingCustomUrls && (
                                    <p className="mt-3 text-xs text-muted-foreground text-center">
                                      Click &quot;Customize&quot; to change URL subdomains
                                    </p>
                                  )}
                                </div>
                              );
                            })()}

                            {/* DNS Configuration Instructions */}
                            {customDomainValidation.isValid === true && customDomainValidation.verificationRecord && (
                              <div className="p-5 bg-white rounded-xl border-2 border-warm-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <ExternalLink className="w-4 h-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">DNS Configuration Required</p>
                                    <p className="text-xs text-muted-foreground">Add this record to your domain provider (GoDaddy, Cloudflare, Namecheap, etc.)</p>
                                  </div>
                                </div>

                                {/* Verification Method Selector */}
                                {customDomainValidation.verificationRecords && customDomainValidation.verificationRecords.length > 1 && (
                                  <div className="mb-4">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Choose verification method:</p>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedVerificationMethod('CNAME')}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                          selectedVerificationMethod === 'CNAME'
                                            ? 'bg-primary text-white'
                                            : 'bg-warm-100 text-foreground hover:bg-warm-200'
                                        }`}
                                      >
                                        CNAME Record
                                        <span className="block text-xs opacity-75 mt-0.5">Recommended</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedVerificationMethod('TXT')}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                          selectedVerificationMethod === 'TXT'
                                            ? 'bg-primary text-white'
                                            : 'bg-warm-100 text-foreground hover:bg-warm-200'
                                        }`}
                                      >
                                        TXT Record
                                        <span className="block text-xs opacity-75 mt-0.5">Alternative</span>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Get the selected verification record */}
                                {(() => {
                                  const selectedRecord = customDomainValidation.verificationRecords?.find(r => r.type === selectedVerificationMethod) || customDomainValidation.verificationRecord;
                                  if (!selectedRecord) return null;
                                  return (
                                    <div className="bg-warm-50 rounded-lg overflow-hidden">
                                      {/* DNS Record Table */}
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="border-b border-warm-200">
                                              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3 w-20">Type</th>
                                              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Host / Name</th>
                                              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Value / Points To</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            <tr>
                                              <td className="px-4 py-3 align-top">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-mono font-semibold text-xs ${
                                                  selectedRecord.type === 'CNAME'
                                                    ? 'bg-sage-100 text-sage-700'
                                                    : 'bg-primary/10 text-primary'
                                                }`}>
                                                  {selectedRecord.type}
                                                </span>
                                              </td>
                                              <td className="px-4 py-3 align-top">
                                                <div className="flex items-start gap-2">
                                                  <code className="flex-1 font-mono text-sm text-foreground bg-white px-3 py-2 rounded-lg break-all select-all">
                                                    {selectedRecord.host}
                                                  </code>
                                                  <button
                                                    type="button"
                                                    onClick={() => navigator.clipboard.writeText(selectedRecord.host || '')}
                                                    className="flex-shrink-0 p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    title="Copy host"
                                                  >
                                                    <Copy className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 align-top">
                                                <div className="flex items-start gap-2">
                                                  <code className="flex-1 font-mono text-sm text-foreground bg-white px-3 py-2 rounded-lg break-all select-all">
                                                    {selectedRecord.value}
                                                  </code>
                                                  <button
                                                    type="button"
                                                    onClick={() => navigator.clipboard.writeText(selectedRecord.value || '')}
                                                    className="flex-shrink-0 p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    title="Copy value"
                                                  >
                                                    <Copy className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Quick Help */}
                                <div className="mt-4 p-3 bg-warm-100 rounded-lg border border-warm-300">
                                  <p className="text-sm text-foreground-secondary">
                                    <strong className="font-semibold text-foreground">Where to add this?</strong> Log in to your domain provider and find DNS settings, Zone Editor, or DNS Management. Add a new record with the values above.
                                  </p>
                                </div>

                                {/* Email Setup Info (Optional) */}
                                <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                  <p className="text-sm text-foreground-secondary">
                                    <strong className="font-semibold text-foreground">Email Setup (Optional):</strong> Want to send emails from your custom domain (e.g., contact@{storeSetupForm.watch('customDomain')})? You can configure SPF, DKIM, and MX records later in Admin Settings → Domains.
                                  </p>
                                </div>

                                {/* Domain Verification Section */}
                                <div className="mt-4 p-4 bg-white rounded-xl border-2 border-warm-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-foreground">Verify DNS Configuration</h4>
                                    <button
                                      type="button"
                                      onClick={verifyDomainDNS}
                                      disabled={domainVerification.isVerifying}
                                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                    >
                                      {domainVerification.isVerifying ? (
                                        <>
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                          Verifying...
                                        </>
                                      ) : (
                                        <>
                                          <RefreshCw className="w-4 h-4" />
                                          Verify Now
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  {/* Verification Status */}
                                  {domainVerification.lastChecked && (
                                    <div className="space-y-3">
                                      {/* DNS Status */}
                                      <div className={`flex items-center gap-3 p-4 rounded-lg ${
                                        domainVerification.dnsVerified
                                          ? 'bg-sage-50 border-2 border-sage-300'
                                          : domainVerification.dnsRecordFound
                                            ? 'bg-amber-50 border-2 border-amber-200'
                                            : 'bg-red-50 border-2 border-red-200'
                                      }`}>
                                        {domainVerification.dnsVerified ? (
                                          <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-6 h-6 text-sage-600" />
                                          </div>
                                        ) : domainVerification.dnsRecordFound ? (
                                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                            <AlertCircle className="w-6 h-6 text-amber-600" />
                                          </div>
                                        ) : (
                                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                            <AlertCircle className="w-6 h-6 text-red-600" />
                                          </div>
                                        )}
                                        <div className="flex-1">
                                          <p className={`text-base font-semibold ${
                                            domainVerification.dnsVerified
                                              ? 'text-sage-700'
                                              : domainVerification.dnsRecordFound
                                                ? 'text-amber-700'
                                                : 'text-red-700'
                                          }`}>
                                            {domainVerification.dnsVerified ? 'DNS Ownership Verified' : domainVerification.dnsRecordFound ? 'DNS Record Found (Incorrect Value)' : 'DNS Record Not Found'}
                                          </p>
                                          <p className={`text-sm mt-1 ${
                                            domainVerification.dnsVerified
                                              ? 'text-sage-600'
                                              : domainVerification.dnsRecordFound
                                                ? 'text-amber-600'
                                                : 'text-red-600'
                                          }`}>
                                            {domainVerification.message}
                                          </p>
                                        </div>
                                      </div>

                                      {/* SSL Status */}
                                      {domainVerification.dnsVerified && (
                                        <div className={`flex items-center gap-3 p-4 rounded-lg ${
                                          domainVerification.sslStatus === 'active'
                                            ? 'bg-sage-50 border-2 border-sage-300'
                                            : domainVerification.sslStatus === 'failed'
                                              ? 'bg-red-50 border-2 border-red-200'
                                              : 'bg-primary/5 border-2 border-primary/20'
                                        }`}>
                                          {domainVerification.sslStatus === 'active' ? (
                                            <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                                              <ShieldCheck className="w-6 h-6 text-sage-600" />
                                            </div>
                                          ) : domainVerification.sslStatus === 'failed' ? (
                                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                              <ShieldAlert className="w-6 h-6 text-red-600" />
                                            </div>
                                          ) : (
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                              <ShieldCheck className="w-6 h-6 text-primary" />
                                            </div>
                                          )}
                                          <div className="flex-1">
                                            <p className={`text-base font-semibold ${
                                              domainVerification.sslStatus === 'active'
                                                ? 'text-sage-700'
                                                : domainVerification.sslStatus === 'failed'
                                                  ? 'text-red-700'
                                                  : 'text-foreground'
                                            }`}>
                                              {domainVerification.sslStatus === 'active'
                                                ? 'SSL Certificate Active'
                                                : domainVerification.sslStatus === 'failed'
                                                  ? 'SSL Certificate Failed'
                                                  : 'SSL Certificate Will Be Provisioned'}
                                            </p>
                                            <p className={`text-sm mt-1 ${
                                              domainVerification.sslStatus === 'active'
                                                ? 'text-sage-600'
                                                : domainVerification.sslStatus === 'failed'
                                                  ? 'text-red-600'
                                                  : 'text-foreground-secondary'
                                            }`}>
                                              {domainVerification.sslStatus === 'active'
                                                ? 'Your domain is secured with HTTPS'
                                                : domainVerification.sslStatus === 'failed'
                                                  ? 'Certificate provisioning failed. Please contact support.'
                                                  : 'A free Let\'s Encrypt SSL certificate will be automatically provisioned after you complete setup (usually within 2-5 minutes)'}
                                            </p>
                                          </div>
                                        </div>
                                      )}

                                      {/* Security Note */}
                                      {domainVerification.dnsVerified && (
                                        <div className="p-3 bg-warm-100 rounded-lg border border-warm-200">
                                          <p className="text-xs text-foreground-tertiary">
                                            <strong className="font-semibold text-foreground-secondary">Security Note:</strong> DNS verification proves you own this domain. Only you can add DNS records at your domain provider, preventing unauthorized claims.
                                          </p>
                                        </div>
                                      )}

                                      {/* Last Checked */}
                                      <p className="text-xs text-muted-foreground text-right">
                                        Verified at: {domainVerification.lastChecked.toLocaleTimeString()}
                                      </p>
                                    </div>
                                  )}

                                  {/* Initial State - No verification yet */}
                                  {!domainVerification.lastChecked && !domainVerification.isVerifying && (
                                    <p className="text-sm text-muted-foreground">
                                      After adding the DNS record above, click &quot;Verify Now&quot; to check if the changes have propagated.
                                    </p>
                                  )}
                                </div>

                                <p className="mt-3 text-xs text-muted-foreground flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                  <span>DNS changes can take up to 48 hours to propagate. You can complete setup now and verify the domain later in Settings.</span>
                                </p>
                              </div>
                            )}

                            {/* Cancel custom domain */}
                            <div className="flex justify-center pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCustomDomainSection(false);
                                  storeSetupForm.setValue('useCustomDomain', false);
                                  storeSetupForm.setValue('customDomain', '');
                                  setCustomDomainValidation({
                                    isChecking: false,
                                    isValid: null,
                                    dnsConfigured: false,
                                    message: '',
                                    formatWarning: undefined,
                                    suggestedDomain: undefined,
                                  });
                                }}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-warm-100"
                              >
                                ← Skip custom domain for now
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Currency *</label>
                        <SearchableSelect
                          options={currencies.map(c => ({
                            value: c.code,
                            label: `${c.symbol} ${c.code}`,
                            description: c.name,
                            searchTerms: [c.name, c.code, c.symbol],
                          }))}
                          value={storeSetupForm.watch('currency')}
                          onChange={(value) => storeSetupForm.setValue('currency', value, { shouldValidate: true, shouldDirty: true })}
                          placeholder="Select currency"
                          searchPlaceholder="Search currencies..."
                          error={!!storeSetupForm.formState.errors.currency}
                        />
                        {storeSetupForm.formState.errors.currency && (
                          <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{storeSetupForm.formState.errors.currency.message}</p>
                        )}
                      </div>
                      <div>
                        <label className={labelClass}>Timezone *</label>
                        <SearchableSelect
                          options={timezones.map(tz => ({
                            value: tz.id,
                            label: tz.name,
                            description: tz.offset,
                            searchTerms: [tz.name, tz.offset, tz.id],
                          }))}
                          value={storeSetupForm.watch('timezone')}
                          onChange={(value) => storeSetupForm.setValue('timezone', value, { shouldValidate: true, shouldDirty: true })}
                          placeholder="Select timezone"
                          searchPlaceholder="Search timezones..."
                          error={!!storeSetupForm.formState.errors.timezone}
                        />
                        {storeSetupForm.formState.errors.timezone && (
                          <p className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">{storeSetupForm.formState.errors.timezone.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Default Language</label>
                      <SearchableSelect
                        options={[
                          { value: 'en', label: 'English', icon: <span>🇺🇸</span> },
                          { value: 'es', label: 'Spanish', icon: <span>🇪🇸</span> },
                          { value: 'fr', label: 'French', icon: <span>🇫🇷</span> },
                          { value: 'de', label: 'German', icon: <span>🇩🇪</span> },
                        ]}
                        value={storeSetupForm.watch('language')}
                        onChange={(value) => storeSetupForm.setValue('language', value)}
                        placeholder="Select language"
                        enableSearch={false}
                      />
                    </div>

                    {/* Documents Section Toggle */}
                    {config.features.documents.enabled && (
                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={() => setShowDocumentsSection(!showDocumentsSection)}
                          className="w-full flex items-center justify-between p-4 bg-warm-50 border border-warm-200 rounded-xl hover:border-warm-300 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-foreground">Documents & Verification</p>
                              <p className="text-sm text-muted-foreground">
                                {config.features.documents.requireAddressProof || config.features.documents.requireBusinessProof
                                  ? 'Required documents for verification'
                                  : 'Optional - increase your trust score'}
                              </p>
                            </div>
                          </div>
                          <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center transition-transform ${showDocumentsSection ? 'rotate-180' : ''}`}>
                            <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
                          </div>
                        </button>

                        {/* Expandable Documents Section */}
                        {showDocumentsSection && (
                          <div className="mt-6 animate-in slide-in-from-top-2 duration-200">
                            <DocumentsSection
                              countryCode={addressForm.watch('country') || ''}
                              sessionId={sessionId || undefined}
                              addressProofType={addressProofType}
                              onAddressProofTypeChange={setAddressProofType}
                              addressProofDocument={addressProofDocument}
                              onAddressProofDocumentChange={setAddressProofDocument}
                              businessProofType={businessProofType}
                              onBusinessProofTypeChange={setBusinessProofType}
                              businessProofDocument={businessProofDocument}
                              onBusinessProofDocumentChange={setBusinessProofDocument}
                              logoDocument={logoDocument}
                              onLogoDocumentChange={setLogoDocument}
                              verificationState={{
                                emailVerified: false, // Will be true after email verification step
                                phoneVerified: false, // Will be true after phone verification
                                businessInfoComplete: !!(businessInfo as any)?.business_name && !!(businessInfo as any)?.business_type,
                                addressComplete: !!(businessAddress as any)?.street_address && !!(businessAddress as any)?.city,
                                storeConfigComplete: !!storeSetupForm.watch('subdomain') && !!storeSetupForm.watch('currency'),
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentSection(2)}
                      className="flex-1 h-14 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 h-14 bg-sage-600 hover:bg-sage-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Launch Store <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" /></>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
