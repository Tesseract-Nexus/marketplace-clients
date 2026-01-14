'use client';

import React from 'react';
import { Label } from '@/components/ui';
import { SimpleSelect } from './SimpleSelect';
import { Input } from '@/components/ui';
import { Phone, AlertCircle } from 'lucide-react';

interface Country {
  id: string;
  name: string;
  code: string;
  calling_code: string;
  flag_emoji?: string;
}

interface PhoneInputProps {
  countries: Country[];
  phoneCountryCode?: string;
  phoneNumber?: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneNumberChange: (value: string) => void;
  countryCodeError?: string;
  phoneNumberError?: string;
  id?: string;
}

export function PhoneInput({
  countries,
  phoneCountryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  countryCodeError,
  phoneNumberError,
  id,
}: PhoneInputProps) {
  const selectedCountry = countries.find(c => c.id === phoneCountryCode);

  return (
    <div>
      <Label htmlFor={id} className="text-[var(--foreground)] font-semibold mb-3 flex items-center">
        <Phone className="w-4 h-4 mr-2" />
        Phone Number *
      </Label>
      <div className="flex gap-3">
        <div className="w-40 flex-shrink-0">
          <SimpleSelect
            id={`${id}-country-code`}
            options={countries.map(country => ({
              value: country.id,
              label: (
                <div className="flex items-center gap-2">
                  {country.flag_emoji && <span className="text-base">{country.flag_emoji}</span>}
                  <span className="font-mono text-sm">{country.calling_code}</span>
                </div>
              )
            }))}
            value={phoneCountryCode}
            onChange={onCountryCodeChange}
            placeholder="Code"
            error={!!countryCodeError}
          />
        </div>
        <div className="flex-1">
          <Input
            id={id}
            type="tel"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            placeholder="123-456-7890"
            className={`h-14 rounded-xl bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:ring-4 transition-all duration-200 ${
              phoneNumberError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20'
            }`}
          />
        </div>
      </div>
      {(countryCodeError || phoneNumberError) && (
        <div className="mt-2 text-sm text-red-600 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{countryCodeError || phoneNumberError}</span>
        </div>
      )}
    </div>
  );
}
