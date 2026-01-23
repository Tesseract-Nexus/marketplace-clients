'use client';

import React, { useState } from 'react';
import { UserPlus, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSetupWizard } from '../SetupWizardProvider';
import { useDialog } from '@/contexts/DialogContext';
import { staffService } from '@/lib/services/staffService';
import { StaffFormData } from '../types';
import { cn } from '@/lib/utils';

interface StaffStepProps {
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
}

// Staff roles that match the StaffRole type
const STAFF_ROLES = [
  { value: 'admin' as const, label: 'Admin', description: 'Full access to all features' },
  { value: 'manager' as const, label: 'Manager', description: 'Manage orders, products, and customers' },
  { value: 'employee' as const, label: 'Employee', description: 'Handle day-to-day operations' },
  { value: 'readonly' as const, label: 'Viewer', description: 'Read-only access' },
];

export function StaffStep({ onComplete, onSkip, onBack }: StaffStepProps) {
  const { setInvitedStaff, markStepComplete, markStepSkipped, invitedStaff } = useSetupWizard();
  const { showError, showSuccess } = useDialog();
  const [formData, setFormData] = useState<StaffFormData>({
    email: invitedStaff?.email || '',
    firstName: '',
    lastName: '',
    role: 'manager',
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

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await staffService.createStaff({
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || '',
        role: formData.role,
        employmentType: 'full_time',
      });

      if (response.success && response.data) {
        setInvitedStaff({
          id: response.data.id,
          email: response.data.email,
          name: `${response.data.firstName} ${response.data.lastName || ''}`.trim(),
          role: response.data.role,
        });
        markStepComplete('staff');
        showSuccess('Invitation Sent', `An invitation has been sent to ${formData.email}`);
        onComplete();
      } else {
        throw new Error('Failed to invite staff member');
      }
    } catch (err: any) {
      console.error('Error inviting staff:', err);
      const errorMessage = err?.message || 'Failed to send invitation. Please try again.';
      setError(errorMessage);
      showError('Error', errorMessage);
    } finally {
      setSaving(false);
    }
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
            <h2 className="text-xl font-semibold text-foreground">Invite a Team Member</h2>
            <p className="text-sm text-muted-foreground">
              Optional - you can do this later
            </p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="mx-6 mb-4 p-3 rounded-lg bg-info/10 border border-info/20 flex items-start gap-3">
        <Info className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
        <p className="text-sm text-info">
          Team members will receive an email invitation to join your store.
        </p>
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
            <label htmlFor="staffEmail" className="text-sm font-medium text-foreground">
              Email Address <span className="text-error">*</span>
            </label>
            <Input
              id="staffEmail"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="colleague@company.com"
              className="h-11"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="staffFirstName" className="text-sm font-medium text-foreground">
                First Name <span className="text-error">*</span>
              </label>
              <Input
                id="staffFirstName"
                name="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                placeholder="John"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="staffLastName" className="text-sm font-medium text-foreground">
                Last Name
              </label>
              <Input
                id="staffLastName"
                name="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                placeholder="Doe"
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Role <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STAFF_ROLES.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: role.value }))}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all',
                    formData.role === role.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card hover:border-primary/50'
                  )}
                >
                  <span className="block font-medium text-sm text-foreground">{role.label}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {role.description}
                  </span>
                </button>
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
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={handleSkip}>
                Skip for Now
              </Button>
              <Button
                type="submit"
                disabled={saving || !formData.email.trim() || !formData.firstName.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invite'
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
