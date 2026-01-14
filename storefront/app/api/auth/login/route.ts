/**
 * Local authentication endpoint removed for security.
 *
 * This endpoint previously implemented local HS256 JWT authentication which
 * bypassed Keycloak and Istio JWT enforcement. It has been removed as part
 * of AUTH-MIGRATION-001.
 *
 * Customer authentication should now use:
 * - auth-bff service for session management
 * - Keycloak customer realm for identity
 *
 * @see docs/security/AUTH_MIGRATION.md
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'This authentication endpoint has been removed.',
      message: 'Please use the new authentication flow via /auth/login',
      migration: 'AUTH-MIGRATION-001',
    },
    { status: 410 }
  );
}
