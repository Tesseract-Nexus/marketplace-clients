import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  SessionResponse,
  BusinessInfoRequest,
  ContactDetailsRequest,
  BusinessAddressRequest,
} from '../types/api-contracts';
import type { AccountSetupResponse, TenantCreationResult } from '../types/tenant';

// Serializable document info (without File object which can't be persisted)
export interface PersistedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  remotePath?: string;
  remoteUrl?: string;
  status: 'uploading' | 'success' | 'error';
  uploadedAt: string;
}

// Documents state for persistence
export interface DocumentsState {
  addressProofType: string;
  addressProofDocument: PersistedDocument | null;
  businessProofType: string;
  businessProofDocument: PersistedDocument | null;
  logoDocument: PersistedDocument | null;
}

export interface StoreSetupRequest {
  business_model: 'ONLINE_STORE' | 'MARKETPLACE';
  subdomain: string;
  storefront_slug: string;
  currency: string;
  timezone: string;
  language: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
}

// Complete detected location data from IP/browser geolocation
export interface DetectedLocation {
  ip?: string;
  country: string;
  country_name: string;
  calling_code: string;
  flag_emoji: string;
  state?: string;
  state_name?: string;
  city?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  currency: string;
  locale?: string;
  // Source of the location data
  source: 'ip' | 'browser' | 'manual';
  // Whether user has confirmed/modified the detected location
  confirmed: boolean;
}

export interface OnboardingState {
  // Hydration tracking - true when store has been restored from localStorage
  _hasHydrated: boolean;

  // Session data
  sessionId: string | null;
  currentStep: number;
  isLoading: boolean;
  error: string | null;

  // Form data
  businessInfo: Partial<BusinessInfoRequest>;
  contactDetails: Partial<ContactDetailsRequest>;
  businessAddress: Partial<BusinessAddressRequest>;
  storeSetup: Partial<StoreSetupRequest>;

  // Location data - complete detected location
  detectedLocation: DetectedLocation | null;
  // Legacy fields for backward compatibility
  detectedCountry: string;
  detectedCurrency: string;

  // Verification status
  emailVerified: boolean;
  phoneVerified: boolean;

  // TOTP setup data (captured during onboarding, persisted during account-setup)
  totpSecretEncrypted: string | null;
  backupCodeHashes: string[] | null;

  // Documents state (persisted)
  documents: DocumentsState;

  // Progress tracking
  completedSteps: number[];
  totalSteps: number;

  // Tenant creation result (populated after successful account setup)
  tenantResult: AccountSetupResponse | null;

  // Session expiry flag (set when rehydration fails with 404)
  sessionExpired: boolean;

