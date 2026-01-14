import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, CACHE_CONFIG } from '@/lib/utils/api-route-handler';

const AUDIT_SERVICE_URL = getServiceUrl('AUDIT');

/**
 * GET /api/audit-logs/:id
 * Get a single audit log by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyGet(AUDIT_SERVICE_URL, `/audit-logs/${id}`, request, {
    cacheConfig: CACHE_CONFIG.DYNAMIC,
  });
}
