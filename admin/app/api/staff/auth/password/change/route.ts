import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint has been removed.',
      message: 'Password changes are handled by Keycloak. Use the Keycloak account settings.',
      code: 'KEYCLOAK_REQUIRED',
    },
    { status: 410 }
  );
}
