'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Check, Loader2 } from 'lucide-react';
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
import { ShippingMethod, ShippingRate } from '@/lib/api/shipping';
import { CheckoutProvider, useCheckout } from '@/context/CheckoutContext';
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress';
import {
  CheckoutContactStep,
  CheckoutShippingStep,
  CheckoutPaymentStep,
  CheckoutReviewStep,
} from '@/components/checkout/steps';
import { PostOrderCreateAccount } from '@/components/checkout/PostOrderCreateAccount';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

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
  const { formatDisplayPrice, formatStorePrice, isConverted, displayCurrency, storeCurrency } = usePriceFormatting();

  const {
    items,
    getSelectedItems,
    removeSelectedItems,
    appliedCoupon,
    clearAppliedCoupon,
    appliedGiftCards,
    getGiftCardTotal,
    clearGiftCards,
  } = useCartStore();

  const selectedItemsRaw = getSelectedItems();
  const selectedItems = useMemo(() => selectedItemsRaw, [JSON.stringify(selectedItemsRaw)]);

  const { customer, accessToken } = useAuthStore();
  const isAuthenticated = !!(customer && accessToken);

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
    isProcessing,
    setIsProcessing,
    error,
    setError,
    pendingOrder,
    setPendingOrder,
  } = useCheckout();

  // Product shipping data cache
  const [productShippingCache, setProductShippingCache] = useState<Record<string, ProductShippingData>>({});
  const [isLoadingProductShipping, setIsLoadingProductShipping] = useState(true);

  // Order completion state
  const [isComplete, setIsComplete] = useState(false);
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | undefined>();
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);

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

  // Determine customer's region for payment method filtering
  // Priority: 1. Shipping address country, 2. Customer profile country, 3. Store localization
  const customerRegion = useMemo(() => {
    // If shipping address is filled, use that country
    if (shippingAddress.countryCode) {
      return shippingAddress.countryCode;
    }
    // Fall back to customer's profile country if available
    if (customer?.countryCode) {
      return customer.countryCode;
    }
    // Finally, fall back to store's localization
    return localization.countryCode || localization.country || '';
  }, [shippingAddress.countryCode, customer?.countryCode, localization.countryCode, localization.country]);

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
    const fetchPaymentMethods = async () => {
      try {
        setIsLoadingPaymentMethods(true);
        // Use customer's region for filtering payment methods
        const region = customerRegion || '';
        const response = await fetch(`/api/payments/methods${region ? `?region=${region}` : ''}`);

        if (response.ok) {
          const data = await response.json();
          const methods = data.paymentMethods || [];
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
  }, [customerRegion]); // Re-fetch when customer's region changes (e.g., shipping address updated)

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
  const tax = taxResult?.taxAmount ?? subtotal * 0.08;
  const discount = appliedCoupon?.discountAmount ?? 0;
  const giftCardDiscount = getGiftCardTotal();
  const total = Math.max(0, subtotal + shipping + tax - discount - loyaltyDiscount - giftCardDiscount);

  // Calculate tax when shipping address changes
  useEffect(() => {
    if (taxCalculationRef.current) clearTimeout(taxCalculationRef.current);

    if (shippingAddress.city && shippingAddress.state && shippingAddress.zip && selectedItems.length > 0) {
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
      if (taxCalculationRef.current) clearTimeout(taxCalculationRef.current);
    };
  }, [shippingAddress.city, shippingAddress.state, shippingAddress.zip, selectedItems, shipping, calculateTax]);

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
        customerEmail: contactInfo.email,
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

        // Success - now safe to clear cart
        removeSelectedItems();
        clearAppliedCoupon();
        clearGiftCards();
        setPendingOrder(null);
        setCompletedOrderNumber(order.orderNumber);
        setIsComplete(true);

        // Record customer order
        if (isAuthenticated && customer?.id && accessToken) {
          recordCustomerOrder(tenant.id, tenant.storefrontId, customer.id, {
            orderId: order.id,
            orderNumber: order.orderNumber,
            totalAmount: total,
          }, accessToken).catch(console.warn);
        }

        // Show create account modal for guests
        if (isGuestMode && !isAuthenticated) {
          setTimeout(() => setShowCreateAccountModal(true), 1000);
        }
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

          const publishableKey = paymentIntent.stripePublicKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';
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

        removeSelectedItems();
        clearAppliedCoupon();
        clearGiftCards();
        setCompletedOrderNumber(pendingOrder.orderNumber);
        setPendingOrder(null);
        setIsComplete(true);
      } else {
        const stripeSessionUrl = paymentIntent.stripeSessionUrl || (paymentIntent.options?.sessionUrl as string);
        if (stripeSessionUrl) {
          window.location.href = stripeSessionUrl;
          return;
        }
        if (paymentIntent.stripeSessionId) {
          const isScriptLoaded = await loadStripeScript();
          if (!isScriptLoaded) throw new Error('Failed to load Stripe SDK');
          const publishableKey = paymentIntent.stripePublicKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';
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

  // Empty cart state
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
                />
              )}

              {currentStep === 'payment' && (
                <CheckoutPaymentStep
                  key="payment"
                  gatewayType={gatewayType}
                  orderSubtotal={subtotal}
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
                  ) : (
                    <span>{formatPrice(tax)}</span>
                  )}
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
    </div>
  );
}

export default function CheckoutPage() {
  const { customer, accessToken } = useAuthStore();
  const isAuthenticated = !!(customer && accessToken);

  return (
    <CheckoutProvider
      isAuthenticated={isAuthenticated}
      customerEmail={customer?.email}
    >
      <CheckoutContent />
    </CheckoutProvider>
  );
}
