'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/Select';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { couponService } from '@/lib/services/couponService';
import {
  Coupon,
  DiscountType,
  CreateCouponRequest,
  UpdateCouponRequest,
  CouponApplicability,
} from '@/lib/api/types';

// Form state type uses strings for numeric inputs since HTML inputs return strings
interface CouponFormState {
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: string; // String for form input, converted to number on submit
  applicability?: CouponApplicability;
  totalUsageLimit?: number;
  perCustomerLimit?: number;
  startDate?: string;
  endDate?: string;
  restrictions?: {
    minPurchaseAmount?: string; // String for form input
    maxDiscountAmount?: string; // String for form input
    allowedProducts?: string[];
    allowedCategories?: string[];
    excludedProducts?: string[];
    excludedCategories?: string[];
    firstOrderOnly?: boolean;
    onePerCustomer?: boolean;
  };
  tags?: string[];
  notes?: string;
}
import {
  Ticket,
  Clock,
  Save,
  AlertCircle,
  ArrowLeft,
  Home,
  Edit,
} from 'lucide-react';

/**
 * Convert datetime-local input value to ISO 8601 string for backend
 * datetime-local format: "2026-01-20T00:02" (no seconds, no timezone)
 * ISO 8601 format: "2026-01-20T00:02:00.000Z" (with seconds and timezone)
 */
const toISODateString = (dateStr: string | undefined): string | undefined => {
  if (!dateStr) return undefined;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return undefined;
    return date.toISOString();
  } catch {
    return undefined;
  }
};

interface CouponFormProps {
  couponId?: string;
  mode: 'create' | 'edit';
}

