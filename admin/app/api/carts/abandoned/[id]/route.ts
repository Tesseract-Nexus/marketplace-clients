import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyDelete } from '@/lib/utils/api-route-handler';

const CUSTOMERS_SERVICE_URL = getServiceUrl('CUSTOMERS');

/**
 * GET /api/carts/abandoned/:id
 * Get a specific abandoned cart
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyGet(CUSTOMERS_SERVICE_URL, `abandoned-carts/${id}`, request);
}

/**
 * DELETE /api/carts/abandoned/:id
 * Delete an abandoned cart
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyDelete(CUSTOMERS_SERVICE_URL, `abandoned-carts/${id}`, request);
}
