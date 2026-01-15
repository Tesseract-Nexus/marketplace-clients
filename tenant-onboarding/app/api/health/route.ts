import { NextResponse } from 'next/server';

const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8086';
const TIMEOUT_MS = 5000;

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    frontend: 'ok' | 'error';
    backend: 'ok' | 'error' | 'timeout';
  };
  latency?: {
    backend_ms: number;
  };
  error?: string;
}

export async function GET() {
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      frontend: 'ok',
      backend: 'ok',
    },
  };

  // Check backend service health
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const startTime = Date.now();
    const backendResponse = await fetch(`${TENANT_SERVICE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;
    healthStatus.latency = { backend_ms: latencyMs };

    if (!backendResponse.ok) {
      healthStatus.services.backend = 'error';
      healthStatus.status = 'degraded';
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      healthStatus.services.backend = 'timeout';
      healthStatus.error = 'Backend service timeout';
    } else {
      healthStatus.services.backend = 'error';
      healthStatus.error = 'Backend service unreachable';
    }
    healthStatus.status = 'degraded';
  }

  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
  return NextResponse.json(healthStatus, { status: statusCode });
}
