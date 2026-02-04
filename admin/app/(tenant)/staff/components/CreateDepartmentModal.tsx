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
import { Select } from '@/components/Select';
import { departmentService } from '@/lib/api/rbac';
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
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parentDepartmentId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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

      const result = await departmentService.create(createData);
      const newDepartment = result.data;

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
                "w-full h-10 px-3 border rounded-md bg-background text-sm focus:outline-none focus:border-primary transition-all",
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
              className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary transition-all"
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
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary transition-all resize-none"
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
              <Select
                value={formData.parentDepartmentId}
                onChange={(value) => setFormData({ ...formData, parentDepartmentId: value })}
                options={[
                  { value: '', label: 'No parent (root department)' },
                  ...existingDepartments.map(dept => ({ value: dept.id, label: dept.name })),
                ]}
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-lg hover:bg-muted/50 transition-all font-medium border border-border disabled:opacity-50"
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
