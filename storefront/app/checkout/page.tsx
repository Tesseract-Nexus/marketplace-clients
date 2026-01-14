'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, CreditCard, Truck, Check, Lock, Shield, Loader2, MapPin, ExternalLink, Globe, User, Edit2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTenant, useCheckoutConfig, useNavPath, useLocalization, useFormatPrice } from '@/context/TenantContext';
import { usePriceFormatting } from '@/context/CurrencyContext';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { useTaxCalculation, ShippingAddress } from '@/hooks/useTaxCalculation';
import { useLocationDetection } from '@/hooks/useLocationDetection';
import { getProduct } from '@/lib/api/storefront';
import { getProductShippingData, type ProductShippingData } from '@/lib/utils/product-shipping';
import {
  createOrder,
  createPaymentIntent,
  confirmPayment,
  loadRazorpayScript,
  initiateRazorpayPayment,
  loadStripeScript,
  initiateStripePayment,
  type CreateOrderRequest
} from '@/lib/api/checkout';
import { AddressSelector } from '@/components/checkout/AddressSelector';
import { GuestCheckoutBanner } from '@/components/checkout/GuestCheckoutBanner';
import { PostOrderCreateAccount } from '@/components/checkout/PostOrderCreateAccount';
import { CouponInput } from '@/components/checkout/CouponInput';
import { GiftCardInput } from '@/components/checkout/GiftCardInput';
import { ShippingMethodSelector } from '@/components/checkout/ShippingMethodSelector';
import { LocationConfirmationModal } from '@/components/checkout/LocationConfirmationModal';
import { LoyaltyPointsRedemption } from '@/components/checkout/LoyaltyPointsRedemption';
import { CustomerAddress, recordCustomerOrder } from '@/lib/api/customers';
import { AppliedCoupon } from '@/lib/api/coupons';
import { ShippingMethod, ShippingRate } from '@/lib/api/shipping';
import type { DetectedLocation } from '@/hooks/useLocationDetection';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

type CheckoutStep = 'shipping' | 'review';

interface Country {
  id: string;
  name: string;
  flagEmoji: string;
}

interface State {
  id: string;
  name: string;
  code: string;
}

const convertWeightToKg = (value: number, unit?: string) => {
  const normalizedUnit = unit?.toLowerCase();
  if (normalizedUnit === 'g') return value / 1000;
  if (normalizedUnit === 'lb') return value * 0.45359237;
  if (normalizedUnit === 'oz') return value * 0.0283495231;
  return value;
};

const convertLengthToCm = (value: number, unit?: string) => {
  const normalizedUnit = unit?.toLowerCase();
  if (normalizedUnit === 'm') return value * 100;
  if (normalizedUnit === 'in') return value * 2.54;
  return value;
};

