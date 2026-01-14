/**
 * Order Input Validation
 *
 * Validates and sanitizes order-related API request inputs.
 * Prevents injection attacks and ensures data integrity.
 */

import { NextResponse } from 'next/server';

/**
 * Valid order statuses
 */
export const ORDER_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Valid payment statuses
 */
export const PAYMENT_STATUSES = [
  'PENDING',
  'PAID',
  'FAILED',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/**
 * Valid fulfillment statuses
 */
export const FULFILLMENT_STATUSES = [
  'UNFULFILLED',
  'PROCESSING',
  'PACKED',
  'DISPATCHED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED_DELIVERY',
  'RETURNED',
] as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

/**
 * Valid return statuses
 */
export const RETURN_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'IN_TRANSIT',
  'RECEIVED',
  'INSPECTING',
  'COMPLETED',
  'CANCELLED',
] as const;

export type ReturnStatus = (typeof RETURN_STATUSES)[number];

/**
 * Valid return reasons
 */
export const RETURN_REASONS = [
  'DEFECTIVE',
  'WRONG_ITEM',
  'NOT_AS_DESCRIBED',
  'CHANGED_MIND',
  'BETTER_PRICE',
  'NO_LONGER_NEEDED',
  'OTHER',
] as const;

export type ReturnReason = (typeof RETURN_REASONS)[number];

/**
 * Validation result
 */
export interface ValidationResult<T> {
  valid: boolean;
  value?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validate order ID parameter
 */
export function validateOrderId(id: string): ValidationResult<string> {
  if (!id || typeof id !== 'string') {
    return {
      valid: false,
      error: {
        code: 'INVALID_ORDER_ID',
        message: 'Order ID is required',
        field: 'id',
      },
    };
  }

  const trimmedId = id.trim();
  if (!isValidUUID(trimmedId)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_ORDER_ID',
        message: 'Order ID must be a valid UUID',
        field: 'id',
      },
    };
  }

  return { valid: true, value: trimmedId };
}

/**
 * Validate order status
 */
export function validateOrderStatus(status: unknown): ValidationResult<OrderStatus> {
  if (!status || typeof status !== 'string') {
    return {
      valid: false,
      error: {
        code: 'INVALID_STATUS',
        message: 'Status is required',
        field: 'status',
      },
    };
  }

  const normalizedStatus = status.toUpperCase().trim() as OrderStatus;
  if (!ORDER_STATUSES.includes(normalizedStatus)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_STATUS',
        message: `Status must be one of: ${ORDER_STATUSES.join(', ')}`,
        field: 'status',
      },
    };
  }

  return { valid: true, value: normalizedStatus };
}

/**
 * Validate payment status
 */
export function validatePaymentStatus(status: unknown): ValidationResult<PaymentStatus> {
  if (!status || typeof status !== 'string') {
    return {
      valid: false,
      error: {
        code: 'INVALID_PAYMENT_STATUS',
        message: 'Payment status is required',
        field: 'status',
      },
    };
  }

  const normalizedStatus = status.toUpperCase().trim() as PaymentStatus;
  if (!PAYMENT_STATUSES.includes(normalizedStatus)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_PAYMENT_STATUS',
        message: `Payment status must be one of: ${PAYMENT_STATUSES.join(', ')}`,
        field: 'status',
      },
    };
  }

  return { valid: true, value: normalizedStatus };
}

/**
 * Validate fulfillment status
 */
export function validateFulfillmentStatus(status: unknown): ValidationResult<FulfillmentStatus> {
  if (!status || typeof status !== 'string') {
    return {
      valid: false,
      error: {
        code: 'INVALID_FULFILLMENT_STATUS',
        message: 'Fulfillment status is required',
        field: 'status',
      },
    };
  }

  const normalizedStatus = status.toUpperCase().trim() as FulfillmentStatus;
  if (!FULFILLMENT_STATUSES.includes(normalizedStatus)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_FULFILLMENT_STATUS',
        message: `Fulfillment status must be one of: ${FULFILLMENT_STATUSES.join(', ')}`,
        field: 'status',
      },
    };
  }

  return { valid: true, value: normalizedStatus };
}

/**
 * Validate return reason
 */
export function validateReturnReason(reason: unknown): ValidationResult<ReturnReason> {
  if (!reason || typeof reason !== 'string') {
    return {
      valid: false,
      error: {
        code: 'INVALID_RETURN_REASON',
        message: 'Return reason is required',
        field: 'reason',
      },
    };
  }

  const normalizedReason = reason.toUpperCase().trim().replace(/ /g, '_') as ReturnReason;
  if (!RETURN_REASONS.includes(normalizedReason)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_RETURN_REASON',
        message: `Return reason must be one of: ${RETURN_REASONS.join(', ')}`,
        field: 'reason',
      },
    };
  }

  return { valid: true, value: normalizedReason };
}

/**
 * Sanitize string input - remove potentially dangerous characters
 */
export function sanitizeString(input: unknown, maxLength: number = 1000): string | null {
  if (input === null || input === undefined) {
    return null;
  }

  if (typeof input !== 'string') {
    return null;
  }

  // Trim and limit length
  let sanitized = input.trim().substring(0, maxLength);

  // Remove null bytes and other control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Validate and sanitize notes field
 */
export function validateNotes(notes: unknown): ValidationResult<string | null> {
  if (notes === null || notes === undefined || notes === '') {
    return { valid: true, value: null };
  }

  const sanitized = sanitizeString(notes, 2000);
  if (sanitized === null) {
    return {
      valid: false,
      error: {
        code: 'INVALID_NOTES',
        message: 'Notes must be a string',
        field: 'notes',
      },
    };
  }

  return { valid: true, value: sanitized };
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(
  value: unknown,
  fieldName: string
): ValidationResult<number> {
  if (value === null || value === undefined) {
    return {
      valid: false,
      error: {
        code: 'INVALID_NUMBER',
        message: `${fieldName} is required`,
        field: fieldName,
      },
    };
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (typeof num !== 'number' || isNaN(num)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_NUMBER',
        message: `${fieldName} must be a valid number`,
        field: fieldName,
      },
    };
  }

  if (num < 0) {
    return {
      valid: false,
      error: {
        code: 'INVALID_NUMBER',
        message: `${fieldName} must be a positive number`,
        field: fieldName,
      },
    };
  }

  return { valid: true, value: num };
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(
  error: NonNullable<ValidationResult<unknown>['error']>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        field: error.field,
      },
    },
    { status: 400 }
  );
}

/**
 * Parse and validate request body safely
 */
export async function parseRequestBody<T = Record<string, unknown>>(
  request: Request
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    if (typeof body !== 'object' || body === null) {
      return { success: false, error: 'Request body must be a JSON object' };
    }
    return { success: true, data: body as T };
  } catch {
    return { success: false, error: 'Invalid JSON in request body' };
  }
}
