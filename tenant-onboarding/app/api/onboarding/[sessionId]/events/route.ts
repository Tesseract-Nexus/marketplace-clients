import { NextRequest } from 'next/server';

const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8086';

/**
 * SSE proxy endpoint for real-time session events
 * Proxies Server-Sent Events from tenant-service to the frontend
 *
 * This enables real-time verification status updates without polling
 * When email verification completes, the session.completed event is broadcast
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  // Validate sessionId format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    return new Response(JSON.stringify({ error: 'Invalid session ID format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Connect to the tenant-service SSE endpoint
    const response = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/onboarding/sessions/${sessionId}/events`,
      {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'X-Request-ID': crypto.randomUUID(),
        },
        // @ts-ignore - Next.js specific option for streaming
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SSE Proxy] Failed to connect: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({ error: 'Failed to connect to event stream' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if we got an SSE response
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/event-stream')) {
      console.error(`[SSE Proxy] Unexpected content-type: ${contentType}`);
      return new Response(JSON.stringify({ error: 'Invalid response from event stream' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a TransformStream to pass through the SSE data
    const { readable, writable } = new TransformStream();

    // Pipe the response body to our writable stream
    if (response.body) {
      response.body.pipeTo(writable).catch((err) => {
        console.log('[SSE Proxy] Stream closed:', err.message);
      });
    }

    // Return the readable stream as SSE
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || 'https://onboarding.tesserix.app',
      },
    });
  } catch (error) {
    console.error('[SSE Proxy] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Disable static optimization for SSE
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
