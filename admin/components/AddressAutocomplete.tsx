'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Navigation, Loader2, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { locationApi, type AddressSuggestion, type GeocodingResult } from '@/lib/api/location';

export interface ParsedAddressData {
  streetAddress: string;
  street2?: string;
  city: string;
  state: string;
  stateCode: string;
  postalCode: string;
  country: string;
  countryCode: string;
  formattedAddress: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: ParsedAddressData) => void;
  placeholder?: string;
  countryRestriction?: string;
  className?: string;
  defaultValue?: string;
}

export function AddressAutocomplete({
  onAddressSelect,
  placeholder = 'Start typing an address...',
  countryRestriction,
  className = '',
  defaultValue = '',
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<ParsedAddressData | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [sessionToken] = useState(() => Math.random().toString(36).substring(2));

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced address search
  const searchAddresses = useCallback(
    async (query: string) => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const options: any = { session_token: sessionToken };
        if (countryRestriction) {
          options.components = `country:${countryRestriction}`;
        }

        const result = await locationApi.autocompleteAddress(query, options);
        setSuggestions(result.suggestions || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Address search failed:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionToken, countryRestriction]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedAddress(null);

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddresses(value);
    }, 300);
  };

  const parseAddressComponents = (result: GeocodingResult): ParsedAddressData => {
    const components = result.components || [];

    const getComponent = (type: string, useShort = false) => {
      const comp = components.find((c) => c.type === type);
      return comp ? (useShort ? comp.short_name : comp.long_name) : '';
    };

    const streetNumber = getComponent('street_number');
    const route = getComponent('route');
    const streetAddress = [streetNumber, route].filter(Boolean).join(' ');

    return {
      streetAddress: streetAddress || getComponent('premise') || getComponent('subpremise'),
      city:
        getComponent('locality') ||
        getComponent('administrative_area_level_2') ||
        getComponent('postal_town'),
      state: getComponent('administrative_area_level_1'),
      stateCode: getComponent('administrative_area_level_1', true),
      postalCode: getComponent('postal_code'),
      country: getComponent('country'),
      countryCode: getComponent('country', true),
      formattedAddress: result.formatted_address,
      latitude: result.location?.latitude,
      longitude: result.location?.longitude,
      placeId: result.place_id,
    };
  };

  const handleSuggestionSelect = async (suggestion: AddressSuggestion) => {
    setIsLoading(true);
    setShowSuggestions(false);
    setInputValue(suggestion.description);

    try {
      const details = await locationApi.getPlaceDetails(suggestion.place_id);
      if (details) {
        const parsed = parseAddressComponents(details);
        setSelectedAddress(parsed);
        onAddressSelect(parsed);
      }
    } catch (error) {
      console.error('Failed to get place details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);

    try {
      // Try browser geolocation first
      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          });
        });

        const { latitude, longitude } = position.coords;

        // Reverse geocode the coordinates
        const result = await locationApi.reverseGeocode(latitude, longitude);
        if (result) {
          const parsed = parseAddressComponents(result);
          setInputValue(result.formatted_address);
          setSelectedAddress(parsed);
          onAddressSelect(parsed);
        }
      } else {
        // Fall back to IP-based detection
        const locationData = await locationApi.detectLocation();
        if (locationData.latitude && locationData.longitude) {
          const result = await locationApi.reverseGeocode(
            locationData.latitude,
            locationData.longitude
          );
          if (result) {
            const parsed = parseAddressComponents(result);
            setInputValue(result.formatted_address);
            setSelectedAddress(parsed);
            onAddressSelect(parsed);
          }
        }
      }
    } catch (error) {
      console.error('Location detection failed:', error);
      // Fall back to IP detection
      try {
        const locationData = await locationApi.detectLocation();
        const address: ParsedAddressData = {
          streetAddress: '',
          city: locationData.city || '',
          state: locationData.state_name || '',
          stateCode: locationData.state?.replace(`${locationData.country}-`, '') || '',
          postalCode: locationData.postal_code || '',
          country: locationData.country_name || '',
          countryCode: locationData.country || '',
          formattedAddress: [
            locationData.city,
            locationData.state_name,
            locationData.postal_code,
            locationData.country_name,
          ]
            .filter(Boolean)
            .join(', '),
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        };
        setInputValue(address.formattedAddress);
        setSelectedAddress(address);
        onAddressSelect(address);
      } catch (ipError) {
        console.error('IP-based location detection also failed:', ipError);
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSelectedAddress(null);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
        </div>

        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-10 pr-24"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

          {selectedAddress && !isLoading && (
            <Check className="h-4 w-4 text-green-500" />
          )}

          {inputValue && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDetectLocation}
            disabled={isDetectingLocation}
            className="h-7 px-2"
            title="Use my current location"
          >
            {isDetectingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSuggestionSelect(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-muted border-b border-border last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-foreground text-sm">
                    {suggestion.main_text}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {suggestion.secondary_text}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected address confirmation */}
      {selectedAddress && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-green-800">Address Selected</div>
              <div className="text-green-700">{selectedAddress.formattedAddress}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
