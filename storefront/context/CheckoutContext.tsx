'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { CustomerAddress } from '@/lib/api/customers';
import { ShippingMethod, ShippingRate } from '@/lib/api/shipping';
import { ShippingAddress } from '@/hooks/useTaxCalculation';
import { useCheckoutStore, useCheckoutHydration } from '@/store/checkout';

export type CheckoutStep = 'contact' | 'shipping' | 'payment' | 'review';

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface CheckoutState {
  // Step tracking
  currentStep: CheckoutStep;
  completedSteps: CheckoutStep[];

  // Contact info
  contactInfo: ContactInfo;

  // Guest mode
  isGuestMode: boolean;

  // Shipping
  addressMode: 'saved' | 'manual';
  selectedSavedAddress: CustomerAddress | null;
  shippingAddress: ShippingAddress;
  selectedShippingMethod: ShippingMethod | ShippingRate | null;
  shippingCost: number;

  // Payment
  billingAddressSameAsShipping: boolean;
  billingAddress: ShippingAddress | null;

  // Loyalty points
  loyaltyPointsApplied: number;
  loyaltyDiscount: number;

  // Terms
  termsAccepted: boolean;

  // Processing state
  isProcessing: boolean;
  error: string | null;

  // Pending order (for retry)
  pendingOrder: { id: string; orderNumber: string; total: number } | null;
}

interface CheckoutContextValue extends CheckoutState {
  // Hydration status
  isHydrated: boolean;

  // Step navigation
  goToStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  markStepCompleted: (step: CheckoutStep) => void;
  canNavigateToStep: (step: CheckoutStep) => boolean;

  // Contact info
  setContactInfo: (info: Partial<ContactInfo>) => void;

  // Guest mode
  setGuestMode: (isGuest: boolean) => void;

  // Shipping
  setAddressMode: (mode: 'saved' | 'manual') => void;
  setSelectedSavedAddress: (address: CustomerAddress | null) => void;
  setShippingAddress: (address: Partial<ShippingAddress>) => void;
  setShippingMethod: (method: ShippingMethod | ShippingRate | null, cost: number) => void;

  // Payment
  setBillingAddressSameAsShipping: (same: boolean) => void;
  setBillingAddress: (address: ShippingAddress | null) => void;

  // Loyalty
  setLoyaltyPoints: (points: number, discount: number) => void;

  // Terms
  setTermsAccepted: (accepted: boolean) => void;

  // Processing
  setIsProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;

  // Pending order
  setPendingOrder: (order: { id: string; orderNumber: string; total: number } | null) => void;

  // Reset
  resetCheckout: () => void;

  // Computed
  getStepIndex: (step: CheckoutStep) => number;
  getProgressPercent: () => number;
}

const STEPS_ORDER: CheckoutStep[] = ['contact', 'shipping', 'payment', 'review'];

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

const DEFAULT_STATE: CheckoutState = {
  currentStep: 'contact',
  completedSteps: [],
  contactInfo: DEFAULT_CONTACT_INFO,
  isGuestMode: false,
  addressMode: 'manual',
  selectedSavedAddress: null,
  shippingAddress: DEFAULT_SHIPPING_ADDRESS,
  selectedShippingMethod: null,
  shippingCost: 0,
  billingAddressSameAsShipping: true,
  billingAddress: null,
  loyaltyPointsApplied: 0,
  loyaltyDiscount: 0,
  termsAccepted: false,
  isProcessing: false,
  error: null,
  pendingOrder: null,
};

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

interface CheckoutProviderProps {
  children: ReactNode;
  isAuthenticated?: boolean;
  customerEmail?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
}

