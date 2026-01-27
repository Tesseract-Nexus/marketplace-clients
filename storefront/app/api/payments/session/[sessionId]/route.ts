import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

// Use config for service URLs - removes /api/v1 suffix if present
const PAYMENT_SERVICE_URL = config.api.paymentService.replace(/\/api\/v1\/?$/, '');
const ORDERS_SERVICE_URL = config.api.ordersService.replace(/\/api\/v1\/?$/, '');

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  totalPrice: number;
  imageUrl?: string;
}

interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

interface ShippingInfo {
  method?: string;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  cost?: number;
}

interface SessionDetails {
  sessionId: string;
  paymentStatus: 'pending' | 'processing' | 'succeeded' | 'failed';
  orderId?: string;
  orderNumber?: string;
  orderDate?: string;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  isGuest?: boolean;
  // Full order details
  items?: OrderItem[];
  subtotal?: number;
  discount?: number;
  tax?: number;
  shippingCost?: number;
  total?: number;
  shippingAddress?: ShippingAddress;
  shipping?: ShippingInfo;
  paymentMethod?: string;
}

// GET /api/payments/session/[sessionId] - Get Stripe session details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    console.log('[BFF] Fetching session details for:', sessionId);

    // First, try to get payment details from payment service by session ID
    const paymentResponse = await fetch(
      `${PAYMENT_SERVICE_URL}/api/v1/payments/by-gateway-id/${sessionId}`,
      {
        headers: {
          'X-Tenant-ID': tenantId,
          ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
        },
      }
    );

    let paymentData: any = null;
    if (paymentResponse.ok) {
      paymentData = await paymentResponse.json();
      console.log('[BFF] Payment data found:', paymentData.id, 'status:', paymentData.status);
    } else {
      console.log('[BFF] Payment not found by session ID, status:', paymentResponse.status);
    }

    // Build response
    const sessionDetails: SessionDetails = {
      sessionId,
      paymentStatus: paymentData?.status || 'pending',
      orderId: paymentData?.orderId,
      amount: paymentData?.amount,
      currency: paymentData?.currency,
      customerEmail: paymentData?.billingEmail,
      customerName: paymentData?.billingName,
    };

    // If we have an order ID, fetch order details
    if (paymentData?.orderId) {
      try {
        const orderResponse = await fetch(
          `${ORDERS_SERVICE_URL}/api/v1/orders/${paymentData.orderId}`,
          {
            headers: {
              'X-Tenant-ID': tenantId,
              ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
            },
          }
        );

        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          sessionDetails.orderNumber = orderData.orderNumber;
          sessionDetails.orderDate = orderData.createdAt;
          sessionDetails.customerEmail = orderData.customerEmail || sessionDetails.customerEmail;
          sessionDetails.isGuest = !orderData.customerId;

          // Get customer name from shipping address if not set
          if (!sessionDetails.customerName && orderData.shippingAddress) {
            const addr = orderData.shippingAddress;
            sessionDetails.customerName = `${addr.firstName || ''} ${addr.lastName || ''}`.trim();
          }

          // Include full order details
          sessionDetails.items = (orderData.items || []).map((item: any) => ({
            id: item.id,
            productId: item.productId,
            name: item.name || item.productName,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price || item.unitPrice,
            totalPrice: item.totalPrice || (item.quantity * (item.price || item.unitPrice)),
            imageUrl: item.imageUrl || item.image,
          }));

          sessionDetails.subtotal = orderData.subtotal;
          sessionDetails.discount = orderData.discount || 0;
          sessionDetails.tax = orderData.tax || 0;
          sessionDetails.shippingCost = orderData.shippingCost || orderData.shipping?.cost || 0;
          sessionDetails.total = orderData.total;

          // Shipping address
          if (orderData.shippingAddress) {
            sessionDetails.shippingAddress = {
              firstName: orderData.shippingAddress.firstName,
              lastName: orderData.shippingAddress.lastName,
              addressLine1: orderData.shippingAddress.addressLine1 || orderData.shippingAddress.line1,
              addressLine2: orderData.shippingAddress.addressLine2 || orderData.shippingAddress.line2,
              city: orderData.shippingAddress.city,
              state: orderData.shippingAddress.state,
              postalCode: orderData.shippingAddress.postalCode || orderData.shippingAddress.zip,
              country: orderData.shippingAddress.country,
              phone: orderData.shippingAddress.phone,
            };
          }

          // Shipping info
          if (orderData.shipping) {
            sessionDetails.shipping = {
              method: orderData.shipping.method || orderData.shipping.serviceName,
              carrier: orderData.shipping.carrier || orderData.shipping.carrierName,
              trackingNumber: orderData.shipping.trackingNumber,
              estimatedDelivery: orderData.shipping.estimatedDelivery,
              cost: orderData.shipping.cost,
            };
          }

          // Payment method
          sessionDetails.paymentMethod = orderData.paymentMethod || paymentData?.paymentMethod;
        }
      } catch (orderError) {
        console.warn('[BFF] Failed to fetch order details:', orderError);
      }
    }

    return NextResponse.json(sessionDetails);
  } catch (error) {
    console.error('[BFF] Failed to fetch session details:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
