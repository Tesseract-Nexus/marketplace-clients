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
  validatePositiveNumber,
  sanitizeString,
  createValidationErrorResponse,
  parseRequestBody,
} from '@/lib/security/order-validation';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

interface CompleteReturnBody {
  refundMethod?: unknown;
  refundAmount?: unknown;
  notes?: unknown;
}

/**
 * Validate complete return request body
 */
function validateCompleteReturnRequest(body: CompleteReturnBody) {
  // Validate refund method
  const validRefundMethods = ['ORIGINAL_PAYMENT', 'STORE_CREDIT', 'BANK_TRANSFER', 'CASH'];
  const refundMethod = sanitizeString(body.refundMethod, 50)?.toUpperCase();
  if (!refundMethod || !validRefundMethods.includes(refundMethod)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_REFUND_METHOD',
        message: `Refund method must be one of: ${validRefundMethods.join(', ')}`,
        field: 'refundMethod',
      },
    };
  }

  // Validate refund amount if present
  let refundAmount: number | undefined;
  if (body.refundAmount !== undefined && body.refundAmount !== null) {
    const amountResult = validatePositiveNumber(body.refundAmount, 'refundAmount');
    if (!amountResult.valid) {
      return { valid: false, error: amountResult.error };
    }
    refundAmount = amountResult.value;
  }

  // Validate notes if present
  const notesResult = validateNotes(body.notes);
  if (!notesResult.valid) {
    return { valid: false, error: notesResult.error };
  }

  return {
    valid: true,
    data: {
      refundMethod,
      refundAmount,
      notes: notesResult.value,
    },
  };
}

/**
 * POST /api/returns/:id/complete
 * Complete a return request and process refund
 * Requires manager role or higher (financial operation)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check - require manager role for completing returns
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
    const bodyResult = await parseRequestBody<CompleteReturnBody>(request);
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

    // Validate complete return request
    const validationResult = validateCompleteReturnRequest(bodyResult.data);
    if (!validationResult.valid) {
      return createValidationErrorResponse(validationResult.error!);
    }

    const response = await proxyToBackend(
      ORDERS_SERVICE_URL,
      `/returns/${idValidation.value}/complete`,
      {
        method: 'POST',
        body: validationResult.data,
        headers: getAuthorizedHeaders(request),
        incomingRequest: request,
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `POST return ${id} complete`);
  }
}
