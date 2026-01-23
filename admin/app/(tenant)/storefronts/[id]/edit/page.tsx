"use client";

import React, { useState, useEffect, use } from 'react';
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
import { UpdateStorefrontRequest, Storefront } from '@/lib/api/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditStorefrontPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStorefront, setLoadingStorefront] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [originalSlug, setOriginalSlug] = useState<string>('');

  const [formData, setFormData] = useState<UpdateStorefrontRequest>({
    slug: '',
    name: '',
    description: '',
    customDomain: '',
    isActive: true,
    logoUrl: '',
    faviconUrl: '',
    metaTitle: '',
    metaDescription: '',
  });

  // Load storefront on mount
  useEffect(() => {
    loadStorefront();
  }, [id]);

  const loadStorefront = async () => {
    try {
      setLoadingStorefront(true);
      const response = await storefrontService.getStorefront(id);
      const sf = response.data;
      setStorefront(sf);
      setOriginalSlug(sf.slug);
      setFormData({
        slug: sf.slug,
        name: sf.name,
        description: sf.description || '',
        customDomain: sf.customDomain || '',
        isActive: sf.isActive,
        logoUrl: sf.logoUrl || '',
        faviconUrl: sf.faviconUrl || '',
        metaTitle: sf.metaTitle || '',
        metaDescription: sf.metaDescription || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load storefront');
    } finally {
      setLoadingStorefront(false);
    }
  };

  // Check slug availability with debounce (only if changed)
  useEffect(() => {
    if (!formData.slug || formData.slug.length < 3 || formData.slug === originalSlug) {
      setSlugAvailable(formData.slug === originalSlug ? true : null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingSlug(true);
      try {
        const isAvailable = await storefrontService.checkSlugAvailability(formData.slug!);
        setSlugAvailable(isAvailable);
      } catch {
        setSlugAvailable(null);
      } finally {
        setCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.slug, originalSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      // Clean up empty optional fields
      const cleanedData: UpdateStorefrontRequest = {
        name: formData.name,
        isActive: formData.isActive,
      };

      if (formData.slug !== originalSlug) cleanedData.slug = formData.slug?.toLowerCase();
      if (formData.description !== undefined) cleanedData.description = formData.description;
      if (formData.customDomain !== undefined) cleanedData.customDomain = formData.customDomain;
      if (formData.logoUrl !== undefined) cleanedData.logoUrl = formData.logoUrl;
      if (formData.faviconUrl !== undefined) cleanedData.faviconUrl = formData.faviconUrl;
      if (formData.metaTitle !== undefined) cleanedData.metaTitle = formData.metaTitle;
      if (formData.metaDescription !== undefined) cleanedData.metaDescription = formData.metaDescription;

      await storefrontService.updateStorefront(id, cleanedData);
      router.push('/storefronts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update storefront');
    } finally {
      setLoading(false);
    }
  };

  const getStorefrontUrl = (slug: string) => {
    // Subdomain-based URL: https://{slug}.tesserix.app
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app';
    return `https://${slug}.${baseDomain}`;
  };

  if (loadingStorefront) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading storefront...</p>
        </div>
      </div>
    );
  }

  if (!storefront) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-error mx-auto mb-4" />
          <p className="text-muted-foreground">Storefront not found</p>
          <Button onClick={() => router.push('/storefronts')} className="mt-4">
            Back to Storefronts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.STOREFRONTS_MANAGE}
      fallback="styled"
      fallbackTitle="Storefront Settings Access Required"
      fallbackDescription="You don't have the required permissions to view storefront settings. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Edit Storefront"
          description={`Editing ${storefront.name}`}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Storefronts', href: '/storefronts' },
            { label: 'Edit' },
          ]}
          actions={
            <>
              <Button
                onClick={() => router.push('/storefronts')}
                className="px-6 py-3 bg-card border-2 border-border text-foreground rounded-md hover:bg-muted transition-all duration-200 flex items-center gap-2 font-semibold"
              >
                <X className="w-5 h-5" />
                Cancel
              </Button>
            </>
          }
        />

        {error && (
          <div className="p-4 bg-error-muted border-2 border-error/30 rounded-xl text-error flex items-center gap-2">
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
                    Storefront Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="My Awesome Store"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Slug <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all ${
                        slugAvailable === true ? 'border-success/40' :
                        slugAvailable === false ? 'border-error/30' : 'border-border'
                      }`}
                      placeholder="my-awesome-store"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {checkingSlug && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                      {!checkingSlug && slugAvailable === true && (
                        <CheckCircle className="w-5 h-5 text-success" />
                      )}
                      {!checkingSlug && slugAvailable === false && (
                        <AlertCircle className="w-5 h-5 text-error" />
                      )}
                    </div>
                  </div>
                  {formData.slug && (
                    <p className="text-sm text-muted-foreground mt-1">
                      URL: <span className="font-mono">{getStorefrontUrl(formData.slug)}</span>
                    </p>
                  )}
                  {slugAvailable === false && (
                    <p className="text-sm text-error mt-1">This slug is already taken</p>
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

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0"
                    />
                    <span className="text-sm font-medium text-foreground">Active</span>
                  </label>
                  <p className="text-sm text-muted-foreground mt-1 ml-6">
                    Inactive storefronts are not accessible to customers
                  </p>
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
              className="px-6 py-3 bg-card border-2 border-border text-foreground rounded-md hover:bg-muted transition-all duration-200 flex items-center gap-2 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || slugAvailable === false}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
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
