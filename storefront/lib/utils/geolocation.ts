// Browser geolocation utilities

export interface BrowserGeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  source: 'browser' | 'ip';
}

export async function getBrowserGeolocation(
  timeout = 10000
): Promise<BrowserGeolocationResult> {
  return new Promise((resolve, reject) => {
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
        maximumAge: 60000,
      }
    );
  });
}

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
  try {
    const response = await fetch(
      `/api/location/address/reverse-geocode?latitude=${latitude}&longitude=${longitude}`
    );

    if (!response.ok) {
      console.warn('Reverse geocode API returned error:', response.status);
      return {};
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      console.warn('Reverse geocode returned no data');
      return {};
    }

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

    return result;
  } catch (error) {
    console.error('Reverse geocode failed:', error);
    return {};
  }
}

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