  // Actions
  setSessionId: (sessionId: string) => void;
  setCurrentStep: (step: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  setBusinessInfo: (info: Partial<BusinessInfoRequest>) => void;
  setContactDetails: (details: Partial<ContactDetailsRequest>) => void;
  setBusinessAddress: (address: Partial<BusinessAddressRequest>) => void;
  setStoreSetup: (setup: Partial<StoreSetupRequest>) => void;

  // New: Set complete detected location
  setDetectedLocation: (location: DetectedLocation) => void;
  // Legacy setters (update detectedLocation internally)
  setDetectedCountry: (country: string) => void;
  setDetectedCurrency: (currency: string) => void;

  setEmailVerified: (verified: boolean) => void;
  setPhoneVerified: (verified: boolean) => void;
  setTotpData: (encrypted: string, hashes: string[]) => void;

  // Documents setters
  setDocuments: (documents: Partial<DocumentsState>) => void;
  setAddressProofDocument: (doc: PersistedDocument | null) => void;
  setBusinessProofDocument: (doc: PersistedDocument | null) => void;
  setLogoDocument: (doc: PersistedDocument | null) => void;
  setAddressProofType: (type: string) => void;
  setBusinessProofType: (type: string) => void;

  // Tenant result setter
  setTenantResult: (result: AccountSetupResponse) => void;

  // Session expiry
  setSessionExpired: (expired: boolean) => void;

  markStepCompleted: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;

  resetOnboarding: () => void;

  // Hydration
  setHasHydrated: (state: boolean) => void;
  // Re-fetch data from server and merge with local fallback
  rehydrateSensitiveData: () => Promise<void>;

  // Computed values
  getProgress: () => number;
  isStepCompleted: (step: number) => boolean;
  canProceedToStep: (step: number) => boolean;
}

const STORE_TTL_MS = 168 * 60 * 60 * 1000; // 168 hours = 7 days

function createTTLStorage() {
  return {
    getItem(name: string): string | null {
      const raw = localStorage.getItem(name);
      if (!raw) return null;
      try {
        const wrapped = JSON.parse(raw);
        if (wrapped._expiresAt && Date.now() > wrapped._expiresAt) {
          localStorage.removeItem(name);
          return null;
        }
        return JSON.stringify(wrapped._data ?? wrapped);
      } catch {
        return raw;
      }
    },
    setItem(name: string, value: string): void {
      try {
        const data = JSON.parse(value);
        localStorage.setItem(name, JSON.stringify({
          _data: data,
          _expiresAt: Date.now() + STORE_TTL_MS,
        }));
      } catch {
        localStorage.setItem(name, value);
      }
    },
    removeItem(name: string): void {
      localStorage.removeItem(name);
    },
  };
}

const initialState = {
  _hasHydrated: false,
  sessionId: null,
  currentStep: 0,
  isLoading: false,
  error: null,

  businessInfo: {},
  contactDetails: {},
  businessAddress: {},
  storeSetup: {},

  detectedLocation: null,
  detectedCountry: '',
  detectedCurrency: '',

  emailVerified: false,
  phoneVerified: false,
  totpSecretEncrypted: null,
  backupCodeHashes: null,

  documents: {
    addressProofType: '',
    addressProofDocument: null,
    businessProofType: '',
    businessProofDocument: null,
    logoDocument: null,
  },

  completedSteps: [],
  totalSteps: 4, // Business Info, Contact Details, Address, Store Setup (Verification removed from steps)

  tenantResult: null, // Populated after successful account setup
  sessionExpired: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Hydration setter
      setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),

      // Re-fetch data from server after rehydration, merging with local fallback
      rehydrateSensitiveData: async () => {
        const state = get();
        if (!state.sessionId) return;

        try {
          // Dynamic import to avoid circular dependencies
          const { onboardingApi } = await import('../api/onboarding');
          const session = await onboardingApi.getOnboardingSession(state.sessionId);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sessionAny = session as any;

          // Restore data from server, falling back to local data if backend is empty
          // Handle field name differences: API returns business_information,
          // contact_information (array), business_addresses (array)
          // while store uses business_info, contact_details, business_address
          const serverBusinessInfo = session.business_info
            || sessionAny.business_information
            || {};
          const serverContactDetails = session.contact_details
            || session.contact_info
            || session.contact_information?.[0]
            || {};
          const serverBusinessAddress = session.business_address
            || session.address
            || sessionAny.business_addresses?.[0]
            || {};
          const serverStoreSetup = session.store_setup || sessionAny.store_setup;

          set({
            businessInfo: Object.keys(serverBusinessInfo).length > 0
              ? serverBusinessInfo
              : state.businessInfo,
            contactDetails: Object.keys(serverContactDetails).length > 0
              ? serverContactDetails
              : state.contactDetails,
            businessAddress: Object.keys(serverBusinessAddress).length > 0
              ? serverBusinessAddress
              : state.businessAddress,
            storeSetup: (serverStoreSetup && Object.keys(serverStoreSetup).length > 0
              ? serverStoreSetup
              : state.storeSetup) as Partial<StoreSetupRequest>,
            emailVerified: session.email_verified || sessionAny.email_verified || false,
            phoneVerified: session.phone_verified || sessionAny.phone_verified || false,
          });
        } catch (error) {
          console.error('Failed to rehydrate sensitive data from server:', error);
          // If session is invalid/expired, clear session but preserve local form data
          // This allows the user to see previously entered data and start a new session
          if ((error as Error).message?.includes('404') || (error as Error).message?.includes('not found')) {
            set({
              sessionId: null,
              sessionExpired: true,
            });
          }
        }
      },

