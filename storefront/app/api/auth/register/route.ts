/**
 * Local registration endpoint removed for security.
 *
 * This endpoint previously implemented local customer registration which
 * bypassed Keycloak. It has been removed as part of AUTH-MIGRATION-001.
 *
 * Customer registration should now use:
 * - auth-bff service for session management
 * - Keycloak customer realm for identity creation
 *
 * @see docs/security/AUTH_MIGRATION.md
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'This registration endpoint has been removed.',
      message: 'Please use the new registration flow via /auth/register',
      migration: 'AUTH-MIGRATION-001',
    },
    { status: 410 }
  );
}
