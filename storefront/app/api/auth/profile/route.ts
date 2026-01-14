/**
 * Local profile endpoint removed for security.
 *
 * This endpoint previously verified local HS256 JWT tokens for profile access.
 * It has been removed as part of AUTH-MIGRATION-001.
 *
 * Customer profile should now be accessed via:
 * - auth-bff session for authentication
 * - Direct call to customers-service with Istio JWT validation
 *
 * @see docs/security/AUTH_MIGRATION.md
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'This profile endpoint has been removed.',
      message: 'Please use the authenticated /api/customers/me endpoint',
      migration: 'AUTH-MIGRATION-001',
    },
    { status: 410 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: 'This profile endpoint has been removed.',
      message: 'Please use the authenticated /api/customers/me endpoint',
      migration: 'AUTH-MIGRATION-001',
    },
    { status: 410 }
  );
}
