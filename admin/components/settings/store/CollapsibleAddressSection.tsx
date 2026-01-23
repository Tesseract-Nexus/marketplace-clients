'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, ChevronDown, ChevronUp, Locate, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/Select';
import { AddressAutocomplete, type ParsedAddressData } from '@/components/AddressAutocomplete';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  COUNTRY_OPTIONS,
  COUNTRY_TIMEZONE_MAP,
  COUNTRY_CURRENCY_MAP,
  getCountryByCode,
} from '@/lib/constants/settings';

interface AddressData {
  address: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  zipCode: string;
}

interface CollapsibleAddressSectionProps {
  data: AddressData;
  onChange: (updates: Partial<AddressData>) => void;
  onCountryChange: (countryCode: string) => void;
  onAutoDetect: () => void;
  isDetecting?: boolean;
  detectedCountryCode?: string | null;
}

export function CollapsibleAddressSection({
  data,
  onChange,
  onCountryChange,
  onAutoDetect,
  isDetecting = false,
  detectedCountryCode,
}: CollapsibleAddressSectionProps) {
  // Determine if section should be expanded
  const isFilledOut = useMemo(() => {
    return !!(data.city && data.country);
  }, [data.city, data.country]);

  const [isOpen, setIsOpen] = useState(!isFilledOut);

  // Auto-expand when fields are empty
  useEffect(() => {
    if (!isFilledOut) {
      setIsOpen(true);
    }
  }, [isFilledOut]);

  // Build summary text
  const summaryText = useMemo(() => {
    const parts = [data.city, data.state, data.country].filter(Boolean);
    if (parts.length === 0) return 'No location set';
    return parts.join(', ');
  }, [data.city, data.state, data.country]);

  // Handle address autocomplete selection
  const handleAddressSelect = (address: ParsedAddressData) => {
    const countryCode = address.countryCode?.toUpperCase() || '';
    const countryOption = COUNTRY_OPTIONS.find((c) => c.value === countryCode);

    onChange({
      address: address.streetAddress,
      city: address.city,
      state: address.stateCode || address.state,
      zipCode: address.postalCode,
      country: countryOption?.name || address.country,
      countryCode: countryCode,
    });

    // Trigger country change to sync regional settings
    if (countryCode) {
      onCountryChange(countryCode);
    }
  };

  // Handle country dropdown change
  const handleCountryDropdownChange = (countryCode: string) => {
    const countryOption = COUNTRY_OPTIONS.find((c) => c.value === countryCode);
    onChange({
      country: countryOption?.name || '',
      countryCode: countryCode,
    });
    onCountryChange(countryCode);
  };

  // Format country options for select
  const countrySelectOptions = COUNTRY_OPTIONS.map((c) => ({
    value: c.value,
    label: `${c.flag} ${c.name}`,
  }));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* Header / Collapsed View */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center">
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Location</p>
            <p className="text-xs text-muted-foreground">{summaryText}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAutoDetect();
            }}
            disabled={isDetecting}
            className="h-8 text-xs"
          >
            {isDetecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Locate className="h-3.5 w-3.5 mr-1" />
            )}
            {isDetecting ? 'Detecting...' : 'Auto-detect'}
          </Button>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      {/* Expanded Content */}
      <CollapsibleContent className="space-y-4 pb-4">
        {/* Address Search */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Search Address
          </label>
          <AddressAutocomplete
            onAddressSelect={handleAddressSelect}
            placeholder="Start typing to search..."
            defaultValue={
              data.address ? `${data.address}, ${data.city}` : ''
            }
          />
        </div>

        {/* Street Address */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Street Address
          </label>
          <Input
            value={data.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="123 Main Street"
            className="h-9 text-sm"
          />
        </div>

        {/* City & State */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              City
            </label>
            <Input
              value={data.city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="Melbourne"
              className="h-9 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              State/Province
            </label>
            <Input
              value={data.state}
              onChange={(e) => onChange({ state: e.target.value })}
              placeholder="VIC"
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Country & ZIP */}
        <div className="grid grid-cols-2 gap-3">
          <div data-field="store.country">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Country <span className="text-destructive">*</span>
            </label>
            <Select
              value={data.countryCode}
              onChange={handleCountryDropdownChange}
              options={countrySelectOptions}
              placeholder="Select country"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              ZIP/Postal Code
            </label>
            <Input
              value={data.zipCode}
              onChange={(e) => onChange({ zipCode: e.target.value })}
              placeholder="3000"
              className="h-9 text-sm"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default CollapsibleAddressSection;
