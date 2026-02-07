/**
 * TOTP Setup Confirm API Route (Onboarding)
 *
 * POST /api/auth/totp/setup/confirm
 * Proxies to auth-bff /auth/totp/setup/confirm-onboarding
 */

import { NextRequest, NextResponse } from 'next/server';

const AUTH_BFF_URL = process.env.AUTH_BFF_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${AUTH_BFF_URL}/auth/totp/setup/confirm-onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[TOTP Setup Confirm] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
