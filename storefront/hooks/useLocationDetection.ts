'use client';

import { useState, useEffect, useCallback } from 'react';

export interface DetectedLocation {
  ip: string;
  country: string;
  countryName: string;
  callingCode: string;
  flagEmoji: string;
  state: string;
  stateName: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  currency: string;
  locale: string;
}

export interface LocationState {
  location: DetectedLocation | null;
  isLoading: boolean;
  error: string | null;
  isAutoDetected: boolean;
}

const LOCATION_CACHE_KEY = 'detected_location';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedLocation {
  location: DetectedLocation;
  timestamp: number;
}

function getCachedLocation(): DetectedLocation | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!cached) return null;

    const { location, timestamp }: CachedLocation = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_DURATION_MS;

    if (isExpired) {
      localStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }

    return location;
  } catch {
    return null;
  }
}

function setCachedLocation(location: DetectedLocation): void {
  if (typeof window === 'undefined') return;

  try {
    const cached: CachedLocation = {
      location,
      timestamp: Date.now(),
    };
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
}

export function useLocationDetection(autoDetect: boolean = true) {
  const [state, setState] = useState<LocationState>({
    location: null,
    isLoading: false,
    error: null,
    isAutoDetected: false,
  });

  const detectLocation = useCallback(async (): Promise<DetectedLocation | null> => {
    // Check cache first
    const cached = getCachedLocation();
    if (cached) {
      setState({
        location: cached,
        isLoading: false,
        error: null,
        isAutoDetected: true,
      });
      return cached;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/location/detect');

      if (!response.ok) {
        throw new Error('Failed to detect location');
      }

      const location: DetectedLocation = await response.json();

      // Cache the detected location
      setCachedLocation(location);

      setState({
        location,
        isLoading: false,
        error: null,
        isAutoDetected: true,
      });

      return location;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Location detection failed';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  const clearLocation = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCATION_CACHE_KEY);
    }
    setState({
      location: null,
      isLoading: false,
      error: null,
      isAutoDetected: false,
    });
  }, []);

  const setManualLocation = useCallback((location: Partial<DetectedLocation>) => {
    const currentLocation = state.location || getDefaultLocation();
    const updatedLocation = { ...currentLocation, ...location };

    setState({
      location: updatedLocation,
      isLoading: false,
      error: null,
      isAutoDetected: false,
    });

    // Don't cache manual locations
  }, [state.location]);

  // Auto-detect on mount if enabled
  useEffect(() => {
    if (autoDetect && !state.location && !state.isLoading) {
      detectLocation();
    }
  }, [autoDetect, state.location, state.isLoading, detectLocation]);

  return {
    ...state,
    detectLocation,
    clearLocation,
    setManualLocation,
  };
}

function getDefaultLocation(): DetectedLocation {
  return {
    ip: '',
    country: 'US',
    countryName: 'United States',
    callingCode: '+1',
    flagEmoji: '🇺🇸',
    state: 'US-CA',
    stateName: 'California',
    city: 'San Francisco',
    postalCode: '94102',
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    locale: 'en_US',
  };
}

export default useLocationDetection;
