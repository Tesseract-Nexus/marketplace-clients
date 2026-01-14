import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const CUSTOMERS_SERVICE_URL = getServiceUrl('CUSTOMERS');

/**
 * GET /api/carts/abandoned/stats
 * Get abandoned cart statistics
 */
export async function GET(request: NextRequest) {
  return proxyGet(CUSTOMERS_SERVICE_URL, 'abandoned-carts/stats', request);
}
