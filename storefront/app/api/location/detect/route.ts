import { NextRequest, NextResponse } from 'next/server';

const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL || 'http://localhost:8080/api/v1';

export interface LocationDetectionResponse {
  ip: string;
  country: string;
  countryName: string;
  callingCode: string;
  flagEmoji: string;
  state: string;
  stateName: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  currency: string;
  locale: string;
}

export async function GET(request: NextRequest) {
  try {
    // Extract client IP from headers (set by reverse proxy/load balancer)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = forwardedFor?.split(',')[0]?.trim() || realIP || '';

    // Build URL with IP if available
    const url = new URL(`${LOCATION_SERVICE_URL}/location/detect`);
    if (clientIP && !isPrivateIP(clientIP)) {
      url.searchParams.set('ip', clientIP);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(clientIP && { 'X-Forwarded-For': clientIP }),
      },
    });

    if (!response.ok) {
      console.error('Location service error:', response.status);
      // Return default US location as fallback
      return NextResponse.json(getDefaultLocation());
    }

    const locationData: LocationDetectionResponse = await response.json();
    return NextResponse.json(locationData);
  } catch (error) {
    console.error('Location detection error:', error);
    // Return default location on error
    return NextResponse.json(getDefaultLocation());
  }
}

function isPrivateIP(ip: string): boolean {
  // Check for private/local IP ranges
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false;

  const [a, b] = parts;
  if (a === undefined || b === undefined) return false;

  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // 127.0.0.0/8 (localhost)
  if (a === 127) return true;

  return false;
}

function getDefaultLocation(): LocationDetectionResponse {
  return {
    ip: '',
    country: 'US',
    countryName: 'United States',
    callingCode: '+1',
    flagEmoji: '🇺🇸',
    state: 'US-CA',
    stateName: 'California',
    city: 'San Francisco',
    postalCode: '94102',
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    locale: 'en_US',
  };
}
