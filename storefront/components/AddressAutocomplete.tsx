'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, Loader2, X, Edit3, CheckCircle, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  locationApi,
  type AddressSuggestion,
  type AddressComponent,
} from '@/lib/api/location';
import { getBrowserGeolocation, reverseGeocode } from '@/lib/utils/geolocation';
import { cn } from '@/lib/utils';

export interface ParsedAddressData {
  streetAddress: string;
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
  onManualEntryToggle?: (isManual: boolean) => void;
  placeholder?: string;
  defaultValue?: string;
  countryRestriction?: string;
  className?: string;
  disabled?: boolean;
  showCurrentLocation?: boolean;
}

export function AddressAutocomplete({
  onAddressSelect,
  onManualEntryToggle,
  placeholder = 'Start typing your address...',
  defaultValue = '',
  countryRestriction,
  className = '',
  disabled = false,
  showCurrentLocation = true,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<ParsedAddressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionTokenRef = useRef<string>(generateSessionToken());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  function generateSessionToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await locationApi.autocompleteAddress(input, {
        session_token: sessionTokenRef.current,
        components: countryRestriction ? `country:${countryRestriction}` : undefined,
      });

      setSuggestions(result.suggestions);
      setIsOpen(result.suggestions.length > 0);

      if (result.suggestions.length === 0 && result.allow_manual_entry) {
        setShowManualEntry(true);
      }
    } catch (err) {
      console.error('Address autocomplete error:', err);
      setError('Failed to fetch address suggestions');
      setSuggestions([]);
      setShowManualEntry(true);
    } finally {
      setIsLoading(false);
    }
  }, [countryRestriction]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedAddress(null);
    setShowManualEntry(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const parseAddressComponents = (components: AddressComponent[]): Partial<ParsedAddressData> => {
    const parsed: Partial<ParsedAddressData> = {};

    for (const component of components) {
      switch (component.type) {
        case 'street_number':
          parsed.streetAddress = component.long_name;
          break;
        case 'route':
          parsed.streetAddress = parsed.streetAddress
            ? `${parsed.streetAddress} ${component.long_name}`
            : component.long_name;
          break;
        case 'locality':
        case 'postal_town':
          parsed.city = component.long_name;
          break;
        case 'administrative_area_level_1':
          parsed.state = component.long_name;
          parsed.stateCode = component.short_name;
          break;
        case 'country':
          parsed.country = component.long_name;
          parsed.countryCode = component.short_name;
          break;
        case 'postal_code':
          parsed.postalCode = component.long_name;
          break;
      }
    }

    return parsed;
  };

  const handleSuggestionSelect = async (suggestion: AddressSuggestion) => {
    setIsLoading(true);
    setIsOpen(false);
    setInputValue(suggestion.description);

    try {
      const details = await locationApi.getPlaceDetails(suggestion.place_id);

      if (details) {
        const parsed = parseAddressComponents(details.components);

        const addressData: ParsedAddressData = {
          streetAddress: parsed.streetAddress || '',
          city: parsed.city || '',
          state: parsed.state || '',
          stateCode: parsed.stateCode || '',
          postalCode: parsed.postalCode || '',
          country: parsed.country || '',
          countryCode: parsed.countryCode || '',
          formattedAddress: details.formatted_address,
          latitude: details.location?.latitude,
          longitude: details.location?.longitude,
          placeId: suggestion.place_id,
        };

        setSelectedAddress(addressData);
        onAddressSelect(addressData);

        sessionTokenRef.current = generateSessionToken();
      }
    } catch (err) {
      console.error('Failed to get place details:', err);
      setError('Failed to get address details. Please try again or enter manually.');
      setShowManualEntry(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualEntryClick = () => {
    setShowManualEntry(false);
    setIsOpen(false);
    setSuggestions([]);
    onManualEntryToggle?.(true);
  };

  const handleClear = () => {
    setInputValue('');
    setSelectedAddress(null);
    setSuggestions([]);
    setIsOpen(false);
    setError(null);
    inputRef.current?.focus();
  };

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setIsOpen(false);
    setError(null);

    try {
      const coords = await getBrowserGeolocation(10000);
      const locationData = await reverseGeocode(coords.latitude, coords.longitude);

      if (locationData.formattedAddress) {
        setInputValue(locationData.formattedAddress);

        const addressData: ParsedAddressData = {
          streetAddress: '',
          city: locationData.city || '',
          state: locationData.state || '',
          stateCode: locationData.stateCode || '',
          postalCode: locationData.postalCode || '',
          country: locationData.country || '',
          countryCode: locationData.countryCode || '',
          formattedAddress: locationData.formattedAddress,
          latitude: coords.latitude,
          longitude: coords.longitude,
        };

        setSelectedAddress(addressData);
        onAddressSelect(addressData);
      } else {
        setError('Unable to determine address from your location. Please enter manually.');
        setShowManualEntry(true);
      }
    } catch (err) {
      console.error('Failed to get current location:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get your location';
      setError(errorMessage);
      setShowManualEntry(true);
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Main Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading || isGettingLocation ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : selectedAddress ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => (suggestions.length > 0 || showCurrentLocation) && setIsOpen(true)}
          placeholder={isGettingLocation ? 'Getting your location...' : placeholder}
          disabled={disabled || isGettingLocation}
          className={cn(
            'pl-9 pr-9',
            selectedAddress && 'border-green-500 focus-visible:ring-green-500/20',
            error && 'border-red-500 focus-visible:ring-red-500/20'
          )}
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Selected Address Display */}
      {selectedAddress && (
        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-green-800 dark:text-green-200">
                {selectedAddress.formattedAddress}
              </p>
              <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                Address selected - fields will be auto-filled
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && (suggestions.length > 0 || showCurrentLocation) && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border bg-card shadow-lg">
          <div className="max-h-80 overflow-auto p-2">
            {/* Use Current Location Option */}
            {showCurrentLocation && (
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg hover:bg-muted transition-colors border-b mb-2"
              >
                <Navigation className="w-5 h-5 text-tenant-primary flex-shrink-0" />
                <span className="text-sm font-medium text-tenant-primary">
                  {isGettingLocation ? 'Getting your location...' : 'Use my current location'}
                </span>
                {isGettingLocation && (
                  <Loader2 className="w-4 h-4 animate-spin text-tenant-primary ml-auto" />
                )}
              </button>
            )}

            {/* Address Suggestions */}
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full flex items-start gap-3 px-3 py-3 text-left rounded-lg hover:bg-muted transition-colors"
              >
                <MapPin className="w-5 h-5 text-tenant-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{suggestion.main_text}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {suggestion.secondary_text}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Manual Entry Option */}
          <div className="border-t p-2">
            <button
              type="button"
              onClick={handleManualEntryClick}
              className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg hover:bg-tenant-primary/10 transition-colors text-tenant-primary"
            >
              <Edit3 className="w-5 h-5" />
              <span className="text-sm">Can't find your address? Enter manually</span>
            </button>
          </div>
        </div>
      )}

      {/* No Results + Manual Entry Option */}
      {isOpen && suggestions.length === 0 && inputValue.length >= 3 && !isLoading && !showCurrentLocation && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border bg-card shadow-lg p-4">
          <div className="text-center">
            <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground mb-3">
              No addresses found matching "{inputValue}"
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleManualEntryClick}
              className="w-full border-tenant-primary text-tenant-primary hover:bg-tenant-primary/10"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Enter address manually
            </Button>
          </div>
        </div>
      )}

      {/* Hint Text */}
      <p className="mt-2 text-xs text-muted-foreground">
        Start typing to search for your address. We'll auto-fill the fields below.
      </p>
    </div>
  );
}

export default AddressAutocomplete;