      // Basic state setters
      setSessionId: (sessionId) => set({ sessionId }),
      setCurrentStep: (currentStep) => set({ currentStep }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Form data setters
      setBusinessInfo: (info) =>
        set((state) => ({
          businessInfo: { ...state.businessInfo, ...info }
        })),

      setContactDetails: (details) =>
        set((state) => ({
          contactDetails: { ...state.contactDetails, ...details }
        })),

      setBusinessAddress: (address) =>
        set((state) => ({
          businessAddress: { ...state.businessAddress, ...address }
        })),

      setStoreSetup: (setup) =>
        set((state) => ({
          storeSetup: { ...state.storeSetup, ...setup }
        })),

      // Location setters
      setDetectedLocation: (location) => set({
        detectedLocation: location,
        detectedCountry: location.country,
        detectedCurrency: location.currency,
      }),
      setDetectedCountry: (detectedCountry) => set((state) => ({
        detectedCountry,
        detectedLocation: state.detectedLocation
          ? { ...state.detectedLocation, country: detectedCountry }
          : null,
      })),
      setDetectedCurrency: (detectedCurrency) => set((state) => ({
        detectedCurrency,
        detectedLocation: state.detectedLocation
          ? { ...state.detectedLocation, currency: detectedCurrency }
          : null,
      })),

      // Verification setters
      setEmailVerified: (emailVerified) => set({ emailVerified }),
      setPhoneVerified: (phoneVerified) => set({ phoneVerified }),
      setTotpData: (totpSecretEncrypted, backupCodeHashes) => set({ totpSecretEncrypted, backupCodeHashes }),

      // Documents setters
      setDocuments: (documents) =>
        set((state) => ({
          documents: { ...state.documents, ...documents }
        })),
      setAddressProofDocument: (doc) =>
        set((state) => ({
          documents: { ...state.documents, addressProofDocument: doc }
        })),
      setBusinessProofDocument: (doc) =>
        set((state) => ({
          documents: { ...state.documents, businessProofDocument: doc }
        })),
      setLogoDocument: (doc) =>
        set((state) => ({
          documents: { ...state.documents, logoDocument: doc }
        })),
      setAddressProofType: (type) =>
        set((state) => ({
          documents: { ...state.documents, addressProofType: type }
        })),
      setBusinessProofType: (type) =>
        set((state) => ({
          documents: { ...state.documents, businessProofType: type }
        })),

      // Tenant result setter
      setTenantResult: (tenantResult) => set({ tenantResult }),

      // Session expiry
      setSessionExpired: (sessionExpired) => set({ sessionExpired }),

      // Step management
      markStepCompleted: (step) =>
        set((state) => ({
          completedSteps: [...new Set([...state.completedSteps, step])]
        })),

      nextStep: () =>
        set((state) => {
          const nextStep = Math.min(state.currentStep + 1, state.totalSteps - 1);
          return { currentStep: nextStep };
        }),

      previousStep: () =>
        set((state) => {
          const prevStep = Math.max(state.currentStep - 1, 0);
          return { currentStep: prevStep };
        }),

      // Reset
      resetOnboarding: () => set(initialState),

      // Computed values
      getProgress: () => {
        const state = get();
        return Math.round((state.completedSteps.length / state.totalSteps) * 100);
      },

      isStepCompleted: (step) => {
        const state = get();
        return state.completedSteps.includes(step);
      },

      canProceedToStep: (step) => {
        const state = get();
        // Can proceed if previous steps are completed or if it's the first step
        if (step === 0) return true;
        return state.completedSteps.includes(step - 1);
      },
    }),
    {
      name: 'tenant-onboarding-store',
      // Use localStorage with 7-day TTL for persistence across tab close/browser restart
      // Data auto-expires after 168 hours to match backend draft TTL
      storage: createJSONStorage(() => createTTLStorage()),
      // Persist all form data to localStorage (with 7-day TTL) for resilience
      // Backend is still the source of truth; local copy is a fallback
      partialize: (state) => ({
        // Session & navigation
        sessionId: state.sessionId,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        // Location preferences
        detectedCountry: state.detectedCountry,
        detectedCurrency: state.detectedCurrency,
        // Verification flags
        emailVerified: state.emailVerified,
        phoneVerified: state.phoneVerified,
        // TOTP data (already AES-256-GCM encrypted)
        totpSecretEncrypted: state.totpSecretEncrypted,
        backupCodeHashes: state.backupCodeHashes,
        // Store setup config
        storeSetup: state.storeSetup,
        // Form data — persisted locally for resilience
        businessInfo: state.businessInfo,
        contactDetails: state.contactDetails,
        businessAddress: state.businessAddress,
        documents: state.documents,
      }),
      // Called when hydration is complete - sets _hasHydrated and syncs with server
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Sync with server data after localStorage rehydration
        state?.rehydrateSensitiveData();
      },
    }
  )
);
