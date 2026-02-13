import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPut, proxyDelete } from '@/lib/utils/api-route-handler';

const VENDORS_SERVICE_URL = getServiceUrl('VENDORS');

interface RouteParams {
  params: Promise<{ id: string }>;
}

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{2,64}$/.test(id);
}

/**
 * GET /api/storefronts/[id]
 * Get a single storefront by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, message: 'Invalid storefront ID' }, { status: 400 });
  }
  return proxyGet(VENDORS_SERVICE_URL, `storefronts/${id}`, request);
}

/**
 * PUT /api/storefronts/[id]
 * Update a storefront
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, message: 'Invalid storefront ID' }, { status: 400 });
  }
  return proxyPut(VENDORS_SERVICE_URL, `storefronts/${id}`, request);
}

/**
 * DELETE /api/storefronts/[id]
 * Delete a storefront (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, message: 'Invalid storefront ID' }, { status: 400 });
  }
  return proxyDelete(VENDORS_SERVICE_URL, `storefronts/${id}`, request);
}
