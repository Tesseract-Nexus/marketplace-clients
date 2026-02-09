'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Check, Loader2, Ticket, Gift, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTenant, useCheckoutConfig, useNavPath, useLocalization, useFormatPrice } from '@/context/TenantContext';
import { usePriceFormatting } from '@/context/CurrencyContext';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useTaxCalculation } from '@/hooks/useTaxCalculation';
import { getProduct } from '@/lib/api/storefront';
import { getProductShippingData, type ProductShippingData } from '@/lib/utils/product-shipping';
import { locationApi } from '@/lib/api/location';
import {
  createOrder,
  createPaymentIntent,
  confirmPayment,
  pollOrderPaymentStatus,
  loadRazorpayScript,
  initiateRazorpayPayment,
  loadStripeScript,
  initiateStripePayment,
  type CreateOrderRequest
} from '@/lib/api/checkout';
import { recordCustomerOrder } from '@/lib/api/customers';
import { redeemPoints } from '@/lib/api/loyalty';
import { ShippingMethod, ShippingRate } from '@/lib/api/shipping';
import { CheckoutProvider, useCheckout } from '@/context/CheckoutContext';
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress';
import {
  CheckoutContactStep,
  CheckoutShippingStep,
  CheckoutReviewStep,
} from '@/components/checkout/steps';
import { PostOrderCreateAccount } from '@/components/checkout/PostOrderCreateAccount';
import { MobileOrderSummary } from '@/components/checkout/MobileOrderSummary';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { CouponInput } from '@/components/checkout/CouponInput';
import { GiftCardInput } from '@/components/checkout/GiftCardInput';
import { LoyaltyPointsRedemption } from '@/components/checkout/LoyaltyPointsRedemption';

// Unit conversion helpers
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

// Helper to get shipping method name
const getShippingMethodName = (method: ShippingMethod | ShippingRate | null): string => {
  if (!method) return '';
  if ('name' in method) return method.name;
  if ('serviceDisplayName' in method) return `${method.carrierDisplayName} - ${method.serviceDisplayName}`;
  return '';
};

