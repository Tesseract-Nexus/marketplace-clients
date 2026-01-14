import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

// Use config for service URLs - removes /api/v1 suffix if present
const PAYMENT_SERVICE_URL = config.api.paymentService.replace(/\/api\/v1\/?$/, '');
const ORDERS_SERVICE_URL = config.api.ordersService.replace(/\/api\/v1\/?$/, '');

interface SessionDetails {
  sessionId: string;
  paymentStatus: 'pending' | 'processing' | 'succeeded' | 'failed';
  orderId?: string;
  orderNumber?: string;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  isGuest?: boolean;
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
          sessionDetails.customerEmail = orderData.customerEmail || sessionDetails.customerEmail;
          sessionDetails.isGuest = !orderData.customerId;

          // Get customer name from shipping address if not set
          if (!sessionDetails.customerName && orderData.shippingAddress) {
            const addr = orderData.shippingAddress;
            sessionDetails.customerName = `${addr.firstName || ''} ${addr.lastName || ''}`.trim();
          }
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
