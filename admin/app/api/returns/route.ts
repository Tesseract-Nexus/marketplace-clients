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
  validateReturnReason,
  validateNotes,
  validatePositiveNumber,
  sanitizeString,
  createValidationErrorResponse,
  parseRequestBody,
} from '@/lib/security/order-validation';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

interface CreateReturnBody {
  orderId?: unknown;
  reason?: unknown;
  returnType?: unknown;
  items?: unknown;
  notes?: unknown;
}

/**
 * Validate create return request body
 */
function validateCreateReturnRequest(body: CreateReturnBody) {
  // Validate order ID
  if (!body.orderId || typeof body.orderId !== 'string') {
    return {
      valid: false,
      error: {
        code: 'INVALID_ORDER_ID',
        message: 'Order ID is required',
        field: 'orderId',
      },
    };
  }

  const orderIdResult = validateOrderId(body.orderId);
  if (!orderIdResult.valid) {
    return { valid: false, error: orderIdResult.error };
  }

  // Validate reason
  const reasonResult = validateReturnReason(body.reason);
  if (!reasonResult.valid) {
    return { valid: false, error: reasonResult.error };
  }

  // Validate return type
  const validReturnTypes = ['REFUND', 'EXCHANGE', 'STORE_CREDIT'];
  const returnType = sanitizeString(body.returnType, 50)?.toUpperCase();
  if (!returnType || !validReturnTypes.includes(returnType)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_RETURN_TYPE',
        message: `Return type must be one of: ${validReturnTypes.join(', ')}`,
        field: 'returnType',
      },
    };
  }

  // Validate items array
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return {
      valid: false,
      error: {
        code: 'INVALID_ITEMS',
        message: 'At least one item is required for return',
        field: 'items',
      },
    };
  }

  // Validate each item
  const validatedItems: Array<{ orderItemId: string; quantity: number }> = [];
  for (const item of body.items) {
    if (!item || typeof item !== 'object') {
      return {
        valid: false,
        error: {
          code: 'INVALID_ITEM',
          message: 'Each item must be an object with orderItemId and quantity',
          field: 'items',
        },
      };
    }

    const itemIdResult = validateOrderId(item.orderItemId || item.productId);
    if (!itemIdResult.valid) {
      return {
        valid: false,
        error: {
          code: 'INVALID_ITEM_ID',
          message: 'Each item must have a valid orderItemId',
          field: 'items',
        },
      };
    }

    const quantityResult = validatePositiveNumber(item.quantity, 'quantity');
    if (!quantityResult.valid || quantityResult.value === 0) {
      return {
        valid: false,
        error: {
          code: 'INVALID_QUANTITY',
          message: 'Each item must have a positive quantity',
          field: 'items',
        },
      };
    }

    validatedItems.push({
      orderItemId: itemIdResult.value!,
      quantity: Math.floor(quantityResult.value!), // Ensure integer
    });
  }

  // Validate notes if present
  const notesResult = validateNotes(body.notes);
  if (!notesResult.valid) {
    return { valid: false, error: notesResult.error };
  }

  return {
    valid: true,
    data: {
      orderId: orderIdResult.value,
      reason: reasonResult.value,
      returnType,
      items: validatedItems,
      notes: notesResult.value,
    },
  };
}

/**
 * GET /api/returns
 * List return requests with pagination and filtering
 * Requires admin portal access
 */
export async function GET(request: NextRequest) {
  // Authorization check
  const auth = requireAdminPortalAccess(request);
  if (!auth.authorized) {
    return createAuthorizationErrorResponse(auth.error!);
  }

  try {
    const { searchParams } = new URL(request.url);

    const response = await proxyToBackend(ORDERS_SERVICE_URL, 'returns', {
      method: 'GET',
      params: searchParams,
      headers: getAuthorizedHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Normalize response: backend returns { returns: [...] }
    // but frontend expects { data: [...] } for consistency
    const returns = data.returns || data.data || [];

    return NextResponse.json({
      success: true,
      data: returns,
      pagination: data.pagination || {
        page: data.page || 1,
        pageSize: data.pageSize || 10,
        total: data.total || returns.length,
        totalPages: Math.ceil((data.total || returns.length) / (data.pageSize || 10)),
      },
    });
  } catch (error) {
    console.error('[Returns API] Exception:', error);
    return handleApiError(error, 'GET returns');
  }
}

/**
 * POST /api/returns
 * Create a new return request
 * Requires admin portal access
 */
export async function POST(request: NextRequest) {
  // Authorization check
  const auth = requireAdminPortalAccess(request);
  if (!auth.authorized) {
    return createAuthorizationErrorResponse(auth.error!);
  }

  try {
    // Parse and validate request body
    const bodyResult = await parseRequestBody<CreateReturnBody>(request);
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

    // Validate return request
    const validationResult = validateCreateReturnRequest(bodyResult.data);
    if (!validationResult.valid) {
      return createValidationErrorResponse(validationResult.error!);
    }

    const response = await proxyToBackend(ORDERS_SERVICE_URL, 'returns', {
      method: 'POST',
      body: validationResult.data,
      headers: getAuthorizedHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'POST returns');
  }
}
