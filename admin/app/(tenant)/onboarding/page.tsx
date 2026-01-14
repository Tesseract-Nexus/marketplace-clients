"use client";

import React, { useState, useEffect } from 'react';
import {
  Building2,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  Store,
  Globe,
  Palette,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { useTenant } from '@/contexts/TenantContext';

interface FormData {
  businessName: string;
  slug: string;
  industry: string;
  primaryColor: string;
  secondaryColor: string;
}

const industries = [
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'fashion', label: 'Fashion & Apparel' },
  { value: 'electronics', label: 'Electronics & Tech' },
  { value: 'health', label: 'Health & Beauty' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'sports', label: 'Sports & Outdoors' },
  { value: 'services', label: 'Services' },
  { value: 'other', label: 'Other' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshTenants } = useTenant();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    slug: '',
    industry: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
  });

  // Generate slug from business name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  };

  // Check slug availability with debounce
  useEffect(() => {
    if (!formData.slug || formData.slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingSlug(true);
      try {
        const response = await fetch(`/api/tenants/check-slug?slug=${formData.slug}`);
        const data = await response.json();
        setSlugAvailable(data.available);
      } catch (err) {
        console.error('Error checking slug:', err);
        setSlugAvailable(null);
      } finally {
        setCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.slug]);

  const handleBusinessNameChange = (name: string) => {
    setFormData({
      ...formData,
      businessName: name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Get access token from localStorage for authentication
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch('/api/tenants/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: formData.businessName,
          slug: formData.slug,
          industry: formData.industry,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create business');
      }

      const data = await response.json();

      // Refresh tenants list
      await refreshTenants();

      // Navigate to the new store's subdomain
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      if (hostname.endsWith('tesserix.app')) {
        window.location.href = `${protocol}//${data.tenant.slug}-admin.tesserix.app/`;
      } else {
        // Local development
        const port = window.location.port;
        const portPart = port ? `:${port}` : '';
        window.location.href = `${protocol}//${data.tenant.slug}.localhost${portPart}/`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business');
      setIsSubmitting(false);
    }
  };

  const canProceedStep1 = formData.businessName.length >= 2 && formData.slug.length >= 3 && slugAvailable === true;
  const canProceedStep2 = formData.industry !== '';
  const canSubmit = canProceedStep1 && canProceedStep2;

  return (
    <PermissionGate
      permission={Permission.STOREFRONTS_MANAGE}
      fallback="styled"
      fallbackTitle="Onboarding Access Required"
      fallbackDescription="You don't have the required permissions to view onboarding. Please contact your administrator to request access."
    >
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Create New Business"
        description="Set up your new store in just a few steps"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Create New Business' },
        ]}
      />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all shadow-md',
                  step >= s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border-2 border-border text-muted-foreground'
                )}
              >
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    'w-16 h-1 rounded-full transition-all',
                    step > s ? 'bg-gradient-to-r from-blue-600 to-violet-600' : 'bg-gray-200'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Step 1: Business Information */}
        {step === 1 && (
          <Card className="rounded-2xl border bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Store className="w-5 h-5 text-primary" />
                Business Information
              </CardTitle>
              <CardDescription>
                Enter the basic details for your new business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleBusinessNameChange(e.target.value)}
                  placeholder="e.g., Acme Electronics"
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Store URL (Subdomain) *
                </label>
                <div className="relative">
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                      placeholder="acme-electronics"
                      className={cn(
                        "flex-1 px-4 py-3 border-2 rounded-l-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-white",
                        slugAvailable === true && "border-green-300 bg-green-50",
                        slugAvailable === false && "border-red-300 bg-red-50",
                        slugAvailable === null && "border-border"
                      )}
                    />
                    <span className="px-4 py-3 bg-muted border-2 border-l-0 border-border rounded-r-xl text-muted-foreground text-sm whitespace-nowrap">
                      .tesserix.app
                    </span>
                  </div>
                  {checkingSlug && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                {slugAvailable === true && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    This URL is available
                  </p>
                )}
                {slugAvailable === false && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    This URL is already taken
                  </p>
                )}
                {formData.slug.length > 0 && formData.slug.length < 3 && (
                  <p className="mt-2 text-sm text-amber-600">
                    Slug must be at least 3 characters
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Industry Selection */}
        {step === 2 && (
          <Card className="rounded-2xl border bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Globe className="w-5 h-5 text-violet-600" />
                Industry
              </CardTitle>
              <CardDescription>
                Select the industry that best describes your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {industries.map((industry) => (
                  <button
                    key={industry.value}
                    onClick={() => setFormData({ ...formData, industry: industry.value })}
                    className={cn(
                      'p-4 border-2 rounded-xl text-left transition-all hover:border-violet-300 bg-white',
                      formData.industry === industry.value
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-border'
                    )}
                  >
                    <span className="font-medium text-foreground">{industry.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-between gap-3 pt-4">
                <Button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-muted text-foreground rounded-xl hover:bg-muted transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Branding & Confirmation */}
        {step === 3 && (
          <Card className="rounded-2xl border bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Palette className="w-5 h-5 text-purple-600" />
                Branding & Confirmation
              </CardTitle>
              <CardDescription>
                Choose your brand colors and confirm your store details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="flex-1 px-4 py-2 border-2 border-border rounded-lg font-mono text-sm bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border"
                    />
                    <input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="flex-1 px-4 py-2 border-2 border-border rounded-lg font-mono text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Card */}
              <div className="p-6 bg-muted rounded-xl border-2 border-border">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Preview</h4>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})` }}
                  >
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{formData.businessName || 'Your Business'}</h3>
                    <div className="space-y-1 mt-1">
                      <p className="text-sm text-muted-foreground">
                        <span className="text-muted-foreground">Storefront:</span> {formData.slug || 'your-slug'}.tesserix.app
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="text-muted-foreground">Admin:</span> {formData.slug || 'your-slug'}-admin.tesserix.app
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize mt-1">
                      {industries.find(i => i.value === formData.industry)?.label || 'Industry'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/30">
                <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-primary space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    A new business will be created for you
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    You'll be set as the owner
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    You'll be redirected to your new store's dashboard
                  </li>
                </ul>
              </div>

              <div className="flex justify-between gap-3 pt-4">
                <Button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-muted text-foreground rounded-xl hover:bg-muted transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Business...
                    </>
                  ) : (
                    <>
                      <Building2 className="w-5 h-5" />
                      Create Business
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </PermissionGate>
  );
}
