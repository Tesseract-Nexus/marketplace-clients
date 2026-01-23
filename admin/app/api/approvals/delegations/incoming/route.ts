import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const APPROVAL_SERVICE_URL = getServiceUrl('APPROVAL');

/**
 * GET /api/approvals/delegations/incoming
 * List delegations granted to the current user
 * Authorization is handled by the backend service via RBAC
 */
export async function GET(request: NextRequest) {
  return proxyGet(APPROVAL_SERVICE_URL, 'delegations/incoming', request);
}