export default function CheckoutPage() {
  const { tenant, settings } = useTenant();
  const checkoutConfig = useCheckoutConfig();
  const getNavPath = useNavPath();
  const localization = useLocalization();
  const formatPrice = useFormatPrice();
  const searchParams = useSearchParams();
  const { formatDisplayPrice, formatStorePrice, isConverted, displayCurrency, storeCurrency } = usePriceFormatting();
  const {
    items,
    getSelectedItems,
    removeSelectedItems,
    appliedCoupon,
    setAppliedCoupon,
    clearAppliedCoupon,
    appliedGiftCards,
    addGiftCard,
    removeGiftCard,
    updateGiftCardAmount,
    getGiftCardTotal,
    clearGiftCards,
  } = useCartStore();
  const selectedItemsRaw = getSelectedItems();
  // Memoize selected items to prevent infinite re-renders
  const selectedItems = useMemo(() => selectedItemsRaw, [JSON.stringify(selectedItemsRaw)]);
  const [productShippingCache, setProductShippingCache] = useState<Record<string, ProductShippingData>>({});
  const [isLoadingProductShipping, setIsLoadingProductShipping] = useState(true);

  useEffect(() => {
    if (!tenant || selectedItems.length === 0) {
      setIsLoadingProductShipping(false);
      return;
    }

    const missingIds = selectedItems
      .filter((item) => {
        const cached = productShippingCache[item.productId];
        const hasWeight = item.weight ?? cached?.weight;
        const hasLength = item.length ?? cached?.length;
        const hasWidth = item.width ?? cached?.width;
        const hasHeight = item.height ?? cached?.height;
        return hasWeight == null || hasLength == null || hasWidth == null || hasHeight == null;
      })
      .map((item) => item.productId)
      .filter((id, index, arr) => arr.indexOf(id) === index)
      .filter((id) => !productShippingCache[id]);

    if (missingIds.length === 0) {
      setIsLoadingProductShipping(false);
      return;
    }

    setIsLoadingProductShipping(true);
    let isMounted = true;
    Promise.all(
      missingIds.map(async (productId) => {
        const product = await getProduct(tenant.id, tenant.storefrontId, productId);
        if (!product) {
          return null;
        }
        const shippingData = getProductShippingData(product);
        return { productId, data: shippingData };
      })
    ).then((results) => {
      if (!isMounted) return;
      const updates: Record<string, ProductShippingData> = {};
      results.forEach((result) => {
        if (result) {
          updates[result.productId] = result.data;
        }
      });
      if (Object.keys(updates).length > 0) {
        setProductShippingCache((prev) => ({ ...prev, ...updates }));
      }
      setIsLoadingProductShipping(false);
    });

    return () => {
      isMounted = false;
    };
  }, [productShippingCache, selectedItems, tenant]);

  const packageMetrics = useMemo(() => {
    let totalWeightKg = 0;
    let maxLengthCm = 0;
    let maxWidthCm = 0;
    let maxHeightCm = 0;

    selectedItems.forEach((item) => {
      const cached = productShippingCache[item.productId];
      const weight = item.weight ?? cached?.weight;
      const weightUnit = item.weightUnit ?? cached?.weightUnit;
      if (weight && item.quantity) {
        totalWeightKg += convertWeightToKg(weight, weightUnit) * item.quantity;
      }
      const dimensionUnit = item.dimensionUnit ?? cached?.dimensionUnit;
      const length = item.length ?? cached?.length;
      const width = item.width ?? cached?.width;
      const height = item.height ?? cached?.height;
      if (length) {
        maxLengthCm = Math.max(maxLengthCm, convertLengthToCm(length, dimensionUnit));
      }
      if (width) {
        maxWidthCm = Math.max(maxWidthCm, convertLengthToCm(width, dimensionUnit));
      }
      if (height) {
        maxHeightCm = Math.max(maxHeightCm, convertLengthToCm(height, dimensionUnit));
      }
    });

    return {
      totalWeightKg,
      lengthCm: maxLengthCm || undefined,
      widthCm: maxWidthCm || undefined,
      heightCm: maxHeightCm || undefined,
    };
  }, [productShippingCache, selectedItems]);
  const { customer, accessToken } = useAuthStore();
  const [currentStep, setCurrentStepRaw] = useState<CheckoutStep>('shipping');
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to change step and scroll to top
  const setCurrentStep = useCallback((step: CheckoutStep) => {
    setCurrentStepRaw(step);
    // Scroll to top when changing steps
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Saved address vs manual entry mode
  const isAuthenticated = !!(customer && accessToken);
  const [addressMode, setAddressMode] = useState<'saved' | 'manual'>(isAuthenticated ? 'saved' : 'manual');
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<CustomerAddress | null>(null);

  // Guest checkout state
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showGuestBanner, setShowGuestBanner] = useState(!isAuthenticated);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | undefined>();

  // Pending order state for retry payment
  const [pendingOrder, setPendingOrder] = useState<{ id: string; orderNumber: string; total: number } | null>(null);

  // Loyalty points state
  const [loyaltyPointsApplied, setLoyaltyPointsApplied] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);

  // Terms acceptance state (mandatory)
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Shipping method state (can be ShippingMethod or ShippingRate from carrier)
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | ShippingRate | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(0); // Will be set when carrier rates load

  // Location auto-detection
  const { location, isLoading: isLocationLoading, isAutoDetected } = useLocationDetection(true);

  // Countries and states for dropdowns
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingStates, setIsLoadingStates] = useState(false);

  // Contact Info State
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Shipping address state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    city: '',
    state: '',
    zip: '',
    country: 'US',
    countryCode: 'US',
    addressLine1: '',
  });
  const [hasAutoFilled, setHasAutoFilled] = useState(false);

  // Location confirmation modal state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [hasShownLocationModal, setHasShownLocationModal] = useState(false);

  // Tax calculation hook
  const { taxResult, isLoading: isTaxLoading, calculateTax } = useTaxCalculation();

  // Determine Gateway based on store's configured country (from admin settings)
  // India -> Razorpay
  // Others -> Stripe
  // Note: Gateway is determined by the store's location, not customer's shipping address
  const storeCountryCode = localization.countryCode || localization.country || '';
  const gatewayType = storeCountryCode === 'IN' ? 'razorpay' : 'stripe';

  // Handle payment cancellation/failure from Stripe redirect
  useEffect(() => {
    const cancelled = searchParams.get('cancelled');
    const paymentFailed = searchParams.get('payment_failed');
    const errorMessage = searchParams.get('error');

    if (cancelled === 'true') {
      setError('Payment was cancelled. Your order has not been placed. You can try again when ready.');
      // Clear the query params from URL without reload
      window.history.replaceState({}, '', '/checkout');
    } else if (paymentFailed === 'true') {
      const message = errorMessage
        ? `Payment failed: ${decodeURIComponent(errorMessage)}`
        : 'Payment failed. Please try again or use a different payment method.';
      setError(message);
      window.history.replaceState({}, '', '/checkout');
    }
  }, [searchParams]);

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/location/countries');
        if (response.ok) {
          const data = await response.json();
          setCountries(data);
        }
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      } finally {
        setIsLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  // Fetch states when country changes
  const fetchStates = useCallback(async (countryId: string) => {
    if (!countryId) return;
    setIsLoadingStates(true);
    try {
      const response = await fetch(`/api/location/countries/${countryId}/states`);
      if (response.ok) {
        const data = await response.json();
        setStates(data);
      }
    } catch (error) {
      console.error('Failed to fetch states:', error);
      setStates([]);
    } finally {
      setIsLoadingStates(false);
    }
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (shippingAddress.countryCode) {
      fetchStates(shippingAddress.countryCode);
    }
  }, [shippingAddress.countryCode, fetchStates]);

  // Show location confirmation modal when location is detected
  useEffect(() => {
    if (location && !hasShownLocationModal && !isLocationLoading && addressMode === 'manual') {
      // Show the modal for user to confirm detected location
      setShowLocationModal(true);
      setHasShownLocationModal(true);
    }
  }, [location, hasShownLocationModal, isLocationLoading, addressMode]);

  // Handle location confirmation
  const handleLocationConfirm = (confirmedLocation: DetectedLocation) => {
    // Extract state code from full state ID (e.g., 'US-CA' -> 'CA')
    const stateCode = confirmedLocation.state?.includes('-')
      ? confirmedLocation.state.split('-')[1]
      : confirmedLocation.state;

    setShippingAddress(prev => ({
      ...prev,
      city: confirmedLocation.city || '',
      state: stateCode || '',
      stateCode: stateCode || '',
      zip: confirmedLocation.postalCode || '',
      country: confirmedLocation.country || 'US',
      countryCode: confirmedLocation.country || 'US',
    }));
    setHasAutoFilled(true);
    setShowLocationModal(false);
  };

  // Handle location skip
  const handleLocationSkip = () => {
    setShowLocationModal(false);
    // User will enter address manually
  };

  // Handle saved address selection
  const handleSavedAddressSelect = (address: CustomerAddress) => {
    setSelectedSavedAddress(address);
    // Pre-fill contact info from saved address
    setContactInfo(prev => ({
      ...prev,
      firstName: address.firstName,
      lastName: address.lastName,
      phone: address.phone || prev.phone,
      // Keep email from customer if available
      email: customer?.email || prev.email,
    }));
    // Pre-fill shipping address
    // Note: Backend stores ISO 2-letter code in 'country' field
    // Use country as countryCode if countryCode is not separately provided
    const countryCode = address.countryCode || address.country;
    setShippingAddress({
      addressLine1: address.addressLine1,
      city: address.city,
      state: address.state,
      zip: address.postalCode,
      country: countryCode,
      countryCode: countryCode,
    });
    setHasAutoFilled(true);
  };

  const packageWeightKg = packageMetrics.totalWeightKg > 0 ? packageMetrics.totalWeightKg : 0.5;
  const packageDimensions = useMemo(() => {
    if (!packageMetrics.lengthCm && !packageMetrics.widthCm && !packageMetrics.heightCm) {
      return undefined;
    }
    return {
      length: packageMetrics.lengthCm,
      width: packageMetrics.widthCm,
      height: packageMetrics.heightCm,
      dimensionUnit: 'cm' as const,
    };
  }, [packageMetrics.heightCm, packageMetrics.lengthCm, packageMetrics.widthCm]);

  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Use selected shipping method cost, or apply free shipping from coupon
  const shipping = appliedCoupon?.coupon.discountType === 'free_shipping' ? 0 : shippingCost;
  const tax = taxResult?.taxAmount ?? subtotal * 0.08; // Use calculated tax or fallback
  const discount = appliedCoupon?.discountAmount ?? 0;
  const giftCardDiscount = getGiftCardTotal();
  const total = Math.max(0, subtotal + shipping + tax - discount - loyaltyDiscount - giftCardDiscount);

  // Handle shipping method selection (can be ShippingMethod or ShippingRate)
  const handleShippingMethodSelect = (method: ShippingMethod | ShippingRate, cost: number) => {
    setSelectedShippingMethod(method);
    setShippingCost(cost);
  };

  // Helper to get shipping method display name (works for both types)
  const getShippingMethodName = (method: ShippingMethod | ShippingRate | null): string => {
    if (!method) return '';
    if ('name' in method) return method.name; // ShippingMethod
    if ('serviceDisplayName' in method) return `${method.carrierDisplayName} - ${method.serviceDisplayName}`; // ShippingRate
    return '';
  };

  // Calculate tax when shipping address is complete (debounced to prevent excessive calls)
  const taxCalculationRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // Clear any pending tax calculation
    if (taxCalculationRef.current) {
      clearTimeout(taxCalculationRef.current);
    }

    if (shippingAddress.city && shippingAddress.state && shippingAddress.zip && selectedItems.length > 0) {
      // Debounce tax calculation by 500ms
      taxCalculationRef.current = setTimeout(() => {
        const cartItems = selectedItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }));
        calculateTax(cartItems, shippingAddress, shipping);
      }, 500);
    }

    return () => {
      if (taxCalculationRef.current) {
        clearTimeout(taxCalculationRef.current);
      }
    };
  }, [shippingAddress.city, shippingAddress.state, shippingAddress.zip, selectedItems, shipping, calculateTax]);

  const steps: { id: CheckoutStep; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: 'shipping', label: 'Shipping & Payment', shortLabel: 'Ship', icon: <Truck className="h-4 w-4" /> },
    { id: 'review', label: 'Review & Pay', shortLabel: 'Pay', icon: <Check className="h-4 w-4" /> },
  ];
  // Note: step labels are used in JSX with TranslatedUIText

  const handlePlaceOrder = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      if (!tenant) throw new Error('Tenant context missing');

      // Validate phone number is provided (required for shipping)
      if (checkoutConfig.requirePhone && !contactInfo.phone?.trim()) {
        throw new Error('Phone number is required for shipping');
      }

      // Validate no unavailable items are being ordered
      const unavailableItems = selectedItems.filter(item =>
        item.status === 'UNAVAILABLE' || item.status === 'OUT_OF_STOCK'
      );
      if (unavailableItems.length > 0) {
        throw new Error(`Cannot proceed: ${unavailableItems.length} item(s) are no longer available. Please remove them from your cart.`);
      }

      // Validate items have valid prices (price must be > 0)
      const invalidPriceItems = selectedItems.filter(item => !item.price || item.price <= 0);
      if (invalidPriceItems.length > 0) {
        throw new Error(`Cannot proceed: ${invalidPriceItems.length} item(s) have invalid prices. Please refresh your cart.`);
      }

      // 1. Create Order (only with selected items)
      const createOrderData: CreateOrderRequest = {
        items: selectedItems.map(item => ({
          productId: item.productId, // Use productId, not the cart item id
          variantId: item.variantId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        shippingAddress: {
          firstName: contactInfo.firstName,
          lastName: contactInfo.lastName,
          addressLine1: shippingAddress.addressLine1 || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.zip,
          country: shippingAddress.countryCode || shippingAddress.country || 'US',
          phone: contactInfo.phone
        },
        billingAddress: { // Assume same as shipping for MVP
          firstName: contactInfo.firstName,
          lastName: contactInfo.lastName,
          addressLine1: shippingAddress.addressLine1 || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.zip,
          country: shippingAddress.countryCode || shippingAddress.country || 'US',
          phone: contactInfo.phone
        },
        customerEmail: contactInfo.email,
        customerPhone: contactInfo.phone,
        shippingMethod: getShippingMethodName(selectedShippingMethod) || 'standard',
        shippingCarrier: selectedShippingMethod && 'carrier' in selectedShippingMethod ? selectedShippingMethod.carrier : undefined,
        shippingServiceCode: selectedShippingMethod && 'service' in selectedShippingMethod ? selectedShippingMethod.service : undefined,
        shippingCost: shippingCost,
        // Pass package dimensions for accurate shipping calculations in admin
        packageWeight: packageWeightKg,
        packageLength: packageDimensions?.length,
        packageWidth: packageDimensions?.width,
        packageHeight: packageDimensions?.height,
        // Pass rate breakdown for admin transparency (only available for carrier rates)
        shippingBaseRate: selectedShippingMethod && 'baseRate' in selectedShippingMethod ? selectedShippingMethod.baseRate : undefined,
        shippingMarkupAmount: selectedShippingMethod && 'markupAmount' in selectedShippingMethod ? selectedShippingMethod.markupAmount : undefined,
        shippingMarkupPercent: selectedShippingMethod && 'markupPercent' in selectedShippingMethod ? selectedShippingMethod.markupPercent : undefined,
      };

      const order = await createOrder(tenant.id, tenant.storefrontId, createOrderData);

      // Save order for potential retry if payment fails
      setPendingOrder({ id: order.id, orderNumber: order.orderNumber, total });

      // 2. Create Payment Intent
      // Use store's configured currency from localization settings
      const currency = localization.currency;
      
      const paymentIntent = await createPaymentIntent(
        tenant.id,
        tenant.storefrontId,
        order.id,
        total,
        currency,
        gatewayType,
        {
          email: contactInfo.email,
          phone: contactInfo.phone,
          name: `${contactInfo.firstName} ${contactInfo.lastName}`.trim()
        }
      );

      if (gatewayType === 'razorpay') {
        // --- RAZORPAY FLOW ---
        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) throw new Error('Failed to load Razorpay SDK');

        // Get Razorpay key from payment intent response (returned by payment service)
        const keyId = (paymentIntent.options?.key as string) || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
        if (!keyId) throw new Error('Razorpay key not configured');
        
        const paymentResponse = await initiateRazorpayPayment({
          key: keyId,
          amount: Math.round(total * 100),
          currency: 'INR',
          name: tenant.name || 'Store',
          description: `Order #${order.orderNumber}`,
          order_id: paymentIntent.razorpayOrderId || '',
          handler: () => {}, 
          prefill: {
            name: `${contactInfo.firstName} ${contactInfo.lastName}`,
            email: contactInfo.email,
            contact: contactInfo.phone
          },
          theme: {
            color: settings.primaryColor || '#000000'
          }
        });

        await confirmPayment(tenant.id, tenant.storefrontId, {
          paymentIntentId: paymentIntent.paymentIntentId,
          gatewayTransactionId: paymentResponse.razorpay_payment_id,
          signature: paymentResponse.razorpay_signature,
          paymentDetails: {
            razorpayOrderId: paymentResponse.razorpay_order_id
          }
        });

        // Remove only the selected items that were ordered, keep unselected items in cart
        removeSelectedItems();
        // Clear applied coupon and gift cards after successful order
        clearAppliedCoupon();
        clearGiftCards();
        // Clear pending order on success
        setPendingOrder(null);
        setCompletedOrderNumber(order.orderNumber);
        setIsComplete(true);

        // Record order for customer stats (non-blocking)
        if (isAuthenticated && customer?.id && accessToken) {
          recordCustomerOrder(
            tenant.id,
            tenant.storefrontId,
            customer.id,
            {
              orderId: order.id,
              orderNumber: order.orderNumber,
              totalAmount: total,
            },
            accessToken
          ).catch((err) => {
            console.warn('Failed to record order stats:', err);
          });
        }

        // Show create account modal for guest users
        if (isGuestMode && !isAuthenticated) {
          setTimeout(() => {
            setShowCreateAccountModal(true);
          }, 1000);
        }

      } else {
        // --- STRIPE FLOW ---
        // Get session URL - check both direct field and options fallback
        const stripeSessionUrl = paymentIntent.stripeSessionUrl ||
          (paymentIntent.options?.sessionUrl as string);

        console.log('[Checkout] Payment intent received:', {
          stripeSessionUrl: paymentIntent.stripeSessionUrl,
          stripeSessionId: paymentIntent.stripeSessionId,
          optionsSessionUrl: paymentIntent.options?.sessionUrl,
          resolvedUrl: stripeSessionUrl
        });

        // Use the session URL directly from the backend if available
        if (stripeSessionUrl) {
          // Direct redirect to Stripe Checkout - no SDK needed
          console.log('[Checkout] Redirecting to Stripe URL:', stripeSessionUrl);
          window.location.href = stripeSessionUrl;
          return;
        }

        // Fallback to SDK-based redirect if session ID is provided
        if (paymentIntent.stripeSessionId) {
          console.log('[Checkout] Falling back to SDK redirect for session:', paymentIntent.stripeSessionId);
          const isScriptLoaded = await loadStripeScript();
          if (!isScriptLoaded) throw new Error('Failed to load Stripe SDK');

          const publishableKey = paymentIntent.stripePublicKey ||
            process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
            'pk_test_placeholder';

          await initiateStripePayment(publishableKey, paymentIntent.stripeSessionId);
          return;
        }

        throw new Error('Failed to initialize Stripe session - missing session URL or ID');
        // Note: Stripe will redirect away, so we don't need setIsComplete here usually.
        // The success_url in createPaymentIntent should handle the post-payment flow.
      }

    } catch (err: any) {
      console.error('Checkout error:', err);

      // Provide user-friendly error messages based on error type
      let userMessage = 'Something went wrong during checkout. Please try again.';
      const errMsg = err.message?.toLowerCase() || '';

      if (errMsg.includes('cancelled') || errMsg.includes('canceled')) {
        userMessage = 'Payment was cancelled. You can try again when ready.';
      } else if (errMsg.includes('declined') || errMsg.includes('insufficient')) {
        userMessage = 'Your payment was declined. Please check your card details or try a different payment method.';
      } else if (errMsg.includes('network') || errMsg.includes('timeout') || errMsg.includes('fetch')) {
        userMessage = 'A network error occurred. Please check your connection and try again.';
      } else if (errMsg.includes('expired')) {
        userMessage = 'Your session has expired. Please refresh the page and try again.';
      } else if (errMsg.includes('invalid') && (errMsg.includes('card') || errMsg.includes('payment'))) {
        userMessage = 'Invalid payment details. Please check your information and try again.';
      } else if (errMsg.includes('order') && errMsg.includes('fail')) {
        userMessage = 'Failed to create your order. Please try again or contact support.';
      } else if (err.message) {
        userMessage = err.message;
      }

      setError(userMessage);
      setIsProcessing(false); // Only reset if error, otherwise we might be redirecting
    }
  };

  // Retry payment for a pending order
  const handleRetryPayment = async () => {
    if (!pendingOrder || !tenant) return;

    setError(null);
    setIsProcessing(true);

    try {
      const currency = localization.currency;

      // Create new payment intent for the existing order
      const paymentIntent = await createPaymentIntent(
        tenant.id,
        tenant.storefrontId,
        pendingOrder.id,
        pendingOrder.total,
        currency,
        gatewayType,
        {
          email: contactInfo.email,
          phone: contactInfo.phone,
          name: `${contactInfo.firstName} ${contactInfo.lastName}`.trim()
        }
      );

      if (gatewayType === 'razorpay') {
        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) throw new Error('Failed to load Razorpay SDK');

        const keyId = (paymentIntent.options?.key as string) || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
        if (!keyId) throw new Error('Razorpay key not configured');

        const paymentResponse = await initiateRazorpayPayment({
          key: keyId,
          amount: Math.round(pendingOrder.total * 100),
          currency: 'INR',
          name: tenant.name || 'Store',
          description: `Order #${pendingOrder.orderNumber}`,
          order_id: paymentIntent.razorpayOrderId || '',
          handler: () => {},
          prefill: {
            name: `${contactInfo.firstName} ${contactInfo.lastName}`,
            email: contactInfo.email,
            contact: contactInfo.phone
          },
          theme: {
            color: settings.primaryColor || '#000000'
          }
        });

        await confirmPayment(tenant.id, tenant.storefrontId, {
          paymentIntentId: paymentIntent.paymentIntentId,
          gatewayTransactionId: paymentResponse.razorpay_payment_id,
          signature: paymentResponse.razorpay_signature,
          paymentDetails: {
            razorpayOrderId: paymentResponse.razorpay_order_id
          }
        });

        // Success - clear everything
        removeSelectedItems();
        clearAppliedCoupon();
        clearGiftCards();
        setCompletedOrderNumber(pendingOrder.orderNumber);
        setPendingOrder(null);
        setIsComplete(true);
      } else {
        // Stripe flow
        const stripeSessionUrl = paymentIntent.stripeSessionUrl ||
          (paymentIntent.options?.sessionUrl as string);

        if (stripeSessionUrl) {
          window.location.href = stripeSessionUrl;
          return;
        }

        if (paymentIntent.stripeSessionId) {
          const isScriptLoaded = await loadStripeScript();
          if (!isScriptLoaded) throw new Error('Failed to load Stripe SDK');

          const publishableKey = paymentIntent.stripePublicKey ||
            process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
            'pk_test_placeholder';

          await initiateStripePayment(publishableKey, paymentIntent.stripeSessionId);
          return;
        }

        throw new Error('Failed to initialize Stripe session');
      }
    } catch (err: any) {
      console.error('Retry payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  // Clear pending order and start fresh
  const handleClearPendingOrder = () => {
    setPendingOrder(null);
    setError(null);
  };

  if (isComplete) {
    return (
      <>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6"
          >
            <Check className="h-10 w-10 text-green-600" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2"><TranslatedUIText text="Order Confirmed!" /></h1>
          {completedOrderNumber && (
            <p className="text-lg font-medium text-tenant-primary mb-2">
              Order #{completedOrderNumber}
            </p>
          )}
          <p className="text-muted-foreground mb-6 max-w-md">
            <TranslatedUIText text="Thank you for your order. We'll send you a confirmation email with order details and tracking information." />
          </p>
          <div className="flex gap-4">
            <Button asChild variant="tenant-gradient" size="lg">
              <Link href={getNavPath('/products')}><TranslatedUIText text="Continue Shopping" /></Link>
            </Button>
            {isAuthenticated && (
              <Button asChild variant="tenant-outline" size="lg">
                <Link href={getNavPath('/account/orders')}><TranslatedUIText text="View Orders" /></Link>
              </Button>
            )}
          </div>
        </div>

        {/* Post-order create account modal for guest users */}
        {isGuestMode && !isAuthenticated && (
          <PostOrderCreateAccount
            open={showCreateAccountModal}
            onOpenChange={setShowCreateAccountModal}
            email={contactInfo.email}
            firstName={contactInfo.firstName}
            lastName={contactInfo.lastName}
            phone={contactInfo.phone}
            orderNumber={completedOrderNumber}
            onAccountCreated={() => {
              // Optionally refresh auth state
              window.location.reload();
            }}
          />
        )}
      </>
    );
  }

  if (selectedItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold mb-2"><TranslatedUIText text="No items selected for checkout" /></h1>
        <p className="text-muted-foreground mb-6">
          {items.length > 0
            ? <TranslatedUIText text="Please select items in your cart to proceed with checkout." />
            : <TranslatedUIText text="Add some items to your cart to checkout." />}
        </p>
        <Button asChild variant="tenant-gradient" size="lg">
          <Link href={getNavPath(items.length > 0 ? '/cart' : '/products')}>
            {items.length > 0 ? <TranslatedUIText text="Go to Cart" /> : <TranslatedUIText text="Shop Now" />}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container-tenant">
        <Link
          href={getNavPath('/cart')}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <TranslatedUIText text="Back to Cart" />
        </Link>

        {/* Progress Steps - Mobile Responsive */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors min-h-[44px]',
                  currentStep === step.id
                    ? 'bg-tenant-primary text-on-tenant-primary'
                    : steps.findIndex((s) => s.id === currentStep) > index
                    ? 'bg-green-100 text-green-700'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {steps.findIndex((s) => s.id === currentStep) > index ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.icon
                )}
                {/* Show short label on mobile, full label on larger screens */}
                <span className="sm:hidden"><TranslatedUIText text={step.shortLabel} /></span>
                <span className="hidden sm:inline"><TranslatedUIText text={step.label} /></span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-6 sm:w-8 h-0.5 mx-1.5 sm:mx-2',
                    steps.findIndex((s) => s.id === currentStep) > index
                      ? 'bg-green-500'
                      : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Shipping Step */}
            {currentStep === 'shipping' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card rounded-xl border p-6"
              >
                {/* Guest Checkout Banner - show for non-authenticated users who haven't chosen guest mode */}
                {!isAuthenticated && showGuestBanner && !isGuestMode && (
                  <GuestCheckoutBanner
                    onContinueAsGuest={() => {
                      setIsGuestMode(true);
                      setShowGuestBanner(false);
                    }}
                  />
                )}

                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold"><TranslatedUIText text="Shipping Information" /></h2>
                  {isLocationLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <TranslatedUIText text="Detecting location..." />
                    </div>
                  ) : isAutoDetected && location && addressMode === 'manual' ? (
                    <button
                      onClick={() => setShowLocationModal(true)}
                      className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition-colors"
                    >
                      <MapPin className="h-4 w-4" />
                      {location.flagEmoji} {location.city}, {location.countryName}
                      <Edit2 className="h-3 w-3 ml-1" />
                    </button>
                  ) : addressMode === 'manual' && !hasAutoFilled ? (
                    <button
                      onClick={() => {
                        setHasShownLocationModal(false);
                        setShowLocationModal(true);
                      }}
                      className="flex items-center gap-2 text-sm text-tenant-primary hover:text-tenant-primary/80 transition-colors"
                    >
                      <MapPin className="h-4 w-4" />
                      <TranslatedUIText text="Detect Location" />
                    </button>
                  ) : null}
                </div>

                {/* Address mode toggle for authenticated users */}
                {isAuthenticated && (
                  <div className="mb-6">
                    <div className="flex gap-2 p-1 bg-muted rounded-lg">
                      <button
                        onClick={() => setAddressMode('saved')}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all',
                          addressMode === 'saved'
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <MapPin className="h-4 w-4" />
                        <TranslatedUIText text="Saved Addresses" />
                      </button>
                      <button
                        onClick={() => setAddressMode('manual')}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all',
                          addressMode === 'manual'
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Edit2 className="h-4 w-4" />
                        <TranslatedUIText text="Enter Manually" />
                      </button>
                    </div>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {/* Saved Address Selector */}
                  {isAuthenticated && addressMode === 'saved' && (
                    <motion.div
                      key="saved-addresses"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-6"
                    >
                      <AddressSelector
                        selectedAddressId={selectedSavedAddress?.id}
                        onSelectAddress={handleSavedAddressSelect}
                        addressType="SHIPPING"
                      />

                      {/* Email input for saved address mode */}
                      {selectedSavedAddress && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 pt-4 border-t space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="email"><TranslatedUIText text="Email" /> *</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="john@example.com"
                              required
                              value={contactInfo.email}
                              onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                            />
                          </div>
                          {checkoutConfig.requirePhone && !selectedSavedAddress.phone && (
                            <div className="space-y-2">
                              <Label htmlFor="phone"><TranslatedUIText text="Phone" /> *</Label>
                              <Input
                                id="phone"
                                type="tel"
                                placeholder="+1 (555) 000-0000"
                                required
                                value={contactInfo.phone}
                                onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                              />
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Manual Address Entry */}
                  {(!isAuthenticated || addressMode === 'manual') && (
                    <motion.div
                      key="manual-entry"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="grid gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName"><TranslatedUIText text="First Name" /> *</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        required
                        value={contactInfo.firstName}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName"><TranslatedUIText text="Last Name" /> *</Label>
                      <Input 
                        id="lastName" 
                        placeholder="Doe" 
                        required 
                        value={contactInfo.lastName}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email"><TranslatedUIText text="Email" /> *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      required
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  {checkoutConfig.requirePhone && (
                    <div className="space-y-2">
                      <Label htmlFor="phone"><TranslatedUIText text="Phone" /> *</Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="+1 (555) 000-0000" 
                        required 
                        value={contactInfo.phone}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="address"><TranslatedUIText text="Address" /> *</Label>
                    <Input 
                      id="address" 
                      placeholder="123 Main Street" 
                      required 
                      value={shippingAddress.addressLine1}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, addressLine1: e.target.value }))}
                    />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city"><TranslatedUIText text="City" /> *</Label>
                      <Input
                        id="city"
                        placeholder="New York"
                        required
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({ ...prev, city: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state"><TranslatedUIText text="State" /> *</Label>
                      <Select
                        value={shippingAddress.state}
                        onValueChange={(value) =>
                          setShippingAddress((prev) => ({
                            ...prev,
                            state: value,
                            stateCode: value,
                          }))
                        }
                        disabled={isLoadingStates}
                      >
                        <SelectTrigger>
                          {isLoadingStates ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Loading...
                            </div>
                          ) : (
                            <SelectValue placeholder="Select state" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {states.length > 0 ? (
                            states.map((state) => (
                              <SelectItem key={state.id} value={state.code || state.id}>
                                {state.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="_no_states" disabled>
                              No states available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip"><TranslatedUIText text="ZIP Code" /> *</Label>
                      <Input
                        id="zip"
                        placeholder="10001"
                        required
                        value={shippingAddress.zip}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({ ...prev, zip: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country"><TranslatedUIText text="Country" /> *</Label>
                    <Select
                      value={shippingAddress.countryCode}
                      onValueChange={(value) => {
                        setShippingAddress((prev) => ({
                          ...prev,
                          country: value,
                          countryCode: value,
                          state: '', // Reset state when country changes
                          stateCode: '',
                        }));
                      }}
                      disabled={isLoadingCountries}
                    >
                      <SelectTrigger>
                        {isLoadingCountries ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Loading...
                          </div>
                        ) : (
                          <SelectValue placeholder="Select country" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {countries.length > 0 ? (
                          countries.map((country) => (
                            <SelectItem key={country.id} value={country.id}>
                              {country.flagEmoji} {country.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="_no_countries" disabled>
                            No countries available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Shipping Method Selection */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    <TranslatedUIText text="Shipping Method" />
                  </h3>
                  {isLoadingProductShipping ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                      <span className="text-gray-500">Loading shipping options...</span>
                    </div>
                  ) : (
                    <ShippingMethodSelector
                      orderSubtotal={subtotal}
                      countryCode={shippingAddress.countryCode || shippingAddress.country}
                      postalCode={shippingAddress.zip}
                      city={shippingAddress.city}
                      state={shippingAddress.state}
                      selectedMethodId={selectedShippingMethod?.id}
                      onSelect={handleShippingMethodSelect}
                      disabled={isProcessing}
                      packageWeight={packageWeightKg}
                      weightUnit="kg"
                      packageDimensions={packageDimensions}
                      useCarrierRates={true}
                    />
                  )}
                </div>

                {/* Payment Method Info */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <TranslatedUIText text="Payment Method" />
                  </h3>

                  <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-muted/30 to-transparent">
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Gateway Logo */}
                        <div className={cn(
                          "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md",
                          gatewayType === 'razorpay'
                            ? "bg-gradient-to-br from-blue-500 to-blue-700"
                            : "bg-gradient-to-br from-indigo-500 to-purple-600"
                        )}>
                          {gatewayType === 'razorpay' ? (
                            <span className="text-white font-bold text-lg">R</span>
                          ) : (
                            <span className="text-white font-bold text-lg">S</span>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">
                              {gatewayType === 'razorpay' ? 'Razorpay' : 'Stripe'} Checkout
                            </h4>
                            <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                              <Shield className="h-3 w-3" />
                              <TranslatedUIText text="Secure" />
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <TranslatedUIText text="You'll be redirected to complete payment securely." />
                          </p>

                          {/* Supported Payment Methods */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="text-xs px-2 py-1 bg-background rounded border">Cards</span>
                            {gatewayType === 'razorpay' && (
                              <>
                                <span className="text-xs px-2 py-1 bg-background rounded border">UPI</span>
                                <span className="text-xs px-2 py-1 bg-background rounded border">Netbanking</span>
                              </>
                            )}
                            {gatewayType === 'stripe' && (
                              <>
                                <span className="text-xs px-2 py-1 bg-background rounded border">Apple Pay</span>
                                <span className="text-xs px-2 py-1 bg-background rounded border">Google Pay</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validation Error Display */}
                {error && currentStep === 'shipping' && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <Button
                    variant="tenant-primary"
                    size="lg"
                    onClick={() => {
                      // Validation based on mode
                      if (isAuthenticated && addressMode === 'saved') {
                        if (!selectedSavedAddress || !contactInfo.email) {
                          setError('Please select a shipping address and provide your email');
                          return;
                        }
                        // Check phone for saved address (may need separate input if address has no phone)
                        if (checkoutConfig.requirePhone && !selectedSavedAddress.phone && !contactInfo.phone?.trim()) {
                          setError('Phone number is required for shipping');
                          return;
                        }
                      } else {
                        if (!contactInfo.firstName || !contactInfo.email || !shippingAddress.addressLine1 || !shippingAddress.city) {
                          setError('Please fill in all required fields (name, email, address, city)');
                          return;
                        }
                        // Validate phone for guest/new address
                        if (checkoutConfig.requirePhone && !contactInfo.phone?.trim()) {
                          setError('Phone number is required for shipping');
                          return;
                        }
                      }
                      setError(null);
                      setCurrentStep('review');
                    }}
                  >
                    <TranslatedUIText text="Review Order" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Review Step */}
            {currentStep === 'review' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card rounded-xl border p-6"
              >
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Check className="h-5 w-5 text-tenant-primary" />
                  <TranslatedUIText text="Review Your Order" />
                </h2>

                {/* Order Items */}
                <div className="space-y-3 mb-6">
                  {selectedItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                        <Image
                          src={item.image || '/placeholder.svg'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-background rounded border">
                            <TranslatedUIText text="Qty:" /> {item.quantity}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatPrice(item.price)} <TranslatedUIText text="each" />
                          </span>
                        </div>
                      </div>
                      <p className="font-semibold text-tenant-primary">{formatPrice(item.price * item.quantity)}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Shipping & Payment Info Cards */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {/* Shipping Address Card */}
                  <div className="relative rounded-xl border bg-gradient-to-br from-muted/50 to-transparent p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                          <Truck className="h-4 w-4 text-tenant-primary" />
                        </div>
                        <span className="font-medium"><TranslatedUIText text="Ship to" /></span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep('shipping')}
                        className="h-7 text-xs text-tenant-primary hover:text-tenant-primary hover:bg-tenant-primary/10"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        <TranslatedUIText text="Edit" />
                      </Button>
                    </div>
                    <div className="space-y-1 text-sm pl-10">
                      <p className="font-medium">{contactInfo.firstName} {contactInfo.lastName}</p>
                      <p className="text-muted-foreground">{shippingAddress.addressLine1}</p>
                      <p className="text-muted-foreground">{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}</p>
                    </div>
                  </div>

                  {/* Payment Method Card */}
                  <div className="relative rounded-xl border bg-gradient-to-br from-muted/50 to-transparent p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-tenant-primary" />
                        </div>
                        <span className="font-medium"><TranslatedUIText text="Payment" /></span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep('shipping')}
                        className="h-7 text-xs text-tenant-primary hover:text-tenant-primary hover:bg-tenant-primary/10"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        <TranslatedUIText text="Edit" />
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm pl-10">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold",
                          gatewayType === 'razorpay' ? "bg-blue-600" : "bg-indigo-600"
                        )}>
                          {gatewayType === 'razorpay' ? 'R' : 'S'}
                        </div>
                        <span className="font-medium">
                          {gatewayType === 'razorpay' ? 'Razorpay' : 'Stripe'}
                        </span>
                      </div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <TranslatedUIText text="Currency:" /> {localization.currency}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/30 mb-6 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground"><TranslatedUIText text="Order confirmation will be sent to:" /></span>
                  <span className="font-medium">{contactInfo.email}</span>
                </div>

                {/* Terms and Conditions - Always mandatory */}
                <div className="flex items-start gap-2 mb-6">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    required
                  />
                  <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                    {checkoutConfig.termsText || 'I agree to the terms and conditions and understand that all sales are final.'}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium"><TranslatedUIText text="Payment Issue" /></p>
                        <p className="mt-1">{error}</p>
                      </div>
                    </div>
                    {pendingOrder && (
                      <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                        <p className="text-sm text-muted-foreground mb-3">
                          Your order #{pendingOrder.orderNumber} has been created. You can retry payment or start over.
                        </p>
                        <div className="flex gap-3">
                          <Button
                            onClick={handleRetryPayment}
                            disabled={isProcessing}
                            className="btn-tenant-primary"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-4 w-4 mr-2" />
                                <TranslatedUIText text="Retry Payment" />
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleClearPendingOrder}
                            disabled={isProcessing}
                          >
                            <TranslatedUIText text="Start Over" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="flex justify-between">
                  <Button variant="tenant-ghost" size="lg" onClick={() => setCurrentStep('shipping')}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <TranslatedUIText text="Back" />
                  </Button>
                  <Button
                    variant="tenant-glow"
                    size="lg"
                    className="min-w-[160px]"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing || !termsAccepted}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <span>
                        Pay {formatStorePrice(total)}
                        {isConverted && (
                          <span className="text-xs font-normal opacity-75 ml-1">
                            ({formatDisplayPrice(total)})
                          </span>
                        )}
                      </span>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4"><TranslatedUIText text="Order Summary" /></h2>

              <div className="space-y-3 mb-4">
                {selectedItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-muted">
                      <Image
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-muted-foreground text-white text-xs rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
                {selectedItems.length > 3 && (
                  <p className="text-sm text-muted-foreground">
                    +{selectedItems.length - 3} <TranslatedUIText text="more items" />
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              {/* Promo Code Input */}
              <CouponInput
                orderValue={subtotal}
                appliedCoupon={appliedCoupon}
                onApply={setAppliedCoupon}
                onRemove={clearAppliedCoupon}
                disabled={isProcessing}
              />

              {/* Gift Card Input */}
              <div className="my-4">
                <GiftCardInput
                  orderTotal={subtotal + shipping + tax - discount - loyaltyDiscount}
                  appliedGiftCards={appliedGiftCards}
                  onApply={addGiftCard}
                  onRemove={removeGiftCard}
                  onUpdateAmount={updateGiftCardAmount}
                  disabled={isProcessing}
                />
              </div>

              {/* Loyalty Points Redemption */}
              <div className="my-4">
                <LoyaltyPointsRedemption
                  orderSubtotal={subtotal}
                  appliedPoints={loyaltyPointsApplied}
                  onApplyPoints={(points, dollarValue) => {
                    setLoyaltyPointsApplied(points);
                    setLoyaltyDiscount(dollarValue);
                  }}
                  onRemovePoints={() => {
                    setLoyaltyPointsApplied(0);
                    setLoyaltyDiscount(0);
                  }}
                  disabled={isProcessing}
                />
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground"><TranslatedUIText text="Subtotal" /></span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    <TranslatedUIText text="Shipping" />
                    {selectedShippingMethod && (
                      <span className="text-xs ml-1">({getShippingMethodName(selectedShippingMethod)})</span>
                    )}
                  </span>
                  <span>
                    {!selectedShippingMethod ? (
                      <span className="text-muted-foreground text-xs"><TranslatedUIText text="Select method above" /></span>
                    ) : shipping === 0 ? (
                      <TranslatedUIText text="FREE" />
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <TranslatedUIText text="Coupon:" /> {appliedCoupon.coupon.code}
                    </span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-yellow-600">
                    <span className="flex items-center gap-1">
                      <TranslatedUIText text="Loyalty Points" />
                      <span className="text-xs">({loyaltyPointsApplied.toLocaleString()} <TranslatedUIText text="pts" />)</span>
                    </span>
                    <span>-{formatPrice(loyaltyDiscount)}</span>
                  </div>
                )}
                {giftCardDiscount > 0 && (
                  <div className="flex justify-between text-purple-600">
                    <span className="flex items-center gap-1">
                      <TranslatedUIText text={appliedGiftCards.length > 1 ? 'Gift Cards' : 'Gift Card'} />
                      <span className="text-xs">({appliedGiftCards.length})</span>
                    </span>
                    <span>-{formatPrice(giftCardDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    <TranslatedUIText text="Tax" />
                    {taxResult?.isEstimate && (
                      <span className="text-xs ml-1">(est.)</span>
                    )}
                  </span>
                  {isTaxLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>{formatPrice(tax)}</span>
                  )}
                </div>
                {/* Show tax breakdown for GST/VAT */}
                {taxResult?.gstSummary && (
                  <div className="pl-4 space-y-1 text-xs text-muted-foreground border-l-2 border-muted">
                    {taxResult.gstSummary.isInterstate ? (
                      <div className="flex justify-between">
                        <span>IGST</span>
                        <span>{formatPrice(taxResult.gstSummary.igst)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span>CGST</span>
                          <span>{formatPrice(taxResult.gstSummary.cgst)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SGST</span>
                          <span>{formatPrice(taxResult.gstSummary.sgst)}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {taxResult?.taxBreakdown && taxResult.taxBreakdown.length > 0 && !taxResult.gstSummary && (
                  <div className="pl-4 space-y-1 text-xs text-muted-foreground border-l-2 border-muted">
                    {taxResult.taxBreakdown.slice(0, 3).map((breakdown, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{breakdown.jurisdictionName} ({breakdown.rate}%)</span>
                        <span>{formatPrice(breakdown.taxAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-bold text-lg">
                <span><TranslatedUIText text="Total" /></span>
                <div className="text-right">
                  {isConverted ? (
                    <>
                      <span className="block">{formatDisplayPrice(total)}</span>
                      <span className="block text-sm font-normal text-muted-foreground">
                        ({formatStorePrice(total)} {storeCurrency})
                      </span>
                    </>
                  ) : (
                    <span>{formatPrice(total)}</span>
                  )}
                </div>
              </div>

              {/* Currency conversion notice */}
              {isConverted && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  <TranslatedUIText text="Prices shown in" /> {displayCurrency}. <TranslatedUIText text="You will be charged in" /> {storeCurrency}.
                </p>
              )}

              {checkoutConfig.showTrustBadges && (
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <TranslatedUIText text="Secure & Encrypted" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Location Confirmation Modal */}
      <LocationConfirmationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onConfirm={handleLocationConfirm}
        onSkip={handleLocationSkip}
        detectedLocation={location}
        isDetecting={isLocationLoading}
      />
    </div>
  );
}
