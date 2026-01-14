import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError } from '@/lib/utils/api-route-handler';
import {
  requireAdminPortalAccess,
  createAuthorizationErrorResponse,
  getAuthorizedHeaders,
} from '@/lib/security/authorization';
import {
  validateOrderId,
  createValidationErrorResponse,
} from '@/lib/security/order-validation';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

/**
 * GET /api/returns/:id
 * Get return request details
 * Requires admin portal access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const auth = requireAdminPortalAccess(request);
  if (!auth.authorized) {
    return createAuthorizationErrorResponse(auth.error!);
  }

  const { id } = await params;

  // Validate return ID (UUIDs)
  const idValidation = validateOrderId(id);
  if (!idValidation.valid) {
    return createValidationErrorResponse({
      ...idValidation.error!,
      field: 'id',
      message: 'Return ID must be a valid UUID',
    });
  }

  try {
    const response = await proxyToBackend(ORDERS_SERVICE_URL, `/returns/${idValidation.value}`, {
      method: 'GET',
      headers: getAuthorizedHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `GET return ${id}`);
  }
}
