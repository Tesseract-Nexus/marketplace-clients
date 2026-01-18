import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPut, proxyDelete } from '@/lib/utils/api-route-handler';

const CATEGORIES_SERVICE_URL = getServiceUrl('CATEGORIES');

/**
 * GET /api/categories/:id
 * Fetch a single category by ID
 * Uses proxyGet which properly extracts JWT claims and forwards Istio headers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyGet(CATEGORIES_SERVICE_URL, `categories/${id}`, request);
}

/**
 * PUT /api/categories/:id
 * Update a category by ID
 * Uses proxyPut which properly extracts JWT claims and forwards Istio headers
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyPut(CATEGORIES_SERVICE_URL, `categories/${id}`, request);
}

/**
 * DELETE /api/categories/:id
 * Delete a category by ID
 * Uses proxyDelete which properly extracts JWT claims and forwards Istio headers
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyDelete(CATEGORIES_SERVICE_URL, `categories/${id}`, request);
}