export function CheckoutProvider({
  children,
  isAuthenticated = false,
  customerEmail,
  customerFirstName,
  customerLastName,
  customerPhone,
}: CheckoutProviderProps) {
  // Get persisted store state
  const checkoutStore = useCheckoutStore();
  const isHydrated = useCheckoutHydration();

  const [state, setState] = useState<CheckoutState>(() => ({
    ...DEFAULT_STATE,
    addressMode: isAuthenticated ? 'saved' : 'manual',
    contactInfo: {
      ...DEFAULT_CONTACT_INFO,
      email: customerEmail || '',
      firstName: customerFirstName || '',
      lastName: customerLastName || '',
      phone: customerPhone || '',
    },
  }));

  // Restore state from persisted store on hydration
  useEffect(() => {
    if (isHydrated && checkoutStore.sessionStartedAt) {
      // Restore persisted checkout state
      console.log('[CheckoutContext] Restoring from persisted store');
      setState((prev) => ({
        ...prev,
        currentStep: checkoutStore.currentStep,
        completedSteps: checkoutStore.completedSteps,
        contactInfo: {
          ...checkoutStore.contactInfo,
          email: checkoutStore.contactInfo.email || customerEmail || '',
          firstName: checkoutStore.contactInfo.firstName || customerFirstName || '',
          lastName: checkoutStore.contactInfo.lastName || customerLastName || '',
          phone: checkoutStore.contactInfo.phone || customerPhone || '',
        },
        isGuestMode: checkoutStore.isGuestMode,
        addressMode: checkoutStore.addressMode,
        shippingAddress: checkoutStore.shippingAddress,
        selectedShippingMethod: checkoutStore.selectedShippingMethodData,
        shippingCost: checkoutStore.shippingCost,
        billingAddressSameAsShipping: checkoutStore.billingAddressSameAsShipping,
        billingAddress: checkoutStore.billingAddress,
        loyaltyPointsApplied: checkoutStore.loyaltyPointsApplied,
        loyaltyDiscount: checkoutStore.loyaltyDiscount,
        termsAccepted: checkoutStore.termsAccepted,
      }));
    }
  }, [isHydrated, checkoutStore.sessionStartedAt, customerEmail, customerFirstName, customerLastName, customerPhone]);

  // Auto-populate contact info when customer profile data arrives (e.g., after profile fetch)
  useEffect(() => {
    if (!isAuthenticated) return;
    setState((prev) => {
      const updated = { ...prev.contactInfo };
      let changed = false;
      if (!prev.contactInfo.firstName && customerFirstName) { updated.firstName = customerFirstName; changed = true; }
      if (!prev.contactInfo.lastName && customerLastName) { updated.lastName = customerLastName; changed = true; }
      if (!prev.contactInfo.phone && customerPhone) { updated.phone = customerPhone; changed = true; }
      if (!prev.contactInfo.email && customerEmail) { updated.email = customerEmail; changed = true; }
      if (!changed) return prev;
      return { ...prev, contactInfo: updated };
    });
  }, [isAuthenticated, customerEmail, customerFirstName, customerLastName, customerPhone]);

  // Sync state changes to the persisted store
  useEffect(() => {
    if (!isHydrated) return;

    // Only sync if we have meaningful data
    if (state.contactInfo.email || state.contactInfo.firstName) {
      checkoutStore.setContactInfo(state.contactInfo);
    }
    checkoutStore.setCurrentStep(state.currentStep);
    state.completedSteps.forEach((step) => checkoutStore.markStepCompleted(step));
    checkoutStore.setGuestMode(state.isGuestMode);
    checkoutStore.setAddressMode(state.addressMode);
    checkoutStore.setShippingAddress(state.shippingAddress);
    checkoutStore.setShippingMethod(state.selectedShippingMethod, state.shippingCost);
    checkoutStore.setBillingAddressSameAsShipping(state.billingAddressSameAsShipping);
    checkoutStore.setBillingAddress(state.billingAddress);
    checkoutStore.setLoyaltyPoints(state.loyaltyPointsApplied, state.loyaltyDiscount);
    checkoutStore.setTermsAccepted(state.termsAccepted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isHydrated,
    state.currentStep,
    state.completedSteps,
    state.contactInfo,
    state.isGuestMode,
    state.addressMode,
    state.shippingAddress,
    state.selectedShippingMethod,
    state.shippingCost,
    state.billingAddressSameAsShipping,
    state.billingAddress,
    state.loyaltyPointsApplied,
    state.loyaltyDiscount,
    state.termsAccepted,
    // checkoutStore is stable from zustand, no need to include
  ]);

  // Step navigation
  const getStepIndex = useCallback((step: CheckoutStep) => {
    return STEPS_ORDER.indexOf(step);
  }, []);

  const canNavigateToStep = useCallback((step: CheckoutStep) => {
    const targetIndex = getStepIndex(step);
    const currentIndex = getStepIndex(state.currentStep);

    // Can always go back
    if (targetIndex < currentIndex) return true;

    // Can go forward only if previous steps are completed
    for (let i = 0; i < targetIndex; i++) {
      const step = STEPS_ORDER[i];
      if (step && !state.completedSteps.includes(step)) {
        return false;
      }
    }
    return true;
  }, [state.currentStep, state.completedSteps, getStepIndex]);

  const goToStep = useCallback((step: CheckoutStep) => {
    if (canNavigateToStep(step)) {
      setState((prev) => ({ ...prev, currentStep: step, error: null }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [canNavigateToStep]);

  const nextStep = useCallback(() => {
    const currentIndex = getStepIndex(state.currentStep);
    if (currentIndex < STEPS_ORDER.length - 1) {
      const nextStepValue = STEPS_ORDER[currentIndex + 1] as CheckoutStep;
      setState((prev) => ({
        ...prev,
        currentStep: nextStepValue,
        completedSteps: prev.completedSteps.includes(prev.currentStep)
          ? prev.completedSteps
          : [...prev.completedSteps, prev.currentStep],
        error: null,
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [state.currentStep, getStepIndex]);

  const prevStep = useCallback(() => {
    const currentIndex = getStepIndex(state.currentStep);
    if (currentIndex > 0) {
      setState((prev) => ({
        ...prev,
        currentStep: STEPS_ORDER[currentIndex - 1] as CheckoutStep,
        error: null,
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [state.currentStep, getStepIndex]);

  const markStepCompleted = useCallback((step: CheckoutStep) => {
    setState((prev) => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(step)
        ? prev.completedSteps
        : [...prev.completedSteps, step],
    }));
  }, []);

  const getProgressPercent = useCallback(() => {
    const currentIndex = getStepIndex(state.currentStep);
    return Math.round(((currentIndex + 1) / STEPS_ORDER.length) * 100);
  }, [state.currentStep, getStepIndex]);

  // Contact info
  const setContactInfo = useCallback((info: Partial<ContactInfo>) => {
    setState((prev) => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, ...info },
    }));
  }, []);

  // Guest mode
  const setGuestMode = useCallback((isGuest: boolean) => {
    setState((prev) => ({ ...prev, isGuestMode: isGuest }));
  }, []);

  // Shipping
  const setAddressMode = useCallback((mode: 'saved' | 'manual') => {
    setState((prev) => ({ ...prev, addressMode: mode }));
  }, []);

  const setSelectedSavedAddress = useCallback((address: CustomerAddress | null) => {
    setState((prev) => ({ ...prev, selectedSavedAddress: address }));
  }, []);

  const setShippingAddress = useCallback((address: Partial<ShippingAddress>) => {
    setState((prev) => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, ...address },
    }));
  }, []);

  const setShippingMethod = useCallback((method: ShippingMethod | ShippingRate | null, cost: number) => {
    setState((prev) => ({
      ...prev,
      selectedShippingMethod: method,
      shippingCost: cost,
    }));
  }, []);

  // Payment
  const setBillingAddressSameAsShipping = useCallback((same: boolean) => {
    setState((prev) => ({ ...prev, billingAddressSameAsShipping: same }));
  }, []);

  const setBillingAddress = useCallback((address: ShippingAddress | null) => {
    setState((prev) => ({ ...prev, billingAddress: address }));
  }, []);

  // Loyalty
  const setLoyaltyPoints = useCallback((points: number, discount: number) => {
    setState((prev) => ({
      ...prev,
      loyaltyPointsApplied: points,
      loyaltyDiscount: discount,
    }));
  }, []);

  // Terms
  const setTermsAccepted = useCallback((accepted: boolean) => {
    setState((prev) => ({ ...prev, termsAccepted: accepted }));
  }, []);

  // Processing
  const setIsProcessing = useCallback((processing: boolean) => {
    setState((prev) => ({ ...prev, isProcessing: processing }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  // Pending order
  const setPendingOrder = useCallback((order: { id: string; orderNumber: string; total: number } | null) => {
    setState((prev) => ({ ...prev, pendingOrder: order }));
  }, []);

  // Reset
  const resetCheckout = useCallback(() => {
    setState({
      ...DEFAULT_STATE,
      addressMode: isAuthenticated ? 'saved' : 'manual',
      contactInfo: {
        ...DEFAULT_CONTACT_INFO,
        email: customerEmail || '',
      },
    });
    // Also reset the persisted store
    checkoutStore.resetCheckout();
  }, [isAuthenticated, customerEmail, checkoutStore]);

  const value = useMemo<CheckoutContextValue>(() => ({
    ...state,
    isHydrated,
    goToStep,
    nextStep,
    prevStep,
    markStepCompleted,
    canNavigateToStep,
    setContactInfo,
    setGuestMode,
    setAddressMode,
    setSelectedSavedAddress,
    setShippingAddress,
    setShippingMethod,
    setBillingAddressSameAsShipping,
    setBillingAddress,
    setLoyaltyPoints,
    setTermsAccepted,
    setIsProcessing,
    setError,
    setPendingOrder,
    resetCheckout,
    getStepIndex,
    getProgressPercent,
  }), [
    state,
    isHydrated,
    goToStep,
    nextStep,
    prevStep,
    markStepCompleted,
    canNavigateToStep,
    setContactInfo,
    setGuestMode,
    setAddressMode,
    setSelectedSavedAddress,
    setShippingAddress,
    setShippingMethod,
    setBillingAddressSameAsShipping,
    setBillingAddress,
    setLoyaltyPoints,
    setTermsAccepted,
    setIsProcessing,
    setError,
    setPendingOrder,
    resetCheckout,
    getStepIndex,
    getProgressPercent,
  ]);

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}

export { STEPS_ORDER };
