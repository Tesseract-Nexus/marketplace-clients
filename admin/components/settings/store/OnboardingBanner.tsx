'use client';

import React, { useState, useMemo } from 'react';
import { Rocket, ChevronRight, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { REQUIRED_STORE_FIELDS } from '@/lib/constants/settings';

interface StoreSettings {
  store: {
    name: string;
    email: string;
    phone: string;
    country: string;
  };
  business: {
    currency: string;
  };
}

interface OnboardingBannerProps {
  settings: StoreSettings;
  onFieldClick: (fieldKey: string) => void;
  onDismiss?: () => void;
}

// Helper to get nested value from object
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

const FIELD_PROMPTS: Record<string, string> = {
  'store.name': 'Add your store name',
  'store.email': 'Add your contact email',
  'store.phone': 'Add your phone number',
  'store.country': 'Select your country',
  'business.currency': 'Set your currency',
};

export function OnboardingBanner({
  settings,
  onFieldClick,
  onDismiss,
}: OnboardingBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const { completedCount, totalCount, missingFields, percentage, nextField } = useMemo(() => {
    let completed = 0;
    const missing: { key: string; label: string }[] = [];

    REQUIRED_STORE_FIELDS.forEach((field) => {
      const value = getNestedValue(settings as unknown as Record<string, unknown>, field.key);
      if (value && typeof value === 'string' && value.trim() !== '') {
        completed++;
      } else if (value) {
        completed++;
      } else {
        missing.push({ key: field.key, label: field.label });
      }
    });

    return {
      completedCount: completed,
      totalCount: REQUIRED_STORE_FIELDS.length,
      missingFields: missing,
      percentage: Math.round((completed / REQUIRED_STORE_FIELDS.length) * 100),
      nextField: missing[0] || null,
    };
  }, [settings]);

  // Don't show if complete or dismissed
  if (percentage === 100 || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleNextClick = () => {
    if (nextField) {
      onFieldClick(nextField.key);
    }
  };

  return (
    <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-4 mb-6">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Rocket className="h-5 w-5 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">
              Complete Your Store Setup
            </h3>
            <span className="text-sm font-medium text-primary">
              {completedCount} of {totalCount}
            </span>
          </div>

          {/* Progress bar */}
          <Progress value={percentage} className="h-1.5 mb-3" />

          {/* Next action */}
          {nextField && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Next: {FIELD_PROMPTS[nextField.key] || nextField.label}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextClick}
                className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                {nextField.label}
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          )}

          {/* Skip link */}
          <button
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
          >
            I&apos;ll do this later
          </button>
        </div>
      </div>
    </div>
  );
}

// Completion celebration component
export function SetupCompleteBanner({ onDismiss }: { onDismiss?: () => void }) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="relative bg-success/10 border border-success/20 rounded-lg p-4 mb-6">
      <button
        onClick={() => {
          setIsDismissed(true);
          onDismiss?.();
        }}
        className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
          <CheckCircle2 className="h-5 w-5 text-success" />
        </div>
        <div>
          <h3 className="font-semibold text-success">Setup Complete!</h3>
          <p className="text-sm text-muted-foreground">
            Your store is ready. Don&apos;t forget to publish it when you&apos;re ready to go live.
          </p>
        </div>
      </div>
    </div>
  );
}

export default OnboardingBanner;
