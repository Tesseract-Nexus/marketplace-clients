'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ParsedAddressData } from '../../components/AddressAutocomplete';
import { type UploadedDocument } from '../../components/DocumentUpload';
import { Loader2, Check, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { useOnboardingStore, type DetectedLocation } from '../../lib/store/onboarding-store';
import { businessInfoSchema, contactDetailsSchema, businessAddressSchema, storeSetupSchema, type BusinessInfoForm, type ContactDetailsForm, type BusinessAddressForm, type StoreSetupForm } from '../../lib/validations/onboarding';
import { onboardingApi, OnboardingAPIError } from '../../lib/api/onboarding';
import { locationApi, type Country, type State, type Currency, type Timezone } from '../../lib/api/location';
import { useRouter } from 'next/navigation';
import { analytics } from '../../lib/analytics/posthog';
import { useAnalytics } from '../../lib/analytics/openpanel';
import { getBrowserGeolocation, reverseGeocode, checkGeolocationPermission } from '../../lib/utils/geolocation';
import { useAutoSave, useBrowserClose, useDraftRecovery, type DraftFormData } from '../../lib/hooks';
import { config } from '../../lib/config/app';
import { normalizeDomain, validateDomain, DEFAULT_STOREFRONT_SUBDOMAIN } from '../../lib/utils/domain';
import { mapContactToStore, mapAddressToStore, mapStoreSetupToStore } from '../../lib/utils/form-mappers';
import {
  BusinessInfoStep,
  ContactDetailsStep,
  LocationStep,
  StoreSetupStep,
  DocumentsStep,
  LegalStep,
  ReviewLaunchStep,
  steps,
  generateSlugFromName,
} from '../../components/steps';

// Development-only logging utility
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args: unknown[]) => isDev && console.log(...args);
const devWarn = (...args: unknown[]) => isDev && console.warn(...args);
const devError = (...args: unknown[]) => isDev && console.error(...args);

