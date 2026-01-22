'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Palette,
  Image as ImageIcon,
  Save,
  Loader2,
  ArrowLeft,
  Type,
  Globe,
  ExternalLink,
  Upload,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';
import { storefrontService } from '@/lib/services/storefrontService';
import { Storefront } from '@/lib/api/types';
import { getStorefrontUrl } from '@/lib/utils/tenant';

interface BrandingSettings {
  logoUrl?: string;
  faviconUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  brandName?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export default function StorefrontBrandingPage() {
  const params = useParams();
  const router = useRouter();
  const storefrontId = params?.id as string;
  const { showSuccess, showError } = useDialog();
  const { currentTenant } = useTenant();

  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [branding, setBranding] = useState<BrandingSettings>({});
  const [savedBranding, setSavedBranding] = useState<BrandingSettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (storefrontId) {
      loadStorefront();
    }
  }, [storefrontId]);

  const loadStorefront = async () => {
    setIsLoading(true);
    try {
      const response = await storefrontService.getStorefront(storefrontId);
      if (response.data) {
        setStorefront(response.data);
        const brandingData: BrandingSettings = {
          logoUrl: response.data.logoUrl,
          faviconUrl: response.data.faviconUrl,
          metaTitle: response.data.metaTitle,
          metaDescription: response.data.metaDescription,
          brandName: response.data.name,
        };
        setBranding(brandingData);
        setSavedBranding(brandingData);
      }
    } catch (error) {
      console.error('Error loading storefront:', error);
      showError('Error', 'Failed to load storefront');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!storefront) return;

    setIsSaving(true);
    try {
      await storefrontService.updateStorefront(storefrontId, {
        name: branding.brandName || storefront.name,
        logoUrl: branding.logoUrl,
        faviconUrl: branding.faviconUrl,
        metaTitle: branding.metaTitle,
        metaDescription: branding.metaDescription,
      });
      setSavedBranding(branding);
      showSuccess('Success', 'Branding settings saved! Changes will reflect on your storefront.');
    } catch (error) {
      showError('Error', 'Failed to save branding settings');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(branding) !== JSON.stringify(savedBranding);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-pink-50/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading branding settings...</p>
        </div>
      </div>
    );
  }

  if (!storefront) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-pink-50/20 p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Failed to load storefront</p>
          <Button onClick={() => router.push('/storefronts')}>Back to Storefronts</Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.STOREFRONTS_MANAGE}
      fallback="styled"
      fallbackTitle="Storefront Branding Access Required"
      fallbackDescription="You don't have the required permissions to view storefront branding. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-pink-50/20">
      <div className="p-8 space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title={`Branding: ${storefront.name}`}
          description="Manage your storefront's brand identity and assets"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Storefronts', href: '/storefronts' },
            { label: storefront.name, href: `/storefronts/${storefrontId}/edit` },
            { label: 'Branding' },
          ]}
          badge={{
            label: hasChanges ? 'Unsaved Changes' : 'Saved',
            variant: hasChanges ? 'warning' : 'success',
          }}
          actions={
            <div className="flex gap-2">
              <a
                href={getStorefrontUrl(storefront)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted"
              >
                <ExternalLink className="h-4 w-4" />
                View Live
              </a>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          }
        />

        {/* Quick Links */}
        <div className="flex gap-2 flex-wrap">
          <Link href={`/storefronts/${storefrontId}/theme`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Palette className="h-4 w-4" />
              Theme
            </Button>
          </Link>
          <Link href={`/storefronts/${storefrontId}/pages`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Globe className="h-4 w-4" />
              Pages
            </Button>
          </Link>
          <Link href={`/storefronts/${storefrontId}/navigation`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Type className="h-4 w-4" />
              Navigation
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Brand Identity */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Type className="h-5 w-5 text-primary" />
              Brand Identity
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Brand Name</label>
                <input
                  type="text"
                  value={branding.brandName || ''}
                  onChange={(e) => setBranding({ ...branding, brandName: e.target.value })}
                  placeholder="Your Brand Name"
                  className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Tagline</label>
                <input
                  type="text"
                  value={branding.tagline || ''}
                  onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                  placeholder="Your catchy tagline"
                  className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Visual Assets */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Visual Assets
            </h3>

            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Logo</label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/30 transition-colors">
                  {branding.logoUrl ? (
                    <div className="relative inline-block">
                      <img src={branding.logoUrl} alt="Logo" className="h-16 mx-auto" />
                      <button
                        onClick={() => setBranding({ ...branding, logoUrl: undefined })}
                        className="absolute -top-2 -right-2 p-1 bg-destructive/10 rounded-full text-destructive hover:bg-destructive/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                      <p className="text-xs text-muted-foreground mt-1">Recommended: 200x60px, PNG or SVG</p>
                    </div>
                  )}
                  <input
                    type="text"
                    value={branding.logoUrl || ''}
                    onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                    placeholder="Or enter logo URL"
                    className="mt-3 w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary text-sm"
                  />
                </div>
              </div>

              {/* Favicon Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Favicon</label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/30 transition-colors">
                  {branding.faviconUrl ? (
                    <div className="relative inline-block">
                      <img src={branding.faviconUrl} alt="Favicon" className="h-8 mx-auto" />
                      <button
                        onClick={() => setBranding({ ...branding, faviconUrl: undefined })}
                        className="absolute -top-2 -right-2 p-1 bg-destructive/10 rounded-full text-destructive hover:bg-destructive/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-2">
                      <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">32x32px, ICO or PNG</p>
                    </div>
                  )}
                  <input
                    type="text"
                    value={branding.faviconUrl || ''}
                    onChange={(e) => setBranding({ ...branding, faviconUrl: e.target.value })}
                    placeholder="Or enter favicon URL"
                    className="mt-3 w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEO & Social */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              SEO & Social Sharing
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Meta Title</label>
                <input
                  type="text"
                  value={branding.metaTitle || ''}
                  onChange={(e) => setBranding({ ...branding, metaTitle: e.target.value })}
                  placeholder="Page title for search engines"
                  className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">Recommended: 50-60 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">OG Image URL</label>
                <input
                  type="text"
                  value={branding.ogImageUrl || ''}
                  onChange={(e) => setBranding({ ...branding, ogImageUrl: e.target.value })}
                  placeholder="Image for social sharing"
                  className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">Recommended: 1200x630px</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Meta Description</label>
                <textarea
                  value={branding.metaDescription || ''}
                  onChange={(e) => setBranding({ ...branding, metaDescription: e.target.value })}
                  placeholder="Brief description for search engines and social sharing"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">Recommended: 150-160 characters</p>
              </div>
            </div>
          </div>

          {/* Brand Colors */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Brand Colors
            </h3>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.primaryColor || '#6366f1'}
                    onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                    className="h-10 w-14 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={branding.primaryColor || '#6366f1'}
                    onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Secondary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.secondaryColor || '#ec4899'}
                    onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                    className="h-10 w-14 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={branding.secondaryColor || '#ec4899'}
                    onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PermissionGate>
  );
}
