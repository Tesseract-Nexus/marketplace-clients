import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPost } from '@/lib/utils/api-route-handler';

const APPROVAL_SERVICE_URL = getServiceUrl('APPROVAL');

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/approvals/delegations/:id/revoke
 * Revoke a delegation
 * Authorization is handled by the backend service via RBAC
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyPost(APPROVAL_SERVICE_URL, `delegations/${id}/revoke`, request);
}
