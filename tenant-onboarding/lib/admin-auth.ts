import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { getSecretWithFallback } from './gcp-secrets';

// Cached admin key to avoid repeated GCP Secret Manager calls
let cachedAdminKey: string | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Gets the admin API key from GCP Secret Manager or environment variable
 */
async function getAdminApiKey(): Promise<string | null> {
  // Return cached value if still valid
  if (cachedAdminKey && cacheExpiry > Date.now()) {
    return cachedAdminKey;
  }

  // Fetch from GCP Secret Manager (with fallback to env var for local dev)
  const key = await getSecretWithFallback(
    'CONTENT_ADMIN_API_KEY_SECRET_NAME',
    'CONTENT_ADMIN_API_KEY'
  );

  if (key) {
    cachedAdminKey = key;
    cacheExpiry = Date.now() + CACHE_TTL_MS;
  }

  return key;
}

export async function validateAdminAuth(
  request: NextRequest
): Promise<NextResponse | null> {
  // Get admin key from GCP Secret Manager
  const adminApiKey = await getAdminApiKey();

  // Check if admin key is configured
  if (!adminApiKey) {
    return NextResponse.json(
      { error: 'Admin access not configured' },
      { status: 503 }
    );
  }

  // Only accept key from header (never query params — prevents URL/log leakage)
  const providedKey = request.headers.get('X-Admin-Key');

  if (!providedKey) {
    return NextResponse.json({ error: 'Admin key required' }, { status: 401 });
  }

  // Timing-safe comparison to prevent timing attacks
  const encoder = new TextEncoder();
  const a = encoder.encode(providedKey);
  const b = encoder.encode(adminApiKey);
  if (a.byteLength !== b.byteLength || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Invalid admin key' }, { status: 403 });
  }

  // Auth passed
  return null;
}

// Helper to check admin auth in page components (async version)
export async function isAdminKeyValid(key: string | null): Promise<boolean> {
  if (!key) return false;
  const adminApiKey = await getAdminApiKey();
  if (!adminApiKey) return false;
  const encoder = new TextEncoder();
  const a = encoder.encode(key);
  const b = encoder.encode(adminApiKey);
  if (a.byteLength !== b.byteLength) return false;
  return timingSafeEqual(a, b);
}
