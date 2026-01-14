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
} from 'lucide-react';

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
      // Use current time as default validFrom if startDate is not provided
      const validFrom = formData.startDate || new Date().toISOString();

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
        validTo: formData.endDate,
        startDate: formData.startDate,
        endDate: formData.endDate,
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
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/', icon: '🏠' },
            { label: 'Coupons', href: '/coupons', icon: '🎟️' },
            { label: mode === 'create' ? 'Create' : 'Edit', icon: '✏️' },
          ]}
        />

        <div className="flex items-center justify-between">
          <Button
            onClick={() => router.push('/coupons')}
            variant="outline"
            className="px-4 py-2 text-sm font-semibold rounded-xl border-2 border-border text-foreground hover:bg-muted hover:border-gray-400 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Coupons
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Live Coupon Preview */}
        <Card className="rounded-2xl border-2 border-dashed border-primary/50 bg-gradient-to-br from-blue-50 to-violet-50 shadow-lg overflow-hidden">
          <CardContent className="p-6">
            <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wide">Live Preview</p>
            <div className="bg-card rounded-xl p-5 shadow-md border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold font-mono text-lg text-foreground">
                      {formData.code || 'COUPON-CODE'}
                    </p>
                    <p className="text-sm text-muted-foreground">{formData.name || 'Coupon Name'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formData.discountType === 'PERCENTAGE' && formData.discountValue
                      ? `${formData.discountValue}%`
                      : formData.discountType === 'FIXED_AMOUNT' && formData.discountValue
                      ? `$${formData.discountValue}`
                      : formData.discountType === 'FREE_SHIPPING'
                      ? 'FREE'
                      : '0%'}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase">
                    {formData.discountType === 'FREE_SHIPPING' ? 'Shipping' : 'Discount'}
                  </p>
                </div>
              </div>
              {formData.description && (
                <p className="text-sm text-muted-foreground border-t border-border pt-3">
                  {formData.description}
                </p>
              )}
              {(formData.startDate || formData.endDate) && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {formData.startDate && `From ${new Date(formData.startDate).toLocaleDateString()}`}
                    {formData.startDate && formData.endDate && ' - '}
                    {formData.endDate && `Until ${new Date(formData.endDate).toLocaleDateString()}`}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/50/50 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="border-b border-blue-100 p-6">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              {mode === 'create' ? 'Create New Coupon' : 'Edit Coupon'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-foreground mb-3">
                  Coupon Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
                  className={cn(
                    "w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 font-mono font-bold",
                    errors.code ? 'border-red-500 focus:ring-red-500' : 'border-border focus:ring-ring'
                  )}
                  placeholder="SUMMER20"
                />
                {errors.code && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.code}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-3">
                  Coupon Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2",
                    errors.name ? 'border-red-500 focus:ring-red-500' : 'border-border focus:ring-ring'
                  )}
                  placeholder="Summer Sale"
                />
                {errors.name && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-3">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={3}
                placeholder="Describe this coupon..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-foreground mb-3">Discount Type</label>
                <Select
                  value={formData.discountType || 'PERCENTAGE'}
                  onChange={(value) => setFormData({ ...formData, discountType: value as DiscountType })}
                  options={[
                    { value: 'PERCENTAGE', label: 'Percentage', icon: '%' },
                    { value: 'FIXED_AMOUNT', label: 'Fixed Amount', icon: '$' },
                    { value: 'FREE_SHIPPING', label: 'Free Shipping', icon: '🚚' },
                    { value: 'BUY_X_GET_Y', label: 'Buy X Get Y', icon: '🎁' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-3">
                  Discount Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(e) => handleFieldChange('discountValue', e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2",
                    errors.discountValue ? 'border-red-500 focus:ring-red-500' : 'border-border focus:ring-ring'
                  )}
                  placeholder={formData.discountType === 'PERCENTAGE' ? '20' : '25.00'}
                />
                {errors.discountValue && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.discountValue}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-foreground mb-3">Start Date</label>
                <input
                  type="datetime-local"
                  value={formData.startDate ? new Date(formData.startDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-3">End Date</label>
                <input
                  type="datetime-local"
                  value={formData.endDate ? new Date(formData.endDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-foreground mb-3">Total Usage Limit</label>
                <input
                  type="number"
                  value={formData.totalUsageLimit || ''}
                  onChange={(e) => setFormData({ ...formData, totalUsageLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Unlimited"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-3">Per Customer Limit</label>
                <input
                  type="number"
                  value={formData.perCustomerLimit || ''}
                  onChange={(e) => setFormData({ ...formData, perCustomerLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-3">Minimum Purchase Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.restrictions?.minPurchaseAmount || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  restrictions: { ...formData.restrictions, minPurchaseAmount: e.target.value }
                })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="0.00"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving || !formData.code || !formData.name || !formData.discountValue}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : mode === 'create' ? 'Create Coupon' : 'Save Changes'}
              </Button>
              <Button
                onClick={() => router.push('/coupons')}
                variant="outline"
                className="px-6 py-3 rounded-xl border-2 border-border text-foreground hover:bg-muted transition-all"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
