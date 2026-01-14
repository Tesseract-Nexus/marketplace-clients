import { NextRequest, NextResponse } from 'next/server';

const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8086';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const recipient = searchParams.get('recipient');
    const purpose = searchParams.get('purpose');

    const queryString = new URLSearchParams();
    if (recipient) queryString.append('recipient', recipient);
    if (purpose) queryString.append('purpose', purpose);

    const response = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/onboarding/sessions/${sessionId}/verification/status?${queryString.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': Math.random().toString(36).substring(2) + Date.now().toString(36),
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || { message: 'Failed to get verification status' } },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Verification status error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
