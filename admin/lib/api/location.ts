// Location API client for admin app

// Location Data from IP detection
export interface LocationData {
  ip: string;
  country: string;
  country_name: string;
  calling_code: string;
  flag_emoji: string;
  state?: string;
  state_name?: string;
  city?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  currency: string;
  locale?: string;
}

// Address Types
export interface AddressSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  types: string[];
}

export interface AddressComponent {
  type: string;
  long_name: string;
  short_name: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface GeocodingResult {
  formatted_address: string;
  place_id: string;
  location: GeoLocation;
  components: AddressComponent[];
  types: string[];
}

export interface ParsedAddress {
  street_number?: string;
  street_name?: string;
  city?: string;
  state?: string;
  state_code?: string;
  country?: string;
  country_code?: string;
  postal_code?: string;
  formatted_address?: string;
  location?: GeoLocation;
}

export interface AutocompleteOptions {
  session_token?: string;
  types?: string[];
  components?: string;
  language?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export interface Country {
  id: string;
  name: string;
  calling_code: string;
  capital?: string;
  currency?: string;
  native_name?: string;
  region?: string;
  subregion?: string;
  flag_emoji?: string;
  active?: boolean;
}

export interface State {
  id: string;
  name: string;
  code: string;
  country_id: string;
  type?: string;
  active?: boolean;
}

// Use Next.js API routes (BFF pattern)
const LOCATION_SERVICE_URL = '/api/location';

class LocationAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = LOCATION_SERVICE_URL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': this.generateRequestId(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Location API request failed');
      }

      return data;
    } catch (error) {
      console.error('Location API request failed:', error);
      throw error;
    }
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Detect location from IP
  async detectLocation(ip?: string): Promise<LocationData> {
    const queryParams = ip ? `?ip=${encodeURIComponent(ip)}` : '';
    const response = await this.makeRequest<{ success: boolean; data: LocationData }>(`/detect${queryParams}`);

    if (!response.data) {
      throw new Error('No location data returned from API');
    }

    return response.data;
  }

  // Get countries
  async getCountries(search?: string, limit = 50): Promise<Country[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit.toString());

    const response = await this.makeRequest<{ data: Country[] }>(`/countries?${params}`);
    return response.data || [];
  }

  // Get states for a country
  async getStates(countryId: string, search?: string): Promise<State[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const response = await this.makeRequest<{ data: State[] }>(`/countries/${countryId}/states?${params}`);
    return response.data || [];
  }

  // Address autocomplete
  async autocompleteAddress(
    input: string,
    options: AutocompleteOptions = {}
  ): Promise<{ suggestions: AddressSuggestion[]; allow_manual_entry: boolean }> {
    try {
      const params = new URLSearchParams();
      params.append('input', input);
      if (options.session_token) params.append('session_token', options.session_token);
      if (options.components) params.append('components', options.components);
      if (options.latitude) params.append('latitude', options.latitude.toString());
      if (options.longitude) params.append('longitude', options.longitude.toString());

      const response = await this.makeRequest<{
        success: boolean;
        data: { suggestions: AddressSuggestion[]; allow_manual_entry: boolean };
      }>(`/address/autocomplete?${params}`);

      return response.data || { suggestions: [], allow_manual_entry: true };
    } catch (error) {
      console.warn('Address autocomplete failed, allowing manual entry');
      return { suggestions: [], allow_manual_entry: true };
    }
  }

  // Get place details
  async getPlaceDetails(placeId: string): Promise<GeocodingResult | null> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        data: GeocodingResult;
      }>(`/address/place-details?place_id=${encodeURIComponent(placeId)}`);

      return response.data || null;
    } catch (error) {
      console.warn('Failed to get place details');
      return null;
    }
  }

  // Reverse geocode (coordinates to address)
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        data: GeocodingResult;
      }>(`/address/reverse-geocode?latitude=${lat}&longitude=${lng}`);

      return response.data || null;
    } catch (error) {
      console.warn('Reverse geocoding failed');
      return null;
    }
  }

  // Geocode address
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        data: GeocodingResult;
      }>(`/address/geocode?address=${encodeURIComponent(address)}`);

      return response.data || null;
    } catch (error) {
      console.warn('Geocoding failed');
      return null;
    }
  }
}

// Export singleton instance
export const locationApi = new LocationAPI();

// Export individual functions
export const {
  detectLocation,
  getCountries,
  getStates,
  autocompleteAddress,
  getPlaceDetails,
  reverseGeocode,
  geocodeAddress,
} = locationApi;
