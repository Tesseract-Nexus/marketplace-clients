import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';

// Feature flags service URL
// Note: Service port is 8080, container port is 8096
const FEATURE_FLAGS_SERVICE_URL = process.env.FEATURE_FLAGS_SERVICE_URL || 'http://feature-flags-service.devtest.svc.cluster.local:8080';

// SDK key from server-side environment (injected from K8s secret)
const SERVER_SDK_KEY = process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY;

/**
 * Proxy requests to the feature-flags-service
 * Handles all routes under /api/feature-flags/*
 *
 * Special handling for /features endpoint:
 * - Uses public SDK endpoint (/api/features/:key) with server-side SDK key
 * - Falls back to client-provided key if server key not available
 */
async function proxyToFeatureFlagsService(
  request: NextRequest,
  path: string[]
): Promise<NextResponse> {
  const url = new URL(request.url);
  const queryString = url.search;
  // Use server-side SDK key (from K8s secret) or fall back to client-provided key
  const clientKey = SERVER_SDK_KEY || url.searchParams.get('client_key');

  // For features endpoint, use the public SDK endpoint
  // This doesn't require tenant authentication
  let endpoint: string;
  let adjustedQueryString = queryString;

  if (path[0] === 'features' && clientKey) {
    // Use public SDK endpoint: /api/features/{clientKey}
    endpoint = `/api/features/${clientKey}`;
    // Remove client_key from query string since it's now in the path
    const params = new URLSearchParams(url.searchParams);
    params.delete('client_key');
    adjustedQueryString = params.toString() ? `?${params.toString()}` : '';
  } else {
    // Use protected API endpoint: /api/v1/{path}
    endpoint = `/api/v1/${path.join('/')}`;
  }

  const fullUrl = `${FEATURE_FLAGS_SERVICE_URL}${endpoint}${adjustedQueryString}`;

  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Get Istio JWT headers
  const proxyHeaders = await getProxyHeaders(request) as Record<string, string>;

  // Build headers
  const headers: Record<string, string> = {
    ...proxyHeaders,
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
  };

  // Copy client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) headers['X-Forwarded-For'] = forwardedFor;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Feature Flags] ${request.method} ${fullUrl}`);
  }

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Handle request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const body = await request.json();
        fetchOptions.body = JSON.stringify(body);
      } catch {
        // No body or invalid JSON - continue without body
      }
    }

    const response = await fetch(fullUrl, fetchOptions);
    const data = await response.json().catch(() => ({}));

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Feature Flags] Response ${response.status}`);
    }

    // Transform SDK endpoint response to match expected format
    // SDK returns: {status: 200, features: {...}, dateUpdated: "..."}
    // Page expects: {success: true, data: {features: {...}, dateUpdated: "..."}}
    // Note: clientKey here includes server-side key from K8s secret
    if (path[0] === 'features' && data.features) {
      return NextResponse.json({
        success: true,
        data: {
          features: data.features,
          dateUpdated: data.dateUpdated,
        },
      }, { status: 200 });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Feature Flags] Proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Feature flags service unavailable',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 503 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToFeatureFlagsService(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToFeatureFlagsService(request, path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToFeatureFlagsService(request, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToFeatureFlagsService(request, path);
}
