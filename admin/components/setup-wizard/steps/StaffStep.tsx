'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, ArrowRight, ExternalLink, Info, Loader2, CheckCircle, Sparkles, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/Select';
import { useSetupWizard } from '../SetupWizardProvider';
import { WIZARD_ROUTES } from '@/lib/routes';
import { staffService } from '@/lib/services/staffService';
import { useDialog } from '@/contexts/DialogContext';

interface StaffStepProps {
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', description: 'Full access' },
  { value: 'manager', label: 'Manager', description: 'Manage operations' },
  { value: 'employee', label: 'Employee', description: 'Standard access' },
  { value: 'readonly', label: 'Viewer', description: 'Read-only' },
];

export function StaffStep({ onComplete, onSkip, onBack }: StaffStepProps) {
  const router = useRouter();
  const { markStepComplete, markStepSkipped, closeWizard, setInvitedStaff } = useSetupWizard();
  const { showSuccess, showError } = useDialog();

  const [mode, setMode] = useState<'choose' | 'quick-invite'>('choose');
  const [isInviting, setIsInviting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'manager',
  });

  const handleGoToStaff = () => {
    markStepComplete('staff');
    closeWizard();
    router.push(WIZARD_ROUTES.staff);
  };

  const handleSkip = () => {
    markStepSkipped('staff');
    onSkip();
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleQuickInvite = async () => {
    if (!formData.email.trim()) {
      showError('Error', 'Please enter an email address');
      return;
    }
    if (!validateEmail(formData.email)) {
      showError('Error', 'Please enter a valid email address');
      return;
    }
    if (!formData.firstName.trim()) {
      showError('Error', 'Please enter a first name');
      return;
    }

    setIsInviting(true);
    try {
      const result = await staffService.createStaff({
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || formData.firstName.trim(), // Default to first name if not provided
        displayName: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        role: formData.role as 'admin' | 'manager' | 'employee' | 'readonly',
        employmentType: 'full_time',
      });

      if (result.success && result.data) {
        setInvitedStaff({
          id: result.data.id,
          email: result.data.email,
          name: result.data.displayName || formData.firstName,
          role: result.data.role,
        });
        showSuccess('Staff Invited!', `An invitation will be sent to ${formData.email}.`);
        markStepComplete('staff');
        onComplete();
      } else {
        throw new Error('Failed to invite staff');
      }
    } catch (error) {
      console.error('Failed to invite staff:', error);
      showError('Error', 'Failed to invite staff member. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  // Mode Selection View
  if (mode === 'choose') {
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

        {/* Content - Two Options */}
        <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
          {/* Quick Invite Option */}
          <button
            onClick={() => setMode('quick-invite')}
            className="w-full p-4 rounded-lg border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Quick Invite
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Invite a team member by email right here in the wizard.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-2" />
            </div>
          </button>

          {/* Full Page Option */}
          <button
            onClick={handleGoToStaff}
            className="w-full p-4 rounded-lg border-2 border-border hover:border-primary/30 hover:bg-muted/50 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Go to Team Page
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Access the full team management page with roles, permissions, and organization structure.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-2" />
            </div>
          </button>

          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium text-foreground mb-2">Available Roles:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {ROLE_OPTIONS.map(role => (
                <div key={role.value} className="p-2 bg-card rounded border border-border">
                  <span className="font-medium text-foreground">{role.label}</span>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={onBack}>
              Back
            </Button>
            <Button type="button" variant="outline" onClick={handleSkip}>
              Skip for Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Quick Invite Form View
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Quick Invite Staff</h2>
            <p className="text-sm text-muted-foreground">
              Send an invitation to your team member
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="colleague@example.com"
              disabled={isInviting}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                First Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                disabled={isInviting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Last Name <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                disabled={isInviting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Role
            </label>
            <Select
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value })}
              options={ROLE_OPTIONS.map(r => ({ value: r.value, label: `${r.label} - ${r.description}` }))}
              disabled={isInviting}
            />
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium text-foreground">What happens next:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              Staff member record will be created
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              They'll receive an email invitation
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              They can set up their account and password
            </li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border px-6 py-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={() => setMode('choose')} disabled={isInviting}>
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleSkip} disabled={isInviting}>
              Skip for Now
            </Button>
            <Button onClick={handleQuickInvite} disabled={isInviting || !formData.email.trim() || !formData.firstName.trim()}>
              {isInviting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Inviting...
                </>
              ) : (
                <>
                  Send Invite
                  <Mail className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
