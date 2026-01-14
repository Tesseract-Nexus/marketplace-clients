import { NextRequest, NextResponse } from 'next/server';

const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL || 'http://localhost:8080/api/v1';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');

    if (!latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: 'latitude and longitude are required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${LOCATION_SERVICE_URL}/address/reverse-geocode?latitude=${latitude}&longitude=${longitude}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Reverse geocode error:', response.status);
      return NextResponse.json(
        { success: false, error: 'Failed to reverse geocode' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data: data.data || data,
    });
  } catch (error) {
    console.error('Reverse geocode API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
