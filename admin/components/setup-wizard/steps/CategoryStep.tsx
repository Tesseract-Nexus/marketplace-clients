'use client';

import React, { useState } from 'react';
import { FolderPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSetupWizard } from '../SetupWizardProvider';
import { useDialog } from '@/contexts/DialogContext';
import { categoryService } from '@/lib/services/categoryService';
import { CategoryFormData } from '../types';
import { cn } from '@/lib/utils';

interface CategoryStepProps {
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function CategoryStep({ onComplete, onSkip, onBack }: CategoryStepProps) {
  const { setCreatedCategory, markStepComplete, createdCategory } = useSetupWizard();
  const { showError } = useDialog();
  const [formData, setFormData] = useState<CategoryFormData>({
    name: createdCategory?.name || '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    setSaving(true);
    try {
      const slug = generateSlug(formData.name);
      const response = await categoryService.createCategory({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        slug,
        isActive: true,
      });

      if (response.success && response.data) {
        setCreatedCategory({
          id: response.data.id,
          name: response.data.name,
          slug: response.data.slug,
        });
        markStepComplete('category');
        onComplete();
      } else {
        throw new Error('Failed to create category');
      }
    } catch (err: any) {
      console.error('Error creating category:', err);
      const errorMessage = err?.message || 'Failed to create category. Please try again.';
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
            <FolderPlus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Create Your First Category</h2>
            <p className="text-sm text-muted-foreground">
              Categories help organize your products
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <div className="flex-1 px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="categoryName" className="text-sm font-medium text-foreground">
              Category Name <span className="text-error">*</span>
            </label>
            <Input
              id="categoryName"
              name="categoryName"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Electronics, Clothing, Food & Beverages"
              className="h-11"
              autoFocus
            />
            {formData.name && (
              <p className="text-xs text-muted-foreground">
                Slug: <span className="font-mono">{generateSlug(formData.name)}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="categoryDescription" className="text-sm font-medium text-foreground">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="categoryDescription"
              name="categoryDescription"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of what products this category contains..."
              rows={3}
            />
          </div>

          {/* Quick suggestions */}
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {['Electronics', 'Clothing', 'Home & Garden', 'Food & Beverages', 'Health & Beauty'].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, name: suggestion }))}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-full border transition-colors',
                      formData.name === suggestion
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    )}
                  >
                    {suggestion}
                  </button>
                )
              )}
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
              <Button type="button" variant="outline" onClick={onSkip}>
                Skip
              </Button>
              <Button type="submit" disabled={saving || !formData.name.trim()}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