export function CouponForm({ couponId, mode }: CouponFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CouponFormState>({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    applicability: 'ALL_PRODUCTS',
    totalUsageLimit: undefined,
    perCustomerLimit: undefined,
    startDate: '',
    endDate: '',
    restrictions: {
      minPurchaseAmount: '',
    },
    tags: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load coupon data when editing
  useEffect(() => {
    if (mode === 'edit' && couponId) {
      loadCoupon();
    }
  }, [mode, couponId]);

  const loadCoupon = async () => {
    try {
      setLoading(true);
      const response = await couponService.getCoupon(couponId!);
      const coupon = response.data;
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: String(coupon.discountValue || ''),
        applicability: coupon.applicability,
        totalUsageLimit: coupon.totalUsageLimit,
        perCustomerLimit: coupon.perCustomerLimit,
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        restrictions: coupon.restrictions ? {
          ...coupon.restrictions,
          minPurchaseAmount: coupon.restrictions.minPurchaseAmount != null
            ? String(coupon.restrictions.minPurchaseAmount)
            : undefined,
          maxDiscountAmount: coupon.restrictions.maxDiscountAmount != null
            ? String(coupon.restrictions.maxDiscountAmount)
            : undefined,
        } : undefined,
        tags: coupon.tags,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupon');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name: string, value: any): string | null => {
    switch (name) {
      case 'code':
        if (!value || value.trim() === '') return 'Coupon code is required';
        if (value.length < 3) return 'Coupon code must be at least 3 characters';
        if (!/^[A-Z0-9-_]+$/.test(value)) return 'Coupon code can only contain uppercase letters, numbers, hyphens, and underscores';
        return null;
      case 'name':
        if (!value || value.trim() === '') return 'Coupon name is required';
        if (value.length < 3) return 'Coupon name must be at least 3 characters';
        return null;
      case 'discountValue':
        if (!value || value === '') return 'Discount value is required';
        const discount = parseFloat(value);
        if (isNaN(discount)) return 'Discount value must be a valid number';
        if (discount <= 0) return 'Discount value must be greater than 0';
        if (formData.discountType === 'PERCENTAGE' && discount > 100) {
          return 'Percentage discount cannot exceed 100%';
        }
        return null;
      case 'totalUsageLimit':
        if (value && !Number.isInteger(Number(value))) return 'Total usage limit must be a whole number';
        if (value && Number(value) <= 0) return 'Total usage limit must be greater than 0';
        return null;
      case 'perCustomerLimit':
        if (value && !Number.isInteger(Number(value))) return 'Per customer limit must be a whole number';
        if (value && Number(value) <= 0) return 'Per customer limit must be greater than 0';
        return null;
      case 'minPurchaseAmount':
        if (value && value !== '') {
          const amount = parseFloat(value);
          if (isNaN(amount)) return 'Minimum purchase amount must be a valid number';
          if (amount < 0) return 'Minimum purchase amount cannot be negative';
        }
        return null;
      case 'endDate':
        if (value && formData.startDate) {
          const start = new Date(formData.startDate);
          const end = new Date(value);
          if (end < start) return 'End date must be after start date';
        }
        return null;
      default:
        return null;
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error || '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    ['code', 'name', 'discountValue'].forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) newErrors[field] = error;
    });

    if (formData.totalUsageLimit) {
      const error = validateField('totalUsageLimit', formData.totalUsageLimit);
      if (error) newErrors.totalUsageLimit = error;
    }

    if (formData.perCustomerLimit) {
      const error = validateField('perCustomerLimit', formData.perCustomerLimit);
      if (error) newErrors.perCustomerLimit = error;
    }

    if (formData.restrictions?.minPurchaseAmount) {
      const error = validateField('minPurchaseAmount', formData.restrictions.minPurchaseAmount);
      if (error) newErrors.minPurchaseAmount = error;
    }

    if (formData.endDate) {
      const error = validateField('endDate', formData.endDate);
      if (error) newErrors.endDate = error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors in the form before submitting.');
      return;
    }

    try {
      setSaving(true);

      // Convert string values to proper types for the API
      // Convert datetime-local values to ISO 8601 format for Go backend
      const startDateISO = toISODateString(formData.startDate);
      const endDateISO = toISODateString(formData.endDate);
      const validFrom = startDateISO || new Date().toISOString();

      const requestData: CreateCouponRequest = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        discountType: formData.discountType,
        discountValue: formData.discountValue ? parseFloat(formData.discountValue) : 0,
        scope: 'APPLICATION', // Default scope
        applicability: formData.applicability,
        totalUsageLimit: formData.totalUsageLimit,
        perCustomerLimit: formData.perCustomerLimit,
        validFrom: validFrom,
        validTo: endDateISO,
        startDate: startDateISO,
        endDate: endDateISO,
        restrictions: formData.restrictions ? {
          ...formData.restrictions,
          minPurchaseAmount: formData.restrictions.minPurchaseAmount
            ? parseFloat(formData.restrictions.minPurchaseAmount)
            : undefined,
          maxDiscountAmount: formData.restrictions.maxDiscountAmount
            ? parseFloat(formData.restrictions.maxDiscountAmount)
            : undefined,
        } : undefined,
        tags: formData.tags,
        notes: formData.notes,
      };

      if (mode === 'create') {
        await couponService.createCoupon(requestData);
      } else if (couponId) {
        await couponService.updateCoupon(couponId, requestData as UpdateCouponRequest);
      }
      router.push('/coupons');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-300">
        {/* Header with breadcrumbs and back button */}
        <div className="flex items-center justify-between">
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/', icon: Home },
              { label: 'Coupons', href: '/coupons', icon: Ticket },
              { label: mode === 'create' ? 'Create' : 'Edit', icon: Edit },
            ]}
          />
          <Button
            onClick={() => router.push('/coupons')}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-card rounded-lg border border-border shadow-sm">
          {/* Header */}
          <div className="border-b border-border p-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {mode === 'create' ? 'Create Coupon' : 'Edit Coupon'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {mode === 'create' ? 'Create a new discount coupon' : 'Update coupon details'}
              </p>
            </div>
            {/* Compact Live Preview */}
            <div className="hidden sm:flex items-center gap-3 bg-muted rounded-lg px-4 py-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Ticket className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-sm text-foreground">
                  {formData.code || 'CODE'}
                </p>
                <p className="text-lg font-bold text-primary">
                  {formData.discountType === 'PERCENTAGE' && formData.discountValue
                    ? `${formData.discountValue}%`
                    : formData.discountType === 'FIXED_AMOUNT' && formData.discountValue
                    ? `$${formData.discountValue}`
                    : formData.discountType === 'FREE_SHIPPING'
                    ? 'FREE'
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-4 space-y-4">
            {/* Row 1: Code and Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Coupon Code <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:border-primary font-mono",
                    errors.code ? 'border-destructive' : 'border-border'
                  )}
                  placeholder="SUMMER20"
                />
                {errors.code && (
                  <p className="text-destructive text-xs mt-1">{errors.code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Coupon Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:border-primary",
                    errors.name ? 'border-destructive' : 'border-border'
                  )}
                  placeholder="Summer Sale"
                />
                {errors.name && (
                  <p className="text-destructive text-xs mt-1">{errors.name}</p>
                )}
              </div>
            </div>

            {/* Row 2: Discount Type and Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Discount Type</label>
                <Select
                  value={formData.discountType || 'PERCENTAGE'}
                  onChange={(value) => setFormData({ ...formData, discountType: value as DiscountType })}
                  options={[
                    { value: 'PERCENTAGE', label: 'Percentage' },
                    { value: 'FIXED_AMOUNT', label: 'Fixed Amount' },
                    { value: 'FREE_SHIPPING', label: 'Free Shipping' },
                    { value: 'BUY_X_GET_Y', label: 'Buy X Get Y' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Discount Value <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(e) => handleFieldChange('discountValue', e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:border-primary",
                    errors.discountValue ? 'border-destructive' : 'border-border'
                  )}
                  placeholder={formData.discountType === 'PERCENTAGE' ? '20' : '25.00'}
                />
                {errors.discountValue && (
                  <p className="text-destructive text-xs mt-1">{errors.discountValue}</p>
                )}
              </div>
            </div>

            {/* Row 3: Description */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary resize-none"
                rows={2}
                placeholder="Describe this coupon..."
              />
            </div>

            {/* Row 4: Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Start Date</label>
                <input
                  type="datetime-local"
                  value={formData.startDate ? new Date(formData.startDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">End Date</label>
                <input
                  type="datetime-local"
                  value={formData.endDate ? new Date(formData.endDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Row 5: Limits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Total Usage Limit</label>
                <input
                  type="number"
                  value={formData.totalUsageLimit || ''}
                  onChange={(e) => setFormData({ ...formData, totalUsageLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                  placeholder="Unlimited"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Per Customer Limit</label>
                <input
                  type="number"
                  value={formData.perCustomerLimit || ''}
                  onChange={(e) => setFormData({ ...formData, perCustomerLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                  placeholder="Unlimited"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Min. Purchase</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.restrictions?.minPurchaseAmount || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    restrictions: { ...formData.restrictions, minPurchaseAmount: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                  placeholder="$0.00"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                onClick={() => router.push('/coupons')}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !formData.code || !formData.name || !formData.discountValue}
                className="bg-primary text-primary-foreground"
              >
                {saving ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {mode === 'create' ? 'Create Coupon' : 'Save Changes'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
