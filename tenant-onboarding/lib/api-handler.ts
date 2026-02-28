// API Handler utilities for BFF (Backend for Frontend) pattern
// This module provides utilities for proxying requests from Next.js API routes to backend services

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, extractClientIp, rateLimitExceededResponse } from './rate-limit';

// Service URLs from environment variables
export const SERVICES = {
  TENANT: process.env.TENANT_SERVICE_URL || 'http://localhost:8086',
  LOCATION: process.env.LOCATION_SERVICE_URL || 'http://localhost:8087',
  VERIFICATION: process.env.VERIFICATION_SERVICE_URL || 'http://localhost:8088',
} as const;

// Request validation
export interface ValidationOptions {
  rateLimit?: boolean;
  requireAuth?: boolean;
}

export function validateRequest(
  request: NextRequest,
  options: ValidationOptions = {}
): NextResponse | null {
  // Rate limiting (uses shared in-memory store from lib/rate-limit.ts)
  if (options.rateLimit) {
    const ip = extractClientIp(request.headers);
    const result = checkRateLimit(ip);
    if (!result.allowed) {
      return rateLimitExceededResponse(result);
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
