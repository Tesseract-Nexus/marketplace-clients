// API handler utilities for Next.js API routes
import { NextRequest, NextResponse } from 'next/server';

// Configuration
const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8086';
const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL || 'http://localhost:8087';
const CUSTOM_DOMAIN_SERVICE_URL = process.env.CUSTOM_DOMAIN_SERVICE_URL || 'http://custom-domain-service.marketplace.svc.cluster.local:8093';

// Request ID generator
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
      const safeMessage = typeof data.error?.message === 'string'
        ? data.error.message
        : typeof data.message === 'string'
          ? data.message
          : 'Request failed';

      // Don't pass raw backend data to client - could contain sensitive info
      return errorResponse(safeMessage, response.status);
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

// Middleware: Rate limiting (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

export function rateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

// Middleware: Request validation
export function validateRequest(
  request: NextRequest,
  options: {
    requireAuth?: boolean;
    rateLimit?: boolean;
  } = {}
): NextResponse | null {
  // Rate limiting
  if (options.rateLimit) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip)) {
      return errorResponse('Rate limit exceeded. Please try again later.', 429);
    }
  }

  // Auth check (placeholder - implement your auth logic)
  if (options.requireAuth) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return errorResponse('Unauthorized. Authentication required.', 401);
    }
    // TODO: Validate JWT token here
  }

  return null; // No validation errors
}
