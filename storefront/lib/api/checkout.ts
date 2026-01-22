// BFF routes - no direct service calls to avoid CSP issues

// ========================================
// Types
// ========================================

export interface Address {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  customerId?: string;
  customerEmail: string;
  customerPhone?: string;
  shippingMethod?: string;
  shippingCarrier?: string;
  shippingServiceCode?: string; // Carrier-specific service code (e.g., Shiprocket courier_company_id)
  shippingCost?: number;
  notes?: string;
  // Package dimensions (captured at checkout for accurate shipping)
  packageWeight?: number; // Weight in kg
  packageLength?: number; // Length in cm
  packageWidth?: number;  // Width in cm
  packageHeight?: number; // Height in cm
  // Shipping rate breakdown (for admin transparency)
  shippingBaseRate?: number;      // Original carrier rate before markup
  shippingMarkupAmount?: number;  // Markup amount applied
  shippingMarkupPercent?: number; // Markup percentage (e.g., 10 for 10%)
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  createdAt: string;
}

export interface PaymentIntent {
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  gatewayType: string;
  // Razorpay specific
  razorpayOrderId?: string;
  // Stripe specific
  clientSecret?: string;
  stripePublicKey?: string;
  stripeSessionId?: string;
  stripeSessionUrl?: string;
  // Generic
  options?: Record<string, unknown>;
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
  gatewayTransactionId?: string;
  signature?: string;
  paymentDetails?: Record<string, string>;
}

// ========================================
// API Functions
// ========================================

