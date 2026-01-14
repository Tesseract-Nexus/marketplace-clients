import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost } from '@/lib/utils/api-route-handler';

const VENDORS_SERVICE_URL = getServiceUrl('VENDORS');

/**
 * GET /api/storefronts
 * List all storefronts with optional pagination and filters
 */
export async function GET(request: NextRequest) {
  return proxyGet(VENDORS_SERVICE_URL, 'storefronts', request);
}

/**
 * POST /api/storefronts
 * Create a new storefront
 */
export async function POST(request: NextRequest) {
  return proxyPost(VENDORS_SERVICE_URL, 'storefronts', request);
}
