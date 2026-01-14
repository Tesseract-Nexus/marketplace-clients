// Browser geolocation utilities with IP fallback

export interface BrowserGeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  source: 'browser' | 'ip';
}

export interface GeolocationError {
  code: number;
  message: string;
}

/**
 * Request browser geolocation permission and get coordinates
 * Falls back to IP-based location if browser geolocation fails
 */
export async function getBrowserGeolocation(
  timeout = 10000
): Promise<BrowserGeolocationResult> {
  return new Promise((resolve, reject) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by this browser',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'browser',
        });
      },
      (error) => {
        let message = 'Unknown error';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'User denied the request for geolocation';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            message = 'The request to get user location timed out';
            break;
        }
        reject({ code: error.code, message });
      },
      {
        enableHighAccuracy: true,
        timeout,
        maximumAge: 60000, // Cache for 1 minute
      }
    );
  });
}

/**
 * Reverse geocode coordinates to get location details
 * Uses the location-service reverse geocode endpoint
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{
  country?: string;
  countryCode?: string;
  state?: string;
  stateCode?: string;
  city?: string;
  postalCode?: string;
  formattedAddress?: string;
}> {
  console.log('[Geolocation] Reverse geocoding coordinates:', latitude, longitude);

  try {
    const response = await fetch(
      `/api/location/address/reverse-geocode?latitude=${latitude}&longitude=${longitude}`
    );

    if (!response.ok) {
      console.warn('[Geolocation] Reverse geocode API returned error:', response.status);
      return {};
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      console.warn('[Geolocation] Reverse geocode returned no data');
      return {};
    }

    // Parse the components to extract country, state, city, etc.
    const result: {
      country?: string;
      countryCode?: string;
      state?: string;
      stateCode?: string;
      city?: string;
      postalCode?: string;
      formattedAddress?: string;
    } = {
      formattedAddress: data.data.formatted_address,
    };

    for (const component of data.data.components || []) {
      switch (component.type) {
        case 'country':
          result.country = component.long_name;
          result.countryCode = component.short_name;
          break;
        case 'administrative_area_level_1':
          result.state = component.long_name;
          result.stateCode = component.short_name;
          break;
        case 'locality':
        case 'postal_town':
          result.city = component.long_name;
          break;
        case 'postal_code':
          result.postalCode = component.long_name;
          break;
      }
    }

    console.log('[Geolocation] Reverse geocode result:', result);
    return result;
  } catch (error) {
    console.error('[Geolocation] Reverse geocode failed:', error);
    return {};
  }
}

/**
 * Check if geolocation permission was already granted
 */
export async function checkGeolocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!navigator.permissions) {
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch (error) {
    console.error('Failed to check geolocation permission:', error);
    return 'prompt';
  }
}

/**
 * Try browser geolocation first, fall back to provided callback if it fails
 */
export async function getLocationWithFallback<T>(
  fallbackFn: () => Promise<T>,
  onBrowserLocation?: (coords: BrowserGeolocationResult) => void
): Promise<T> {
  try {
    // First check permission status
    const permission = await checkGeolocationPermission();

    if (permission === 'denied') {
      console.log('[Geolocation] Permission denied, using IP fallback');
      return fallbackFn();
    }

    // Try browser geolocation (with shorter timeout for better UX)
    const browserLocation = await getBrowserGeolocation(5000);
    console.log('[Geolocation] Browser location obtained:', browserLocation);

    // Notify caller about browser location
    if (onBrowserLocation) {
      onBrowserLocation(browserLocation);
    }

    // Still call fallback to get full location data (country, city, etc.)
    // Browser only gives us coordinates
    return fallbackFn();
  } catch (error) {
    console.log('[Geolocation] Browser geolocation failed, using IP fallback:', error);
    return fallbackFn();
  }
}
