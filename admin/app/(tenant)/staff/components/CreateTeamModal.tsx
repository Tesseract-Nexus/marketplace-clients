'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Users, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select } from '@/components/Select';
import { cn } from '@/lib/utils';
import { useTenant } from '@/contexts/TenantContext';
import { useUser } from '@/contexts/UserContext';
import type { Team, CreateTeamRequest, Role } from '@/lib/api/rbacTypes';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (team: Team) => void;
  departmentId: string;
  departmentName?: string;
}

export function CreateTeamModal({
  isOpen,
  onClose,
  onSuccess,
  departmentId,
  departmentName,
}: CreateTeamModalProps) {
  const { currentTenant } = useTenant();
  const { user } = useUser();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    defaultRoleId: '',
    maxCapacity: '',
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const getHeaders = (): HeadersInit => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-jwt-claim-tenant-id': currentTenant?.id || '',
    };
    if (user?.id) headers['x-jwt-claim-sub'] = user.id;
    if (user?.email) headers['x-jwt-claim-email'] = user.email;
    return headers;
  };

  // Load roles when modal opens
  useEffect(() => {
    if (isOpen && currentTenant?.id) {
      loadRoles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentTenant?.id]);

  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await fetch('/api/staff/roles', { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setRoles(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoadingRoles(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Team name must be at least 2 characters';
    }

    if (formData.maxCapacity && (isNaN(Number(formData.maxCapacity)) || Number(formData.maxCapacity) < 1)) {
      newErrors.maxCapacity = 'Max capacity must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const createData: CreateTeamRequest = {
        name: formData.name.trim(),
        departmentId: departmentId,
        code: formData.code.trim() || undefined,
        defaultRoleId: formData.defaultRoleId || undefined,
        maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : undefined,
      };

      const response = await fetch('/api/staff/teams', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(createData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create team');
      }

      const result = await response.json();
      const newTeam = result.data || result;

      // Attach the default role info if selected
      if (formData.defaultRoleId) {
        const selectedRole = roles.find(r => r.id === formData.defaultRoleId);
        if (selectedRole) {
          newTeam.defaultRole = selectedRole;
        }
      }

      // Reset form
      setFormData({
        name: '',
        code: '',
        defaultRoleId: '',
        maxCapacity: '',
      });
      setErrors({});

      onSuccess(newTeam);
      onClose();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        code: '',
        defaultRoleId: '',
        maxCapacity: '',
      });
      setErrors({});
      setApiError(null);
      onClose();
    }
  };

  const selectedRole = roles.find(r => r.id === formData.defaultRoleId);

  const roleOptions = [
    { value: '', label: 'No default role' },
    ...roles.map(r => ({ value: r.id, label: r.displayName || r.name })),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success-muted flex items-center justify-center">
              <Users className="w-5 h-5 text-success" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Create Team</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {departmentName
                  ? `Create a new team in ${departmentName}`
                  : 'Create a new team for staff members'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {apiError && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              {apiError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Team Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              className={cn(
                "w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                errors.name ? "border-destructive" : "border-border"
              )}
              placeholder="e.g., Frontend Team, Sales Team A"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-error text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Team Code
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              placeholder="e.g., FE-TEAM, SALES-A"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">Optional short code for the team</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Default Role
              {loadingRoles && <Loader2 className="inline w-3 h-3 ml-2 animate-spin" />}
            </label>
            <Select
              value={formData.defaultRoleId}
              onChange={(value) => setFormData({ ...formData, defaultRoleId: value })}
              options={roleOptions}
              className="w-full"
              disabled={isSubmitting || loadingRoles}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Team members will automatically inherit permissions from this role
            </p>
          </div>

          {selectedRole && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-start gap-2">
              <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Role: <span className="text-primary">{selectedRole.displayName || selectedRole.name}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  New staff members will inherit this role&apos;s permissions automatically.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Max Capacity
            </label>
            <input
              type="number"
              value={formData.maxCapacity}
              onChange={(e) => {
                setFormData({ ...formData, maxCapacity: e.target.value });
                if (errors.maxCapacity) setErrors(prev => ({ ...prev, maxCapacity: '' }));
              }}
              className={cn(
                "w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                errors.maxCapacity ? "border-destructive" : "border-border"
              )}
              placeholder="e.g., 10"
              min={1}
              disabled={isSubmitting}
            />
            {errors.maxCapacity && (
              <p className="text-error text-xs mt-1">{errors.maxCapacity}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Optional maximum number of team members</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-all font-medium border border-border disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Team'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateTeamModal;
