import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const CUSTOMERS_SERVICE_URL = getServiceUrl('CUSTOMERS');

/**
 * GET /api/carts/abandoned
 * List abandoned carts with filters and pagination
 */
export async function GET(request: NextRequest) {
  // Use the new enhanced endpoint
  return proxyGet(CUSTOMERS_SERVICE_URL, 'abandoned-carts', request);
}
