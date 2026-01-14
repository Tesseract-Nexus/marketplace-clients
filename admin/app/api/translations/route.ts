import { NextRequest, NextResponse } from 'next/server';

// Translation service URL - uses Kubernetes internal DNS in production
// Falls back to localhost for local development
const TRANSLATION_SERVICE_BASE =
  process.env.TRANSLATION_SERVICE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'http://translation-service.devtest.svc.cluster.local:8080'
    : 'http://localhost:8080');

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30000;

/**
 * Helper to create fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number = REQUEST_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Helper to handle errors consistently
 */
function handleError(error: unknown, endpoint: string, method: string): NextResponse {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const isTimeout = error instanceof Error && error.name === 'AbortError';
  const isConnectionError = errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND');

  console.error(`Translation service ${method} error:`, {
    endpoint,
    error: errorMessage,
    service: TRANSLATION_SERVICE_BASE,
    timestamp: new Date().toISOString(),
  });

  if (isTimeout) {
    return NextResponse.json(
      { error: 'Translation service request timed out', details: 'The service took too long to respond' },
      { status: 504 }
    );
  }

  if (isConnectionError) {
    return NextResponse.json(
      { error: 'Translation service unavailable', details: 'Unable to connect to translation service' },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: 'Translation service error', details: errorMessage },
    { status: 500 }
  );
}

/**
 * Proxy requests to the translation service
 */
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID');
  const userId = request.headers.get('X-User-ID');
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'languages';

  // Languages endpoint doesn't require tenant ID
  if (!tenantId && endpoint !== 'languages' && !endpoint.startsWith('users/me')) {
    return NextResponse.json(
      { error: 'X-Tenant-ID header is required' },
      { status: 400 }
    );
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }
    if (userId) {
      headers['X-User-ID'] = userId;
    }

    const response = await fetchWithTimeout(`${TRANSLATION_SERVICE_BASE}/api/v1/${endpoint}`, {
      method: 'GET',
      headers,
    });

    // Handle non-JSON responses gracefully
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      console.error('Translation service returned non-JSON response:', { status: response.status, body: text.substring(0, 200) });
      return NextResponse.json(
        { error: 'Invalid response from translation service', details: 'Expected JSON response' },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleError(error, endpoint, 'GET');
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID');

  if (!tenantId) {
    return NextResponse.json(
      { error: 'X-Tenant-ID header is required' },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'translate';

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  try {
    const response = await fetchWithTimeout(`${TRANSLATION_SERVICE_BASE}/api/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Handle non-JSON responses gracefully
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      console.error('Translation service returned non-JSON response:', { status: response.status, body: text.substring(0, 200) });
      return NextResponse.json(
        { error: 'Invalid response from translation service', details: 'Expected JSON response' },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleError(error, endpoint, 'POST');
  }
}

export async function PUT(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID');
  const userId = request.headers.get('X-User-ID');

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'preferences';

  // User preference endpoints don't strictly require tenant ID
  if (!tenantId && !endpoint.startsWith('users/me')) {
    return NextResponse.json(
      { error: 'X-Tenant-ID header is required' },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }
    if (userId) {
      headers['X-User-ID'] = userId;
    }

    const response = await fetchWithTimeout(`${TRANSLATION_SERVICE_BASE}/api/v1/${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    // Handle non-JSON responses gracefully
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      console.error('Translation service returned non-JSON response:', { status: response.status, body: text.substring(0, 200) });
      return NextResponse.json(
        { error: 'Invalid response from translation service', details: 'Expected JSON response' },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleError(error, endpoint, 'PUT');
  }
}

export async function DELETE(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID');

  if (!tenantId) {
    return NextResponse.json(
      { error: 'X-Tenant-ID header is required' },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'cache';

  try {
    const response = await fetchWithTimeout(`${TRANSLATION_SERVICE_BASE}/api/v1/${endpoint}`, {
      method: 'DELETE',
      headers: {
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json',
      },
    });

    // Handle non-JSON responses gracefully
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      console.error('Translation service returned non-JSON response:', { status: response.status, body: text.substring(0, 200) });
      return NextResponse.json(
        { error: 'Invalid response from translation service', details: 'Expected JSON response' },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleError(error, endpoint, 'DELETE');
  }
}
