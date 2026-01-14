import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError } from '@/lib/utils/api-route-handler';
import {
  requireRole,
  createAuthorizationErrorResponse,
  getAuthorizedHeaders,
} from '@/lib/security/authorization';
import {
  validateOrderId,
  validateNotes,
  createValidationErrorResponse,
  parseRequestBody,
} from '@/lib/security/order-validation';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

interface ApproveReturnBody {
  notes?: unknown;
}

/**
 * POST /api/returns/:id/approve
 * Approve a return request
 * Requires manager role or higher (sensitive operation)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check - require manager role for return approval
  const auth = requireRole(request, 'manager');
  if (!auth.authorized) {
    return createAuthorizationErrorResponse(auth.error!);
  }

  const { id } = await params;

  // Validate return ID
  const idValidation = validateOrderId(id);
  if (!idValidation.valid) {
    return createValidationErrorResponse({
      ...idValidation.error!,
      field: 'id',
      message: 'Return ID must be a valid UUID',
    });
  }

  try {
    // Parse request body (optional notes)
    const bodyResult = await parseRequestBody<ApproveReturnBody>(request);
    let notes: string | null = null;

    if (bodyResult.success && bodyResult.data.notes) {
      const notesResult = validateNotes(bodyResult.data.notes);
      if (!notesResult.valid) {
        return createValidationErrorResponse(notesResult.error!);
      }
      notes = notesResult.value ?? null;
    }

    const response = await proxyToBackend(
      ORDERS_SERVICE_URL,
      `/returns/${idValidation.value}/approve`,
      {
        method: 'POST',
        body: { notes },
        headers: getAuthorizedHeaders(request),
        incomingRequest: request,
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `POST return ${id} approve`);
  }
}
