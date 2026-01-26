import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError } from '@/lib/utils/api-route-handler';

const PAYMENTS_SERVICE_URL = getServiceUrl('PAYMENTS');

type RouteParams = { params: Promise<{ gatewayType: string }> };

/**
 * Valid gateway types supported by the payment service.
 * Used for request validation before proxying to backend.
 */
const VALID_GATEWAY_TYPES = [
  'STRIPE',
  'PAYPAL',
  'RAZORPAY',
  'PHONEPE',
  'AFTERPAY',
  'ZIP',
  'GOOGLE_PAY',
  'APPLE_PAY',
  'PAYTM',
  'UPI',
] as const;

type GatewayType = (typeof VALID_GATEWAY_TYPES)[number];

function isValidGatewayType(type: string): type is GatewayType {
  return VALID_GATEWAY_TYPES.includes(type as GatewayType);
}

/**
 * POST /api/payments/gateway-configs/from-template/:gatewayType
 * Creates a new gateway configuration from a template.
 *
 * This endpoint proxies to the payment service's from-template endpoint which:
 * 1. Uses gateway templates for default configuration (display name, supported countries, etc.)
 * 2. Provisions credentials to GCP Secret Manager (if dynamic credentials enabled)
 * 3. Stores only metadata in the database (no secrets)
 * 4. Triggers approval workflow if required
 *
 * Request body:
 * {
 *   credentials: Record<string, string>  // Raw credentials (e.g., { key_id, key_secret, webhook_secret })
 *   isTestMode?: boolean                 // Whether to use test/sandbox mode (default: true)
 * }
 *
 * The backend handles:
 * - Credential validation per gateway type
 * - Credential mapping to internal format
 * - GCP Secret Manager provisioning
 * - Approval workflow orchestration
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { gatewayType } = await params;

  try {
    // Validate gateway type before proxying
    if (!isValidGatewayType(gatewayType)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: `Invalid gateway type: ${gatewayType}. Valid types: ${VALID_GATEWAY_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { credentials, isTestMode } = body;

    // Basic validation - detailed validation happens in the backend
    if (!credentials || typeof credentials !== 'object') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Credentials object is required' },
        { status: 400 }
      );
    }

    // Proxy to the backend's from-template endpoint
    // The backend handles:
    // - Template-based configuration (display name, supported countries, payment methods)
    // - Credential mapping and validation
    // - GCP Secret Manager provisioning
    // - Approval workflow
    const response = await proxyToBackend(
      PAYMENTS_SERVICE_URL,
      `gateway-configs/from-template/${gatewayType}`,
      {
        method: 'POST',
        body: {
          credentials,
          isTestMode: isTestMode ?? true,
        },
        incomingRequest: request,
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(
      error,
      `POST /payments/gateway-configs/from-template/${gatewayType}`
    );
  }
}
