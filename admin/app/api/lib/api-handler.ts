// API handler utilities for Next.js API routes
import { NextRequest, NextResponse } from 'next/server';

// Configuration
const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL || 'http://localhost:8080';

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

  // Get client IP from various headers
  const getClientIP = (): string => {
    // Try various headers for client IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0]?.trim() || 'unknown';
    }
    const realIP = request.headers.get('x-real-ip');
    if (realIP) return realIP;
    const cfIP = request.headers.get('cf-connecting-ip');
    if (cfIP) return cfIP;
    const vercelFor = request.headers.get('x-vercel-forwarded-for');
    if (vercelFor) return vercelFor.split(',')[0]?.trim() || 'unknown';
    return 'unknown';
  };

  const clientIP = getClientIP();

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    'X-Forwarded-For': clientIP,
    'X-Real-IP': clientIP,
    'X-Client-IP': clientIP,
    'User-Agent': request.headers.get('user-agent') || 'admin-bff',
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

    // Log response status (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] Response ${response.status} [${requestId}]`);
    }

    // If backend returned an error
    if (!response.ok) {
      return errorResponse(
        data.error?.message || data.message || 'Backend service error',
        response.status,
        data
      );
    }

    // Return backend response directly
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[API Error] ${method} ${url}:`, error);
    return errorResponse(
      'Failed to communicate with backend service',
      503,
      process.env.NODE_ENV === 'development' ? { error: String(error) } : undefined
    );
  }
}

// Service URLs
export const SERVICES = {
  LOCATION: LOCATION_SERVICE_URL,
};

// Rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 100;

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

// Request validation
export function validateRequest(
  request: NextRequest,
  options: {
    requireAuth?: boolean;
    rateLimit?: boolean;
  } = {}
): NextResponse | null {
  if (options.rateLimit) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip)) {
      return errorResponse('Rate limit exceeded. Please try again later.', 429);
    }
  }

  if (options.requireAuth) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return errorResponse('Unauthorized. Authentication required.', 401);
    }
  }

  return null;
}