// Default base domain for subdomain-based URLs (will be updated from runtime config)
// URL format: {subdomain}-admin.{baseDomain}
const DEFAULT_BASE_DOMAIN = 'mark8ly.app';


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
    sessionExpired,
    setSessionExpired,
    markStepCompleted,
    // Legal acceptance from store (persisted)
    legalAccepted,
    setLegalAccepted,
    // Document state from store
    documents,
    setAddressProofType: setStoreAddressProofType,
    setBusinessProofType: setStoreBusinessProofType,
    setAddressProofDocument: setStoreAddressProofDocument,
    setBusinessProofDocument: setStoreBusinessProofDocument,
    setLogoDocument: setStoreLogoDocument,
  } = useOnboardingStore();

  const opAnalytics = useAnalytics();

  const [currentSection, setCurrentSection] = useState(0);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [timezones, setTimezones] = useState<Timezone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasAutoFilledForms, setHasAutoFilledForms] = useState(false);
  const [, setSelectedAddressFromAutocomplete] = useState<ParsedAddressData | null>(null);
  const [isStoreHydrated, setIsStoreHydrated] = useState(false);
  const previousSessionIdRef = useRef<string | null>(null);

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
  // Only CNAME verification is supported
  const [customDomainValidation, setCustomDomainValidation] = useState<{
    isChecking: boolean;
    isValid: boolean | null;
    dnsConfigured: boolean;
    message: string;
    verificationRecord?: { type: string; host: string; value: string };
    verificationRecords?: { type: string; host: string; value: string; purpose?: string }[];
    // A records for routing traffic to gateway
    routingRecords?: { type: string; host: string; value: string; purpose?: string }[];
    proxyTarget?: string;
    // CNAME delegation for automatic SSL certificates
    cnameDelegationRecord?: { type: string; host: string; value: string; purpose?: string };
    cnameDelegationEnabled?: boolean;
    formatWarning?: string;
    suggestedDomain?: string;
  }>({
    isChecking: false,
    isValid: null,
    dnsConfigured: false,
    message: '',
  });
  const customDomainValidationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // State for showing/hiding sensitive DNS values (security feature)
  const [showSensitiveDNS, setShowSensitiveDNS] = useState(false);

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
  const [, setShowDocumentsSection] = useState(false);

  // Copy button feedback state - tracks which item was recently copied
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to copy text and show feedback
  const copyToClipboard = useCallback((text: string, itemId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(itemId);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedItem(null);
    }, 2000);
  }, []);

  // Start Over confirmation dialog
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false);

  // Legal step (step 4) — scroll-to-enable agreement
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(legalAccepted);
  const legalScrollRef = useRef<HTMLDivElement>(null);

  // Resilient email: fallback to session API when store/form data goes stale
  const [fetchedEmail, setFetchedEmail] = useState('');

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
      ...storeSetup,
    },
  });

  // Track if custom domain URLs are being edited

  // Track if storefrontSlug was manually edited
  const [storefrontSlugManuallyEdited, setStorefrontSlugManuallyEdited] = useState(false);

  // Effect A — Populate forms reactively whenever PII data changes (handles async rehydration)
  useEffect(() => {
    if (!sessionId) return;

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
      const cd = mapContactToStore(contactDetails as any);
      const formData: Partial<ContactDetailsForm> = {
        firstName: cd.first_name || '',
        lastName: cd.last_name || '',
        email: cd.email || '',
        phoneCountryCode: (contactDetails as any).phone_country_code || 'US',
        phoneNumber: cd.phone_number || '',
        jobTitle: cd.job_title || '',
      };
      Object.entries(formData).forEach(([key, value]) => {
        if (value) contactForm.setValue(key as keyof ContactDetailsForm, value as any);
      });
    }
    if (businessAddress && Object.keys(businessAddress).length > 0) {
      const ba = mapAddressToStore(businessAddress as any);
      const formData: Partial<BusinessAddressForm> = {
        streetAddress: ba.street_address || '',
        city: ba.city || '',
        state: ba.state_province || '',
        postalCode: ba.postal_code || '',
        country: ba.country || '',
        addressConfirmed: ba.address_confirmed || false,
      };
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== '') addressForm.setValue(key as keyof BusinessAddressForm, value as any);
      });
    }
    if (storeSetup && Object.keys(storeSetup).length > 0) {
      const ss = mapStoreSetupToStore(storeSetup as any);
      const storeFormData: Partial<StoreSetupForm> = {
        businessModel: ss.business_model || undefined,
        subdomain: ss.subdomain || '',
        storefrontSlug: ss.storefront_slug || '',
        currency: ss.currency || '',
        timezone: ss.timezone || '',
        language: ss.language || 'en',
        logo: ss.logo || '',
      };
      Object.entries(storeFormData).forEach(([key, value]) => {
        if (value) storeSetupForm.setValue(key as keyof StoreSetupForm, value as any);
      });
    }
    // Restore document state from store
    if (documents) {
      if (documents.addressProofDocument && documents.addressProofDocument.status === 'success') {
        const persistedDoc = documents.addressProofDocument;
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
  }, [sessionId, businessInfo, contactDetails, businessAddress, storeSetup, documents, businessForm, contactForm, addressForm, storeSetupForm]);

  // Effect: Reset progress when sessionId changes (new onboarding started)
  useEffect(() => {
    // If sessionId changed from previous value, it means a new session was started
    if (sessionId && previousSessionIdRef.current && sessionId !== previousSessionIdRef.current) {
      console.log('[Onboarding] New session detected, resetting progress from', previousSessionIdRef.current, 'to', sessionId);
      useOnboardingStore.setState({
        completedSteps: [],
        currentStep: 0,
      });
      setCurrentSection(0);
      setIsStoreHydrated(false);
    }

    // Update ref to current sessionId
    previousSessionIdRef.current = sessionId;
  }, [sessionId]);

  // Effect B — Restore wizard step position ONLY after PII has loaded from server
  useEffect(() => {
    if (!sessionId || isStoreHydrated) return;

    // Wait until at least one PII field has loaded from server
    const hasPII = (businessInfo && Object.keys(businessInfo).length > 0) ||
                   (contactDetails && Object.keys(contactDetails).length > 0) ||
                   (businessAddress && Object.keys(businessAddress).length > 0);
    if (!hasPII) return; // PII not loaded yet — don't jump

    setIsStoreHydrated(true);
    const storedCurrentStep = useOnboardingStore.getState().currentStep;
    const completedSteps = useOnboardingStore.getState().completedSteps;

    // SECURITY FIX: Only restore step if previous steps are completed
    // This prevents skipping steps when sessionStorage has stale currentStep
    if (storedCurrentStep > 0) {
      // Validate that all previous steps are completed
      const canRestoreStep = Array.from({ length: storedCurrentStep }, (_, i) => i)
        .every(step => completedSteps.includes(step));

      if (canRestoreStep) {
        setCurrentSection(storedCurrentStep);
      } else {
        // Reset to first incomplete step
        const firstIncompleteStep = Array.from({ length: storedCurrentStep }, (_, i) => i)
          .find(step => !completedSteps.includes(step)) || 0;
        setCurrentSection(firstIncompleteStep);
      }
    }
  }, [sessionId, isStoreHydrated, businessInfo, contactDetails, businessAddress]);

  useEffect(() => {
    if (isStoreHydrated && currentSection !== currentStep) setCurrentStep(currentSection);
  }, [currentSection, currentStep, isStoreHydrated, setCurrentStep]);

  // Reset local wizard state when session expires
  useEffect(() => {
    if (sessionExpired) {
      setCurrentSection(0);
      setIsStoreHydrated(false);
    }
  }, [sessionExpired]);

  // Fetch base domain from runtime config for subdomain-based URLs
  useEffect(() => {
    const fetchDomainConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const config = await response.json();
          // Extract base domain from admin hostname (e.g., "dev-admin.mark8ly.app" -> "mark8ly.app")
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

  // Auto-save — no useMemo needed since useAutoSave already debounces at 3000ms
  const formDataForDraft: DraftFormData = {
    currentStep: currentSection,
    businessInfo: businessForm.getValues(),
    contactDetails: contactForm.getValues(),
    businessAddress: addressForm.getValues(),
    storeSetup: storeSetupForm.getValues(),
  };

  const handleDraftRecovery = useCallback((draftData: DraftFormData, step: number) => {
    if (draftData.businessInfo) Object.entries(draftData.businessInfo).forEach(([k, v]) => businessForm.setValue(k as keyof BusinessInfoForm, v as any));
    if (draftData.contactDetails) Object.entries(draftData.contactDetails).forEach(([k, v]) => contactForm.setValue(k as keyof ContactDetailsForm, v as any));
    if (draftData.businessAddress) Object.entries(draftData.businessAddress).forEach(([k, v]) => addressForm.setValue(k as keyof BusinessAddressForm, v as any));
    if (draftData.storeSetup) Object.entries(draftData.storeSetup).forEach(([k, v]) => storeSetupForm.setValue(k as keyof StoreSetupForm, v as any));
    setCurrentSection(step);
  }, [businessForm, contactForm, addressForm, storeSetupForm]);

  // Ref to prevent multiple cleanup calls (race condition prevention)
  const cleanupInProgressRef = useRef(false);

  // Shared reset helper — clears store, forms, and UI state
  const resetAllForms = useCallback(() => {
    localStorage.removeItem('tenant-onboarding-store');
    resetOnboarding();
    setCurrentSection(0);
    setIsStoreHydrated(false);
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
    setAddressProofDocumentLocal(null);
    setBusinessProofDocumentLocal(null);
    setLogoDocumentLocal(null);
    setShowDocumentsSection(false);
  }, [resetOnboarding, businessForm, contactForm, addressForm, storeSetupForm]);

  // Handle stale/invalid session - clear and start fresh
  const handleSessionNotFound = useCallback(() => {
    // Prevent multiple simultaneous cleanup attempts
    if (cleanupInProgressRef.current) return;
    cleanupInProgressRef.current = true;

    devWarn('[Onboarding] Session not found, clearing stale session data');
    resetAllForms();

    // Reset the flag after a delay to allow new cleanup if needed
    setTimeout(() => {
      cleanupInProgressRef.current = false;
    }, 1000);
  }, [resetAllForms]);

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
      if (sessionId) {
        await deleteDraft();
      }
      resetAllForms();
      // Additional resets specific to Start Fresh
      setAddressProofType('');
      setAddressProofDocument(null);
      setBusinessProofType('');
      setBusinessProofDocument(null);
      setLogoDocument(null);
      setSelectedAddressFromAutocomplete(null);
      setSlugValidation({
        isChecking: false,
        isAvailable: null,
        message: '',
        suggestions: [],
      });
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
  }, [sessionId, deleteDraft, resetAllForms, setAddressProofType, setAddressProofDocument, setBusinessProofType, setBusinessProofDocument, setLogoDocument]);

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
    opAnalytics.onboardingStarted({ timestamp: new Date().toISOString() });

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
        const response = await locationApi.getCountries(undefined, undefined, 300);
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
      // Don't auto-populate currency and timezone - let user select manually
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

        // Get the store slug for unique ACME CNAME target
        const storeSlug = storeSetupForm.getValues('subdomain') || generateSlugFromName(businessForm.getValues('businessName') || '');

        const response = await fetch('/api/onboarding/validate/custom-domain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: normalized,
            session_id: sessionId,
            tenant_slug: storeSlug, // Pass unique store slug for ACME CNAME target
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
          // Include routing records for A record setup
          routingRecords: domainIsValid ? data.routing_records : undefined,
          proxyTarget: domainIsValid ? data.proxy_target : undefined,
          // Include CNAME delegation for automatic SSL
          cnameDelegationRecord: domainIsValid ? data.cname_delegation_record : undefined,
          cnameDelegationEnabled: domainIsValid ? data.cname_delegation_enabled : undefined,
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
    // Get the CNAME verification record
    const selectedRecord = customDomainValidation.verificationRecords?.find(
      r => r.type === 'CNAME'
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
  }, [customDomainValidation.verificationRecord, customDomainValidation.verificationRecords, storeSetupForm]);

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
      opAnalytics.businessInfoCompleted({
        businessType: data.businessType,
        industry: data.industryCategory,
        hasWebsite: !!data.companyWebsite,
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

      markStepCompleted(0);
      setCurrentSection(1); // Move to Personal step
    } catch (error) {
      // Use OnboardingAPIError for better error handling
      if (error instanceof OnboardingAPIError) {
        if (error.isSessionError()) {
          handleSessionNotFound();
          return;
        }
        // Show specific error message from API
        let errorMsg = error.message;

        // If suggestions are available, append them to the error message
        if (error.details?.suggestions && Array.isArray(error.details.suggestions) && error.details.suggestions.length > 0) {
          const suggestions = error.details.suggestions.slice(0, 3).join(', ');
          errorMsg += ` Try these instead: ${suggestions}`;
        }

        setValidationErrors({ businessName: errorMsg });
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
      opAnalytics.contactInfoCompleted({ jobTitle: data.jobTitle, hasPhone: !!data.phoneNumber });
      setContactDetails(mapContactToStore({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone_number: data.phoneNumber,
        phone_country_code: callingCode,
        job_title: data.jobTitle,
      }) as any);
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
      markStepCompleted(1);
      setCurrentSection(2); // Move to Location step
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
      opAnalytics.addressCompleted({ country: data.country, state: data.state });
      // Store the address data in the Zustand store (uses snake_case for API compatibility)
      setBusinessAddress(mapAddressToStore({
        street_address: data.streetAddress,
        city: data.city,
        state_province: data.state,
        postal_code: data.postalCode,
        country: data.country,
      }) as any);
      // Don't auto-populate currency and timezone - let user select manually
      markStepCompleted(2);
      setCurrentSection(3); // Move to Store Setup step
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

  // Handler for Store Setup step - validates basic fields and moves to Custom Domain step
  const handleStoreSetupContinue = async () => {
    setValidationErrors({});

    // Validate basic store setup fields
    const basicFieldsValid = await storeSetupForm.trigger(['businessModel', 'subdomain', 'storefrontSlug', 'currency', 'timezone', 'language']);
    if (!basicFieldsValid) {
      return;
    }

    // Validate subdomain availability
    if (slugValidation.isChecking) {
      setValidationErrors({ storeSetup: 'Please wait for URL validation to complete.' });
      return;
    }
    if (slugValidation.isAvailable === false) {
      setValidationErrors({ storeSetup: slugValidation.message || 'The selected URL is not available. Please choose a different one.' });
      return;
    }

    markStepCompleted(3);
    // Move to Documents step (or Legal if documents disabled)
    if (config.features.documents.enabled) {
      setCurrentSection(4);
    } else {
      setCurrentSection(5);
    }
  };

  // Handler for Documents step - moves to Legal step
  const handleDocumentsContinue = () => {
    const uploadedDocs = [addressProofDocument, businessProofDocument, logoDocument].filter(Boolean);
    if (uploadedDocs.length > 0) {
      const docTypes = [
        addressProofDocument ? 'address_proof' : null,
        businessProofDocument ? 'business_proof' : null,
        logoDocument ? 'logo' : null,
      ].filter(Boolean) as string[];
      opAnalytics.documentsUploaded({ documentCount: uploadedDocs.length, documentTypes: docTypes });
    }
    markStepCompleted(4);
    setCurrentSection(5);
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
      // CRITICAL: Retrieve verification token from localStorage so backend uses the same token
      // that was shown to user during DNS setup. This prevents token mismatch issues.
      let verificationToken: string | undefined;
      if (data.useCustomDomain && data.customDomain) {
        try {
          const normalizedDomain = data.customDomain.toLowerCase().trim();
          const storageKey = `domain_verification_${normalizedDomain}`;
          verificationToken = localStorage.getItem(storageKey) || undefined;
        } catch (e) {
          // localStorage not available, token will be generated by backend
        }
      }

      const storeSetupPayload = {
        subdomain: data.subdomain,
        storefront_slug: data.storefrontSlug,
        currency: data.currency,
        timezone: data.timezone,
        language: data.language,
        business_model: data.businessModel,
        logo_url: data.logo,
        // Custom domain fields
        use_custom_domain: data.useCustomDomain || false,
        custom_domain: data.useCustomDomain ? data.customDomain : undefined,
        custom_admin_subdomain: data.useCustomDomain ? (data.customAdminSubdomain || 'admin') : undefined,
        custom_storefront_subdomain: data.useCustomDomain ? (data.customStorefrontSubdomain || DEFAULT_STOREFRONT_SUBDOMAIN) : undefined,
        // Pass verification token so backend uses same token shown to user during DNS setup
        verification_token: verificationToken,
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
      opAnalytics.storeSetupCompleted({ subdomain: data.subdomain, currency: data.currency, timezone: data.timezone, businessModel: data.businessModel });
      setStoreSetup(mapStoreSetupToStore({
        business_model: data.businessModel,
        subdomain: data.subdomain,
        storefront_slug: data.storefrontSlug,
        currency: data.currency,
        timezone: data.timezone,
        language: data.language,
        logo: data.logo,
      }) as any);
      nextStep();

      // Pre-flight: verify contact info exists in backend before navigating to verify
      try {
        const session = await onboardingApi.getOnboardingSession(sessionId);
        const sessionAny = session as any;
        const hasContact = (Array.isArray(sessionAny.contact_information) && sessionAny.contact_information.length > 0)
          || (session.contact_details && Object.keys(session.contact_details).length > 0);

        if (!hasContact) {
          // Try backfill from form data
          const contactData = contactForm.getValues();
          if (contactData.email && contactData.firstName) {
            const selectedCountry = countries.find(c => c.id === contactData.phoneCountryCode);
            const callingCode = selectedCountry?.calling_code || contactData.phoneCountryCode;
            await onboardingApi.updateContactDetails(sessionId, {
              first_name: contactData.firstName,
              last_name: contactData.lastName,
              email: contactData.email,
              phone: contactData.phoneNumber,
              phone_country_code: callingCode,
              job_title: contactData.jobTitle || undefined,
            });
            devLog('[Onboarding] Pre-flight: backfilled missing contact info from form data');
          } else {
            // No data to backfill — send user back to contact step
            setCurrentSection(1);
            setValidationErrors({ storeSetup: 'Please complete your contact details before proceeding.' });
            return; // Don't navigate to verify
          }
        }
      } catch (err) {
        devWarn('[Onboarding] Pre-flight contact check failed:', err);
        // Continue anyway — CompleteAccountSetup will catch it
      }

      // Send to email verification after launch
      const verifyParams = new URLSearchParams();
      if (sessionId) verifyParams.set('session', sessionId);
      // Use resilient email: form → store → fetched from session API → session API direct
      let emailForVerify = contactForm.getValues('email') || contactDetails.email || fetchedEmail;
      // Safety: if email is still missing, try fetching directly from session API
      if (!emailForVerify && sessionId) {
        try {
          const sessionData = await onboardingApi.getOnboardingSession(sessionId);
          const sessionAny = sessionData as any;
          emailForVerify = sessionData.contact_details?.email
            || sessionData.contact_info?.email
            || sessionData.contact_information?.[0]?.email
            || sessionAny.contact_information?.[0]?.email
            || sessionAny.draft_form_data?.contactDetails?.email;
        } catch { /* ignore - verify page has its own fallback */ }
      }
      if (emailForVerify) verifyParams.set('email', emailForVerify as string);
      markStepCompleted(6);
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

  // Derive email — resilient: form → store → session API fallback
  const wizardEmail = contactForm.getValues('email') || contactDetails.email || fetchedEmail;

  // Fetch email from session API when store/form data is stale (e.g. page idle for minutes)
  useEffect(() => {
    // Only fetch if we don't already have email from form or store
    if (contactForm.getValues('email') || contactDetails.email || fetchedEmail) return;
    if (!sessionId) return;

    const fetchEmailFromSession = async () => {
      try {
        const session = await onboardingApi.getOnboardingSession(sessionId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sessionAny = session as any;
        const sessionEmail = session.contact_details?.email
          || session.contact_info?.email
          || session.contact_information?.[0]?.email
          || sessionAny.draft_form_data?.contactDetails?.email;
        if (sessionEmail) {
          devLog('[Onboarding] Email recovered from session API:', sessionEmail);
          setFetchedEmail(sessionEmail);
        }
      } catch (error) {
        devError('[Onboarding] Failed to fetch email from session API:', error);
      }
    };

    fetchEmailFromSession();
  }, [sessionId, contactDetails.email, fetchedEmail]);

  const progress = ((currentSection + 1) / steps.length) * 100;

  // Styles imported from components/steps/constants

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img
              src="/icon-192.png"
              alt="mark8ly icon"
              className="h-9 w-auto object-contain"
              style={{ marginRight: '0px' }}
            />
            <span className="text-[1.375rem] font-serif font-medium tracking-[-0.015em] text-foreground-secondary">mark8ly</span>
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
            {(sessionId || currentSection > 0) && (
              <button
                onClick={() => setShowStartOverConfirm(true)}
                className="text-sm text-destructive/70 hover:text-destructive transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Start Over</span>
              </button>
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

      {/* Start Over Confirmation Dialog */}
      {showStartOverConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-2xl border border-border shadow-xl max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="text-lg font-serif font-medium text-foreground">Start Over?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              This will permanently delete all your saved progress, including business details, store setup, and uploaded documents. You'll need to start the onboarding process from the beginning.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStartOverConfirm(false)}
                className="flex-1 h-11 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowStartOverConfirm(false);
                  await handleStartFresh();
                }}
                className="flex-1 h-11 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Session Expired Banner */}
      {sessionExpired && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-warm-100 border-b border-warm-200 py-4 px-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warm-600" />
              <p className="text-sm text-foreground">Your previous session has expired. Please start a new application.</p>
            </div>
            <button
              onClick={() => setSessionExpired(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`pt-32 pb-20 px-6 ${draftRecoveryState.hasDraft || sessionExpired ? 'pt-44' : ''}`}>
        <div className="max-w-3xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-start justify-center gap-4 sm:gap-6 mb-8">
              {steps.map((step, index) => {
                const isCompleted = index < currentSection;
                const isActive = index === currentSection;
                const Icon = step.icon;
                return (
                  <div key={step.id} className="flex items-start">
                    <button
                      type="button"
                      disabled={!isCompleted}
                      onClick={() => isCompleted && setCurrentSection(index)}
                      aria-label={isCompleted ? `Go back to ${step.label}` : step.label}
                      className={`flex flex-col items-center ${isCompleted ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-sage-500 hover:bg-sage-600'
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
                    </button>
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

              {/* Step 0: Business Information */}
              {currentSection === 0 && (
                <BusinessInfoStep
                  form={businessForm}
                  onSubmit={handleBusinessSubmit}
                  isLoading={isLoading}
                  setCurrentSection={setCurrentSection}
                />
              )}

              {/* Step 1: Contact Details */}
              {currentSection === 1 && (
                <ContactDetailsStep
                  form={contactForm}
                  onSubmit={handleContactSubmit}
                  isLoading={isLoading}
                  setCurrentSection={setCurrentSection}
                  countries={countries}
                />
              )}

              {/* Step 2: Business Address (Location) */}
              {currentSection === 2 && (
                <LocationStep
                  form={addressForm}
                  onSubmit={handleAddressSubmit}
                  isLoading={isLoading}
                  setCurrentSection={setCurrentSection}
                  countries={countries}
                  states={states}
                  isLoadingStates={isLoadingStates}
                  loadStates={loadStates}
                  onAddressSelect={handleAddressSelect}
                />
              )}

              {/* Step 3: Store Setup */}
              {currentSection === 3 && (
                <StoreSetupStep
                  form={storeSetupForm}
                  onContinue={handleStoreSetupContinue}
                  isLoading={isLoading}
                  setCurrentSection={setCurrentSection}
                  currencies={currencies}
                  timezones={timezones}
                  baseDomain={baseDomain}
                  businessInfo={businessInfo}
                  slugValidation={slugValidation}
                  storefrontValidation={storefrontValidation}
                  customDomainValidation={customDomainValidation}
                  domainVerification={domainVerification}
                  showCustomDomainSection={showCustomDomainSection}
                  setShowCustomDomainSection={setShowCustomDomainSection}
                  subdomainManuallyEdited={subdomainManuallyEdited}
                  setSubdomainManuallyEdited={setSubdomainManuallyEdited}
                  storefrontSlugManuallyEdited={storefrontSlugManuallyEdited}
                  setStorefrontSlugManuallyEdited={setStorefrontSlugManuallyEdited}
                  showSensitiveDNS={showSensitiveDNS}
                  setShowSensitiveDNS={setShowSensitiveDNS}
                  validateCustomDomain={validateCustomDomain}
                  verifyDomainDNS={verifyDomainDNS}
                  setCustomDomainValidation={setCustomDomainValidation}
                  copiedItem={copiedItem}
                  copyToClipboard={copyToClipboard}
                />
              )}

              {/* Step 4: Documents */}
              {currentSection === 4 && (
                <DocumentsStep
                  isLoading={isLoading}
                  setCurrentSection={setCurrentSection}
                  sessionId={sessionId}
                  addressForm={addressForm}
                  storeSetupForm={storeSetupForm}
                  businessInfo={businessInfo}
                  businessAddress={businessAddress}
                  addressProofType={addressProofType}
                  setAddressProofType={setAddressProofType}
                  addressProofDocument={addressProofDocument}
                  setAddressProofDocument={setAddressProofDocument}
                  businessProofType={businessProofType}
                  setBusinessProofType={setBusinessProofType}
                  businessProofDocument={businessProofDocument}
                  setBusinessProofDocument={setBusinessProofDocument}
                  logoDocument={logoDocument}
                  setLogoDocument={setLogoDocument}
                  onContinue={handleDocumentsContinue}
                />
              )}

              {/* Step 5: Legal & Compliance */}
              {currentSection === 5 && (
                <LegalStep
                  isLoading={isLoading}
                  setCurrentSection={setCurrentSection}
                  legalAccepted={legalAccepted}
                  setLegalAccepted={setLegalAccepted}
                  hasScrolledToBottom={hasScrolledToBottom}
                  setHasScrolledToBottom={setHasScrolledToBottom}
                  legalScrollRef={legalScrollRef}
                  markStepCompleted={markStepCompleted}
                  onLegalAccepted={() => opAnalytics.legalAccepted()}
                />
              )}

              {/* Step 6: Review & Launch */}
              {currentSection === 6 && (
                <ReviewLaunchStep
                  storeSetupForm={storeSetupForm}
                  onSubmit={handleStoreSetupSubmit}
                  isLoading={isLoading}
                  setCurrentSection={setCurrentSection}
                  baseDomain={baseDomain}
                  countries={countries}
                  states={states}
                  businessInfo={businessInfo}
                  contactDetails={contactDetails}
                  businessAddress={businessAddress}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
