/**
 * OAuth callback endpoint removed for security.
 *
 * This endpoint previously handled OAuth callbacks and created local HS256 JWTs
 * which bypassed Keycloak and Istio JWT enforcement. It has been removed as part
 * of AUTH-MIGRATION-001.
 *
 * OAuth/social login should now use:
 * - auth-bff service which handles Keycloak IDP brokering
 * - Keycloak's built-in social login configuration
 *
 * To configure social login:
 * 1. Configure Google/Facebook/Apple as Identity Providers in Keycloak
 * 2. Use auth-bff's /auth/login?kc_idp_hint=google to trigger social login
 *
 * @see https://www.keycloak.org/docs/latest/server_admin/#_identity_broker
 * @see docs/security/AUTH_MIGRATION.md
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Redirect to home with error message
  const baseUrl = request.headers.get('host') || 'localhost:3000';
  const protocol = baseUrl.includes('localhost') ? 'http' : 'https';

  return NextResponse.redirect(
    new URL('/login?error=oauth_deprecated', `${protocol}://${baseUrl}`)
  );
}

export async function POST(request: NextRequest) {
  return GET(request);
}
