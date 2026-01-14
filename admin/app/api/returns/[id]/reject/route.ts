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
  sanitizeString,
  createValidationErrorResponse,
  parseRequestBody,
} from '@/lib/security/order-validation';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

interface RejectReturnBody {
  reason?: unknown;
  notes?: unknown;
}

/**
 * POST /api/returns/:id/reject
 * Reject a return request
 * Requires manager role or higher (sensitive operation)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check - require manager role for return rejection
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
    // Parse and validate request body
    const bodyResult = await parseRequestBody<RejectReturnBody>(request);
    if (!bodyResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: bodyResult.error,
          },
        },
        { status: 400 }
      );
    }

    // Rejection reason is required
    const reason = sanitizeString(bodyResult.data.reason, 500);
    if (!reason || reason.length < 10) {
      return createValidationErrorResponse({
        code: 'INVALID_REASON',
        message: 'Rejection reason is required and must be at least 10 characters',
        field: 'reason',
      });
    }

    // Validate notes if present
    const notesResult = validateNotes(bodyResult.data.notes);
    if (!notesResult.valid) {
      return createValidationErrorResponse(notesResult.error!);
    }

    const response = await proxyToBackend(
      ORDERS_SERVICE_URL,
      `/returns/${idValidation.value}/reject`,
      {
        method: 'POST',
        body: {
          reason,
          notes: notesResult.value,
        },
        headers: getAuthorizedHeaders(request),
        incomingRequest: request,
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `POST return ${id} reject`);
  }
}
