'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, Loader2, X, Edit3, CheckCircle, Navigation } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import {
  locationApi,
  type AddressSuggestion,
  type GeocodingResult,
  type AddressComponent
} from '../lib/api/location';
import { getBrowserGeolocation, reverseGeocode } from '../lib/utils/geolocation';

// Parsed address data structure for form filling
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
  countryRestriction?: string; // ISO country code to restrict suggestions
  className?: string;
  disabled?: boolean;
  showCurrentLocation?: boolean; // Show "Use current location" option
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

  // Generate a unique session token for billing optimization
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

  // Fetch address suggestions with debouncing
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

      // If no suggestions and manual entry is allowed, show the option
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

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedAddress(null);
    setShowManualEntry(false);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce API calls (300ms)
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Parse address components into structured data
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

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion: AddressSuggestion) => {
    setIsLoading(true);
    setIsOpen(false);
    setInputValue(suggestion.description);

    try {
      // Get full place details
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

        // Generate new session token for next search
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

  // Handle manual entry toggle
  const handleManualEntryClick = () => {
    setShowManualEntry(false);
    setIsOpen(false);
    setSuggestions([]);
    onManualEntryToggle?.(true);
  };

  // Clear selection
  const handleClear = () => {
    setInputValue('');
    setSelectedAddress(null);
    setSuggestions([]);
    setIsOpen(false);
    setError(null);
    inputRef.current?.focus();
  };

  // Handle "Use current location" button
  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setIsOpen(false);
    setError(null);

    try {
      // Get browser geolocation
      const coords = await getBrowserGeolocation(10000);

      // Reverse geocode to get address
      const locationData = await reverseGeocode(coords.latitude, coords.longitude);

      if (locationData.formattedAddress) {
        setInputValue(locationData.formattedAddress);

        // Build parsed address data
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
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Main Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-tertiary)]">
          {isLoading || isGettingLocation ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : selectedAddress ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <Search className="w-5 h-5" />
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
          className={`
            h-14 pl-12 pr-12 rounded-xl
            bg-[var(--surface)] text-[var(--foreground)]
            placeholder:text-[var(--foreground-tertiary)]
            border-[var(--border)]
            focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/20
            transition-all duration-200
            ${selectedAddress ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          `}
        />

        {/* Clear button */}
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] transition-colors"
          >
            <X className="w-5 h-5" />
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
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="max-h-80 overflow-auto p-2">
            {/* Use Current Location Option */}
            {showCurrentLocation && (
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg hover:bg-[var(--surface-secondary)] transition-colors border-b border-[var(--border)] mb-2"
              >
                <Navigation className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
                <span className="text-sm font-medium text-[var(--primary)]">
                  {isGettingLocation ? 'Getting your location...' : 'Use my current location'}
                </span>
                {isGettingLocation && (
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)] ml-auto" />
                )}
              </button>
            )}

            {/* Address Suggestions */}
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full flex items-start gap-3 px-3 py-3 text-left rounded-lg hover:bg-[var(--surface-secondary)] transition-colors"
              >
                <MapPin className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--foreground)] truncate">
                    {suggestion.main_text}
                  </p>
                  <p className="text-sm text-[var(--foreground-secondary)] truncate">
                    {suggestion.secondary_text}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Manual Entry Option */}
          <div className="border-t border-[var(--border)] p-2">
            <button
              type="button"
              onClick={handleManualEntryClick}
              className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg hover:bg-[var(--surface-secondary)] transition-colors text-[var(--foreground-secondary)]"
            >
              <Edit3 className="w-5 h-5" />
              <span className="text-sm">Can't find your address? Enter manually</span>
            </button>
          </div>
        </div>
      )}

      {/* No Results + Manual Entry Option */}
      {isOpen && suggestions.length === 0 && inputValue.length >= 3 && !isLoading && !showCurrentLocation && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg p-4">
          <div className="text-center">
            <MapPin className="w-8 h-8 text-[var(--foreground-tertiary)] mx-auto mb-2" />
            <p className="text-[var(--foreground-secondary)] mb-3">
              No addresses found matching "{inputValue}"
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleManualEntryClick}
              className="w-full"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Enter address manually
            </Button>
          </div>
        </div>
      )}

      {/* Hint Text */}
      <p className="mt-2 text-xs text-[var(--foreground-tertiary)]">
        Start typing to search for your business address. We'll auto-fill the fields below.
      </p>
    </div>
  );
}

export default AddressAutocomplete;
