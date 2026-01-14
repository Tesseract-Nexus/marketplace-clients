import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';
import {
  validateOrderId,
  validateOrderStatus,
  validateNotes,
  createValidationErrorResponse,
  parseRequestBody,
} from '@/lib/security/order-validation';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

interface StatusUpdateBody {
  status?: unknown;
  notes?: unknown;
}

/**
 * Validate status update request body
 */
function validateStatusUpdateRequest(body: StatusUpdateBody) {
  const statusResult = validateOrderStatus(body.status);
  if (!statusResult.valid) {
    return { valid: false, error: statusResult.error };
  }

  const notesResult = validateNotes(body.notes);
  if (!notesResult.valid) {
    return { valid: false, error: notesResult.error };
  }

  return {
    valid: true,
    data: {
      status: statusResult.value,
      notes: notesResult.value,
    },
  };
}

/**
 * PATCH /api/orders/:id/status
 * Update order status (PLACED, CONFIRMED, PROCESSING, COMPLETED, CANCELLED)
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
    const bodyResult = await parseRequestBody<StatusUpdateBody>(request);
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

    // Validate status value
    const validationResult = validateStatusUpdateRequest(bodyResult.data);
    if (!validationResult.valid) {
      return createValidationErrorResponse(validationResult.error!);
    }

    const response = await proxyToBackend(
      ORDERS_SERVICE_URL,
      `/orders/${idValidation.value}/status`,
      {
        method: 'PATCH',
        body: validationResult.data,
        headers: getProxyHeaders(request),
        incomingRequest: request,
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `PATCH order ${id} status`);
  }
}

/**
 * PUT /api/orders/:id/status
 * Update order status (alias for PATCH)
 * Requires admin portal access
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params });
}
