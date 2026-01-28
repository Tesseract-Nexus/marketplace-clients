'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ArrowRight, ExternalLink, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/Select';
import { useSetupWizard } from '../SetupWizardProvider';
import { WIZARD_ROUTES } from '@/lib/routes';
import { productService } from '@/lib/services/productService';
import { categoryService } from '@/lib/services/categoryService';
import { useToast } from '@/contexts/ToastContext';
import { useTenant } from '@/contexts/TenantContext';

interface ProductStepProps {
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function ProductStep({ onComplete, onSkip, onBack }: ProductStepProps) {
  const router = useRouter();
  const { markStepComplete, markStepSkipped, closeWizard, setCreatedProduct, createdCategory } = useSetupWizard();
  const toast = useToast();
  const { currentTenant } = useTenant();

  const [mode, setMode] = useState<'choose' | 'quick-create'>('choose');
  const [isCreating, setIsCreating] = useState(false);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: createdCategory?.id || '',
  });

  // Load categories when entering quick create mode
  useEffect(() => {
    if (mode === 'quick-create' && categories.length === 0) {
      loadCategories();
    }
  }, [mode]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const result = await categoryService.getCategories({ limit: 100 });
      if (result.success && result.data) {
        setCategories(result.data.map(cat => ({ value: cat.id, label: cat.name })));
        // Auto-select the category created in previous step if available
        if (createdCategory?.id && !formData.categoryId) {
          setFormData(prev => ({ ...prev, categoryId: createdCategory.id }));
        }
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleGoToProducts = () => {
    markStepComplete('product');
    closeWizard();
    router.push(WIZARD_ROUTES.product);
  };

  const handleSkip = () => {
    markStepSkipped('product');
    onSkip();
  };

  const generateSKU = (name: string): string => {
    const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'PRD';
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${random}`;
  };

  const handleQuickCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Error', 'Please enter a product name');
      return;
    }
    if (!formData.price.trim() || isNaN(parseFloat(formData.price))) {
      toast.error('Error', 'Please enter a valid price');
      return;
    }

    setIsCreating(true);
    try {
      const sku = generateSKU(formData.name);
      // Use a default category if none selected
      const categoryId = formData.categoryId || categories[0]?.value || '';
      const vendorId = currentTenant?.id || '';

      if (!categoryId) {
        toast.error('Error', 'Please select a category or create one first');
        setIsCreating(false);
        return;
      }

      const result = await productService.createProduct({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: formData.price.trim(),
        sku,
        categoryId,
        vendorId,
        quantity: 0,
      });

      if (result.success && result.data) {
        setCreatedProduct({
          id: result.data.id,
          name: result.data.name,
          sku: result.data.sku,
        });
        toast.success('Product Created!', `"${result.data.name}" has been added to your catalog.`);
        markStepComplete('product');
        onComplete();
      } else {
        throw new Error('Failed to create product');
      }
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('Error', 'Failed to create product. Please try again.');
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
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Add Your First Product</h2>
              <p className="text-sm text-muted-foreground">
                Start building your catalog
              </p>
            </div>
          </div>
        </div>

        {/* Content - Two Options */}
        <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
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
                  Create a simple product right here in the wizard. Perfect for getting started quickly.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-2" />
            </div>
          </button>

          {/* Full Page Option */}
          <button
            onClick={handleGoToProducts}
            className="w-full p-4 rounded-lg border-2 border-border hover:border-primary/30 hover:bg-muted/50 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Go to Products Page
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Access the full products page with advanced options like images, variants, inventory tracking, and more.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-2" />
            </div>
          </button>

          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <p className="text-sm text-info">
              <strong>Tip:</strong> Good product photos and detailed descriptions help increase sales. You can add images and variants later.
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
            <h2 className="text-xl font-semibold text-foreground">Quick Create Product</h2>
            <p className="text-sm text-muted-foreground">
              Enter the basics to get started
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Product Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Wireless Headphones, Cotton T-Shirt"
              disabled={isCreating}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Price <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Category <span className="text-muted-foreground">(optional)</span>
            </label>
            {loadingCategories ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground h-10">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading categories...
              </div>
            ) : (
              <Select
                value={formData.categoryId}
                onChange={(value) => setFormData({ ...formData, categoryId: value })}
                options={[
                  { value: '', label: 'No category' },
                  ...categories,
                ]}
                disabled={isCreating}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief product description..."
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
              Product will be created as a draft
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              SKU will be auto-generated
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              Add images and variants later from Products page
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
            <Button onClick={handleQuickCreate} disabled={isCreating || !formData.name.trim() || !formData.price.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Product
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
