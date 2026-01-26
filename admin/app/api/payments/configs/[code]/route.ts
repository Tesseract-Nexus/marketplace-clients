import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPut } from '@/lib/utils/api-route-handler';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

/**
 * GET /api/payments/configs/[code]
 * Get a specific payment method configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  return proxyGet(ORDERS_SERVICE_URL, `/payments/configs/${code}`, request);
}

/**
 * PUT /api/payments/configs/[code]
 * Update a payment method configuration
 * Requires: payments:methods:config permission (Owner only)
 *
 * Request body:
 * {
 *   isEnabled?: boolean,
 *   isTestMode?: boolean,
 *   displayOrder?: number,
 *   credentials?: PaymentCredentials,
 *   settings?: PaymentConfigSettings
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  return proxyPut(ORDERS_SERVICE_URL, `/payments/configs/${code}`, request);
}
