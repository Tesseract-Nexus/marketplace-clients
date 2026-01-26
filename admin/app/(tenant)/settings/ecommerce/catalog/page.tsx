'use client';

import React, { useState, useEffect } from 'react';
import { Package, Save, Grid, Search, Loader2 } from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { StoreSelector } from '@/components/settings/StoreSelector';
import { settingsService } from '@/lib/services/settingsService';
import { storefrontService } from '@/lib/services/storefrontService';
import type { Storefront } from '@/lib/api/types';
import type { CatalogSettings } from '@/lib/types/settings';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';

const defaultCatalogData: CatalogSettings = {
  categories: {
    maxDepth: 5,
    enableImages: true,
    enableDescriptions: true,
    displayType: 'grid',
    sortOptions: ['name', 'popularity', 'product_count'],
  },
  products: {
    skuFormat: 'TGP-{YYYY}-{####}',
    enableVariants: true,
    enableBundles: true,
    enableDigitalProducts: true,
    enableSubscriptions: true,
    enableCustomizations: true,
    maxImages: 15,
    maxVideos: 5,
    enableReviews: true,
    enableRatings: true,
    enableWishlist: true,
    enableComparisons: true,
    sortOptions: ['price_low_high', 'price_high_low', 'newest', 'best_selling', 'highest_rated'],
  },
  search: {
    enableAutoComplete: true,
    enableSearchSuggestions: true,
    enableFacetedSearch: true,
    enableSearchAnalytics: true,
    searchResultsPerPage: 24,
    enableSpellCheck: true,
    enableSynonyms: true,
  },
};

