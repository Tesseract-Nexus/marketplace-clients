import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

// Root domain prefixes (these are NOT tenants)
const ROOT_PREFIXES = ['dev', 'staging', 'prod'];

/**
 * Extract tenant slug from hostname
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
 * Activate staff account
 *
 * IMPORTANT: This is a public endpoint (no JWT required).
 * Staff-service TenantMiddleware requires X-Tenant-ID header, which we extract from subdomain.
 */
export async function POST(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const tenantSlug = extractTenantFromHost(host);

  if (!tenantSlug) {
    console.error('[Activate] No tenant found in hostname:', host);
    return NextResponse.json(
      { success: false, message: 'Tenant context required. Access via tenant subdomain.' },
      { status: 400 }
    );
  }

  const url = `${STAFF_SERVICE_URL}/auth/activate`;

  console.log('[Activate] Forwarding to staff-service:', {
    url,
    tenant: tenantSlug,
  });

  try {
    const body = await request.json();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantSlug,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Activate] Failed to activate with staff-service:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to activate account' },
      { status: 502 }
    );
  }
}
