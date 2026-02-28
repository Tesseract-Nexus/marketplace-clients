// API handler utilities for Next.js API routes
import { NextRequest, NextResponse } from 'next/server';

// Configuration
const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8086';
const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL || 'http://localhost:8087';
const CUSTOM_DOMAIN_SERVICE_URL = process.env.CUSTOM_DOMAIN_SERVICE_URL || 'http://custom-domain-service.marketplace.svc.cluster.local:8093';

// Request ID generator
export function generateRequestId(): string {
  return crypto.randomUUID();
}

// Error response helper
export function errorResponse(message: string, status: number = 500, details?: any) {
  return NextResponse.json(
    {
      error: {
        message,
        status,
        details,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

// Success response helper
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(
    {
      data,
      success: true,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

// Proxy request to backend service
export async function proxyRequest(
  serviceUrl: string,
  endpoint: string,
  request: NextRequest,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
) {
  const requestId = generateRequestId();
  const method = options.method || request.method;
  const url = `${serviceUrl}${endpoint}`;

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    'X-Forwarded-For': request.headers.get('x-forwarded-for') || 'unknown',
    'User-Agent': request.headers.get('user-agent') || 'next-bff',
    ...options.headers,
  };

  // Copy auth headers if present
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  // Log request (in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${method} ${url} [${requestId}]`);
  }

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // Add body for POST/PUT/PATCH
    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    } else if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const body = await request.json().catch(() => null);
      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json().catch(() => ({}));

    // Log response status only (no data to avoid PII exposure)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] Response ${response.status} [${requestId}]`);
    }

    // If backend returned an error
    if (!response.ok) {
      // Extract safe error message - don't expose internal details
      // Backend can send error as: data.error (string), data.error.message (object), or data.message
      const safeMessage = typeof data.error === 'string'
        ? data.error
        : typeof data.error?.message === 'string'
          ? data.error.message
          : typeof data.message === 'string'
            ? data.message
            : 'Request failed';

      // Pass through suggestions if available (for business name validation)
      const responseData: Record<string, unknown> = { error: safeMessage };
      if (data.suggestions && Array.isArray(data.suggestions)) {
        responseData.suggestions = data.suggestions;
      }
      if (data.field) {
        responseData.field = data.field;
      }

      return NextResponse.json(responseData, { status: response.status });
    }

    // Return backend response directly (don't double-wrap)
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    // Log error message only, not full stack trace or sensitive details
    if (process.env.NODE_ENV === 'development') {
      console.error(`[API Error] ${method} [${requestId}]:`, error instanceof Error ? error.message : 'Unknown error');
    }
    // Return generic error without exposing internal details
    return errorResponse('Failed to communicate with backend service', 503);
  }
}

// Proxy GET request
export async function proxyGet(
  serviceUrl: string,
  endpoint: string,
  request: NextRequest
) {
  return proxyRequest(serviceUrl, endpoint, request, { method: 'GET' });
}

// Proxy POST request
export async function proxyPost(
  serviceUrl: string,
  endpoint: string,
  request: NextRequest,
  body?: any
) {
  return proxyRequest(serviceUrl, endpoint, request, { method: 'POST', body });
}

// Proxy PUT request
export async function proxyPut(
  serviceUrl: string,
  endpoint: string,
  request: NextRequest,
  body?: any
) {
  return proxyRequest(serviceUrl, endpoint, request, { method: 'PUT', body });
}

// Proxy DELETE request
export async function proxyDelete(
  serviceUrl: string,
  endpoint: string,
  request: NextRequest
) {
  return proxyRequest(serviceUrl, endpoint, request, { method: 'DELETE' });
}

// Service URLs
export const SERVICES = {
  TENANT: TENANT_SERVICE_URL,
  LOCATION: LOCATION_SERVICE_URL,
  CUSTOM_DOMAIN: CUSTOM_DOMAIN_SERVICE_URL,
};

// Middleware: Request validation
// NOTE: Authentication is handled by upstream services (API Gateway/Ingress).
// This BFF does NOT perform JWT validation - it trusts the upstream auth layer.
import { checkRateLimit, extractClientIp, rateLimitExceededResponse } from '@/lib/rate-limit';

export function validateRequest(
  request: NextRequest,
  options: {
    rateLimit?: boolean;
  } = {}
): NextResponse | null {
  // Rate limiting (uses shared in-memory store from lib/rate-limit.ts)
  if (options.rateLimit) {
    const ip = extractClientIp(request.headers);
    const result = checkRateLimit(ip);
    if (!result.allowed) {
      return rateLimitExceededResponse(result);
    }
  }

  return null; // No validation errors
}
