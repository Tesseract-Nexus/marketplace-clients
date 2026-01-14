import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError } from '@/lib/utils/api-route-handler';
import {
  requireAdminPortalAccess,
  createAuthorizationErrorResponse,
  getAuthorizedHeaders,
} from '@/lib/security/authorization';

const APPROVAL_SERVICE_URL = getServiceUrl('APPROVAL');

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/approvals/admin/approval-workflows/:id
 * Get a single approval workflow
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = requireAdminPortalAccess(request);
  if (!auth.authorized) {
    return createAuthorizationErrorResponse(auth.error!);
  }

  try {
    const { id } = await params;
    const response = await proxyToBackend(APPROVAL_SERVICE_URL, `admin/approval-workflows/${id}`, {
      method: 'GET',
      headers: getAuthorizedHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'GET approval-workflow');
  }
}

/**
 * PUT /api/approvals/admin/approval-workflows/:id
 * Update an approval workflow
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = requireAdminPortalAccess(request);
  if (!auth.authorized) {
    return createAuthorizationErrorResponse(auth.error!);
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const response = await proxyToBackend(APPROVAL_SERVICE_URL, `admin/approval-workflows/${id}`, {
      method: 'PUT',
      body,
      headers: getAuthorizedHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'PUT approval-workflow');
  }
}