function CheckoutContent() {
  const { tenant, settings } = useTenant();
  const checkoutConfig = useCheckoutConfig();
  const getNavPath = useNavPath();
  const localization = useLocalization();
  const formatPrice = useFormatPrice();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { formatDisplayPrice, formatStorePrice, isConverted, displayCurrency, storeCurrency } = usePriceFormatting();

  const {
    items,
    getSelectedItems,
    removeSelectedItems,
    removeItem,
    updateQuantity,
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
  const selectedItems = useMemo(() => selectedItemsRaw, [JSON.stringify(selectedItemsRaw)]);

  const { customer, accessToken, isAuthenticated } = useAuthStore();

  // Checkout context
  const {
    currentStep,
    contactInfo,
    shippingAddress,
    selectedShippingMethod,
    shippingCost,
    isGuestMode,
    loyaltyDiscount,
    loyaltyPointsApplied,
    setLoyaltyPoints,
    orderNotes,
    isGiftOrder,
    giftMessage,
    isProcessing,
    setIsProcessing,
    error,
    setError,
    pendingOrder,
    setPendingOrder,
    isHydrated,
  } = useCheckout();

  // Product shipping data cache
  const [productShippingCache, setProductShippingCache] = useState<Record<string, ProductShippingData>>({});
  const [isLoadingProductShipping, setIsLoadingProductShipping] = useState(true);

  // Order completion state
  const [isComplete, setIsComplete] = useState(false);
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | undefined>();
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [isNavigatingToSuccess, setIsNavigatingToSuccess] = useState(false);

  // Redirect to homepage if cart is empty after hydration
  useEffect(() => {
    // Wait for hydration to complete before checking
    if (!isHydrated) return;

    // Don't redirect if we're navigating to success page after payment
    if (isNavigatingToSuccess) return;

    // If no items in cart and no selected items, redirect to homepage
    if (items.length === 0 && selectedItems.length === 0) {
      console.log('[Checkout] No cart items after hydration, redirecting to homepage');
      router.replace(getNavPath('/'));
    }
  }, [isHydrated, items.length, selectedItems.length, router, getNavPath, isNavigatingToSuccess]);

  // Auto-detected region from IP geolocation
  const [detectedRegion, setDetectedRegion] = useState<string | null>(null);
  const [isDetectingRegion, setIsDetectingRegion] = useState(true);

  // Dynamic payment methods state
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<Array<{
    code: string;
    name: string;
    description: string;
    provider: string;
    type: string;
    supportedRegions: string[];
    supportedCurrencies: string[];
    iconUrl?: string;
    transactionFeePercent: number;
    transactionFeeFixed: number;
    displayName?: string;
    checkoutMessage?: string;
    isTestMode: boolean;
  }>>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);

  // Tax calculation
  const { taxResult, isLoading: isTaxLoading, calculateTax } = useTaxCalculation();
  const taxCalculationRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-detect customer's region from IP on initial load
  useEffect(() => {
    const detectRegion = async () => {
      try {
        setIsDetectingRegion(true);
        const location = await locationApi.detectLocation();
        if (location?.country) {
          setDetectedRegion(location.country);
        }
      } catch (error) {
        console.warn('Failed to auto-detect region:', error);
      } finally {
        setIsDetectingRegion(false);
      }
    };

    detectRegion();
  }, []);

  // Determine customer's region for payment method filtering
  // Priority: 1. Shipping address country, 2. Customer profile country, 3. IP-detected region, 4. Store localization
  const customerRegion = useMemo(() => {
    // If shipping address is filled, use that country
    if (shippingAddress.countryCode) {
      return shippingAddress.countryCode;
    }
    // Fall back to customer's profile country if available
    if (customer?.countryCode) {
      return customer.countryCode;
    }
    // Use IP-detected region for automatic gateway selection
    if (detectedRegion) {
      return detectedRegion;
    }
    // Finally, fall back to store's localization
    return localization.countryCode || localization.country || '';
  }, [shippingAddress.countryCode, customer?.countryCode, detectedRegion, localization.countryCode, localization.country]);

  // Gateway type based on store country (fallback if no dynamic methods)
  const storeCountryCode = localization.countryCode || localization.country || '';
  const fallbackGatewayType = customerRegion === 'IN' ? 'razorpay' : 'stripe';

  // Determine actual gateway type based on selected payment method
  const gatewayType = useMemo(() => {
    if (selectedPaymentMethod && enabledPaymentMethods.length > 0) {
      const method = enabledPaymentMethods.find(m => m.code === selectedPaymentMethod);
      if (method) {
        // Map provider to gateway type
        const providerToGateway: Record<string, 'stripe' | 'razorpay'> = {
          'Stripe': 'stripe',
          'Razorpay': 'razorpay',
          'PayPal': 'stripe', // PayPal goes through Stripe in some integrations
        };
        return providerToGateway[method.provider] || 'stripe';
      }
    }
    return fallbackGatewayType;
  }, [selectedPaymentMethod, enabledPaymentMethods, fallbackGatewayType]);

  // Fetch enabled payment methods based on customer's region
  useEffect(() => {
    // Wait for region detection to complete before fetching payment methods
    // This avoids double-fetching (once with store locale, once with detected region)
    if (isDetectingRegion) {
      return;
    }

    const fetchPaymentMethods = async () => {
      try {
        setIsLoadingPaymentMethods(true);
        // Use customer's region for filtering payment methods
        const region = customerRegion || '';
        const response = await fetch(`/api/payments/methods${region ? `?region=${region}` : ''}`);

        if (response.ok) {
          const data = await response.json();
          const methods = data.paymentMethods || data.data?.paymentMethods || [];
          setEnabledPaymentMethods(methods);

          // Auto-select first method if only one available
          if (methods.length === 1) {
            setSelectedPaymentMethod(methods[0].code);
          } else if (methods.length > 0 && !selectedPaymentMethod) {
            // Auto-select card/stripe method if available, otherwise first
            const cardMethod = methods.find((m: any) => m.type === 'card' || m.provider === 'Stripe');
            setSelectedPaymentMethod(cardMethod?.code || methods[0].code);
          }
        }
      } catch (error) {
        console.error('Failed to fetch payment methods:', error);
        // Fall back to empty array - will use legacy gateway
      } finally {
        setIsLoadingPaymentMethods(false);
      }
    };

    fetchPaymentMethods();
  }, [customerRegion, isDetectingRegion]); // Re-fetch when customer's region changes or detection completes

  // Load product shipping data
  useEffect(() => {
    if (!tenant || selectedItems.length === 0) {
      setIsLoadingProductShipping(false);
      return;
    }

    const missingIds = selectedItems
      .filter((item) => {
        const cached = productShippingCache[item.productId];
        const hasWeight = item.weight ?? cached?.weight;
        return hasWeight == null;
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
        if (!product) return null;
        const shippingData = getProductShippingData(product);
        return { productId, data: shippingData };
      })
    ).then((results) => {
      if (!isMounted) return;
      const updates: Record<string, ProductShippingData> = {};
      results.forEach((result) => {
        if (result) updates[result.productId] = result.data;
      });
      if (Object.keys(updates).length > 0) {
        setProductShippingCache((prev) => ({ ...prev, ...updates }));
      }
      setIsLoadingProductShipping(false);
    });

    return () => { isMounted = false; };
  }, [productShippingCache, selectedItems, tenant]);

  // Calculate package metrics
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
      if (length) maxLengthCm = Math.max(maxLengthCm, convertLengthToCm(length, dimensionUnit));
      if (width) maxWidthCm = Math.max(maxWidthCm, convertLengthToCm(width, dimensionUnit));
      if (height) maxHeightCm = Math.max(maxHeightCm, convertLengthToCm(height, dimensionUnit));
    });

    return {
      totalWeightKg,
      lengthCm: maxLengthCm || undefined,
      widthCm: maxWidthCm || undefined,
      heightCm: maxHeightCm || undefined,
    };
  }, [productShippingCache, selectedItems]);

  const packageWeightKg = packageMetrics.totalWeightKg > 0 ? packageMetrics.totalWeightKg : 0.5;
  const packageDimensions = useMemo(() => {
    if (!packageMetrics.lengthCm && !packageMetrics.widthCm && !packageMetrics.heightCm) return undefined;
    return {
      length: packageMetrics.lengthCm,
      width: packageMetrics.widthCm,
      height: packageMetrics.heightCm,
      dimensionUnit: 'cm' as const,
    };
  }, [packageMetrics]);

  // Calculate totals
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = appliedCoupon?.coupon.discountType === 'free_shipping' ? 0 : shippingCost;
  const tax = taxResult?.taxAmount ?? 0;
  const discount = appliedCoupon?.discountAmount ?? 0;
  const giftCardDiscount = getGiftCardTotal();
  const total = Math.max(0, subtotal + shipping + tax - discount - loyaltyDiscount - giftCardDiscount);

  // Use full store address from localization for tax calculation (includes city for GST/VAT)
  const storeAddress = useMemo(() => {
    // Prefer the full storeAddress if available (includes city, state, zip)
    if (localization.storeAddress) {
      return localization.storeAddress;
    }
    // Fallback to building from basic localization fields
    if (!localization.countryCode && !localization.country) return undefined;
    return {
      country: localization.country || localization.countryCode,
      countryCode: localization.countryCode || localization.country,
      state: localization.region || undefined,
    };
  }, [localization.storeAddress, localization.country, localization.countryCode, localization.region]);

  // Calculate tax when shipping address changes
  useEffect(() => {
    if (taxCalculationRef.current) clearTimeout(taxCalculationRef.current);

    // Trigger tax calculation when we have minimum required fields (city and state for GST)
    const hasMinimumAddress = shippingAddress.city && (shippingAddress.state || shippingAddress.stateCode);

    if (hasMinimumAddress && selectedItems.length > 0) {
      console.log('[Tax] Triggering tax calculation for:', {
        city: shippingAddress.city,
        state: shippingAddress.state,
        stateCode: shippingAddress.stateCode,
        country: shippingAddress.country,
        countryCode: shippingAddress.countryCode,
        storeAddress: storeAddress ? { city: storeAddress.city, state: storeAddress.state, countryCode: storeAddress.countryCode } : 'undefined',
      });

      taxCalculationRef.current = setTimeout(() => {
        const cartItems = selectedItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }));
        calculateTax(cartItems, shippingAddress, shipping, storeAddress, tenant?.id);
      }, 500);
    }

    return () => {
      if (taxCalculationRef.current) clearTimeout(taxCalculationRef.current);
    };
  }, [shippingAddress.city, shippingAddress.state, shippingAddress.stateCode, shippingAddress.countryCode, shippingAddress.zip, selectedItems, shipping, calculateTax, storeAddress]);

  // Handle payment cancellation from Stripe redirect
  useEffect(() => {
    const cancelled = searchParams.get('cancelled');
    const paymentFailed = searchParams.get('payment_failed');
    const errorMessage = searchParams.get('error');

    if (cancelled === 'true') {
      setError('Payment was cancelled. Your order has not been placed. You can try again when ready.');
      window.history.replaceState({}, '', '/checkout');
    } else if (paymentFailed === 'true') {
      const message = errorMessage
        ? `Payment failed: ${decodeURIComponent(errorMessage)}`
        : 'Payment failed. Please try again or use a different payment method.';
      setError(message);
      window.history.replaceState({}, '', '/checkout');
    }
  }, [searchParams, setError]);

  // Place order handler
  const handlePlaceOrder = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      if (!tenant) throw new Error('Tenant context missing');

      // Validate phone if required
      if (checkoutConfig.requirePhone && !contactInfo.phone?.trim()) {
        throw new Error('Phone number is required for shipping');
      }

      // Validate no unavailable items
      const unavailableItems = selectedItems.filter(item =>
        item.status === 'UNAVAILABLE' || item.status === 'OUT_OF_STOCK'
      );
      if (unavailableItems.length > 0) {
        throw new Error(`Cannot proceed: ${unavailableItems.length} item(s) are no longer available.`);
      }

      // Create order
      const createOrderData: CreateOrderRequest = {
        currency: localization.currency,
        items: selectedItems.map(item => ({
          productId: item.productId,
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
        billingAddress: {
          firstName: contactInfo.firstName,
          lastName: contactInfo.lastName,
          addressLine1: shippingAddress.addressLine1 || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.zip,
          country: shippingAddress.countryCode || shippingAddress.country || 'US',
          phone: contactInfo.phone
        },
        customerId: isAuthenticated && customer?.id ? customer.id : undefined,
        customerEmail: (isAuthenticated && customer?.email) || contactInfo.email,
        customerPhone: contactInfo.phone,
        shippingMethod: getShippingMethodName(selectedShippingMethod) || 'standard',
        shippingCarrier: selectedShippingMethod && 'carrier' in selectedShippingMethod ? selectedShippingMethod.carrier : undefined,
        shippingServiceCode: selectedShippingMethod && 'service' in selectedShippingMethod ? selectedShippingMethod.service : undefined,
        shippingCost: shippingCost,
        packageWeight: packageWeightKg,
        packageLength: packageDimensions?.length,
        packageWidth: packageDimensions?.width,
        packageHeight: packageDimensions?.height,
        shippingBaseRate: selectedShippingMethod && 'baseRate' in selectedShippingMethod ? selectedShippingMethod.baseRate : undefined,
        shippingMarkupAmount: selectedShippingMethod && 'markupAmount' in selectedShippingMethod ? selectedShippingMethod.markupAmount : undefined,
        shippingMarkupPercent: selectedShippingMethod && 'markupPercent' in selectedShippingMethod ? selectedShippingMethod.markupPercent : undefined,
        notes: orderNotes || undefined,
        isGiftOrder: isGiftOrder || undefined,
        giftMessage: isGiftOrder ? giftMessage : undefined,
        companyName: contactInfo.company || undefined,
        loyaltyPointsRedeemed: loyaltyPointsApplied > 0 ? loyaltyPointsApplied : undefined,
        loyaltyDiscount: loyaltyDiscount > 0 ? loyaltyDiscount : undefined,
      };

      const order = await createOrder(tenant.id, tenant.storefrontId, createOrderData);
      setPendingOrder({ id: order.id, orderNumber: order.orderNumber, total });

      // Create payment intent
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
        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) throw new Error('Failed to load Razorpay SDK');

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
          theme: { color: settings.primaryColor || '#000000' }
        });

        await confirmPayment(tenant.id, tenant.storefrontId, {
          paymentIntentId: paymentIntent.paymentIntentId,
          gatewayTransactionId: paymentResponse.razorpay_payment_id,
          signature: paymentResponse.razorpay_signature,
          paymentDetails: { razorpayOrderId: paymentResponse.razorpay_order_id }
        });

        // SECURITY: Poll for payment confirmation before clearing cart
        // This ensures the backend has processed the webhook and confirmed payment
        const confirmedOrder = await pollOrderPaymentStatus(
          tenant.id,
          tenant.storefrontId,
          order.id,
          5, // max 5 attempts
          1500 // 1.5 seconds between attempts
        );

        if (!confirmedOrder || !['PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(confirmedOrder.status.toUpperCase())) {
          // Payment not confirmed yet - show warning but proceed
          // The webhook will eventually update the order status
          console.warn('Payment confirmation pending, proceeding with order completion');
        }

        // IMPORTANT: Set navigation flag BEFORE clearing cart to prevent redirect race condition
        setIsNavigatingToSuccess(true);

        // Success - clear cart and redirect to success page
        removeSelectedItems();
        clearAppliedCoupon();
        clearGiftCards();

        // Record customer order (don't wait for it)
        if (isAuthenticated && customer?.id && accessToken) {
          recordCustomerOrder(tenant.id, tenant.storefrontId, customer.id, {
            orderId: order.id,
            orderNumber: order.orderNumber,
            totalAmount: total,
          }, accessToken).catch(console.warn);
        }

        // Redeem loyalty points after successful payment
        if (loyaltyPointsApplied > 0 && isAuthenticated && customer?.id) {
          redeemPoints(tenant.id, tenant.storefrontId, loyaltyPointsApplied, order.id, customer.id)
            .catch((err) => console.warn('Failed to redeem loyalty points:', err));
        }

        // Redirect to success page with payment session ID
        router.push(getNavPath(`/checkout/success?session_id=${paymentIntent.paymentIntentId}`));
        return;
      } else {
        // Stripe flow
        const stripeSessionUrl = paymentIntent.stripeSessionUrl || (paymentIntent.options?.sessionUrl as string);

        if (stripeSessionUrl) {
          window.location.href = stripeSessionUrl;
          return;
        }

        if (paymentIntent.stripeSessionId) {
          const isScriptLoaded = await loadStripeScript();
          if (!isScriptLoaded) throw new Error('Failed to load Stripe SDK');

          const publishableKey = paymentIntent.stripePublicKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
          if (!publishableKey) throw new Error('Stripe publishable key not configured');
          await initiateStripePayment(publishableKey, paymentIntent.stripeSessionId);
          return;
        }

        throw new Error('Failed to initialize Stripe session');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      let userMessage = 'Something went wrong during checkout. Please try again.';
      const errMsg = err.message?.toLowerCase() || '';

      if (errMsg.includes('cancelled') || errMsg.includes('canceled')) {
        userMessage = 'Payment was cancelled. You can try again when ready.';
      } else if (errMsg.includes('declined')) {
        userMessage = 'Your payment was declined. Please try a different payment method.';
      } else if (errMsg.includes('network') || errMsg.includes('timeout')) {
        userMessage = 'A network error occurred. Please check your connection and try again.';
      } else if (err.message) {
        userMessage = err.message;
      }

      setError(userMessage);
      setIsProcessing(false);
    }
  };

  // Retry payment handler
  const handleRetryPayment = async () => {
    if (!pendingOrder || !tenant) return;

    setError(null);
    setIsProcessing(true);

    try {
      const currency = localization.currency;
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
          theme: { color: settings.primaryColor || '#000000' }
        });

        await confirmPayment(tenant.id, tenant.storefrontId, {
          paymentIntentId: paymentIntent.paymentIntentId,
          gatewayTransactionId: paymentResponse.razorpay_payment_id,
          signature: paymentResponse.razorpay_signature,
          paymentDetails: { razorpayOrderId: paymentResponse.razorpay_order_id }
        });

        // SECURITY: Poll for payment confirmation before clearing cart
        await pollOrderPaymentStatus(
          tenant.id,
          tenant.storefrontId,
          pendingOrder.id,
          5,
          1500
        );

        // IMPORTANT: Set navigation flag BEFORE clearing cart to prevent redirect race condition
        setIsNavigatingToSuccess(true);

        removeSelectedItems();
        clearAppliedCoupon();
        clearGiftCards();

        // Redirect to success page with payment session ID
        router.push(getNavPath(`/checkout/success?session_id=${paymentIntent.paymentIntentId}`));
        return;
      } else {
        const stripeSessionUrl = paymentIntent.stripeSessionUrl || (paymentIntent.options?.sessionUrl as string);
        if (stripeSessionUrl) {
          window.location.href = stripeSessionUrl;
          return;
        }
        if (paymentIntent.stripeSessionId) {
          const isScriptLoaded = await loadStripeScript();
          if (!isScriptLoaded) throw new Error('Failed to load Stripe SDK');
          const publishableKey = paymentIntent.stripePublicKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
          if (!publishableKey) throw new Error('Stripe publishable key not configured');
          await initiateStripePayment(publishableKey, paymentIntent.stripeSessionId);
          return;
        }
        throw new Error('Failed to initialize Stripe session');
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  // Completed state
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

        {isGuestMode && !isAuthenticated && (
          <PostOrderCreateAccount
            open={showCreateAccountModal}
            onOpenChange={setShowCreateAccountModal}
            email={contactInfo.email}
            firstName={contactInfo.firstName}
            lastName={contactInfo.lastName}
            phone={contactInfo.phone}
            orderNumber={completedOrderNumber}
            onAccountCreated={() => window.location.reload()}
          />
        )}
      </>
    );
  }

  // Show loading state while waiting for hydration
  if (!isHydrated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-tenant-primary mb-4" />
        <p className="text-muted-foreground"><TranslatedUIText text="Loading checkout..." /></p>
      </div>
    );
  }

  // Empty cart state - redirect happens via useEffect, show loading while redirecting
  if (selectedItems.length === 0) {
    // If items exist in cart but none selected, go to cart
    if (items.length > 0) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-2xl font-bold mb-2"><TranslatedUIText text="No items selected for checkout" /></h1>
          <p className="text-muted-foreground mb-6">
            <TranslatedUIText text="Please select items in your cart to proceed with checkout." />
          </p>
          <Button asChild variant="tenant-gradient" size="lg">
            <Link href={getNavPath('/cart')}>
              <TranslatedUIText text="Go to Cart" />
            </Link>
          </Button>
        </div>
      );
    }

    // No items at all - redirect is happening, show loading
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-tenant-primary mb-4" />
        <p className="text-muted-foreground"><TranslatedUIText text="Redirecting..." /></p>
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

        {/* Progress Steps */}
        <CheckoutProgress />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Step Components */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {currentStep === 'contact' && (
                <CheckoutContactStep
                  key="contact"
                  isAuthenticated={isAuthenticated}
                  customerEmail={customer?.email}
                  customerName={customer?.firstName ? `${customer.firstName} ${customer.lastName || ''}`.trim() : undefined}
                  customerPhone={customer?.phone}
                />
              )}

              {currentStep === 'shipping' && (
                <CheckoutShippingStep
                  key="shipping"
                  isAuthenticated={isAuthenticated}
                  orderSubtotal={subtotal}
                  packageWeight={packageWeightKg}
                  packageDimensions={packageDimensions}
                  isLoadingProductShipping={isLoadingProductShipping}
                  shipping={shipping}
                  tax={tax}
                  enabledPaymentMethods={enabledPaymentMethods}
                  selectedPaymentMethod={selectedPaymentMethod}
                  onPaymentMethodSelect={setSelectedPaymentMethod}
                  isLoadingPaymentMethods={isLoadingPaymentMethods}
                />
              )}

              {currentStep === 'review' && (
                <CheckoutReviewStep
                  key="review"
                  selectedItems={selectedItems}
                  gatewayType={gatewayType}
                  subtotal={subtotal}
                  shipping={shipping}
                  tax={tax}
                  discount={discount}
                  loyaltyDiscount={loyaltyDiscount}
                  giftCardDiscount={giftCardDiscount}
                  total={total}
                  onPlaceOrder={handlePlaceOrder}
                  onRetryPayment={handleRetryPayment}
                  onRemoveItem={removeItem}
                  onUpdateQuantity={updateQuantity}
                  selectedPaymentMethodName={
                    selectedPaymentMethod
                      ? enabledPaymentMethods.find(m => m.code === selectedPaymentMethod)?.displayName ||
                        enabledPaymentMethods.find(m => m.code === selectedPaymentMethod)?.name
                      : undefined
                  }
                  selectedPaymentMethodProvider={
                    selectedPaymentMethod
                      ? enabledPaymentMethods.find(m => m.code === selectedPaymentMethod)?.provider
                      : undefined
                  }
                />
              )}
            </AnimatePresence>
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
                      <span className="text-muted-foreground text-xs"><TranslatedUIText text="Calculated at shipping" /></span>
                    ) : shipping === 0 ? (
                      <TranslatedUIText text="FREE" />
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span><TranslatedUIText text="Coupon" /></span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-yellow-600">
                    <span><TranslatedUIText text="Loyalty Points" /></span>
                    <span>-{formatPrice(loyaltyDiscount)}</span>
                  </div>
                )}
                {giftCardDiscount > 0 && (
                  <div className="flex justify-between text-purple-600">
                    <span><TranslatedUIText text="Gift Card" /></span>
                    <span>-{formatPrice(giftCardDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    <TranslatedUIText text="Tax" />
                    {taxResult?.isEstimate && <span className="text-xs ml-1">(est.)</span>}
                  </span>
                  {isTaxLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : !taxResult ? (
                    <span className="text-sm text-muted-foreground"><TranslatedUIText text="Calculated at checkout" /></span>
                  ) : (
                    <span>{formatPrice(tax)}</span>
                  )}
                </div>
                {/* GST Breakdown for India */}
                {taxResult?.gstSummary && !taxResult.isEstimate && (
                  <div className="ml-4 text-xs text-muted-foreground space-y-1">
                    {taxResult.gstSummary.isInterstate ? (
                      <div className="flex justify-between">
                        <span>IGST ({taxResult.taxBreakdown?.find(t => t.taxType === 'IGST')?.rate || 18}%)</span>
                        <span>{formatPrice(taxResult.gstSummary.igst)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span>CGST ({taxResult.taxBreakdown?.find(t => t.taxType === 'CGST')?.rate || 9}%)</span>
                          <span>{formatPrice(taxResult.gstSummary.cgst)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SGST ({taxResult.taxBreakdown?.find(t => t.taxType === 'SGST')?.rate || 9}%)</span>
                          <span>{formatPrice(taxResult.gstSummary.sgst)}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {/* Tax Breakdown for other regions */}
                {taxResult?.taxBreakdown && taxResult.taxBreakdown.length > 0 && !taxResult.gstSummary && !taxResult.isEstimate && (
                  <div className="ml-4 text-xs text-muted-foreground space-y-1">
                    {taxResult.taxBreakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.jurisdictionName} ({item.rate}%)</span>
                        <span>{formatPrice(item.taxAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discounts & Rewards */}
              <Separator className="my-4" />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  <TranslatedUIText text="Discounts & Rewards" />
                </h3>

                {/* Coupon Code */}
                <CouponInput
                  orderValue={subtotal}
                  appliedCoupon={appliedCoupon}
                  onApply={setAppliedCoupon}
                  onRemove={clearAppliedCoupon}
                  disabled={isProcessing}
                />

                {/* Gift Card */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5 text-purple-600" />
                    <span className="text-xs font-medium"><TranslatedUIText text="Gift Card" /></span>
                  </div>
                  <GiftCardInput
                    orderTotal={total + giftCardDiscount}
                    appliedGiftCards={appliedGiftCards}
                    onApply={addGiftCard}
                    onRemove={removeGiftCard}
                    onUpdateAmount={updateGiftCardAmount}
                    disabled={isProcessing}
                  />
                </div>

                {/* Loyalty Points */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-yellow-600" />
                    <span className="text-xs font-medium"><TranslatedUIText text="Loyalty Points" /></span>
                  </div>
                  <LoyaltyPointsRedemption
                    orderSubtotal={subtotal}
                    appliedPoints={loyaltyPointsApplied}
                    onApplyPoints={(points, dollarValue) => setLoyaltyPoints(points, dollarValue)}
                    onRemovePoints={() => setLoyaltyPoints(0, 0)}
                    disabled={isProcessing}
                  />
                </div>
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

              {isConverted && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  <TranslatedUIText text="Prices shown in" /> {displayCurrency}. <TranslatedUIText text="You will be charged in" /> {storeCurrency}.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Order Summary - Floating at bottom */}
      <MobileOrderSummary
        itemCount={selectedItems.length}
        total={total}
        formatPrice={formatPrice}
      >
        <div className="space-y-3 mb-3">
          {selectedItems.slice(0, 3).map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="relative w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={item.image || '/placeholder.svg'}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.quantity} × {formatPrice(item.price)}</p>
              </div>
            </div>
          ))}
          {selectedItems.length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{selectedItems.length - 3} <TranslatedUIText text="more items" />
            </p>
          )}
        </div>
        <Separator className="my-3" />
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground"><TranslatedUIText text="Subtotal" /></span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {selectedShippingMethod && (
            <div className="flex justify-between">
              <span className="text-muted-foreground"><TranslatedUIText text="Shipping" /></span>
              <span>{shipping === 0 ? <TranslatedUIText text="FREE" /> : formatPrice(shipping)}</span>
            </div>
          )}
          {tax > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground"><TranslatedUIText text="Tax" /></span>
              <span>{formatPrice(tax)}</span>
            </div>
          )}
        </div>
      </MobileOrderSummary>

      {/* Spacer for mobile to prevent content hiding behind fixed summary */}
      <div className="lg:hidden h-16" />
    </div>
  );
}

export default function CheckoutPage() {
  const { customer, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();

  // Wait for auth session validation before rendering checkout
  // This prevents the guest banner from flashing for authenticated users
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <CheckoutProvider
      isAuthenticated={isAuthenticated}
      customerEmail={customer?.email}
      customerFirstName={customer?.firstName}
      customerLastName={customer?.lastName}
      customerPhone={customer?.phone}
    >
      <CheckoutContent />
    </CheckoutProvider>
  );
}
