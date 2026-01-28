'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus, ArrowRight, ExternalLink, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSetupWizard } from '../SetupWizardProvider';
import { WIZARD_ROUTES } from '@/lib/routes';
import { categoryService } from '@/lib/services/categoryService';
import { useToast } from '@/contexts/ToastContext';

interface CategoryStepProps {
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function CategoryStep({ onComplete, onSkip, onBack }: CategoryStepProps) {
  const router = useRouter();
  const { markStepComplete, markStepSkipped, closeWizard, setCreatedCategory } = useSetupWizard();
  const toast = useToast();

  const [mode, setMode] = useState<'choose' | 'quick-create'>('choose');
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleGoToCategories = () => {
    markStepComplete('category');
    closeWizard();
    router.push(WIZARD_ROUTES.category);
  };

  const handleSkip = () => {
    markStepSkipped('category');
    onSkip();
  };

  const handleQuickCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Error', 'Please enter a category name');
      return;
    }

    setIsCreating(true);
    try {
      const result = await categoryService.createCategory({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        isActive: true,
      });

      if (result.success && result.data) {
        setCreatedCategory({
          id: result.data.id,
          name: result.data.name,
          slug: result.data.slug,
        });
        toast.success('Category Created!', `"${result.data.name}" has been added to your catalog.`);
        markStepComplete('category');
        onComplete();
      } else {
        throw new Error('Failed to create category');
      }
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error('Error', 'Failed to create category. Please try again.');
    } finally {
      setIsCreating(false);
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
              <FolderPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Create Your First Category</h2>
              <p className="text-sm text-muted-foreground">
                Organize your products with categories
              </p>
            </div>
          </div>
        </div>

        {/* Content - Two Options */}
        <div className="flex-1 px-6 py-4 space-y-4">
          {/* Quick Create Option */}
          <button
            onClick={() => setMode('quick-create')}
            className="w-full p-4 rounded-lg border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Quick Create
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a simple category right here in the wizard. Perfect for getting started quickly.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-2" />
            </div>
          </button>

          {/* Full Page Option */}
          <button
            onClick={handleGoToCategories}
            className="w-full p-4 rounded-lg border-2 border-border hover:border-primary/30 hover:bg-muted/50 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Go to Categories Page
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Access the full categories page with advanced options like images, SEO settings, and subcategories.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-2" />
            </div>
          </button>

          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <p className="text-sm text-info">
              <strong>Tip:</strong> Categories help customers find products easily. You can always add more categories and edit them later.
            </p>
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

  // Quick Create Form View
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Quick Create Category</h2>
            <p className="text-sm text-muted-foreground">
              Enter the basics to get started
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 px-6 py-4 space-y-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Category Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Electronics, Clothing, Food & Beverages"
              disabled={isCreating}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of what products this category contains..."
              disabled={isCreating}
              rows={3}
            />
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium text-foreground">What happens next:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              Category will be created and saved
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              You can add more details anytime from Categories page
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              Ready to use when adding products
            </li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border px-6 py-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={() => setMode('choose')} disabled={isCreating}>
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleSkip} disabled={isCreating}>
              Skip for Now
            </Button>
            <Button onClick={handleQuickCreate} disabled={isCreating || !formData.name.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Category
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
