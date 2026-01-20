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

  // Documents state (persisted)
  documents: DocumentsState;

  // Progress tracking
  completedSteps: number[];
  totalSteps: number;

  // Tenant creation result (populated after successful account setup)
  tenantResult: AccountSetupResponse | null;

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

  // Documents setters
  setDocuments: (documents: Partial<DocumentsState>) => void;
  setAddressProofDocument: (doc: PersistedDocument | null) => void;
  setBusinessProofDocument: (doc: PersistedDocument | null) => void;
  setLogoDocument: (doc: PersistedDocument | null) => void;
  setAddressProofType: (type: string) => void;
  setBusinessProofType: (type: string) => void;

  // Tenant result setter
  setTenantResult: (result: AccountSetupResponse) => void;

  markStepCompleted: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;

  resetOnboarding: () => void;

  // Hydration
  setHasHydrated: (state: boolean) => void;
  // SECURITY: Re-fetch sensitive PII data from server (not stored in browser)
  rehydrateSensitiveData: () => Promise<void>;

  // Computed values
  getProgress: () => number;
  isStepCompleted: (step: number) => boolean;
  canProceedToStep: (step: number) => boolean;
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
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Hydration setter
      setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),

      // SECURITY: Re-fetch sensitive PII data from server after rehydration
      // This ensures sensitive data is not stored in browser storage
      rehydrateSensitiveData: async () => {
        const state = get();
        if (!state.sessionId) return;

        try {
          // Dynamic import to avoid circular dependencies
          const { onboardingApi } = await import('../api/onboarding');
          const session = await onboardingApi.getOnboardingSession(state.sessionId);

          // Restore sensitive data from server
          set({
            businessInfo: session.business_info || {},
            contactDetails: session.contact_details || session.contact_info || {},
            businessAddress: session.business_address || session.address || {},
            storeSetup: session.store_setup as Partial<StoreSetupRequest> || {},
            emailVerified: session.email_verified || false,
            phoneVerified: session.phone_verified || false,
          });
        } catch (error) {
          console.error('Failed to rehydrate sensitive data from server:', error);
          // If session is invalid, reset the store
          if ((error as Error).message?.includes('404') || (error as Error).message?.includes('not found')) {
            set(initialState);
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
      // SECURITY: Use sessionStorage instead of localStorage for better security
      // sessionStorage is cleared when the tab/browser is closed
      storage: createJSONStorage(() => sessionStorage),
      // SECURITY: Only persist non-sensitive navigation data
      // Sensitive PII data (businessInfo, contactDetails, businessAddress) is NOT persisted
      // and will be re-fetched from the server on page refresh
      partialize: (state) => ({
        // Non-sensitive navigation state only
        sessionId: state.sessionId,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        // Location preferences (not PII - just timezone/currency preferences)
        detectedCountry: state.detectedCountry,
        detectedCurrency: state.detectedCurrency,
        // Verification status (boolean flags, not PII)
        emailVerified: state.emailVerified,
        phoneVerified: state.phoneVerified,
        // EXCLUDED: businessInfo, contactDetails, businessAddress, storeSetup
        // EXCLUDED: detectedLocation (contains IP address), documents, tenantResult
      }),
      // Called when hydration is complete - sets _hasHydrated and re-fetches PII
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Re-fetch sensitive PII data from server after storage rehydration
        state?.rehydrateSensitiveData();
      },
    }
  )
);
