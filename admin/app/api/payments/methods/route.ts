import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

/**
 * GET /api/payments/methods
 * List available payment methods with tenant configuration status
 * Query params:
 * - region: Filter by region (e.g., AU, IN, US)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || '';

  const path = region
    ? `/payments/methods?region=${region}`
    : '/payments/methods';

  return proxyGet(ORDERS_SERVICE_URL, path, request);
}
