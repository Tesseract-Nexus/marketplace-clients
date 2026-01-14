// Location API client for address autocomplete

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

export interface AutocompleteOptions {
  session_token?: string;
  components?: string;
  language?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

class LocationAPI {
  private baseURL = '/api/location';

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async autocompleteAddress(
    input: string,
    options: AutocompleteOptions = {}
  ): Promise<{ suggestions: AddressSuggestion[]; allow_manual_entry: boolean }> {
    try {
      const params = new URLSearchParams();
      params.append('input', input);
      if (options.session_token) params.append('session_token', options.session_token);
      if (options.components) params.append('components', options.components);
      if (options.language) params.append('language', options.language);
      if (options.latitude) params.append('latitude', options.latitude.toString());
      if (options.longitude) params.append('longitude', options.longitude.toString());
      if (options.radius) params.append('radius', options.radius.toString());

      const response = await fetch(`${this.baseURL}/address/autocomplete?${params}`, {
        headers: {
          'X-Request-ID': this.generateRequestId(),
        },
      });

      if (!response.ok) {
        console.warn('Address autocomplete failed');
        return { suggestions: [], allow_manual_entry: true };
      }

      const data = await response.json();
      return data.data || { suggestions: [], allow_manual_entry: true };
    } catch (error) {
      console.warn('Address autocomplete error:', error);
      return { suggestions: [], allow_manual_entry: true };
    }
  }

  async getPlaceDetails(placeId: string): Promise<GeocodingResult | null> {
    try {
      const response = await fetch(
        `${this.baseURL}/address/place-details?place_id=${encodeURIComponent(placeId)}`,
        {
          headers: {
            'X-Request-ID': this.generateRequestId(),
          },
        }
      );

      if (!response.ok) {
        console.warn('Failed to get place details');
        return null;
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.warn('Place details error:', error);
      return null;
    }
  }

  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<GeocodingResult | null> {
    try {
      const response = await fetch(
        `${this.baseURL}/address/reverse-geocode?latitude=${latitude}&longitude=${longitude}`,
        {
          headers: {
            'X-Request-ID': this.generateRequestId(),
          },
        }
      );

      if (!response.ok) {
        console.warn('Reverse geocode failed');
        return null;
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.warn('Reverse geocode error:', error);
      return null;
    }
  }
}

export const locationApi = new LocationAPI();
