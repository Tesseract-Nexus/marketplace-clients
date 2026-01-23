import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPut } from '@/lib/utils/api-route-handler';

const APPROVAL_SERVICE_URL = getServiceUrl('APPROVAL');

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/approvals/admin/approval-workflows/:id
 * Get a single approval workflow
 * Authorization is handled by the backend service via RBAC
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyGet(APPROVAL_SERVICE_URL, `admin/approval-workflows/${id}`, request);
}

/**
 * PUT /api/approvals/admin/approval-workflows/:id
 * Update an approval workflow
 * Authorization is handled by the backend service via RBAC
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyPut(APPROVAL_SERVICE_URL, `admin/approval-workflows/${id}`, request);
}
