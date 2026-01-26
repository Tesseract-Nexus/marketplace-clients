import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

/**
 * GET /api/payments/configs/enabled
 * Get enabled payment methods for storefront checkout
 * Query params:
 * - region: Filter by region (e.g., AU, IN, US)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || '';

  const path = region
    ? `/payments/configs/enabled?region=${region}`
    : '/payments/configs/enabled';

  return proxyGet(ORDERS_SERVICE_URL, path, request);
}
