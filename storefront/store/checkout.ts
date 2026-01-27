import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSessionAwareStorage, extendSessionTTL } from '@/lib/session-storage';
import { CustomerAddress } from '@/lib/api/customers';
import { ShippingMethod, ShippingRate } from '@/lib/api/shipping';
import { ShippingAddress } from '@/hooks/useTaxCalculation';

export type CheckoutStep = 'contact' | 'shipping' | 'payment' | 'review';

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface PersistedCheckoutState {
  // Step tracking
  currentStep: CheckoutStep;
  completedSteps: CheckoutStep[];

  // Contact info
  contactInfo: ContactInfo;

  // Guest mode
  isGuestMode: boolean;

  // Shipping
  addressMode: 'saved' | 'manual';
  selectedSavedAddressId: string | null; // Store ID instead of full object
  shippingAddress: ShippingAddress;
  selectedShippingMethodId: string | null; // Store ID for reconstruction
  selectedShippingMethodData: ShippingMethod | ShippingRate | null;
  shippingCost: number;

  // Payment
  billingAddressSameAsShipping: boolean;
  billingAddress: ShippingAddress | null;
  selectedPaymentMethodCode: string | null;

  // Loyalty points
  loyaltyPointsApplied: number;
  loyaltyDiscount: number;

  // Terms
  termsAccepted: boolean;

  // Session metadata
  sessionStartedAt: string | null;
  lastUpdatedAt: string | null;
}

interface CheckoutStore extends PersistedCheckoutState {
  // Actions
  setCurrentStep: (step: CheckoutStep) => void;
  markStepCompleted: (step: CheckoutStep) => void;
  setContactInfo: (info: Partial<ContactInfo>) => void;
  setGuestMode: (isGuest: boolean) => void;
  setAddressMode: (mode: 'saved' | 'manual') => void;
  setSelectedSavedAddressId: (addressId: string | null) => void;
  setShippingAddress: (address: Partial<ShippingAddress>) => void;
  setShippingMethod: (method: ShippingMethod | ShippingRate | null, cost: number) => void;
  setBillingAddressSameAsShipping: (same: boolean) => void;
  setBillingAddress: (address: ShippingAddress | null) => void;
  setSelectedPaymentMethodCode: (code: string | null) => void;
  setLoyaltyPoints: (points: number, discount: number) => void;
  setTermsAccepted: (accepted: boolean) => void;
  resetCheckout: () => void;
  extendSession: () => void;

  // Hydration helpers
  isHydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
}

const DEFAULT_CONTACT_INFO: ContactInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

const DEFAULT_SHIPPING_ADDRESS: ShippingAddress = {
  city: '',
  state: '',
  zip: '',
  country: 'US',
  countryCode: 'US',
  addressLine1: '',
};

const INITIAL_STATE: PersistedCheckoutState = {
  currentStep: 'contact',
  completedSteps: [],
  contactInfo: DEFAULT_CONTACT_INFO,
  isGuestMode: false,
  addressMode: 'manual',
  selectedSavedAddressId: null,
  shippingAddress: DEFAULT_SHIPPING_ADDRESS,
  selectedShippingMethodId: null,
  selectedShippingMethodData: null,
  shippingCost: 0,
  billingAddressSameAsShipping: true,
  billingAddress: null,
  selectedPaymentMethodCode: null,
  loyaltyPointsApplied: 0,
  loyaltyDiscount: 0,
  termsAccepted: false,
  sessionStartedAt: null,
  lastUpdatedAt: null,
};

export const useCheckoutStore = create<CheckoutStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      isHydrated: false,

      setCurrentStep: (step) => {
        set({
          currentStep: step,
          lastUpdatedAt: new Date().toISOString(),
        });
        get().extendSession();
      },

      markStepCompleted: (step) => {
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
          lastUpdatedAt: new Date().toISOString(),
        }));
      },

      setContactInfo: (info) => {
        set((state) => ({
          contactInfo: { ...state.contactInfo, ...info },
          lastUpdatedAt: new Date().toISOString(),
          sessionStartedAt: state.sessionStartedAt || new Date().toISOString(),
        }));
        get().extendSession();
      },

      setGuestMode: (isGuest) => {
        set({
          isGuestMode: isGuest,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      setAddressMode: (mode) => {
        set({
          addressMode: mode,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      setSelectedSavedAddressId: (addressId) => {
        set({
          selectedSavedAddressId: addressId,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      setShippingAddress: (address) => {
        set((state) => ({
          shippingAddress: { ...state.shippingAddress, ...address },
          lastUpdatedAt: new Date().toISOString(),
        }));
        get().extendSession();
      },

      setShippingMethod: (method, cost) => {
        set({
          selectedShippingMethodData: method,
          selectedShippingMethodId: method?.id ?? null,
          shippingCost: cost,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      setBillingAddressSameAsShipping: (same) => {
        set({
          billingAddressSameAsShipping: same,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      setBillingAddress: (address) => {
        set({
          billingAddress: address,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      setSelectedPaymentMethodCode: (code) => {
        set({
          selectedPaymentMethodCode: code,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      setLoyaltyPoints: (points, discount) => {
        set({
          loyaltyPointsApplied: points,
          loyaltyDiscount: discount,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      setTermsAccepted: (accepted) => {
        set({
          termsAccepted: accepted,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      resetCheckout: () => {
        set({
          ...INITIAL_STATE,
          sessionStartedAt: null,
          lastUpdatedAt: null,
        });
      },

      extendSession: () => {
        // Extend the TTL when user is actively using checkout
        extendSessionTTL('storefront-checkout');
      },

      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated });
      },
    }),
    {
      name: 'storefront-checkout',
      storage: createJSONStorage(() => createSessionAwareStorage('storefront-checkout')),
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        contactInfo: state.contactInfo,
        isGuestMode: state.isGuestMode,
        addressMode: state.addressMode,
        selectedSavedAddressId: state.selectedSavedAddressId,
        shippingAddress: state.shippingAddress,
        selectedShippingMethodId: state.selectedShippingMethodId,
        selectedShippingMethodData: state.selectedShippingMethodData,
        shippingCost: state.shippingCost,
        billingAddressSameAsShipping: state.billingAddressSameAsShipping,
        billingAddress: state.billingAddress,
        selectedPaymentMethodCode: state.selectedPaymentMethodCode,
        loyaltyPointsApplied: state.loyaltyPointsApplied,
        loyaltyDiscount: state.loyaltyDiscount,
        termsAccepted: state.termsAccepted,
        sessionStartedAt: state.sessionStartedAt,
        lastUpdatedAt: state.lastUpdatedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
          console.log('[CheckoutStore] Rehydrated from storage');
        }
      },
    }
  )
);

// Hook to wait for hydration
export function useCheckoutHydration() {
  return useCheckoutStore((state) => state.isHydrated);
}
