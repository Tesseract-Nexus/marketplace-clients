import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, CACHE_CONFIG } from '@/lib/utils/api-route-handler';

const AUDIT_SERVICE_URL = getServiceUrl('AUDIT');

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{2,64}$/.test(id);
}

/**
 * GET /api/audit-logs/:id
 * Get a single audit log by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
  }
  return proxyGet(AUDIT_SERVICE_URL, `/audit-logs/${id}`, request, {
    cacheConfig: CACHE_CONFIG.DYNAMIC,
  });
}
