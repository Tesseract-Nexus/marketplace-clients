import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyDelete } from '@/lib/utils/api-route-handler';

const CATEGORIES_SERVICE_URL = getServiceUrl('CATEGORIES');

/**
 * DELETE /api/categories/bulk
 * Bulk delete categories
 * Uses proxyDelete which properly extracts JWT claims and forwards Istio headers
 */
export async function DELETE(request: NextRequest) {
  return proxyDelete(CATEGORIES_SERVICE_URL, 'categories/bulk', request);
}
