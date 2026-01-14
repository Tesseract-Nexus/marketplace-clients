// API Handler utilities for BFF (Backend for Frontend) pattern
// This module provides utilities for proxying requests from Next.js API routes to backend services

import { NextRequest, NextResponse } from 'next/server';

// Service URLs from environment variables
export const SERVICES = {
  TENANT: process.env.TENANT_SERVICE_URL || 'http://localhost:8086',
  LOCATION: process.env.LOCATION_SERVICE_URL || 'http://localhost:8087',
  VERIFICATION: process.env.VERIFICATION_SERVICE_URL || 'http://localhost:8088',
} as const;

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// Request validation
export interface ValidationOptions {
  rateLimit?: boolean;
  requireAuth?: boolean;
}

export function validateRequest(
  request: NextRequest,
  options: ValidationOptions = {}
): NextResponse | null {
  // Rate limiting
  if (options.rateLimit) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
  }

  // Auth validation (if needed in future)
  if (options.requireAuth) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return null;
}

// Generic proxy function
async function proxyRequest(
  serviceUrl: string,
  path: string,
  request: NextRequest,
  method: string = 'GET'
): Promise<NextResponse> {
  try {
    const url = `${serviceUrl}${path}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Forward auth headers if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    // Add body for POST, PUT, PATCH requests
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const body = await request.json();
        options.body = JSON.stringify(body);
      } catch (e) {
        // No body or invalid JSON
      }
    }

    const response = await fetch(url, options);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Proxy error for ${method} ${path}:`, error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Specific proxy methods
export function proxyGet(serviceUrl: string, path: string, request: NextRequest): Promise<NextResponse> {
  return proxyRequest(serviceUrl, path, request, 'GET');
}

export function proxyPost(serviceUrl: string, path: string, request: NextRequest): Promise<NextResponse> {
  return proxyRequest(serviceUrl, path, request, 'POST');
}

export function proxyPut(serviceUrl: string, path: string, request: NextRequest): Promise<NextResponse> {
  return proxyRequest(serviceUrl, path, request, 'PUT');
}

export function proxyPatch(serviceUrl: string, path: string, request: NextRequest): Promise<NextResponse> {
  return proxyRequest(serviceUrl, path, request, 'PATCH');
}

export function proxyDelete(serviceUrl: string, path: string, request: NextRequest): Promise<NextResponse> {
  return proxyRequest(serviceUrl, path, request, 'DELETE');
}
