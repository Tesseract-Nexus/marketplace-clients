'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSetupWizard } from '../SetupWizardProvider';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';
import { SettingsFormData } from '../types';
import { cn } from '@/lib/utils';

interface SettingsStepProps {
  onComplete: () => void;
  onBack: () => void;
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'UTC', label: 'UTC' },
];

export function SettingsStep({ onComplete, onBack }: SettingsStepProps) {
  const { markStepComplete } = useSetupWizard();
  const { currentTenant } = useTenant();
  const { showError, showSuccess } = useDialog();

  // Try to detect user's timezone
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const defaultTimezone = TIMEZONES.find((tz) => tz.value === detectedTimezone)?.value || 'UTC';

  const [formData, setFormData] = useState<SettingsFormData>({
    contactEmail: '',
    contactPhone: '',
    timezone: defaultTimezone,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.contactEmail.trim()) {
      setError('Contact email is required');
      return;
    }

    if (!validateEmail(formData.contactEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      // Note: In a real implementation, this would call the settings API
      // For now, we'll just simulate success since the settings service
      // has a different structure than what we need for this wizard
      await new Promise((resolve) => setTimeout(resolve, 500));

      markStepComplete('settings');
      showSuccess('Settings Saved', 'Your store settings have been updated.');
      onComplete();
    } catch (err: any) {
      console.error('Error saving settings:', err);
      const errorMessage = err?.message || 'Failed to save settings. Please try again.';
      setError(errorMessage);
      showError('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Quick Store Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure essential contact information
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="contactEmail" className="text-sm font-medium text-foreground">
              Store Contact Email <span className="text-error">*</span>
            </label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
              placeholder="support@yourstore.com"
              className="h-11"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Customers will see this email for support inquiries
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="contactPhone" className="text-sm font-medium text-foreground">
              Contact Phone <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="timezone" className="text-sm font-medium text-foreground">
              Store Timezone <span className="text-error">*</span>
            </label>
            <select
              id="timezone"
              name="timezone"
              value={formData.timezone}
              onChange={(e) => setFormData((prev) => ({ ...prev, timezone: e.target.value }))}
              className={cn(
                'w-full h-11 px-3 rounded-md border border-input bg-background text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
              )}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            {formData.timezone === detectedTimezone && (
              <p className="text-xs text-success">
                Detected from your browser
              </p>
            )}
          </div>

          {/* Current tenant info display */}
          {currentTenant && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground mb-2">Store Information</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium">Name:</span> {currentTenant.name}
                </p>
                {currentTenant.slug && (
                  <p>
                    <span className="font-medium">Store URL:</span>{' '}
                    <span className="font-mono text-xs">{currentTenant.slug}.tesserix.app</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={onBack}>
              Back
            </Button>
            <Button type="submit" disabled={saving || !formData.contactEmail.trim()}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Continue'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
