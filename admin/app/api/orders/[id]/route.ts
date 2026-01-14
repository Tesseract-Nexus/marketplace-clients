import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';
import {
  validateOrderId,
  createValidationErrorResponse,
  parseRequestBody,
} from '@/lib/security/order-validation';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

/**
 * Transform backend order format to frontend expected format
 * Backend returns 'currency', frontend expects 'currencyCode'
 */
function transformOrder(order: Record<string, unknown>): Record<string, unknown> {
  const payment = order.payment as Record<string, unknown> | undefined;
  const shipping = order.shipping as Record<string, unknown> | undefined;
  const customer = order.customer as Record<string, unknown> | undefined;

  return {
    ...order,
    // Map nested payment.status to paymentStatus
    paymentStatus: order.paymentStatus || payment?.status || 'PENDING',
    // Map fulfillment status - check shipping status or default
    fulfillmentStatus:
      order.fulfillmentStatus ||
      (shipping?.trackingNumber
        ? 'SHIPPED'
        : shipping?.actualDelivery
          ? 'DELIVERED'
          : 'UNFULFILLED'),
    // Map customer info to flat fields
    customerName:
      order.customerName ||
      (customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : ''),
    customerEmail: order.customerEmail || customer?.email || '',
    // Map payment method
    paymentMethod: order.paymentMethod || payment?.method || '',
    // Map shipping method
    shippingMethod: order.shippingMethod || shipping?.method || '',
    // Map tracking number
    trackingNumber: order.trackingNumber || shipping?.trackingNumber || '',
    // Ensure currencyCode exists - map from backend 'currency' field
    currencyCode: order.currencyCode || order.currency || 'INR',
    // Map amounts - ensure they're strings for consistency
    subtotal: String(order.subtotal || '0'),
    tax: String(order.taxAmount || order.tax || '0'),
    shippingCost: String(order.shippingCost || shipping?.cost || '0'),
    discount: String(order.discountAmount || order.discount || '0'),
    total: String(order.total || '0'),
    // Map order date
    orderDate: order.orderDate || order.createdAt,
  };
}

/**
 * GET /api/orders/:id
 * Get order details
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
    const response = await proxyToBackend(ORDERS_SERVICE_URL, `/orders/${idValidation.value}`, {
      method: 'GET',
      headers: getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Transform the order data to match frontend expectations
    const order = data.data || data.order || data;
    const transformedOrder = transformOrder(order as Record<string, unknown>);

    return NextResponse.json({
      success: true,
      data: transformedOrder,
    }, { status: response.status });
  } catch (error) {
    return handleApiError(error, `GET order ${id}`);
  }
}

/**
 * PUT /api/orders/:id
 * Update order details
 * Auth is handled by backend orders-service via Istio JWT validation
 */
export async function PUT(
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
    const bodyResult = await parseRequestBody(request);
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

    const response = await proxyToBackend(ORDERS_SERVICE_URL, `/orders/${idValidation.value}`, {
      method: 'PUT',
      body: bodyResult.data,
      headers: getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `PUT order ${id}`);
  }
}

/**
 * DELETE /api/orders/:id
 * Delete an order
 * Auth is handled by backend orders-service via Istio JWT validation
 */
export async function DELETE(
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
    const response = await proxyToBackend(ORDERS_SERVICE_URL, `/orders/${idValidation.value}`, {
      method: 'DELETE',
      headers: getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, `DELETE order ${id}`);
  }
}
