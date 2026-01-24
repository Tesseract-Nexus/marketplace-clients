'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetupWizard } from '../SetupWizardProvider';
import { WIZARD_ROUTES } from '@/lib/routes';

interface StaffStepProps {
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function StaffStep({ onComplete, onSkip, onBack }: StaffStepProps) {
  const router = useRouter();
  const { markStepComplete, markStepSkipped, closeWizard } = useSetupWizard();

  const handleGoToStaff = () => {
    markStepComplete('staff');
    closeWizard();
    router.push(WIZARD_ROUTES.staff);
  };

  const handleSkip = () => {
    markStepSkipped('staff');
    onSkip();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Invite Team Members</h2>
            <p className="text-sm text-muted-foreground">
              Optional - Add staff to help manage your store
            </p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="mx-6 mb-4 p-3 rounded-lg bg-info/10 border border-info/20 flex items-start gap-3">
        <Info className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
        <p className="text-sm text-info">
          You can skip this step if you're managing the store alone. You can always invite team members later.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-foreground">What you'll do:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span>Go to <strong>Team → Staff</strong> in the sidebar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span>Click <strong>"Add Staff Member"</strong> button</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <span>Enter their email and name</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
              <span>Assign a role (Admin, Manager, Support, etc.)</span>
            </li>
          </ul>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-medium text-foreground mb-2">Available Roles:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 bg-card rounded border border-border">
              <span className="font-medium text-foreground">Admin</span>
              <p className="text-xs text-muted-foreground">Full access</p>
            </div>
            <div className="p-2 bg-card rounded border border-border">
              <span className="font-medium text-foreground">Manager</span>
              <p className="text-xs text-muted-foreground">Manage operations</p>
            </div>
            <div className="p-2 bg-card rounded border border-border">
              <span className="font-medium text-foreground">Support</span>
              <p className="text-xs text-muted-foreground">Customer service</p>
            </div>
            <div className="p-2 bg-card rounded border border-border">
              <span className="font-medium text-foreground">Viewer</span>
              <p className="text-xs text-muted-foreground">Read-only</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border px-6 py-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleSkip}>
              Skip for Now
            </Button>
            <Button onClick={handleGoToStaff} className="gap-2">
              Go to Team
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
