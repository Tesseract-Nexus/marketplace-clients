import { NextRequest, NextResponse } from 'next/server';

const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL || 'http://localhost:8080/api/v1';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const input = searchParams.get('input');

    if (!input || input.length < 3) {
      return NextResponse.json({
        success: true,
        data: { suggestions: [], allow_manual_entry: true },
      });
    }

    const params = new URLSearchParams();
    params.append('input', input);

    // Optional parameters
    const sessionToken = searchParams.get('session_token');
    if (sessionToken) params.append('session_token', sessionToken);

    const components = searchParams.get('components');
    if (components) params.append('components', components);

    const language = searchParams.get('language');
    if (language) params.append('language', language);

    const latitude = searchParams.get('latitude');
    if (latitude) params.append('latitude', latitude);

    const longitude = searchParams.get('longitude');
    if (longitude) params.append('longitude', longitude);

    const radius = searchParams.get('radius');
    if (radius) params.append('radius', radius);

    const response = await fetch(
      `${LOCATION_SERVICE_URL}/address/autocomplete?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Address autocomplete error:', response.status);
      return NextResponse.json({
        success: true,
        data: { suggestions: [], allow_manual_entry: true },
      });
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data: data.data || data,
    });
  } catch (error) {
    console.error('Address autocomplete API error:', error);
    return NextResponse.json({
      success: true,
      data: { suggestions: [], allow_manual_entry: true },
    });
  }
}
