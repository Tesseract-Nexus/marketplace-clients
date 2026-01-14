import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPut } from '@/lib/utils/api-route-handler';

const CUSTOMERS_SERVICE_URL = getServiceUrl('CUSTOMERS');

/**
 * GET /api/carts/abandoned/settings
 * Get abandoned cart settings
 */
export async function GET(request: NextRequest) {
  return proxyGet(CUSTOMERS_SERVICE_URL, 'abandoned-carts/settings', request);
}

/**
 * PUT /api/carts/abandoned/settings
 * Update abandoned cart settings
 */
export async function PUT(request: NextRequest) {
  return proxyPut(CUSTOMERS_SERVICE_URL, 'abandoned-carts/settings', request);
}
