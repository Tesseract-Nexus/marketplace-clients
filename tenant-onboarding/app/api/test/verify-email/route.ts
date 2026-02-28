/**
 * Test API Route for Email Verification Bypass
 *
 * POST /api/test/verify-email
 *
 * This endpoint is for E2E testing only. It allows tests to mark
 * an email as verified without actually receiving/clicking the verification email.
 *
 * SECURITY: This endpoint should only be available in dev/test environments.
 */

import { NextRequest, NextResponse } from 'next/server';

const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8086';
const IS_TEST_MODE = process.env.NODE_ENV === 'development' ||
                     process.env.ENVIRONMENT === 'dev' ||
                     process.env.ENVIRONMENT === 'test';

interface VerifyEmailRequest {
  session_id: string;
  email: string;
}

export async function POST(request: NextRequest) {
  // Only allow in test/dev mode
  if (!IS_TEST_MODE) {
    return NextResponse.json(
      { error: { message: 'Test endpoints are only available in dev/test environments' } },
      { status: 403 }
    );
  }

  try {
    const body: VerifyEmailRequest = await request.json();

    if (!body.session_id || !body.email) {
      return NextResponse.json(
        { error: { message: 'session_id and email are required' } },
        { status: 400 }
      );
    }

    // Try to call the backend test endpoint
    const backendResponse = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/test/verify-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': crypto.randomUUID(),
        },
        body: JSON.stringify(body),
      }
    );

    if (backendResponse.ok) {
      const data = await backendResponse.json();
      return NextResponse.json({
        success: true,
        message: 'Email verified for testing',
        data: {
          session_id: body.session_id,
          email: body.email,
          verified: true,
        },
      });
    }

    // If backend test endpoint is not available, try an alternative approach
    // Mark the email_verification task as completed via the session update endpoint
    const completeTaskResponse = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/onboarding/sessions/${body.session_id}/tasks/email_verification`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': crypto.randomUUID(),
        },
        body: JSON.stringify({
          status: 'completed',
          completed_at: new Date().toISOString(),
        }),
      }
    );

    if (completeTaskResponse.ok) {
      return NextResponse.json({
        success: true,
        message: 'Email verification task marked as completed',
        data: {
          session_id: body.session_id,
          email: body.email,
          verified: true,
        },
      });
    }

    // Return error if neither approach worked
    const errorData = await completeTaskResponse.json().catch(() => ({}));
    return NextResponse.json(
      {
        error: {
          message: 'Failed to verify email for testing',
          details: errorData,
        },
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('[Test Verify Email] Error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// GET endpoint to check test mode status
export async function GET() {
  return NextResponse.json({
    test_mode: IS_TEST_MODE,
    environment: process.env.ENVIRONMENT || process.env.NODE_ENV,
  });
}
