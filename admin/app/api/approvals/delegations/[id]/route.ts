import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const APPROVAL_SERVICE_URL = getServiceUrl('APPROVAL');

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
  return proxyGet(APPROVAL_SERVICE_URL, `delegations/${id}`, request);
}
