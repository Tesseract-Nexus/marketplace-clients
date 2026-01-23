'use client';

import React, { useState, useMemo } from 'react';
import { Check, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Select } from '@/components/Select';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CURRENCY_OPTIONS,
  TIMEZONE_OPTIONS,
  DATE_FORMAT_OPTIONS,
  getTimezoneLabel,
  getAutoSyncedSettings,
} from '@/lib/constants/settings';

interface RegionalData {
  currency: string;
  timezone: string;
  dateFormat: string;
}

interface SmartRegionalSettingsProps {
  data: RegionalData;
  countryCode: string;
  onChange: (updates: Partial<RegionalData>) => void;
}

export function SmartRegionalSettings({
  data,
  countryCode,
  onChange,
}: SmartRegionalSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get auto-synced values based on country
  const autoSyncedValues = useMemo(() => {
    return getAutoSyncedSettings(countryCode);
  }, [countryCode]);

  // Check if current values match auto-synced values
  const isAutoSynced = useMemo(() => {
    return (
      data.currency === autoSyncedValues.currency &&
      data.timezone === autoSyncedValues.timezone &&
      data.dateFormat === autoSyncedValues.dateFormat
    );
  }, [data, autoSyncedValues]);

  // Reset to auto-synced values
  const handleResetToDefault = () => {
    onChange(autoSyncedValues);
    setIsExpanded(false);
  };

  // Format options for select
  const currencySelectOptions = CURRENCY_OPTIONS.map((c) => ({
    value: c.value,
    label: c.label,
  }));

  const timezoneSelectOptions = TIMEZONE_OPTIONS.map((t) => ({
    value: t.value,
    label: t.label,
  }));

  const dateFormatSelectOptions = DATE_FORMAT_OPTIONS.map((d) => ({
    value: d.value,
    label: d.label,
  }));

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="space-y-3">
        {/* Summary Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {isAutoSynced && (
              <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
            )}
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{data.currency}</span>
              {' \u2022 '}
              <span className="font-medium text-foreground">
                {getTimezoneLabel(data.timezone)}
              </span>
              {' \u2022 '}
              <span className="font-medium text-foreground">{data.dateFormat}</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            {!isAutoSynced && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetToDefault}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
              >
                {isExpanded ? 'Hide' : 'Override'}
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Auto-sync indicator */}
        {isAutoSynced && countryCode && (
          <p className="text-xs text-muted-foreground">
            Auto-synced with country selection
          </p>
        )}

        {/* Expanded Override Controls */}
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="grid grid-cols-3 gap-3">
            {/* Currency */}
            <div data-field="business.currency">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Currency
              </label>
              <Select
                value={data.currency}
                onChange={(value) => onChange({ currency: value })}
                options={currencySelectOptions}
              />
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Timezone
              </label>
              <Select
                value={data.timezone}
                onChange={(value) => onChange({ timezone: value })}
                options={timezoneSelectOptions}
              />
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Date Format
              </label>
              <Select
                value={data.dateFormat}
                onChange={(value) => onChange({ dateFormat: value })}
                options={dateFormatSelectOptions}
              />
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default SmartRegionalSettings;
