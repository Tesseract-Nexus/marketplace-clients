import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

/**
 * GET /api/payments/configs
 * Get all payment configurations for the tenant
 */
export async function GET(request: NextRequest) {
  return proxyGet(ORDERS_SERVICE_URL, '/payments/configs', request);
}
