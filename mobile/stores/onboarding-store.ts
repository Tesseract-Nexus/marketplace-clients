import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { tenantsApi } from '@/lib/api/tenants';
import { useAuthStore } from './auth-store';

import type { Tenant, Address, TenantTheme } from '@/types/entities';

export interface PaymentMethodDetails {
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
}

export interface OnboardingData {
  // Step 1: Store Setup
  storeName?: string;
  storeSlug?: string;
  storeUrl?: string; // Alias for storeSlug used in UI
  category?: string;

  // Step 2: Plan Selection
  plan?: 'free' | 'starter' | 'growth' | 'professional' | 'enterprise';
  billingCycle?: 'monthly' | 'yearly';

  // Step 3: Business Details
  businessName?: string;
  businessType?: string;
  phone?: string;
  address?: string; // Street address as string for form
  taxId?: string;
  // Convenience fields for form (mapped to address)
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  currency?: string;

  // Step 4: Payment Setup
  paymentProvider?: string;
  paymentMethod?: PaymentMethodDetails;

  // Step 5: Theme
  theme?: Partial<TenantTheme>;
}

interface OnboardingState {
  // State
  data: OnboardingData;
  currentStep: number;
  totalSteps: number;
  isCreating: boolean;
  isSlugAvailable: boolean | null;
  isCheckingSlug: boolean;
  error: string | null;

  // Actions
  setData: (data: Partial<OnboardingData>) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  checkSlugAvailability: (slug: string) => Promise<boolean>;
  createTenant: () => Promise<Tenant>;
  createStore: () => Promise<Tenant>; // Alias for createTenant
  reset: () => void;
  clearError: () => void;
}

const INITIAL_DATA: OnboardingData = {
  plan: 'starter',
  billingCycle: 'monthly',
  paymentProvider: 'stripe',
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      data: INITIAL_DATA,
      currentStep: 1,
      totalSteps: 5,
      isCreating: false,
      isSlugAvailable: null,
      isCheckingSlug: false,
      error: null,

      // Set onboarding data
      setData: (newData: Partial<OnboardingData>) => {
        set((state) => ({
          data: { ...state.data, ...newData },
        }));
      },

      // Set current step
      setStep: (step: number) => {
        const { totalSteps } = get();
        if (step >= 1 && step <= totalSteps) {
          set({ currentStep: step });
        }
      },

      // Go to next step
      nextStep: () => {
        const { currentStep, totalSteps } = get();
        if (currentStep < totalSteps) {
          set({ currentStep: currentStep + 1 });
        }
      },

      // Go to previous step
      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
        }
      },

      // Check slug availability
      checkSlugAvailability: async (slug: string) => {
        if (!slug || slug.length < 3) {
          set({ isSlugAvailable: null });
          return false;
        }

        set({ isCheckingSlug: true });
        try {
          const response = await tenantsApi.checkSlug(slug);
          set({
            isSlugAvailable: response.available,
            isCheckingSlug: false,
          });
          return response.available;
        } catch {
          set({
            isSlugAvailable: false,
            isCheckingSlug: false,
          });
          return false;
        }
      },

      // Create tenant
      createTenant: async () => {
        const { data } = get();
        const authStore = useAuthStore.getState();

        if (!data.storeName || !data.storeSlug) {
          throw new Error('Store name and URL are required');
        }

        set({ isCreating: true, error: null });

        try {
          const tenant = await tenantsApi.create({
            name: data.storeName,
            slug: data.storeSlug,
            subscription_plan: data.plan,
            billing_cycle: data.billingCycle,
            business_name: data.businessName,
            business_type: data.businessType,
            phone: data.phone,
            address:
              data.address || data.city
                ? {
                    first_name: '',
                    last_name: '',
                    address1: data.address || '',
                    city: data.city || '',
                    state: data.state || '',
                    postal_code: data.zipCode || '',
                    country: data.country || '',
                    country_code: data.country || '',
                  }
                : undefined,
            payment_provider: data.paymentProvider,
          });

          // Add tenant to auth store
          authStore.addTenant(tenant);
          await authStore.setCurrentTenant(tenant.id);

          set({ isCreating: false });

          return tenant;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create store';
          set({
            isCreating: false,
            error: message,
          });
          throw new Error(message);
        }
      },

      // Alias for createTenant
      createStore: async () => {
        return get().createTenant();
      },

      // Reset store
      reset: () => {
        set({
          data: INITIAL_DATA,
          currentStep: 1,
          isCreating: false,
          isSlugAvailable: null,
          isCheckingSlug: false,
          error: null,
        });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        data: state.data,
        currentStep: state.currentStep,
      }),
    }
  )
);

// Selector hooks
export const useOnboardingData = () => useOnboardingStore((state) => state.data);
export const useOnboardingStep = () => useOnboardingStore((state) => state.currentStep);
export const useOnboardingProgress = () =>
  useOnboardingStore((state) => ({
    current: state.currentStep,
    total: state.totalSteps,
    percentage: (state.currentStep / state.totalSteps) * 100,
  }));
