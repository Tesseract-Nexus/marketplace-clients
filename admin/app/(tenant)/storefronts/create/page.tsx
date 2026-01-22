"use client";

import React, { useState, useEffect } from 'react';
import {
  Save,
  X,
  Store,
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { storefrontService } from '@/lib/services/storefrontService';
import { CreateStorefrontRequest } from '@/lib/api/types';
import { useTenant } from '@/contexts/TenantContext';

export default function CreateStorefrontPage() {
  const router = useRouter();
  const { currentTenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const [formData, setFormData] = useState<CreateStorefrontRequest>({
    vendorId: '', // Will be set from tenant context on backend
    slug: '',
    name: '',
    description: '',
    customDomain: '',
    logoUrl: '',
    faviconUrl: '',
    metaTitle: '',
    metaDescription: '',
  });

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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
        const isAvailable = await storefrontService.checkSlugAvailability(formData.slug);
        setSlugAvailable(isAvailable);
      } catch {
        setSlugAvailable(null);
      } finally {
        setCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.slug]);

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentTenant?.id) {
      setError('No tenant selected. Please select a tenant first.');
      return;
    }

    if (!formData.name) {
      setError('Please enter a storefront name');
      return;
    }

    if (!formData.slug || formData.slug.length < 3) {
      setError('Please enter a valid slug (at least 3 characters)');
      return;
    }

    if (slugAvailable === false) {
      setError('This slug is already taken. Please choose a different one.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Clean up empty optional fields - vendorId is set from tenant context on backend
      const cleanedData: CreateStorefrontRequest = {
        vendorId: currentTenant.id, // This is ignored by backend, included for API compatibility
        slug: formData.slug.toLowerCase(),
        name: formData.name,
      };

      if (formData.description) cleanedData.description = formData.description;
      if (formData.customDomain) cleanedData.customDomain = formData.customDomain;
      if (formData.logoUrl) cleanedData.logoUrl = formData.logoUrl;
      if (formData.faviconUrl) cleanedData.faviconUrl = formData.faviconUrl;
      if (formData.metaTitle) cleanedData.metaTitle = formData.metaTitle;
      if (formData.metaDescription) cleanedData.metaDescription = formData.metaDescription;

      await storefrontService.createStorefront(cleanedData);
      router.push('/storefronts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create storefront');
    } finally {
      setLoading(false);
    }
  };

  const getStorefrontUrl = (slug: string) => {
    // Subdomain-based URL: https://{slug}.tesserix.app
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app';
    return `https://${slug}.${baseDomain}`;
  };

  return (
    <PermissionGate
      permission={Permission.STOREFRONTS_MANAGE}
      fallback="styled"
      fallbackTitle="Storefront Creation Access Required"
      fallbackDescription="You don't have the required permissions to view storefront creation. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Create Storefront"
          description="Set up a new storefront for a vendor"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Storefronts', href: '/storefronts' },
            { label: 'Create' },
          ]}
          actions={
            <>
              <Button
                onClick={() => router.push('/storefronts')}
                className="px-6 py-3 bg-card border-2 border-border text-foreground rounded-xl hover:bg-muted transition-all duration-200 flex items-center gap-2 font-semibold"
              >
                <X className="w-5 h-5" />
                Cancel
              </Button>
            </>
          }
        />

        {error && (
          <div className="p-4 bg-destructive/10 border-2 border-destructive/30 rounded-xl text-destructive flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tenant
                  </label>
                  <div className="px-4 py-3 bg-muted border-2 border-border rounded-xl text-foreground">
                    {currentTenant?.name || 'Loading tenant...'}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    This storefront will be created for your current tenant
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Storefront Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="My Awesome Store"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Slug <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all ${
                        slugAvailable === true ? 'border-success/40' :
                        slugAvailable === false ? 'border-destructive/30' : 'border-border'
                      }`}
                      placeholder="my-awesome-store"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {checkingSlug && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                      {!checkingSlug && slugAvailable === true && (
                        <CheckCircle className="w-5 h-5 text-success" />
                      )}
                      {!checkingSlug && slugAvailable === false && (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                  </div>
                  {formData.slug && (
                    <p className="text-sm text-muted-foreground mt-1">
                      URL: <span className="font-mono">{getStorefrontUrl(formData.slug)}</span>
                    </p>
                  )}
                  {slugAvailable === false && (
                    <p className="text-sm text-destructive mt-1">This slug is already taken</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="Brief description of the storefront..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* URLs & Domain */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  URLs & Domain
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Custom Domain (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.customDomain}
                    onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="store.example.com"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Point your domain's DNS to our servers to use a custom domain
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Favicon URL
                  </label>
                  <input
                    type="url"
                    value={formData.faviconUrl}
                    onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  SEO Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      placeholder="My Store - Quality Products"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Meta Description
                    </label>
                    <input
                      type="text"
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      placeholder="Shop the best products at competitive prices"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              onClick={() => router.push('/storefronts')}
              className="px-6 py-3 bg-card border-2 border-border text-foreground rounded-xl hover:bg-muted transition-all duration-200 flex items-center gap-2 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || slugAvailable === false}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Storefront
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
    </PermissionGate>
  );
}
