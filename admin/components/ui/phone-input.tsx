'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Phone } from 'lucide-react';

// Country data with dial codes
const COUNTRIES = [
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoDetectCountry?: boolean;
  countryCode?: string; // ISO country code to set externally (e.g., 'AU', 'US')
}

export function PhoneInput({
  value,
  onChange,
  placeholder = 'Enter phone number',
  className = '',
  disabled = false,
  autoDetectCountry = true,
  countryCode,
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Default to Australia
  const [localNumber, setLocalNumber] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);

  // Update country when external countryCode prop changes
  useEffect(() => {
    if (countryCode) {
      const matchedCountry = COUNTRIES.find((c) => c.code === countryCode.toUpperCase());
      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
        // Update the full value if we have a local number
        if (localNumber) {
          onChange(`${matchedCountry.dialCode}-${localNumber}`);
        }
      }
    }
  }, [countryCode]);

  // Parse existing value to extract country code and local number
  // Re-run when value changes externally (e.g., data loaded from API)
  useEffect(() => {
    if (value) {
      // Normalize the value - replace spaces with hyphens for consistent parsing
      const normalizedValue = value.replace(/^\+(\d+)\s+/, '+$1-');

      // Try to find matching country from the value
      const matchedCountry = COUNTRIES.find((c) =>
        normalizedValue.startsWith(c.dialCode)
      );
      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
        // Extract local number, removing dial code and separator (- or space)
        const localPart = normalizedValue.slice(matchedCountry.dialCode.length).replace(/^[-\s]/, '');
        setLocalNumber(localPart);
      } else {
        // Just set the local number, removing any country code prefix
        setLocalNumber(value.replace(/^\+\d+[-\s]?/, ''));
      }
    }
  }, [value]);

  // Auto-detect country from browser/geolocation (only if no external countryCode provided)
  useEffect(() => {
    if (autoDetectCountry && !value && !countryCode) {
      detectCountry();
    }
  }, [autoDetectCountry, countryCode]);

  const detectCountry = async () => {
    setIsDetecting(true);
    try {
      // Try to detect from browser locale first
      const browserLocale = navigator.language || (navigator as any).userLanguage;
      const countryFromLocale = browserLocale?.split('-')[1]?.toUpperCase();

      if (countryFromLocale) {
        const matchedCountry = COUNTRIES.find((c) => c.code === countryFromLocale);
        if (matchedCountry) {
          setSelectedCountry(matchedCountry);
          setIsDetecting(false);
          return;
        }
      }

      // Fallback: Try IP-based geolocation (free API)
      const response = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(3000)
      });
      if (response.ok) {
        const data = await response.json();
        const countryCode = data.country_code;
        const matchedCountry = COUNTRIES.find((c) => c.code === countryCode);
        if (matchedCountry) {
          setSelectedCountry(matchedCountry);
        }
      }
    } catch {
      // Silently fail - keep default country
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCountryChange = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country);
    setIsOpen(false);
    // Update the full value
    const fullNumber = localNumber ? `${country.dialCode}-${localNumber}` : '';
    onChange(fullNumber);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const newNumber = e.target.value.replace(/[^\d]/g, '');
    setLocalNumber(newNumber);
    // Update the full value
    const fullNumber = newNumber ? `${selectedCountry.dialCode}-${newNumber}` : '';
    onChange(fullNumber);
  };

  const sortedCountries = useMemo(() => {
    // Sort with selected country first, then alphabetically
    return [...COUNTRIES].sort((a, b) => {
      if (a.code === selectedCountry.code) return -1;
      if (b.code === selectedCountry.code) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [selectedCountry]);

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        {/* Country Code Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-2.5 border border-r-0 border-border rounded-l-lg bg-muted hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-foreground">
              {selectedCountry.dialCode}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-card border border-border rounded-lg shadow-lg z-20">
                {sortedCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountryChange(country)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-primary/10 ${
                      country.code === selectedCountry.code
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground'
                    }`}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="flex-1 text-sm">{country.name}</span>
                    <span className="text-sm text-muted-foreground">{country.dialCode}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Phone Number Input */}
        <div className="relative flex-1">
          <input
            type="tel"
            value={localNumber}
            onChange={handleNumberChange}
            placeholder={placeholder}
            disabled={disabled || isDetecting}
            className="w-full px-4 py-2.5 border border-border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:bg-muted disabled:cursor-not-allowed"
          />
          {isDetecting && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Helper text */}
      {isDetecting && (
        <p className="mt-1 text-xs text-muted-foreground">Detecting your location...</p>
      )}
    </div>
  );
}

export default PhoneInput;
