import { NextRequest, NextResponse } from 'next/server';

/**
 * Payment Service URL - source of truth for gateway configurations
 * This connects directly to the Payment Service which stores gateway configs
 * configured via the Admin panel (with credentials in GCP Secret Manager)
 */
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:8080';

/**
 * Gateway response from Payment Service
 */
interface GatewayOption {
  gatewayType: string;
  displayName: string;
  isEnabled: boolean;
  isTestMode: boolean;
  isPrimary: boolean;
  priority: number;
  paymentMethods: PaymentMethodInfo[];
}

interface PaymentMethodInfo {
  type: string;
  displayName: string;
  icon: string;
  gatewayType: string;
}

/**
 * Payment method response format expected by storefront checkout
 */
interface EnabledPaymentMethod {
  code: string;
  name: string;
  description: string;
  provider: string;
  type: string;
  iconUrl: string;
  displayOrder: number;
  gatewayType: string;
  isTestMode: boolean;
  installmentInfo?: string;
}

/**
 * Map gateway type to provider name for display
 */
const GATEWAY_PROVIDERS: Record<string, string> = {
  STRIPE: 'Stripe',
  PAYPAL: 'PayPal',
  RAZORPAY: 'Razorpay',
  PHONEPE: 'PhonePe',
  AFTERPAY: 'Afterpay',
  ZIP: 'Zip',
  GOOGLE_PAY: 'Google Pay',
  APPLE_PAY: 'Apple Pay',
  PAYTM: 'Paytm',
  UPI: 'UPI',
  LINKT: 'Linkt',
  BHARATPAY: 'BharatPay',
};

/**
 * Map payment method types to descriptions
 */
const METHOD_DESCRIPTIONS: Record<string, string> = {
  CARD: 'Pay securely with your credit or debit card',
  UPI: 'Pay using UPI apps like GPay, PhonePe, Paytm',
  NET_BANKING: 'Pay directly from your bank account',
  WALLET: 'Pay using digital wallets',
  EMI: 'Pay in easy monthly installments',
  PAY_LATER: 'Buy now, pay later in interest-free installments',
  PAYPAL: 'Pay securely with PayPal',
  APPLE_PAY: 'Pay with Apple Pay',
  GOOGLE_PAY: 'Pay with Google Pay',
  BANK_ACCOUNT: 'Pay directly from your bank account',
};

/**
 * Map icon names to icon URLs (using common icon library paths)
 */
const ICON_URLS: Record<string, string> = {
  'credit-card': '/icons/payment/card.svg',
  smartphone: '/icons/payment/upi.svg',
  'building-2': '/icons/payment/bank.svg',
  wallet: '/icons/payment/wallet.svg',
  paypal: '/icons/payment/paypal.svg',
  apple: '/icons/payment/apple-pay.svg',
  google: '/icons/payment/google-pay.svg',
  euro: '/icons/payment/sepa.svg',
  ideal: '/icons/payment/ideal.svg',
  klarna: '/icons/payment/klarna.svg',
};

/**
 * GET /api/payments/methods
 * Fetches enabled payment methods for the storefront checkout
 *
 * This endpoint now calls the Payment Service directly (source of truth)
 * instead of the Orders Service, ensuring gateways configured in Admin
 * are immediately available in the storefront.
 *
 * Query params:
 * - region: Filter by region/country code (e.g., AU, IN, US)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'US';

    // Get tenant ID from request headers (set by middleware)
    const tenantId =
      request.headers.get('x-tenant-id') ||
      request.headers.get('x-jwt-claim-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: { message: 'Tenant ID is required' } },
        { status: 400 }
      );
    }

    // Call Payment Service's gateways/available endpoint
    // This is the source of truth for gateway configurations
    const url = new URL(`${PAYMENT_SERVICE_URL}/api/v1/gateways/available`);
    url.searchParams.set('country', region);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-jwt-claim-tenant-id': tenantId,
        'X-Tenant-ID': tenantId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Payment Service error:', response.status, errorData);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: errorData.message || 'Failed to fetch payment methods',
          },
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const gateways: GatewayOption[] = data.gateways || [];

    // Transform gateway response to payment methods format expected by checkout
    const paymentMethods: EnabledPaymentMethod[] = [];
    let displayOrder = 0;

    for (const gateway of gateways) {
      // Skip disabled gateways
      if (!gateway.isEnabled) continue;

      // Add each payment method from the gateway
      for (const method of gateway.paymentMethods || []) {
        const methodCode = `${gateway.gatewayType.toLowerCase()}_${method.type.toLowerCase()}`;

        paymentMethods.push({
          code: methodCode,
          name: method.displayName,
          description:
            METHOD_DESCRIPTIONS[method.type] ||
            `Pay with ${method.displayName}`,
          provider: GATEWAY_PROVIDERS[gateway.gatewayType] || gateway.gatewayType,
          type: method.type.toLowerCase(),
          iconUrl: ICON_URLS[method.icon] || `/icons/payment/${method.icon}.svg`,
          displayOrder: displayOrder++,
          gatewayType: gateway.gatewayType,
          isTestMode: gateway.isTestMode,
          // Add installment info for BNPL methods
          ...(method.type === 'PAY_LATER' && {
            installmentInfo:
              gateway.gatewayType === 'AFTERPAY'
                ? 'Pay in 4 interest-free payments'
                : gateway.gatewayType === 'ZIP'
                  ? 'Buy now, pay later'
                  : 'Pay in installments',
          }),
        });
      }
    }

    // Sort by display order (primary gateways first, then by priority)
    paymentMethods.sort((a, b) => a.displayOrder - b.displayOrder);

    return NextResponse.json({
      success: true,
      data: {
        paymentMethods,
        region,
        gatewayCount: gateways.filter((g) => g.isEnabled).length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch payment methods:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch payment methods' } },
      { status: 500 }
    );
  }
}
