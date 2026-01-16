import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost } from '@/lib/utils/api-route-handler';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

// SECURITY: POST handler is preferred - token is sent in request body, not URL
// This prevents token exposure in browser history, referrer headers, and server logs
export async function POST(request: NextRequest) {
  return proxyPost(STAFF_SERVICE_URL, 'auth/invitation/verify', request);
}

// DEPRECATED: GET handler kept for backward compatibility during migration
// TODO: Remove after 14 days (after 2024-02-01 or similar deadline)
// Tokens in URLs are a security risk - they leak via history/referrer/logs
export async function GET(request: NextRequest) {
  console.warn('[SECURITY] Deprecated: Invitation verification via GET with token in URL. Use POST with token in body instead.');
  const token = request.nextUrl.searchParams.get('token');
  return proxyGet(STAFF_SERVICE_URL, `auth/invitation/verify?token=${encodeURIComponent(token || '')}`, request);
}
