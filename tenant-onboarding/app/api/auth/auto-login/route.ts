/**
 * Auto-Login API Route
 *
 * POST /api/auth/auto-login
 *
 * Creates a session transfer code from tokens returned by account-setup.
 * This allows seamless redirect to the admin dashboard without requiring
 * the user to log in again after completing onboarding.
 */

import { NextRequest, NextResponse } from 'next/server';

// BFF URL configuration
const AUTH_BFF_URL = process.env.AUTH_BFF_URL || 'http://localhost:8080';

interface AutoLoginRequest {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user_id: string;
  email: string;
  tenant_id: string;
  tenant_slug: string;
  first_name?: string;
  last_name?: string;
}

interface AutoLoginResponse {
  success: boolean;
  transfer_code?: string;
  admin_url?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<AutoLoginResponse>> {
  try {
    const body: AutoLoginRequest = await request.json();

    // Validate required fields
    if (!body.access_token || !body.user_id || !body.email || !body.tenant_id || !body.tenant_slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: access_token, user_id, email, tenant_id, tenant_slug',
        },
        { status: 400 }
      );
    }

    // Call BFF to create transfer code
    const bffResponse = await fetch(`${AUTH_BFF_URL}/auth/import-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: body.access_token,
        refresh_token: body.refresh_token,
        expires_in: body.expires_in,
        user_id: body.user_id,
        email: body.email,
        tenant_id: body.tenant_id,
        tenant_slug: body.tenant_slug,
        first_name: body.first_name,
        last_name: body.last_name,
      }),
    });

    if (!bffResponse.ok) {
      const errorData = await bffResponse.json().catch(() => ({}));
      console.error('[Auto-Login] BFF error:', errorData);
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || 'Failed to create auto-login session',
        },
        { status: bffResponse.status }
      );
    }

    const bffData = await bffResponse.json();

    // Build admin URL with transfer code
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app';
    const adminBaseUrl = `https://${body.tenant_slug}-admin.${baseDomain}`;
    const adminUrl = `${adminBaseUrl}/auth/accept-transfer?code=${bffData.transfer_code}&returnTo=/`;

    return NextResponse.json({
      success: true,
      transfer_code: bffData.transfer_code,
      admin_url: adminUrl,
    });
  } catch (error) {
    console.error('[Auto-Login] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
