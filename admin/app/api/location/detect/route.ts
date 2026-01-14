import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest, SERVICES, validateRequest, errorResponse } from '../../lib/api-handler';

// Get client IP from request headers
function getClientIP(request: NextRequest): string | null {
  // Check various headers for client IP (in order of reliability)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first (original client)
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0] || null;
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Vercel/Next.js specific
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0]?.trim() || null;
  }

  return null;
}

export async function GET(request: NextRequest) {
  // Rate limit check
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const { searchParams } = new URL(request.url);
  let ip = searchParams.get('ip');

  // If no IP provided, try to get the client's IP from headers
  if (!ip) {
    ip = getClientIP(request);
  }

  // Build query string for backend
  const queryParts: string[] = [];
  if (ip) queryParts.push(`ip=${encodeURIComponent(ip)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  return proxyRequest(
    SERVICES.LOCATION,
    `/api/v1/location/detect${queryString}`,
    request,
    { method: 'GET' }
  );
}
