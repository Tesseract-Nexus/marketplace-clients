import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';
import {
  validateOrderId,
  validatePaymentStatus,
  validateNotes,
  createValidationErrorResponse,
  parseRequestBody,
} from '@/lib/security/order-validation';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

interface PaymentStatusUpdateBody {
  status?: unknown;
  notes?: unknown;
  refundAmount?: unknown;
  refundReason?: unknown;
}

/**
 * Validate payment status update request body
 */
function validatePaymentStatusUpdateRequest(body: PaymentStatusUpdateBody) {
  const statusResult = validatePaymentStatus(body.status);
  if (!statusResult.valid) {
    return { valid: false, error: statusResult.error };
  }

  const notesResult = validateNotes(body.notes);
  if (!notesResult.valid) {
    return { valid: false, error: notesResult.error };
  }

  // Validate refund amount if present
  let refundAmount: number | undefined;
  if (body.refundAmount !== undefined && body.refundAmount !== null) {
    const num = typeof body.refundAmount === 'string'
      ? parseFloat(body.refundAmount)
      : body.refundAmount;

    if (typeof num !== 'number' || isNaN(num) || num < 0) {
      return {
        valid: false,
        error: {
          code: 'INVALID_REFUND_AMOUNT',
          message: 'Refund amount must be a positive number',
          field: 'refundAmount',
        },
      };
    }
    refundAmount = num;
  }

  // Sanitize refund reason if present
  const refundReasonResult = validateNotes(body.refundReason);
  if (!refundReasonResult.valid) {
    return { valid: false, error: refundReasonResult.error };
  }

  return {
    valid: true,
    data: {
      status: statusResult.value,
      notes: notesResult.value,
      refundAmount,
      refundReason: refundReasonResult.value,
    },
  };
}

/**
 * PATCH /api/orders/:id/payment-status
 * Update order payment status (PENDING, PAID, FAILED, PARTIALLY_REFUNDED, REFUNDED)
 * Auth is handled by backend orders-service via Istio JWT validation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate order ID
  const idValidation = validateOrderId(id);
  if (!idValidation.valid) {
    return createValidationErrorResponse(idValidation.error!);
  }

  try {
    // Parse and validate request body
    const bodyResult = await parseRequestBody<PaymentStatusUpdateBody>(request);
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

    // Validate payment status value
    const validationResult = validatePaymentStatusUpdateRequest(bodyResult.data);
    if (!validationResult.valid) {
      return createValidationErrorResponse(validationResult.error!);
    }

    const response = await proxyToBackend(
      ORDERS_SERVICE_URL,
      `/orders/${idValidation.value}/payment-status`,
      {
        method: 'PATCH',
        body: validationResult.data,
        headers: await getProxyHeaders(request),
        incomingRequest: request,
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `PATCH order ${id} payment-status`);
  }
}

/**
 * PUT /api/orders/:id/payment-status
 * Update order payment status (alias for PATCH)
 * Requires admin portal access
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params });
}
