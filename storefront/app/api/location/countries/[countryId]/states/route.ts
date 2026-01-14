import { NextRequest, NextResponse } from 'next/server';

const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL || 'http://localhost:8080/api/v1';

export interface State {
  id: string;
  name: string;
  nativeName: string;
  code: string;
  countryId: string;
  type: string;
  latitude: number;
  longitude: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ countryId: string }> }
) {
  try {
    const { countryId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    const url = new URL(`${LOCATION_SERVICE_URL}/countries/${countryId}/states`);
    if (search) url.searchParams.set('search', search);
    url.searchParams.set('limit', '100'); // Get all states

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('States fetch error:', response.status);
      // Return states for common countries as fallback
      return NextResponse.json(getStatesFallback(countryId));
    }

    const data = await response.json();
    return NextResponse.json(data.data || data);
  } catch (error) {
    console.error('States API error:', error);
    const { countryId } = await params;
    return NextResponse.json(getStatesFallback(countryId));
  }
}

function getStatesFallback(countryId: string): State[] {
  const statesMap: Record<string, State[]> = {
    US: [
      { id: 'US-CA', name: 'California', nativeName: 'California', code: 'CA', countryId: 'US', type: 'state', latitude: 36.7783, longitude: -119.4179 },
      { id: 'US-NY', name: 'New York', nativeName: 'New York', code: 'NY', countryId: 'US', type: 'state', latitude: 40.7128, longitude: -74.0060 },
      { id: 'US-TX', name: 'Texas', nativeName: 'Texas', code: 'TX', countryId: 'US', type: 'state', latitude: 31.9686, longitude: -99.9018 },
      { id: 'US-FL', name: 'Florida', nativeName: 'Florida', code: 'FL', countryId: 'US', type: 'state', latitude: 27.6648, longitude: -81.5158 },
      { id: 'US-IL', name: 'Illinois', nativeName: 'Illinois', code: 'IL', countryId: 'US', type: 'state', latitude: 40.6331, longitude: -89.3985 },
      { id: 'US-PA', name: 'Pennsylvania', nativeName: 'Pennsylvania', code: 'PA', countryId: 'US', type: 'state', latitude: 41.2033, longitude: -77.1945 },
      { id: 'US-OH', name: 'Ohio', nativeName: 'Ohio', code: 'OH', countryId: 'US', type: 'state', latitude: 40.4173, longitude: -82.9071 },
      { id: 'US-GA', name: 'Georgia', nativeName: 'Georgia', code: 'GA', countryId: 'US', type: 'state', latitude: 32.1656, longitude: -82.9001 },
      { id: 'US-NC', name: 'North Carolina', nativeName: 'North Carolina', code: 'NC', countryId: 'US', type: 'state', latitude: 35.7596, longitude: -79.0193 },
      { id: 'US-MI', name: 'Michigan', nativeName: 'Michigan', code: 'MI', countryId: 'US', type: 'state', latitude: 44.3148, longitude: -85.6024 },
      { id: 'US-WA', name: 'Washington', nativeName: 'Washington', code: 'WA', countryId: 'US', type: 'state', latitude: 47.7511, longitude: -120.7401 },
    ],
    IN: [
      { id: 'IN-MH', name: 'Maharashtra', nativeName: 'महाराष्ट्र', code: 'MH', countryId: 'IN', type: 'state', latitude: 19.7515, longitude: 75.7139 },
      { id: 'IN-KA', name: 'Karnataka', nativeName: 'ಕರ್ನಾಟಕ', code: 'KA', countryId: 'IN', type: 'state', latitude: 15.3173, longitude: 75.7139 },
      { id: 'IN-DL', name: 'Delhi', nativeName: 'दिल्ली', code: 'DL', countryId: 'IN', type: 'union_territory', latitude: 28.7041, longitude: 77.1025 },
      { id: 'IN-TN', name: 'Tamil Nadu', nativeName: 'தமிழ்நாடு', code: 'TN', countryId: 'IN', type: 'state', latitude: 11.1271, longitude: 78.6569 },
      { id: 'IN-GJ', name: 'Gujarat', nativeName: 'ગુજરાત', code: 'GJ', countryId: 'IN', type: 'state', latitude: 22.2587, longitude: 71.1924 },
      { id: 'IN-RJ', name: 'Rajasthan', nativeName: 'राजस्थान', code: 'RJ', countryId: 'IN', type: 'state', latitude: 27.0238, longitude: 74.2179 },
      { id: 'IN-UP', name: 'Uttar Pradesh', nativeName: 'उत्तर प्रदेश', code: 'UP', countryId: 'IN', type: 'state', latitude: 26.8467, longitude: 80.9462 },
      { id: 'IN-WB', name: 'West Bengal', nativeName: 'পশ্চিমবঙ্গ', code: 'WB', countryId: 'IN', type: 'state', latitude: 22.9868, longitude: 87.8550 },
      { id: 'IN-KL', name: 'Kerala', nativeName: 'കേരളം', code: 'KL', countryId: 'IN', type: 'state', latitude: 10.8505, longitude: 76.2711 },
      { id: 'IN-AP', name: 'Andhra Pradesh', nativeName: 'ఆంధ్ర ప్రదేశ్', code: 'AP', countryId: 'IN', type: 'state', latitude: 15.9129, longitude: 79.7400 },
      { id: 'IN-TS', name: 'Telangana', nativeName: 'తెలంగాణ', code: 'TS', countryId: 'IN', type: 'state', latitude: 18.1124, longitude: 79.0193 },
    ],
    GB: [
      { id: 'GB-ENG', name: 'England', nativeName: 'England', code: 'ENG', countryId: 'GB', type: 'country', latitude: 52.3555, longitude: -1.1743 },
      { id: 'GB-SCT', name: 'Scotland', nativeName: 'Scotland', code: 'SCT', countryId: 'GB', type: 'country', latitude: 56.4907, longitude: -4.2026 },
      { id: 'GB-WLS', name: 'Wales', nativeName: 'Cymru', code: 'WLS', countryId: 'GB', type: 'country', latitude: 52.1307, longitude: -3.7837 },
      { id: 'GB-NIR', name: 'Northern Ireland', nativeName: 'Northern Ireland', code: 'NIR', countryId: 'GB', type: 'province', latitude: 54.7877, longitude: -6.4923 },
    ],
    CA: [
      { id: 'CA-ON', name: 'Ontario', nativeName: 'Ontario', code: 'ON', countryId: 'CA', type: 'province', latitude: 51.2538, longitude: -85.3232 },
      { id: 'CA-QC', name: 'Quebec', nativeName: 'Québec', code: 'QC', countryId: 'CA', type: 'province', latitude: 52.9399, longitude: -73.5491 },
      { id: 'CA-BC', name: 'British Columbia', nativeName: 'British Columbia', code: 'BC', countryId: 'CA', type: 'province', latitude: 53.7267, longitude: -127.6476 },
      { id: 'CA-AB', name: 'Alberta', nativeName: 'Alberta', code: 'AB', countryId: 'CA', type: 'province', latitude: 53.9333, longitude: -116.5765 },
    ],
    AU: [
      { id: 'AU-NSW', name: 'New South Wales', nativeName: 'New South Wales', code: 'NSW', countryId: 'AU', type: 'state', latitude: -31.2532, longitude: 146.9211 },
      { id: 'AU-VIC', name: 'Victoria', nativeName: 'Victoria', code: 'VIC', countryId: 'AU', type: 'state', latitude: -37.4713, longitude: 144.7852 },
      { id: 'AU-QLD', name: 'Queensland', nativeName: 'Queensland', code: 'QLD', countryId: 'AU', type: 'state', latitude: -20.9176, longitude: 142.7028 },
      { id: 'AU-WA', name: 'Western Australia', nativeName: 'Western Australia', code: 'WA', countryId: 'AU', type: 'state', latitude: -27.6728, longitude: 121.6283 },
    ],
  };

  return statesMap[countryId] || [];
}
