import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const APPROVAL_SERVICE_URL = getServiceUrl('APPROVAL');

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{2,64}$/.test(id);
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/approvals/delegations/:id
 * Get a single delegation
 * Authorization is handled by the backend service via RBAC
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, message: 'Invalid delegation ID' }, { status: 400 });
  }
  return proxyGet(APPROVAL_SERVICE_URL, `delegations/${id}`, request);
}
