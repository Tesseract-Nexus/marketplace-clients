'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetupWizard } from '../SetupWizardProvider';

interface CategoryStepProps {
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function CategoryStep({ onComplete, onSkip, onBack }: CategoryStepProps) {
  const router = useRouter();
  const { markStepComplete, markStepSkipped, closeWizard } = useSetupWizard();

  const handleGoToCategories = () => {
    markStepComplete('category');
    closeWizard();
    router.push('/categories');
  };

  const handleSkip = () => {
    markStepSkipped('category');
    onSkip();
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
              Organize your products with categories
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4 space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-foreground">What you'll do:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span>Go to <strong>Catalog → Categories</strong> in the sidebar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span>Click <strong>"Add Category"</strong> button</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <span>Enter a name like "Electronics", "Clothing", or "Food"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
              <span>Add a description and save</span>
            </li>
          </ul>
        </div>

        <div className="bg-info/10 border border-info/20 rounded-lg p-4">
          <p className="text-sm text-info">
            <strong>Tip:</strong> Categories help customers find products easily. You can create subcategories later for better organization.
          </p>
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
            <Button onClick={handleGoToCategories} className="gap-2">
              Go to Categories
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
