import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint has been removed.',
      message: 'Authentication is handled by Keycloak. Use /auth/login for the OIDC flow.',
      code: 'KEYCLOAK_REQUIRED',
    },
    { status: 410 }
  );
}
