'use client';

import React, { useState } from 'react';
import { Loader2, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useTenant } from '@/contexts/TenantContext';
import { useUser } from '@/contexts/UserContext';
import type { Department, CreateDepartmentRequest } from '@/lib/api/rbacTypes';

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (department: Department) => void;
  existingDepartments?: Department[];
}

export function CreateDepartmentModal({
  isOpen,
  onClose,
  onSuccess,
  existingDepartments = [],
}: CreateDepartmentModalProps) {
  const { currentTenant } = useTenant();
  const { user } = useUser();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parentDepartmentId: '',
  });
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Department name must be at least 2 characters';
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
      const createData: CreateDepartmentRequest = {
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        description: formData.description.trim() || undefined,
        parentDepartmentId: formData.parentDepartmentId || undefined,
      };

      const response = await fetch('/api/staff/departments', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(createData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create department');
      }

      const result = await response.json();
      const newDepartment = result.data || result;

      // Reset form
      setFormData({
        name: '',
        code: '',
        description: '',
        parentDepartmentId: '',
      });
      setErrors({});

      onSuccess(newDepartment);
      onClose();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to create department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        code: '',
        description: '',
        parentDepartmentId: '',
      });
      setErrors({});
      setApiError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Create Department</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Create a new department to organize your teams
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {apiError && (
            <div className="p-3 bg-error-muted border border-error/30 rounded-lg text-error text-sm">
              {apiError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Department Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              className={cn(
                "w-full h-10 px-3 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all",
                errors.name ? "border-error" : "border-border"
              )}
              placeholder="e.g., Engineering, Sales, Marketing"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-error text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Department Code
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
              placeholder="e.g., ENG, SALES"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">Optional short code for the department</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all resize-none"
              placeholder="Brief description of this department..."
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          {existingDepartments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Parent Department
              </label>
              <select
                value={formData.parentDepartmentId}
                onChange={(e) => setFormData({ ...formData, parentDepartmentId: e.target.value })}
                className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                disabled={isSubmitting}
              >
                <option value="">No parent (root department)</option>
                {existingDepartments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          )}

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
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Department'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateDepartmentModal;
