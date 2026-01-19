import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

// Root domain prefixes (these are NOT tenants)
const ROOT_PREFIXES = ['dev', 'staging', 'prod'];

/**
 * Extract tenant slug from hostname
 *
 * Patterns:
 * - {tenant}-admin.tesserix.app -> {tenant}
 * - {tenant}.localhost -> {tenant}
 */
function extractTenantFromHost(host: string): string | null {
  const hostname = host.split(':')[0];

  // Pattern 1: {tenant}-admin.tesserix.app
  const cloudPattern = /^(.+)-admin\.tesserix\.app$/;
  const cloudMatch = hostname.match(cloudPattern);
  if (cloudMatch) {
    const prefix = cloudMatch[1];
    if (ROOT_PREFIXES.includes(prefix)) {
      return null;
    }
    return prefix;
  }

  // Pattern 2: {tenant}.localhost
  const localPattern = /^(.+)\.localhost$/;
  const localMatch = hostname.match(localPattern);
  if (localMatch && !localMatch[1].includes('.')) {
    return localMatch[1];
  }

  return null;
}

/**
 * Verify invitation by forwarding to staff-service
 *
 * IMPORTANT: This is a public endpoint (no JWT required).
 * Staff-service TenantMiddleware requires X-Tenant-ID header, which we extract from subdomain.
 */
async function verifyInvitation(token: string, request: NextRequest): Promise<NextResponse> {
  const host = request.headers.get('host') || '';
  const tenantSlug = extractTenantFromHost(host);

  if (!tenantSlug) {
    console.error('[Invitation Verify] No tenant found in hostname:', host);
    return NextResponse.json(
      { valid: false, message: 'Tenant context required. Access via tenant subdomain.' },
      { status: 400 }
    );
  }

  const url = `${STAFF_SERVICE_URL}/auth/invitation/verify?token=${encodeURIComponent(token)}`;

  console.log('[Invitation Verify] Forwarding to staff-service:', {
    url,
    tenant: tenantSlug,
  });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantSlug,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Invitation Verify] Failed to verify with staff-service:', error);
    return NextResponse.json(
      { valid: false, message: 'Failed to verify invitation' },
      { status: 502 }
    );
  }
}

// SECURITY: POST handler is preferred - token is sent in request body, not URL
// This prevents token exposure in browser history, referrer headers, and server logs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body.token;

    if (!token) {
      return NextResponse.json(
        { valid: false, message: 'Token is required' },
        { status: 400 }
      );
    }

    return verifyInvitation(token, request);
  } catch (error) {
    console.error('[Invitation Verify] Error processing request:', error);
    return NextResponse.json(
      { valid: false, message: 'Failed to verify invitation' },
      { status: 500 }
    );
  }
}

// DEPRECATED: GET handler kept for backward compatibility
// Tokens in URLs are a security risk - they leak via history/referrer/logs
export async function GET(request: NextRequest) {
  console.warn('[SECURITY] Deprecated: Invitation verification via GET with token in URL. Use POST with token in body instead.');
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { valid: false, message: 'Token is required' },
      { status: 400 }
    );
  }

  return verifyInvitation(token, request);
}
