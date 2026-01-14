import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  checks?: {
    name: string;
    status: 'pass' | 'fail';
    message?: string;
  }[];
}

const startTime = Date.now();

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const response: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'admin-portal',
    version: process.env.npm_package_version || '0.1.0',
    uptime,
    checks: [
      {
        name: 'runtime',
        status: 'pass',
        message: 'Node.js runtime is operational',
      },
      {
        name: 'memory',
        status: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? 'pass' : 'fail',
        message: `Heap used: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      },
    ],
  };

  // Check if any health check failed
  const hasFailure = response.checks?.some((check) => check.status === 'fail');
  if (hasFailure) {
    response.status = 'unhealthy';
    return NextResponse.json(response, { status: 503 });
  }

  return NextResponse.json(response, { status: 200 });
}
