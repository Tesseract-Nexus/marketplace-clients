import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const VENDORS_SERVICE_URL = getServiceUrl('VENDORS');

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/storefronts/resolve/by-slug/[slug]
 * Resolve a storefront by its slug
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  return proxyGet(VENDORS_SERVICE_URL, `storefronts/resolve/by-slug/${slug}`, request);
}