export default function CatalogSettingsPage() {
  const { showSuccess, showError } = useDialog();
  const { currentTenant } = useTenant();

  // Storefront state
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);

  // Settings state
  const [catalogData, setCatalogData] = useState<CatalogSettings>(defaultCatalogData);
  const [savedData, setSavedData] = useState<CatalogSettings>(defaultCatalogData);
  const [existingEcommerce, setExistingEcommerce] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  // Load storefronts on mount
  useEffect(() => {
    loadStorefronts();
  }, []);

  // Load settings when storefront changes
  useEffect(() => {
    if (selectedStorefront && currentTenant?.id) {
      loadSettings();
    }
  }, [selectedStorefront?.id, currentTenant?.id]);

  const loadStorefronts = async () => {
    try {
      setLoadingStorefronts(true);
      const result = await storefrontService.getStorefronts();
      const sfList = result.data || [];
      setStorefronts(sfList);

      // Auto-select first storefront
      if (sfList.length > 0) {
        setSelectedStorefront(sfList[0]);
      }
    } catch (error) {
      console.error('Failed to load storefronts:', error);
    } finally {
      setLoadingStorefronts(false);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await settingsService.getSettingsByContext({
        applicationId: 'admin-portal',
        scope: 'application',
        tenantId: currentTenant?.id,
      });

      // Store the full ecommerce object to preserve other sections when saving
      if (settings?.ecommerce) {
        setExistingEcommerce(settings.ecommerce);
      } else {
        setExistingEcommerce({});
      }

      if (settings?.ecommerce?.catalog) {
        setCatalogData(settings.ecommerce.catalog);
        setSavedData(settings.ecommerce.catalog);
        setSettingsId(settings.id);
      } else {
        setCatalogData(defaultCatalogData);
        setSavedData(defaultCatalogData);
        setSettingsId(settings?.id || null);
      }
    } catch (error) {
      console.error('Failed to load catalog settings:', error);
      setCatalogData(defaultCatalogData);
      setSavedData(defaultCatalogData);
      setExistingEcommerce({});
      setSettingsId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedStorefront) {
      showError('Error', 'Please select a storefront');
      return;
    }

    try {
      setSaving(true);
      // Merge current section with existing ecommerce data to preserve other sections
      const mergedEcommerce = {
        ...existingEcommerce,
        catalog: catalogData,
      };

      const payload = {
        context: {
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: currentTenant?.id,
        },
        ecommerce: mergedEcommerce,
      };

      if (settingsId) {
        await settingsService.updateSettings(settingsId, payload as any, currentTenant?.id);
      } else {
        const newSettings = await settingsService.createSettings(payload as any, currentTenant?.id);
        setSettingsId(newSettings.id);
      }

      // Update existing ecommerce with the merged data
      setExistingEcommerce(mergedEcommerce);
      setSavedData(catalogData);
      showSuccess('Success', 'Catalog settings saved successfully!');
    } catch (error) {
      console.error('Failed to save catalog settings:', error);
      showError('Error', 'Failed to save catalog settings');
    } finally {
      setSaving(false);
    }
  };

  const handleStorefrontSelect = (storefront: Storefront) => {
    setSelectedStorefront(storefront);
  };

  const handleStorefrontCreated = (storefront: Storefront) => {
    setStorefronts((prev) => [...prev, storefront]);
    setSelectedStorefront(storefront);
  };

  const hasChanges = JSON.stringify(catalogData) !== JSON.stringify(savedData);

  const updateField = (path: string[], value: any) => {
    setCatalogData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  // Show loading state while storefronts are loading
  if (loadingStorefronts && !storefronts.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading storefronts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Catalog Management"
          description="Configure product catalog, categories, and search settings"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Ecommerce' },
            { label: 'Catalog', href: '/products' },
          ]}
          actions={
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving || loading}
              className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          }
        />

        <StoreSelector
          storefronts={storefronts}
          selectedStorefront={selectedStorefront}
          onSelect={handleStorefrontSelect}
          onStorefrontCreated={handleStorefrontCreated}
          loading={loadingStorefronts}
          showQuickActions={false}
          showUrlInfo={false}
        />

        {selectedStorefront ? (
          loading ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          ) : (
          <div className="space-y-6">
            {/* Category Settings */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Grid className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Category Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure category hierarchy and display</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Maximum Category Depth
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={catalogData.categories.maxDepth}
                      onChange={(e) => updateField(['categories', 'maxDepth'], parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">How many levels of subcategories allowed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Display Type
                    </label>
                    <Select
                      value={catalogData.categories.displayType}
                      onChange={(value) => updateField(['categories', 'displayType'], value)}
                      options={[
                        { value: 'grid', label: 'Grid View' },
                        { value: 'list', label: 'List View' },
                      ]}
                    />
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3">Category Features</h4>
                  <div className="space-y-3">
                    <Checkbox
                      checked={catalogData.categories.enableImages}
                      onChange={(e) => updateField(['categories', 'enableImages'], e.target.checked)}
                      label="Enable Category Images"
                      description="Allow images for category pages"
                    />
                    <Checkbox
                      checked={catalogData.categories.enableDescriptions}
                      onChange={(e) => updateField(['categories', 'enableDescriptions'], e.target.checked)}
                      label="Enable Category Descriptions"
                      description="Allow detailed descriptions for categories"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Settings */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Product Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure product types and features</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    SKU Format
                  </label>
                  <Input
                    value={catalogData.products.skuFormat}
                    onChange={(e) => updateField(['products', 'skuFormat'], e.target.value)}
                    placeholder="TGP-{YYYY}-{####}"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {'{YYYY}'} for year, {'{MM}'} for month, {'{####}'} for sequential number
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Maximum Product Images
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={catalogData.products.maxImages}
                      onChange={(e) => updateField(['products', 'maxImages'], parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Maximum Product Videos
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      value={catalogData.products.maxVideos}
                      onChange={(e) => updateField(['products', 'maxVideos'], parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3">Product Types</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Checkbox
                      checked={catalogData.products.enableVariants}
                      onChange={(e) => updateField(['products', 'enableVariants'], e.target.checked)}
                      label="Product Variants"
                      description="Size, color, material options"
                    />
                    <Checkbox
                      checked={catalogData.products.enableBundles}
                      onChange={(e) => updateField(['products', 'enableBundles'], e.target.checked)}
                      label="Product Bundles"
                      description="Group products together"
                    />
                    <Checkbox
                      checked={catalogData.products.enableDigitalProducts}
                      onChange={(e) => updateField(['products', 'enableDigitalProducts'], e.target.checked)}
                      label="Digital Products"
                      description="Downloadable items"
                    />
                    <Checkbox
                      checked={catalogData.products.enableSubscriptions}
                      onChange={(e) => updateField(['products', 'enableSubscriptions'], e.target.checked)}
                      label="Subscriptions"
                      description="Recurring purchases"
                    />
                    <Checkbox
                      checked={catalogData.products.enableCustomizations}
                      onChange={(e) => updateField(['products', 'enableCustomizations'], e.target.checked)}
                      label="Customizations"
                      description="Personalized products"
                    />
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3">Customer Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Checkbox
                      checked={catalogData.products.enableReviews}
                      onChange={(e) => updateField(['products', 'enableReviews'], e.target.checked)}
                      label="Product Reviews"
                      description="Customer written reviews"
                    />
                    <Checkbox
                      checked={catalogData.products.enableRatings}
                      onChange={(e) => updateField(['products', 'enableRatings'], e.target.checked)}
                      label="Product Ratings"
                      description="Star ratings (1-5)"
                    />
                    <Checkbox
                      checked={catalogData.products.enableWishlist}
                      onChange={(e) => updateField(['products', 'enableWishlist'], e.target.checked)}
                      label="Wishlist"
                      description="Save for later"
                    />
                    <Checkbox
                      checked={catalogData.products.enableComparisons}
                      onChange={(e) => updateField(['products', 'enableComparisons'], e.target.checked)}
                      label="Product Comparisons"
                      description="Compare multiple products"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Search Settings */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Search Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure product search and discovery</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Search Results Per Page
                  </label>
                  <Input
                    type="number"
                    min="12"
                    max="100"
                    step="12"
                    value={catalogData.search.searchResultsPerPage}
                    onChange={(e) => updateField(['search', 'searchResultsPerPage'], parseInt(e.target.value))}
                  />
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3">Search Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Checkbox
                      checked={catalogData.search.enableAutoComplete}
                      onChange={(e) => updateField(['search', 'enableAutoComplete'], e.target.checked)}
                      label="Auto-Complete"
                      description="Suggest completions as you type"
                    />
                    <Checkbox
                      checked={catalogData.search.enableSearchSuggestions}
                      onChange={(e) => updateField(['search', 'enableSearchSuggestions'], e.target.checked)}
                      label="Search Suggestions"
                      description="Popular and trending searches"
                    />
                    <Checkbox
                      checked={catalogData.search.enableFacetedSearch}
                      onChange={(e) => updateField(['search', 'enableFacetedSearch'], e.target.checked)}
                      label="Faceted Search"
                      description="Filter by attributes"
                    />
                    <Checkbox
                      checked={catalogData.search.enableSearchAnalytics}
                      onChange={(e) => updateField(['search', 'enableSearchAnalytics'], e.target.checked)}
                      label="Search Analytics"
                      description="Track search queries"
                    />
                    <Checkbox
                      checked={catalogData.search.enableSpellCheck}
                      onChange={(e) => updateField(['search', 'enableSpellCheck'], e.target.checked)}
                      label="Spell Check"
                      description="Correct typos automatically"
                    />
                    <Checkbox
                      checked={catalogData.search.enableSynonyms}
                      onChange={(e) => updateField(['search', 'enableSynonyms'], e.target.checked)}
                      label="Synonyms"
                      description="Search using similar terms"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          )
        ) : (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Create Your First Storefront
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by creating a storefront to configure catalog settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
