import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError } from '@/lib/utils/api-route-handler';
import { getServerSession } from '@/lib/auth/session';

const PAYMENTS_SERVICE_URL = getServiceUrl('PAYMENTS');

type RouteParams = { params: Promise<{ gatewayType: string }> };

/**
 * Gateway type to credential mapping
 * Maps the credential keys to the API field names expected by the backend
 */
const CREDENTIAL_MAPPINGS: Record<string, Record<string, string>> = {
  STRIPE: {
    publishable_key: 'apiKeyPublic',
    secret_key: 'apiKeySecret',
    webhook_secret: 'webhookSecret',
  },
  PAYPAL: {
    client_id: 'apiKeyPublic',
    client_secret: 'apiKeySecret',
  },
  RAZORPAY: {
    key_id: 'apiKeyPublic',
    key_secret: 'apiKeySecret',
    webhook_secret: 'webhookSecret',
  },
  AFTERPAY: {
    merchant_id: 'merchantAccountId',
    secret_key: 'apiKeySecret',
  },
  ZIP: {
    merchant_id: 'merchantAccountId',
    api_key: 'apiKeySecret',
  },
  PHONEPE: {
    merchant_id: 'merchantAccountId',
    salt_key: 'apiKeySecret',
    salt_index: 'webhookSecret',
  },
};

/**
 * Gateway type display names
 */
const DISPLAY_NAMES: Record<string, string> = {
  STRIPE: 'Stripe Payment Gateway',
  PAYPAL: 'PayPal',
  RAZORPAY: 'Razorpay',
  AFTERPAY: 'Afterpay',
  ZIP: 'Zip Pay',
  PHONEPE: 'PhonePe',
};

/**
 * Supported countries by gateway
 */
const SUPPORTED_COUNTRIES: Record<string, string[]> = {
  STRIPE: ['US', 'GB', 'AU', 'NZ', 'CA', 'DE', 'FR', 'IE', 'SG', 'JP'],
  PAYPAL: ['US', 'GB', 'AU', 'CA', 'DE', 'FR', 'IN', 'SG', 'JP', 'NZ'],
  RAZORPAY: ['IN'],
  AFTERPAY: ['AU', 'NZ', 'US', 'GB'],
  ZIP: ['AU', 'NZ', 'US'],
  PHONEPE: ['IN'],
};

/**
 * Supported payment methods by gateway
 */
const SUPPORTED_METHODS: Record<string, string[]> = {
  STRIPE: ['CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'BANK_ACCOUNT'],
  PAYPAL: ['PAYPAL'],
  RAZORPAY: ['CARD', 'UPI', 'NET_BANKING', 'WALLET', 'EMI'],
  AFTERPAY: ['PAY_LATER'],
  ZIP: ['PAY_LATER'],
  PHONEPE: ['UPI', 'WALLET'],
};

/**
 * POST /api/payments/gateway-configs/from-template/:gatewayType
 * Creates a new gateway configuration from a template
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { gatewayType } = await params;

  try {
    // Verify authentication
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { credentials, isTestMode } = body;

    if (!credentials) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Credentials are required' },
        { status: 400 }
      );
    }

    // Map credentials to gateway config fields
    const mapping = CREDENTIAL_MAPPINGS[gatewayType];
    if (!mapping) {
      return NextResponse.json(
        { error: 'Bad Request', message: `Unknown gateway type: ${gatewayType}` },
        { status: 400 }
      );
    }

    // Build the gateway config request
    const gatewayConfig: Record<string, unknown> = {
      gatewayType,
      displayName: DISPLAY_NAMES[gatewayType] || gatewayType,
      isEnabled: true,
      isTestMode: isTestMode ?? true,
      priority: 10,
      supportedCountries: SUPPORTED_COUNTRIES[gatewayType] || [],
      supportedPaymentMethods: SUPPORTED_METHODS[gatewayType] || [],
      supportsPlatformSplit: gatewayType === 'STRIPE',
    };

    // Map provided credentials to config fields
    for (const [credKey, configKey] of Object.entries(mapping)) {
      if (credentials[credKey]) {
        gatewayConfig[configKey] = credentials[credKey];
      }
    }

    // Proxy the create request to the payments service
    const response = await proxyToBackend(PAYMENTS_SERVICE_URL, 'gateway-configs', {
      method: 'POST',
      body: gatewayConfig,
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `POST /payments/gateway-configs/from-template/${gatewayType}`);
  }
}
