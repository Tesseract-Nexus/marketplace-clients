import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPut, proxyDelete } from '@/lib/utils/api-route-handler';

const VENDORS_SERVICE_URL = getServiceUrl('VENDORS');

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/storefronts/[id]
 * Get a single storefront by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyGet(VENDORS_SERVICE_URL, `storefronts/${id}`, request);
}

/**
 * PUT /api/storefronts/[id]
 * Update a storefront
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyPut(VENDORS_SERVICE_URL, `storefronts/${id}`, request);
}

/**
 * DELETE /api/storefronts/[id]
 * Delete a storefront (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyDelete(VENDORS_SERVICE_URL, `storefronts/${id}`, request);
}
