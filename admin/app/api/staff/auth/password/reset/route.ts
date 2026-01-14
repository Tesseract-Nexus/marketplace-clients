import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint has been removed.',
      message: 'Password reset is handled by Keycloak. Use the Keycloak login flow.',
      code: 'KEYCLOAK_REQUIRED',
    },
    { status: 410 }
  );
}
