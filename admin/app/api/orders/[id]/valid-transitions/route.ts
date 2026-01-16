import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';
import {
  validateOrderId,
  createValidationErrorResponse,
} from '@/lib/security/order-validation';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

/**
 * GET /api/orders/:id/valid-transitions
 * Get valid status transitions for an order
 * Auth is handled by backend orders-service via Istio JWT validation
 */
export async function GET(
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
    const response = await proxyToBackend(
      ORDERS_SERVICE_URL,
      `/orders/${idValidation.value}/valid-transitions`,
      {
        method: 'GET',
        headers: await getProxyHeaders(request),
        incomingRequest: request,
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `GET order ${id} valid-transitions`);
  }
}
