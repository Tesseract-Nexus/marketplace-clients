// Location API client for location-service
import type {
  Country,
  State,
  Currency,
  Timezone,
  CountriesResponse,
  StatesResponse,
  CurrenciesResponse,
  TimezonesResponse
} from '../types/api-contracts';

// Extended LocationData with all fields from geolocation service
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

// Address Autocomplete Types
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

export interface AddressValidationResult {
  valid: boolean;
  formatted_address?: string;
  components?: AddressComponent[];
  location?: GeoLocation;
  deliverable: boolean;
  issues?: string[];
  suggestions?: string[];
}

export interface AutocompleteOptions {
  session_token?: string;
  types?: string[];
  components?: string; // e.g., "country:us|country:ca"
  language?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
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

// Response wrapper for location detection
interface LocationDetectionResponse {
  success: boolean;
  message: string;
  data: LocationData;
}

// Use Next.js API routes (BFF pattern) instead of direct backend calls
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
    // Endpoint is already relative to /api/location
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
        throw new Error(data.error?.details || data.message || 'Location API request failed');
      }

      return data;
    } catch (error) {
      console.error('Location API request failed:', error);
      throw error;
    }
  }

  private generateRequestId(): string {
    return crypto.randomUUID();
  }

  // Location Detection
  async detectLocation(ip?: string): Promise<LocationData> {
    const queryParams = ip ? `?ip=${encodeURIComponent(ip)}` : '';
    const response = await this.makeRequest<LocationDetectionResponse>(`/detect${queryParams}`);
    return response.data!;
  }

  // Countries
  async getCountries(search?: string, region?: string, limit = 50, offset = 0): Promise<Country[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (region) params.append('region', region);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await this.makeRequest<CountriesResponse>(`/countries?${params}`);
    return response.data || [];
  }

  async getCountry(countryId: string): Promise<Country> {
    const response = await this.makeRequest<{data: Country}>(`/countries/${countryId}`);
    return response.data!;
  }

  // States
  async getStates(countryId: string, search?: string): Promise<State[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const response = await this.makeRequest<StatesResponse>(`/countries/${countryId}/states?${params}`);
    return response.data || [];
  }

  async getAllStates(search?: string, countryId?: string, limit = 50, offset = 0): Promise<State[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (countryId) params.append('country_id', countryId);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await this.makeRequest<StatesResponse>(`/states?${params}`);
    return response.data!;
  }

  async getState(stateId: string): Promise<State> {
    const response = await this.makeRequest<{data: State}>(`/states/${stateId}`);
    return response.data!;
  }

  // Currencies
  async getCurrencies(search?: string, activeOnly = true): Promise<Currency[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('active_only', activeOnly.toString());

    const response = await this.makeRequest<CurrenciesResponse>(`/currencies?${params}`);
    return response.data!;
  }

  async getCurrency(currencyCode: string): Promise<Currency> {
    const response = await this.makeRequest<{data: Currency}>(`/currencies/${currencyCode}`);
    return response.data!;
  }

  // Timezones
  async getTimezones(search?: string, countryId?: string): Promise<Timezone[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (countryId) params.append('country_id', countryId);

    const response = await this.makeRequest<TimezonesResponse>(`/timezones?${params}`);
    return response.data!;
  }

  async getTimezone(timezoneId: string): Promise<Timezone> {
    const response = await this.makeRequest<{data: Timezone}>(`/timezones/${encodeURIComponent(timezoneId)}`);
    return response.data!;
  }

  // Address Autocomplete
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

  // Get Place Details (after user selects from autocomplete)
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

  // Geocode an address
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

  // Validate an address
  async validateAddress(address: string): Promise<AddressValidationResult> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        data: AddressValidationResult;
      }>(`/address/validate?address=${encodeURIComponent(address)}`);

      return response.data || { valid: false, deliverable: false, issues: ['Validation failed'] };
    } catch (error) {
      console.warn('Address validation failed');
      return { valid: false, deliverable: false, issues: ['Validation service unavailable'] };
    }
  }

  // Parse a raw address string into components
  async parseAddress(rawAddress: string): Promise<ParsedAddress | null> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        data: ParsedAddress & { parsed: boolean; allow_manual_entry?: boolean };
      }>(`/address/parse`, {
        method: 'POST',
        body: JSON.stringify({ raw_address: rawAddress }),
      });

      if (response.data?.parsed) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.warn('Address parsing failed');
      return null;
    }
  }

  // Format a manually entered address
  async formatManualAddress(address: {
    street_address: string;
    apartment_unit?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    latitude?: number;
    longitude?: number;
  }): Promise<{ formatted_address: string; components: AddressComponent[] } | null> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        data: { formatted_address: string; components: AddressComponent[]; manual_entry: boolean };
      }>(`/address/format-manual`, {
        method: 'POST',
        body: JSON.stringify(address),
      });

      return response.data || null;
    } catch (error) {
      console.warn('Manual address formatting failed');
      return null;
    }
  }
}

// Export singleton instance
export const locationApi = new LocationAPI();

// Export individual functions for convenience
export const {
  detectLocation,
  getCountries,
  getCountry,
  getStates,
  getAllStates,
  getState,
  getCurrencies,
  getCurrency,
  getTimezones,
  getTimezone,
  autocompleteAddress,
  getPlaceDetails,
  geocodeAddress,
  validateAddress,
  parseAddress,
  formatManualAddress,
} = locationApi;

// Re-export external types for convenience (types defined in this file are already exported)
export type {
  Country,
  State,
  Currency,
  Timezone,
};