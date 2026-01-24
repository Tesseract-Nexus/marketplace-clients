'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetupWizard } from '../SetupWizardProvider';
import { useTenant } from '@/contexts/TenantContext';

interface SettingsStepProps {
  onComplete: () => void;
  onBack: () => void;
}

export function SettingsStep({ onComplete, onBack }: SettingsStepProps) {
  const router = useRouter();
  const { currentTenant } = useTenant();
  const { markStepComplete, closeWizard } = useSetupWizard();

  const handleGoToSettings = () => {
    markStepComplete('settings');
    closeWizard();
    router.push('/settings/general');
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
            <h2 className="text-xl font-semibold text-foreground">Configure Store Settings</h2>
            <p className="text-sm text-muted-foreground">
              Set up essential store information
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-foreground">What you'll configure:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span>Go to <strong>Settings → Store Settings</strong> in the sidebar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span>Update your store name and description</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <span>Add contact email and phone number</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
              <span>Set your timezone and currency</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">5</span>
              <span>Configure your store address</span>
            </li>
          </ul>
        </div>

        {/* Current tenant info */}
        {currentTenant && (
          <div className="bg-card rounded-lg p-4 border border-border">
            <h3 className="font-medium text-foreground mb-3">Current Store Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Store Name</span>
                <span className="font-medium text-foreground">{currentTenant.name}</span>
              </div>
              {currentTenant.slug && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Store URL</span>
                  <span className="font-mono text-xs text-foreground">{currentTenant.slug}.tesserix.app</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-info/10 border border-info/20 rounded-lg p-4">
          <p className="text-sm text-info">
            <strong>Tip:</strong> You can also set up payments, shipping, and taxes from the Settings menu. These are important for accepting orders.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border px-6 py-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleGoToSettings} className="gap-2">
            Go to Settings
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