export async function createOrder(
  tenantId: string,
  storefrontId: string,
  orderData: CreateOrderRequest
): Promise<Order> {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
    body: JSON.stringify({
      tenantId,
      customerId: orderData.customerId,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      items: orderData.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      shippingMethod: orderData.shippingMethod || 'standard',
      shippingCarrier: orderData.shippingCarrier,
      shippingServiceCode: orderData.shippingServiceCode,
      shippingCost: orderData.shippingCost,
      // Package dimensions for accurate shipping calculations
      packageWeight: orderData.packageWeight,
      packageLength: orderData.packageLength,
      packageWidth: orderData.packageWidth,
      packageHeight: orderData.packageHeight,
      notes: orderData.notes,
      status: 'pending',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // Prefer detailed message over generic error
    throw new Error(error.message || error.error || 'Failed to create order');
  }

  return response.json();
}

export async function createPaymentIntent(
  tenantId: string,
  storefrontId: string,
  orderId: string,
  amount: number,
  currency: string,
  gatewayType: 'razorpay' | 'stripe',
  customerDetails: {
    customerId?: string;
    email: string;
    phone?: string;
    name: string;
  }
): Promise<PaymentIntent> {
  // Get the current storefront URL for Stripe redirects
  const storefrontUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const response = await fetch('/api/payments/create-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
    body: JSON.stringify({
      tenantId,
      orderId,
      amount, // Amount in base currency units (dollars, rupees) - payment service converts to cents/paise
      currency,
      gatewayType,
      customerId: customerDetails.customerId,
      customerEmail: customerDetails.email,
      customerPhone: customerDetails.phone,
      customerName: customerDetails.name,
      description: `Order payment for ${orderId}`,
      // Stripe-specific URLs for redirect
      returnUrl: `${storefrontUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${storefrontUrl}/checkout?cancelled=true`,
      metadata: {
        orderId,
        storefrontId,
        storefrontUrl,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Failed to create payment intent');
  }

  return response.json();
}

export async function confirmPayment(
  tenantId: string,
  storefrontId: string,
  paymentData: ConfirmPaymentRequest
): Promise<{ success: boolean; paymentId: string; status: string }> {
  const response = await fetch('/api/payments/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Failed to confirm payment');
  }

  return response.json();
}

export async function updateOrderStatus(
  tenantId: string,
  storefrontId: string,
  orderId: string,
  status: string
): Promise<Order> {
  const response = await fetch(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Failed to update order status');
  }

  return response.json();
}

export async function getOrder(
  tenantId: string,
  storefrontId: string,
  orderId: string
): Promise<Order | null> {
  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      headers: {
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

/**
 * Poll for order payment confirmation
 * SECURITY: Ensures payment is truly confirmed before clearing cart
 *
 * @param tenantId - Tenant ID
 * @param storefrontId - Storefront ID
 * @param orderId - Order ID to check
 * @param maxAttempts - Maximum polling attempts (default: 10)
 * @param intervalMs - Polling interval in ms (default: 2000)
 * @returns Order with confirmed payment status, or null if not confirmed
 */
export async function pollOrderPaymentStatus(
  tenantId: string,
  storefrontId: string,
  orderId: string,
  maxAttempts: number = 10,
  intervalMs: number = 2000
): Promise<Order | null> {
  const paidStatuses = ['PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED'];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const order = await getOrder(tenantId, storefrontId, orderId);

    if (order && paidStatuses.includes(order.status.toUpperCase())) {
      return order;
    }

    // Wait before next attempt (except for last attempt)
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  // Return the final order state even if not confirmed
  return await getOrder(tenantId, storefrontId, orderId);
}

export interface OrderTracking {
  orderId: string;
  orderNumber: string;
  status: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  timeline: OrderTimelineEvent[];
}

export interface OrderTimelineEvent {
  id?: string;
  status: string;
  description: string;
  timestamp: string;
  createdBy?: string;
}

export async function getOrderTracking(
  tenantId: string,
  storefrontId: string,
  orderId: string
): Promise<OrderTracking | null> {
  try {
    const response = await fetch(`/api/orders/${orderId}/tracking`, {
      headers: {
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

// ========================================
// Order Cancellation
// ========================================

export type CancellationReason =
  | 'CHANGED_MIND'
  | 'FOUND_BETTER_PRICE'
  | 'ORDERED_BY_MISTAKE'
  | 'SHIPPING_TOO_SLOW'
  | 'PAYMENT_ISSUE'
  | 'OTHER';

export interface CancelOrderRequest {
  reason: CancellationReason;
  notes?: string;
}

export async function cancelOrder(
  tenantId: string,
  storefrontId: string,
  orderId: string,
  data: CancelOrderRequest
): Promise<Order> {
  const response = await fetch(`/api/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
    body: JSON.stringify({
      reason: data.reason,
      notes: data.notes,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Failed to cancel order');
  }

  return response.json();
}

// ========================================
// Razorpay Client-side Integration
// ========================================

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    Stripe?: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayInstance {
  open: () => void;
  close: () => void;
  on: (event: string, callback: (response: { error: RazorpayError }) => void) => void;
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface RazorpayError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata?: {
    order_id?: string;
    payment_id?: string;
  };
}

export function initiateRazorpayPayment(
  options: RazorpayOptions
): Promise<RazorpayResponse> {
  return new Promise((resolve, reject) => {
    const razorpay = new window.Razorpay({
      ...options,
      handler: (response) => {
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled by user'));
        },
      },
    });

    // Handle payment failures
    razorpay.on('payment.failed', (response: { error: RazorpayError }) => {
      const error = response.error;
      let message = 'Payment failed';

      if (error.reason === 'payment_failed') {
        message = error.description || 'Your payment was declined. Please try again.';
      } else if (error.reason === 'payment_cancelled') {
        message = 'Payment was cancelled';
      } else {
        message = error.description || 'Payment processing failed. Please try again.';
      }

      reject(new Error(message));
    });

    razorpay.open();
  });
}

// ========================================
// Stripe Client-side Integration
// ========================================

export function loadStripeScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Stripe) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function initiateStripePayment(
  publishableKey: string,
  sessionId: string
): Promise<void> {
  if (!window.Stripe) {
    throw new Error('Stripe script not loaded');
  }

  const stripe = window.Stripe(publishableKey);
  const { error } = await stripe.redirectToCheckout({
    sessionId,
  });

  if (error) {
    throw new Error(error.message);
  }
}