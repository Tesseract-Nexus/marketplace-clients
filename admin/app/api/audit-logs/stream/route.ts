import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';

const AUDIT_SERVICE_URL = getServiceUrl('AUDIT');

/**
 * GET /api/audit-logs/stream
 * Server-Sent Events stream for real-time audit log updates
 *
 * This endpoint proxies the SSE stream from the audit service to the client.
 * The stream sends:
 * - Initial batch of recent logs on connect
 * - New logs as they are created
 * - Heartbeats every 5 seconds to keep the connection alive
 */
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID');
  const authorization = request.headers.get('Authorization');

  if (!tenantId) {
    return NextResponse.json(
      { error: 'Tenant ID is required' },
      { status: 400 }
    );
  }

  try {
    const headers: Record<string, string> = {
      'Accept': 'text/event-stream',
      'X-Tenant-ID': tenantId,
    };

    if (authorization) {
      headers['Authorization'] = authorization;
    }

    const response = await fetch(`${AUDIT_SERVICE_URL}/audit-logs/stream`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to connect to audit stream' },
        { status: response.status }
      );
    }

    // Create a TransformStream to pipe the SSE data
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }
            controller.enqueue(value);
          }
        } catch {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('SSE stream error:', error);
    return NextResponse.json(
      { error: 'Failed to establish stream connection' },
      { status: 500 }
    );
  }
}
