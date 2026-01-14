/**
 * API Error Handling Utilities
 */

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

export class ApiException extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
    this.code = error.code;
    this.statusCode = error.statusCode || 500;
    this.details = error.details;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiException);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * Error codes for different scenarios
 */
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',

  // Authentication/Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Request errors
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',

  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',

  // Application errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Parse error from response
 */
export function parseApiError(error: any, defaultMessage = 'An error occurred'): ApiError {
  // If already an ApiException
  if (error instanceof ApiException) {
    return error.toJSON();
  }

  // If it's a fetch error
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: ERROR_CODES.NETWORK_ERROR,
      message: 'Network error: Unable to reach server',
      statusCode: 0,
    };
  }

  // If it's a structured API error
  if (error?.error) {
    return {
      code: error.error.code || ERROR_CODES.UNKNOWN_ERROR,
      message: error.error.message || defaultMessage,
      details: error.error.details,
      statusCode: error.statusCode,
    };
  }

  // If it's an Error object
  if (error instanceof Error) {
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: error.message || defaultMessage,
      statusCode: 500,
    };
  }

  // Fallback
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: defaultMessage,
    statusCode: 500,
  };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: ApiError | ApiException): string {
  const errorObj = error instanceof ApiException ? error.toJSON() : error;

  switch (errorObj.code) {
    case ERROR_CODES.NETWORK_ERROR:
      return 'Unable to connect to the server. Please check your internet connection.';
    case ERROR_CODES.TIMEOUT:
      return 'Request timed out. Please try again.';
    case ERROR_CODES.UNAUTHORIZED:
      return 'You are not authorized. Please log in again.';
    case ERROR_CODES.FORBIDDEN:
      return 'You do not have permission to perform this action.';
    case ERROR_CODES.NOT_FOUND:
      return 'The requested resource was not found.';
    case ERROR_CODES.SERVICE_UNAVAILABLE:
      return 'Service is temporarily unavailable. Please try again later.';
    case ERROR_CODES.VALIDATION_ERROR:
      return errorObj.message || 'Validation failed. Please check your input.';
    default:
      return errorObj.message || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Determine if error is retryable
 */
export function isRetryableError(error: ApiError | ApiException): boolean {
  const errorObj = error instanceof ApiException ? error.toJSON() : error;

  const retryableCodes = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT,
    ERROR_CODES.SERVICE_UNAVAILABLE,
    ERROR_CODES.GATEWAY_TIMEOUT,
  ];

  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];

  return (
    retryableCodes.includes(errorObj.code as any) ||
    (errorObj.statusCode !== undefined && retryableStatusCodes.includes(errorObj.statusCode))
  );
}
