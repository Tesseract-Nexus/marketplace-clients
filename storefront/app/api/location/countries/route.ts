import { NextRequest, NextResponse } from 'next/server';

const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL || 'http://localhost:8080/api/v1';

export interface Country {
  id: string;
  name: string;
  nativeName: string;
  capital: string;
  region: string;
  subregion: string;
  currency: string;
  callingCode: string;
  flagEmoji: string;
  latitude: number;
  longitude: number;
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
      // Return common countries as fallback
      return NextResponse.json(getCommonCountries());
    }

    const data = await response.json();
    return NextResponse.json(data.data || data);
  } catch (error) {
    console.error('Countries API error:', error);
    return NextResponse.json(getCommonCountries());
  }
}

function getCommonCountries(): Country[] {
  return [
    { id: 'US', name: 'United States', nativeName: 'United States', capital: 'Washington D.C.', region: 'Americas', subregion: 'Northern America', currency: 'USD', callingCode: '+1', flagEmoji: '🇺🇸', latitude: 37.0902, longitude: -95.7129 },
    { id: 'IN', name: 'India', nativeName: 'भारत', capital: 'New Delhi', region: 'Asia', subregion: 'Southern Asia', currency: 'INR', callingCode: '+91', flagEmoji: '🇮🇳', latitude: 20.5937, longitude: 78.9629 },
    { id: 'GB', name: 'United Kingdom', nativeName: 'United Kingdom', capital: 'London', region: 'Europe', subregion: 'Northern Europe', currency: 'GBP', callingCode: '+44', flagEmoji: '🇬🇧', latitude: 55.3781, longitude: -3.4360 },
    { id: 'CA', name: 'Canada', nativeName: 'Canada', capital: 'Ottawa', region: 'Americas', subregion: 'Northern America', currency: 'CAD', callingCode: '+1', flagEmoji: '🇨🇦', latitude: 56.1304, longitude: -106.3468 },
    { id: 'AU', name: 'Australia', nativeName: 'Australia', capital: 'Canberra', region: 'Oceania', subregion: 'Australia and New Zealand', currency: 'AUD', callingCode: '+61', flagEmoji: '🇦🇺', latitude: -25.2744, longitude: 133.7751 },
    { id: 'DE', name: 'Germany', nativeName: 'Deutschland', capital: 'Berlin', region: 'Europe', subregion: 'Western Europe', currency: 'EUR', callingCode: '+49', flagEmoji: '🇩🇪', latitude: 51.1657, longitude: 10.4515 },
    { id: 'FR', name: 'France', nativeName: 'France', capital: 'Paris', region: 'Europe', subregion: 'Western Europe', currency: 'EUR', callingCode: '+33', flagEmoji: '🇫🇷', latitude: 46.2276, longitude: 2.2137 },
    { id: 'SG', name: 'Singapore', nativeName: 'Singapore', capital: 'Singapore', region: 'Asia', subregion: 'South-Eastern Asia', currency: 'SGD', callingCode: '+65', flagEmoji: '🇸🇬', latitude: 1.3521, longitude: 103.8198 },
    { id: 'NZ', name: 'New Zealand', nativeName: 'New Zealand', capital: 'Wellington', region: 'Oceania', subregion: 'Australia and New Zealand', currency: 'NZD', callingCode: '+64', flagEmoji: '🇳🇿', latitude: -40.9006, longitude: 174.886 },
    { id: 'JP', name: 'Japan', nativeName: '日本', capital: 'Tokyo', region: 'Asia', subregion: 'Eastern Asia', currency: 'JPY', callingCode: '+81', flagEmoji: '🇯🇵', latitude: 36.2048, longitude: 138.2529 },
  ];
}
