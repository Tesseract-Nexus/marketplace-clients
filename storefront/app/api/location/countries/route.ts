import { NextRequest, NextResponse } from 'next/server';

const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL || 'http://localhost:8080/api/v1';

export interface Country {
  id: string;
  name: string;
  nativeName: string;
  code: string;
  capital: string;
  region: string;
  subregion: string;
  currency: string;
  callingCode: string;
  flagEmoji: string;
  latitude: number;
  longitude: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCountry(raw: any): Country {
  return {
    id: raw.id,
    name: raw.name,
    nativeName: raw.native_name || raw.nativeName || raw.name,
    code: raw.code || raw.id, // location-service uses `id` as the ISO code
    capital: raw.capital || '',
    region: raw.region || '',
    subregion: raw.subregion || '',
    currency: raw.currency || '',
    callingCode: raw.calling_code || raw.callingCode || '',
    flagEmoji: raw.flag_emoji || raw.flagEmoji || '',
    latitude: raw.latitude || 0,
    longitude: raw.longitude || 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get('region');
    const search = searchParams.get('search');

    const url = new URL(`${LOCATION_SERVICE_URL}/countries`);
    if (region) url.searchParams.set('region', region);
    if (search) url.searchParams.set('search', search);
    url.searchParams.set('limit', '250'); // Get all countries

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Countries fetch error:', response.status);
      return NextResponse.json({ countries: [] }, { status: response.status });
    }

    const data = await response.json();
    const rawCountries = data.data || data;
    const countries = Array.isArray(rawCountries)
      ? rawCountries.map(mapCountry)
      : [];

    return NextResponse.json({ countries });
  } catch (error) {
    console.error('Countries API error:', error);
    return NextResponse.json({ countries: [] }, { status: 502 });
  }
}


