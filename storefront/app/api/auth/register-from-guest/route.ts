/**
 * Guest-to-customer conversion endpoint removed for security.
 *
 * This endpoint previously implemented local guest-to-customer conversion which
 * created local HS256 JWTs. It has been removed as part of AUTH-MIGRATION-001.
 *
 * Guest checkout to registered customer conversion should now use:
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
      error: 'This endpoint has been removed.',
      message: 'Please use the new registration flow via /auth/register',
      migration: 'AUTH-MIGRATION-001',
    },
    { status: 410 }
  );
}
