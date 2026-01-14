import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError } from '@/lib/utils/api-route-handler';
import {
  requireAdminPortalAccess,
  createAuthorizationErrorResponse,
  getAuthorizedHeaders,
} from '@/lib/security/authorization';

const APPROVAL_SERVICE_URL = getServiceUrl('APPROVAL');

/**
 * GET /api/approvals/admin/approval-workflows
 * List approval workflows
 * Requires admin portal access with approvals:manage permission
 */
export async function GET(request: NextRequest) {
  const auth = requireAdminPortalAccess(request);
  if (!auth.authorized) {
    return createAuthorizationErrorResponse(auth.error!);
  }

  try {
    const response = await proxyToBackend(APPROVAL_SERVICE_URL, 'admin/approval-workflows', {
      method: 'GET',
      headers: getAuthorizedHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'GET approval-workflows');
  }
}
