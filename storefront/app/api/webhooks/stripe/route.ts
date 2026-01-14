import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { config } from '@/lib/config';

/**
 * Stripe Webhook Handler
 *
 * This endpoint receives payment events from Stripe and updates order/payment status.
 * Stripe sends webhooks for:
 * - checkout.session.completed: Checkout session completed successfully
 * - checkout.session.expired: Checkout session expired
 * - payment_intent.succeeded: Payment intent succeeded
 * - payment_intent.payment_failed: Payment intent failed
 * - charge.refunded: Charge was refunded
 *
 * Setup in Stripe Dashboard:
 * 1. Go to Developers → Webhooks
 * 2. Add endpoint: https://{storefront-domain}/api/webhooks/stripe
 * 3. Select events: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed
 * 4. Copy the webhook signing secret and set STRIPE_WEBHOOK_SECRET env var
 */

const PAYMENT_SERVICE_URL = config.api.paymentService.replace(/\/api\/v1\/?$/, '');
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

interface StripeWebhookEvent {
  id: string;
  object: string;
  api_version: string;
  created: number;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
  livemode: boolean;
}

/**
 * Verify Stripe webhook signature
 * Stripe uses a timestamp-based signature scheme
 */
function verifyWebhookSignature(
  payload: string,
  sigHeader: string,
  secret: string
): boolean {
  const parts = sigHeader.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.slice(2);
  const signatures = parts
    .filter(p => p.startsWith('v1='))
    .map(p => p.slice(3));

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  // Check timestamp tolerance (5 minutes)
  const timestampMs = parseInt(timestamp, 10) * 1000;
  const tolerance = 5 * 60 * 1000;
  if (Math.abs(Date.now() - timestampMs) > tolerance) {
    console.warn('[Stripe Webhook] Timestamp outside tolerance');
    return false;
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Check if any signature matches
  return signatures.some(sig => {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(sig),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();

    // Verify webhook signature
    const sigHeader = request.headers.get('stripe-signature');

    if (!sigHeader) {
      console.error('[Stripe Webhook] Missing signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
      // In development, allow webhooks without verification
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
      }
    } else {
      // Verify signature
      const isValid = verifyWebhookSignature(body, sigHeader, STRIPE_WEBHOOK_SECRET);
      if (!isValid) {
        console.error('[Stripe Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Parse event
    let event: StripeWebhookEvent;
    try {
      event = JSON.parse(body);
    } catch {
      console.error('[Stripe Webhook] Invalid JSON body');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('[Stripe Webhook] Received event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          id: string;
          payment_intent?: string;
          payment_status: string;
          status: string;
          amount_total?: number;
          currency?: string;
          customer_email?: string;
          metadata?: Record<string, string>;
        };

        console.log('[Stripe Webhook] Checkout session completed:', session.id);

        // Forward to payment service for processing
        const response = await fetch(`${PAYMENT_SERVICE_URL}/api/v1/webhooks/stripe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'checkout.session.completed',
            sessionId: session.id,
            paymentIntentId: session.payment_intent,
            paymentStatus: session.payment_status,
            status: session.status,
            amountTotal: session.amount_total,
            currency: session.currency,
            customerEmail: session.customer_email,
            metadata: session.metadata,
          }),
        });

        if (!response.ok) {
          console.error('[Stripe Webhook] Failed to forward to payment service:', response.status);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as {
          id: string;
          metadata?: Record<string, string>;
        };

        console.log('[Stripe Webhook] Checkout session expired:', session.id);

        // Forward to payment service
        const response = await fetch(`${PAYMENT_SERVICE_URL}/api/v1/webhooks/stripe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'checkout.session.expired',
            sessionId: session.id,
            metadata: session.metadata,
          }),
        });

        if (!response.ok) {
          console.error('[Stripe Webhook] Failed to forward to payment service:', response.status);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as {
          id: string;
          amount: number;
          currency: string;
          status: string;
          metadata?: Record<string, string>;
        };

        console.log('[Stripe Webhook] Payment intent succeeded:', paymentIntent.id);

        // Forward to payment service
        const response = await fetch(`${PAYMENT_SERVICE_URL}/api/v1/webhooks/stripe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'payment_intent.succeeded',
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            metadata: paymentIntent.metadata,
          }),
        });

        if (!response.ok) {
          console.error('[Stripe Webhook] Failed to forward to payment service:', response.status);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as {
          id: string;
          last_payment_error?: {
            code?: string;
            message?: string;
            type?: string;
          };
          metadata?: Record<string, string>;
        };

        console.log('[Stripe Webhook] Payment intent failed:', paymentIntent.id);

        // Forward to payment service
        const response = await fetch(`${PAYMENT_SERVICE_URL}/api/v1/webhooks/stripe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'payment_intent.payment_failed',
            paymentIntentId: paymentIntent.id,
            errorCode: paymentIntent.last_payment_error?.code,
            errorMessage: paymentIntent.last_payment_error?.message,
            errorType: paymentIntent.last_payment_error?.type,
            metadata: paymentIntent.metadata,
          }),
        });

        if (!response.ok) {
          console.error('[Stripe Webhook] Failed to forward to payment service:', response.status);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as {
          id: string;
          payment_intent?: string;
          amount_refunded: number;
          currency: string;
          refunded: boolean;
          metadata?: Record<string, string>;
        };

        console.log('[Stripe Webhook] Charge refunded:', charge.id);

        // Forward to payment service
        const response = await fetch(`${PAYMENT_SERVICE_URL}/api/v1/webhooks/stripe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'charge.refunded',
            chargeId: charge.id,
            paymentIntentId: charge.payment_intent,
            amountRefunded: charge.amount_refunded,
            currency: charge.currency,
            fullyRefunded: charge.refunded,
            metadata: charge.metadata,
          }),
        });

        if (!response.ok) {
          console.error('[Stripe Webhook] Failed to forward to payment service:', response.status);
        }
        break;
      }

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
