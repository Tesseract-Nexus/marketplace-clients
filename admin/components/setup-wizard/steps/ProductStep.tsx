'use client';

import React, { useState, useEffect } from 'react';
import { Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSetupWizard } from '../SetupWizardProvider';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';
import { useUser } from '@/contexts/UserContext';
import { productService } from '@/lib/services/productService';
import { categoryService } from '@/lib/services/categoryService';
import { ProductFormData } from '../types';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

interface ProductStepProps {
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function ProductStep({ onComplete, onSkip, onBack }: ProductStepProps) {
  const { setCreatedProduct, markStepComplete, createdCategory, createdProduct } = useSetupWizard();
  const { showError } = useDialog();
  const { currentTenant } = useTenant();
  const { user } = useUser();
  const [formData, setFormData] = useState<ProductFormData>({
    name: createdProduct?.name || '',
    price: '',
    categoryId: createdCategory?.id || '',
    sku: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryService.getCategories({ limit: 100 });
        if (response.success && response.data) {
          setCategories(response.data);
          // If we created a category in the previous step, pre-select it
          if (createdCategory?.id && !formData.categoryId) {
            setFormData((prev) => ({ ...prev, categoryId: createdCategory.id }));
          }
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [createdCategory?.id, formData.categoryId]);

  const generateSku = (name: string): string => {
    const prefix = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${random}`;
  };

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
      setError('Product name is required');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    setSaving(true);
    try {
      const sku = formData.sku?.trim() || generateSku(formData.name);
      const slug = generateSlug(formData.name);
      // Get vendorId from user context or tenant ID
      const vendorId = user?.vendorId || currentTenant?.id || '';
      // Use created category or first available category, or empty string
      const categoryId = formData.categoryId || createdCategory?.id || (categories[0]?.id || '');

      const response = await productService.createProduct({
        name: formData.name.trim(),
        slug,
        sku,
        price: formData.price,
        vendorId,
        categoryId,
        quantity: 0,
        currencyCode: 'USD',
      });

      if (response.success && response.data) {
        setCreatedProduct({
          id: response.data.id,
          name: response.data.name,
          sku: response.data.sku,
        });
        markStepComplete('product');
        onComplete();
      } else {
        throw new Error('Failed to create product');
      }
    } catch (err: any) {
      console.error('Error creating product:', err);
      const errorMessage = err?.message || 'Failed to create product. Please try again.';
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="productName" className="text-sm font-medium text-foreground">
              Product Name <span className="text-error">*</span>
            </label>
            <Input
              id="productName"
              name="productName"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Wireless Headphones"
              className="h-11"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="productPrice" className="text-sm font-medium text-foreground">
              Price <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="productPrice"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                className="h-11 pl-7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="productCategory" className="text-sm font-medium text-foreground">
              Category <span className="text-muted-foreground">(optional)</span>
            </label>
            {loadingCategories ? (
              <div className="h-11 flex items-center justify-center border rounded-md bg-muted/30">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <select
                id="productCategory"
                name="categoryId"
                value={formData.categoryId}
                onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                className={cn(
                  'w-full h-11 px-3 rounded-md border border-input bg-background text-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                )}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                    {cat.id === createdCategory?.id ? ' (just created)' : ''}
                  </option>
                ))}
              </select>
            )}
            {createdCategory && !formData.categoryId && (
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, categoryId: createdCategory.id }))}
                className="text-xs text-primary hover:underline"
              >
                Use "{createdCategory.name}" (created in previous step)
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="productSku" className="text-sm font-medium text-foreground">
              SKU <span className="text-muted-foreground">(auto-generated if empty)</span>
            </label>
            <Input
              id="productSku"
              name="sku"
              value={formData.sku}
              onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
              placeholder={formData.name ? generateSku(formData.name) : 'ABC-1234'}
              className="h-11 font-mono"
            />
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
              <Button
                type="submit"
                disabled={saving || !formData.name.trim() || !formData.price}
              >
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
