import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { config } from '@/lib/config';

/**
 * Razorpay Webhook Handler
 *
 * This endpoint receives payment events from Razorpay and updates order/payment status.
 * Razorpay sends webhooks for:
 * - payment.authorized: Payment authorized but not captured
 * - payment.captured: Payment successfully captured
 * - payment.failed: Payment failed
 * - refund.created: Refund initiated
 * - refund.processed: Refund completed
 *
 * Setup in Razorpay Dashboard:
 * 1. Go to Settings → Webhooks
 * 2. Add webhook URL: https://{storefront-domain}/api/webhooks/razorpay
 * 3. Select events: payment.captured, payment.failed, refund.processed
 * 4. Copy the webhook secret and set RAZORPAY_WEBHOOK_SECRET env var
 */

const PAYMENT_SERVICE_URL = config.api.paymentService.replace(/\/api\/v1\/?$/, '');
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

interface RazorpayWebhookEvent {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        method: string;
        description?: string;
        email?: string;
        contact?: string;
        notes?: Record<string, string>;
        error_code?: string;
        error_description?: string;
        error_reason?: string;
      };
    };
    refund?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        payment_id: string;
        notes?: Record<string, string>;
        status: string;
      };
    };
  };
  created_at: number;
}

/**
 * Verify Razorpay webhook signature
 */
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();

    // Verify webhook signature
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('[Razorpay Webhook] Missing signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    if (!RAZORPAY_WEBHOOK_SECRET) {
      // SECURITY: Always require webhook secret - fail hard in all environments
      console.error('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    } else {
      // Verify signature
      const isValid = verifyWebhookSignature(body, signature, RAZORPAY_WEBHOOK_SECRET);
      if (!isValid) {
        console.error('[Razorpay Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Parse event
    let event: RazorpayWebhookEvent;
    try {
      event = JSON.parse(body);
    } catch {
      console.error('[Razorpay Webhook] Invalid JSON body');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('[Razorpay Webhook] Received event:', event.event);

    // Handle different event types
    switch (event.event) {
      case 'payment.captured': {
        const payment = event.payload.payment?.entity;
        if (!payment) {
          console.error('[Razorpay Webhook] No payment entity in event');
          break;
        }

        console.log('[Razorpay Webhook] Payment captured:', payment.id);

        // Forward to payment service for processing
        const response = await fetch(`${PAYMENT_SERVICE_URL}/api/v1/webhooks/razorpay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'payment.captured',
            paymentId: payment.id,
            orderId: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            method: payment.method,
            email: payment.email,
            contact: payment.contact,
            notes: payment.notes,
          }),
        });

        if (!response.ok) {
          console.error('[Razorpay Webhook] Failed to forward to payment service:', response.status);
        }
        break;
      }

      case 'payment.failed': {
        const payment = event.payload.payment?.entity;
        if (!payment) {
          console.error('[Razorpay Webhook] No payment entity in event');
          break;
        }

        console.log('[Razorpay Webhook] Payment failed:', payment.id, payment.error_code);

        // Forward to payment service for processing
        const response = await fetch(`${PAYMENT_SERVICE_URL}/api/v1/webhooks/razorpay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'payment.failed',
            paymentId: payment.id,
            orderId: payment.order_id,
            errorCode: payment.error_code,
            errorDescription: payment.error_description,
            errorReason: payment.error_reason,
          }),
        });

        if (!response.ok) {
          console.error('[Razorpay Webhook] Failed to forward to payment service:', response.status);
        }
        break;
      }

      case 'refund.processed': {
        const refund = event.payload.refund?.entity;
        if (!refund) {
          console.error('[Razorpay Webhook] No refund entity in event');
          break;
        }

        console.log('[Razorpay Webhook] Refund processed:', refund.id);

        // Forward to payment service for processing
        const response = await fetch(`${PAYMENT_SERVICE_URL}/api/v1/webhooks/razorpay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'refund.processed',
            refundId: refund.id,
            paymentId: refund.payment_id,
            amount: refund.amount,
            currency: refund.currency,
            status: refund.status,
            notes: refund.notes,
          }),
        });

        if (!response.ok) {
          console.error('[Razorpay Webhook] Failed to forward to payment service:', response.status);
        }
        break;
      }

      default:
        console.log('[Razorpay Webhook] Unhandled event type:', event.event);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Razorpay Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
