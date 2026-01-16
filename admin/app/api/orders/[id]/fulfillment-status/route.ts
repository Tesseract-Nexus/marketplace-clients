import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';
import {
  validateOrderId,
  validateFulfillmentStatus,
  validateNotes,
  sanitizeString,
  createValidationErrorResponse,
  parseRequestBody,
} from '@/lib/security/order-validation';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

interface FulfillmentStatusUpdateBody {
  status?: unknown;
  notes?: unknown;
  trackingNumber?: unknown;
  carrier?: unknown;
  estimatedDelivery?: unknown;
}

/**
 * Validate fulfillment status update request body
 */
function validateFulfillmentStatusUpdateRequest(body: FulfillmentStatusUpdateBody) {
  const statusResult = validateFulfillmentStatus(body.status);
  if (!statusResult.valid) {
    return { valid: false, error: statusResult.error };
  }

  const notesResult = validateNotes(body.notes);
  if (!notesResult.valid) {
    return { valid: false, error: notesResult.error };
  }

  // Sanitize optional tracking number
  const trackingNumber = sanitizeString(body.trackingNumber, 100);

  // Sanitize optional carrier
  const carrier = sanitizeString(body.carrier, 100);

  // Validate estimated delivery date if present
  let estimatedDelivery: string | undefined;
  if (body.estimatedDelivery) {
    const dateStr = sanitizeString(body.estimatedDelivery, 30);
    if (dateStr) {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return {
          valid: false,
          error: {
            code: 'INVALID_DATE',
            message: 'Estimated delivery must be a valid date',
            field: 'estimatedDelivery',
          },
        };
      }
      estimatedDelivery = date.toISOString();
    }
  }

  return {
    valid: true,
    data: {
      status: statusResult.value,
      notes: notesResult.value,
      trackingNumber,
      carrier,
      estimatedDelivery,
    },
  };
}

/**
 * PATCH /api/orders/:id/fulfillment-status
 * Update order fulfillment status (UNFULFILLED, PROCESSING, PACKED, DISPATCHED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED_DELIVERY, RETURNED)
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
    const bodyResult = await parseRequestBody<FulfillmentStatusUpdateBody>(request);
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

    // Validate fulfillment status value
    const validationResult = validateFulfillmentStatusUpdateRequest(bodyResult.data);
    if (!validationResult.valid) {
      return createValidationErrorResponse(validationResult.error!);
    }

    const response = await proxyToBackend(
      ORDERS_SERVICE_URL,
      `/orders/${idValidation.value}/fulfillment-status`,
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
    return handleApiError(error, `PATCH order ${id} fulfillment-status`);
  }
}

/**
 * PUT /api/orders/:id/fulfillment-status
 * Update order fulfillment status (alias for PATCH)
 * Requires admin portal access
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params });
}
