import { NextResponse } from 'next/server';

/**
 * Health check endpoint for startup/liveness probes.
 *
 * Returns 200 immediately to satisfy Cloud Run probes (3s timeout).
 * The frontend container itself is always healthy if it can serve this response.
 * Backend connectivity is NOT checked here — that would block the response
 * beyond the probe timeout (TENANT_SERVICE_URL defaults to localhost:8086
 * which is unreachable on Cloud Run, causing a 5s hang).
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      frontend: 'ok',
    },
  });
}
