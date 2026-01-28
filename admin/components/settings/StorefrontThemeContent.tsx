'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Palette,
  Layout,
  Settings2,
  Image as ImageIcon,
  Save,
  Eye,
  RotateCcw,
  Loader2,
  ShoppingBag,
  CreditCard,
  Menu,
  FootprintsIcon,
  Sparkles,
  Store,
  AlertCircle,
  Globe,
  Moon,
  Sun,
  Monitor,
  ImagePlus,
  Bookmark,
  Info,
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Wand2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { cn } from '@/lib/utils';
import { useDialog } from '@/contexts/DialogContext';
import { useToast } from '@/contexts/ToastContext';
import { StoreSelector } from '@/components/settings/StoreSelector';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/Select';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import type { ContentPage, ContentPageType, ContentPageStatus } from '@/lib/types/settings';

// Import our new storefront builder components
import {
  ThemeSelector,
  ColorPairPicker,
  ColorPicker,
  SectionEditor,
  NavigationEditor,
  AssetUploader,
  LivePreview,
  NavigationBuilder,
  FooterBuilder,
} from '@/components/storefront-builder';

// Import API and types
import { storefrontApi, setCurrentStorefrontId, setCurrentTenantId, setCurrentUserInfo } from '@/lib/api/storefront';
import { useTenant } from '@/contexts/TenantContext';
import { useUser } from '@/contexts/UserContext';
import { storefrontService } from '@/lib/services/storefrontService';
import { getStorefrontDomain, buildStorefrontUrl } from '@/lib/utils/tenant';
import {
  StorefrontSettings,
  ThemeTemplate,
  StorefrontSection,
  StorefrontNavLink,
  DEFAULT_STOREFRONT_SETTINGS,
  THEME_PRESETS,
  Storefront,
  ColorMode,
} from '@/lib/api/types';

type TabId = 'theme' | 'homepage' | 'header' | 'footer' | 'products' | 'checkout' | 'pages';

const TABS: { id: TabId; label: string; icon: React.ElementType; description: string }[] = [
  {
    id: 'theme',
    label: 'Theme & Colors',
    icon: Palette,
    description: 'Choose template and customize colors',
  },
  {
    id: 'homepage',
    label: 'Homepage',
    icon: Layout,
    description: 'Configure homepage sections',
  },
  {
    id: 'header',
    label: 'Header',
    icon: Menu,
    description: 'Logo, navigation, and announcement',
  },
  {
    id: 'footer',
    label: 'Footer',
    icon: FootprintsIcon,
    description: 'Footer links and contact info',
  },
  {
    id: 'products',
    label: 'Products',
    icon: ShoppingBag,
    description: 'Product display settings',
  },
  {
    id: 'checkout',
    label: 'Checkout',
    icon: CreditCard,
    description: 'Checkout flow options',
  },
  {
    id: 'pages',
    label: 'Pages',
    icon: FileText,
    description: 'Manage content pages',
  },
];

interface StorefrontThemeContentProps {
  embedded?: boolean; // When embedded in Store Settings, hide PageHeader and StoreSelector
  selectedStorefrontId?: string; // When embedded, use parent's selected storefront
}

export function StorefrontThemeContent({ embedded = false, selectedStorefrontId }: StorefrontThemeContentProps) {
  const searchParams = useSearchParams();
  const { showConfirm } = useDialog();
  const toast = useToast();
  const { currentTenant } = useTenant();
  const { user } = useUser();
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);
  const [savedSettings, setSavedSettings] = useState<StorefrontSettings | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('theme');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Storefront selection state
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);

  // Content pages state
  const [contentPages, setContentPages] = useState<ContentPage[]>([]);
  const [savingPages, setSavingPages] = useState(false);
  const [showPageForm, setShowPageForm] = useState(false);
  const [pageSearchQuery, setPageSearchQuery] = useState('');
  const [pageTypeFilter, setPageTypeFilter] = useState('');
  const [pageStatusFilter, setPageStatusFilter] = useState('');
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [pageForm, setPageForm] = useState({
    type: 'STATIC' as ContentPageType,
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    showInMenu: false,
    showInFooter: false,
    isFeatured: false,
  });

  // Get vendor ID from tenant context
  const vendorId = currentTenant?.id || '';

  // Set tenant ID for API calls when tenant context changes
  useEffect(() => {
    if (currentTenant?.id) {
      setCurrentTenantId(currentTenant.id);
    }
  }, [currentTenant?.id]);

  // Set user info for API calls (required for backend IstioAuth middleware)
  useEffect(() => {
    if (user?.id) {
      setCurrentUserInfo(user.id, user.email || null);
    }
  }, [user?.id, user?.email]);

  // Load storefronts on mount
  useEffect(() => {
    loadStorefronts();
  }, []);

  // Handle storefront ID from URL params or embedded prop
  useEffect(() => {
    const storefrontIdToUse = embedded ? selectedStorefrontId : searchParams.get('storefrontId');
    if (storefrontIdToUse && storefronts.length > 0) {
      const storefront = storefronts.find(sf => sf.id === storefrontIdToUse);
      if (storefront && storefront.id !== selectedStorefront?.id) {
        handleStorefrontSelect(storefront);
      }
    }
  }, [searchParams, storefronts, selectedStorefrontId, embedded]);

  // Auto-select first storefront when embedded and parent hasn't selected one
  useEffect(() => {
    if (embedded && !selectedStorefrontId && storefronts.length > 0 && !selectedStorefront) {
      handleStorefrontSelect(storefronts[0]);
    }
  }, [embedded, selectedStorefrontId, storefronts, selectedStorefront]);

  const loadStorefronts = async () => {
    setLoadingStorefronts(true);
    try {
      const response = await storefrontService.getStorefronts();
      setStorefronts(response.data);
      // Auto-select first storefront if none selected
      if (response.data.length > 0 && !selectedStorefront) {
        handleStorefrontSelect(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading storefronts:', error);
    } finally {
      setLoadingStorefronts(false);
    }
  };

  const handleStorefrontSelect = (storefront: Storefront) => {
    setSelectedStorefront(storefront);
    setCurrentStorefrontId(storefront.id);
  };

  const handleStorefrontCreated = (storefront: Storefront) => {
    setStorefronts(prev => [...prev, storefront]);
    handleStorefrontSelect(storefront);
  };

  // Load settings when storefront changes
  useEffect(() => {
    if (selectedStorefront?.id) {
      loadSettings();
    }
  }, [selectedStorefront?.id]);

  const loadSettings = async () => {
    if (!selectedStorefront?.id) {
      setSettings(null);
      setSavedSettings(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await storefrontApi.settings.getSettings();
      if (response.success && response.data) {
        setSettings(response.data);
        setSavedSettings(response.data);
      }
    } catch (error) {
      toast.error('Error', 'Failed to load storefront settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    // Verify we have required context set
    if (!selectedStorefront?.id) {
      toast.error('Error', 'No storefront selected. Please select a storefront first.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await storefrontApi.settings.saveSettings(settings);
      if (response.success && response.data) {
        setSavedSettings(response.data);
        setSettings(response.data);
        toast.success('Settings Saved', 'Storefront settings saved successfully!');
      } else {
        const errorMessage = response.message || 'Failed to save settings';
        toast.error('Error', errorMessage);
        console.error('Save settings failed:', response);
      }
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error('Error', 'An error occurred while saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = await showConfirm({
      title: 'Reset Settings',
      message: 'Are you sure you want to reset all storefront settings to defaults? This cannot be undone.',
    });

    if (confirmed) {
      try {
        const response = await storefrontApi.settings.resetSettings();
        if (response.success && response.data) {
          setSettings(response.data);
          setSavedSettings(response.data);
          toast.success('Reset Complete', 'Settings reset to defaults');
        }
      } catch (error) {
        toast.error('Error', 'Failed to reset settings');
      }
    }
  };

  const handleDiscard = () => {
    if (savedSettings) {
      setSettings(savedSettings);
    }
  };

  const hasChanges = settings && savedSettings
    ? JSON.stringify(settings) !== JSON.stringify(savedSettings)
    : false;

  // Update helper functions
  const updateSettings = (updates: Partial<StorefrontSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
  };

  const updateHeaderConfig = (updates: Partial<StorefrontSettings['headerConfig']>) => {
    if (settings) {
      setSettings({
        ...settings,
        headerConfig: { ...settings.headerConfig, ...updates },
      });
    }
  };

  const updateHomepageConfig = (updates: Partial<StorefrontSettings['homepageConfig']>) => {
    if (settings) {
      setSettings({
        ...settings,
        homepageConfig: { ...settings.homepageConfig, ...updates },
      });
    }
  };

  const updateFooterConfig = (updates: Partial<StorefrontSettings['footerConfig']>) => {
    if (settings) {
      setSettings({
        ...settings,
        footerConfig: { ...settings.footerConfig, ...updates },
      });
    }
  };

  const updateProductConfig = (updates: Partial<StorefrontSettings['productConfig']>) => {
    if (settings) {
      setSettings({
        ...settings,
        productConfig: { ...settings.productConfig, ...updates },
      });
    }
  };

  const updateCheckoutConfig = (updates: Partial<StorefrontSettings['checkoutConfig']>) => {
    if (settings) {
      setSettings({
        ...settings,
        checkoutConfig: { ...settings.checkoutConfig, ...updates },
      });
    }
  };

  // Content Pages functions
  const pageTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'STATIC', label: 'Static' },
    { value: 'BLOG', label: 'Blog' },
    { value: 'FAQ', label: 'FAQ' },
    { value: 'POLICY', label: 'Policy' },
    { value: 'LANDING', label: 'Landing' },
    { value: 'CUSTOM', label: 'Custom' },
  ];

  const pageStatusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'ARCHIVED', label: 'Archived' },
  ];

  const filteredPages = contentPages.filter((page) => {
    const matchesSearch =
      !pageSearchQuery ||
      page.title.toLowerCase().includes(pageSearchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(pageSearchQuery.toLowerCase());
    const matchesType = !pageTypeFilter || page.type === pageTypeFilter;
    const matchesStatus = !pageStatusFilter || page.status === pageStatusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handlePageTitleChange = (title: string) => {
    const slug = generateSlug(title);
    if (editingPage) {
      setEditingPage({ ...editingPage, title, slug });
    } else {
      setPageForm({ ...pageForm, title, slug });
    }
  };

  const resetPageForm = () => {
    setPageForm({
      type: 'STATIC',
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      metaTitle: '',
      metaDescription: '',
      showInMenu: false,
      showInFooter: false,
      isFeatured: false,
    });
    setEditingPage(null);
    setShowPageForm(false);
  };

  const startEditPage = (page: ContentPage) => {
    setEditingPage({ ...page });
    setShowPageForm(true);
  };

  const startCreatePage = () => {
    setEditingPage(null);
    resetPageForm();
    setShowPageForm(true);
  };

  const saveContentPages = async (updatedPages: ContentPage[]) => {
    if (!selectedStorefront) return;

    try {
      setSavingPages(true);
      const response = await fetch('/api/storefront/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Storefront-ID': selectedStorefront.id,
        },
        body: JSON.stringify({ contentPages: updatedPages }),
      });

      if (!response.ok) {
        throw new Error('Failed to save content pages');
      }

      setContentPages(updatedPages);
      // Also update settings to keep in sync
      if (settings) {
        setSettings({ ...settings, contentPages: updatedPages });
        setSavedSettings({ ...settings, contentPages: updatedPages });
      }
    } catch (error) {
      console.error('Failed to save content pages:', error);
      throw error;
    } finally {
      setSavingPages(false);
    }
  };

  const handleSavePage = async () => {
    const formData = editingPage || pageForm;

    if (!formData.title || !formData.slug) {
      toast.error('Error', 'Title and slug are required');
      return;
    }

    // Check for duplicate slug (excluding current page if editing)
    const isDuplicate = contentPages.some((p) =>
      p.slug === formData.slug && (!editingPage || p.id !== editingPage.id)
    );
    if (isDuplicate) {
      toast.error('Error', 'A page with this slug already exists');
      return;
    }

    if (editingPage) {
      // Update existing page
      const updatedPages = contentPages.map((p) =>
        p.id === editingPage.id ? { ...editingPage, updatedAt: new Date().toISOString() } : p
      );

      try {
        await saveContentPages(updatedPages);
        resetPageForm();
        toast.success('Success', 'Page updated successfully!');
      } catch {
        toast.error('Error', 'Failed to update page');
      }
    } else {
      // Create new page
      const now = new Date().toISOString();
      const newPage: ContentPage = {
        id: crypto.randomUUID(),
        type: pageForm.type,
        status: 'DRAFT',
        title: pageForm.title,
        slug: pageForm.slug,
        excerpt: pageForm.excerpt || undefined,
        content: pageForm.content,
        metaTitle: pageForm.metaTitle || undefined,
        metaDescription: pageForm.metaDescription || undefined,
        viewCount: 0,
        showInMenu: pageForm.showInMenu,
        showInFooter: pageForm.showInFooter,
        isFeatured: pageForm.isFeatured,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await saveContentPages([...contentPages, newPage]);
        resetPageForm();
        toast.success('Success', 'Page created successfully!');
      } catch {
        toast.error('Error', 'Failed to create page');
      }
    }
  };


  const handlePublishPage = async (id: string) => {
    const updatedPages = contentPages.map((p) =>
      p.id === id
        ? { ...p, status: 'PUBLISHED' as ContentPageStatus, publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : p
    );

    try {
      await saveContentPages(updatedPages);
      toast.success('Success', 'Page published!');
    } catch {
      toast.error('Error', 'Failed to publish page');
    }
  };

  const handleUnpublishPage = async (id: string) => {
    const updatedPages = contentPages.map((p) =>
      p.id === id
        ? { ...p, status: 'DRAFT' as ContentPageStatus, updatedAt: new Date().toISOString() }
        : p
    );

    try {
      await saveContentPages(updatedPages);
      toast.success('Success', 'Page unpublished');
    } catch {
      toast.error('Error', 'Failed to unpublish page');
    }
  };

  const handleDeletePage = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Page',
      message: 'Are you sure you want to delete this page? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (confirmed) {
      const updatedPages = contentPages.filter((p) => p.id !== id);
      try {
        await saveContentPages(updatedPages);
        toast.success('Success', 'Page deleted');
      } catch {
        toast.error('Error', 'Failed to delete page');
      }
    }
  };

  const autoGenerateContent = () => {
    const formData = editingPage || pageForm;
    if (!formData.title) {
      toast.error('Title Required', 'Please enter a page title first');
      return;
    }

    const title = formData.title;
    const type = formData.type;
    const storeName = selectedStorefront?.name || 'Our Store';

    const metaTitle = `${title} | ${storeName}`;

    const excerptTemplates: Record<string, string> = {
      STATIC: `Learn more about ${title.toLowerCase()} at ${storeName}.`,
      BLOG: `Read our latest insights about ${title.toLowerCase()}.`,
      FAQ: `Find answers to frequently asked questions about ${title.toLowerCase()}.`,
      POLICY: `Review our ${title.toLowerCase()} to understand how ${storeName} operates.`,
      LANDING: `Discover ${title.toLowerCase()} at ${storeName}.`,
      CUSTOM: `Explore ${title.toLowerCase()} at ${storeName}.`,
    };

    const contentTemplates: Record<string, string> = {
      STATIC: `<h2>${title}</h2>\n<p>Welcome to our ${title.toLowerCase()} page at ${storeName}.</p>\n\n<h3>Our Commitment</h3>\n<p>We are dedicated to providing exceptional service and products that meet your needs.</p>`,
      BLOG: `<h2>${title}</h2>\n<p><em>Published on ${new Date().toLocaleDateString()}</em></p>\n\n<p>Welcome to this article about ${title.toLowerCase()}.</p>`,
      FAQ: `<h2>${title}</h2>\n<p>Find answers to the most common questions about ${storeName}.</p>\n\n<p><strong>Q: What is ${storeName}?</strong></p>\n<p>A: ${storeName} is your trusted destination for quality products.</p>`,
      POLICY: `<h2>${title}</h2>\n<p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>\n\n<h3>Overview</h3>\n<p>This ${title.toLowerCase()} outlines the terms for ${storeName}.</p>`,
      LANDING: `<h2>${title}</h2>\n<p class="lead">Discover amazing products at ${storeName}.</p>\n\n<h3>Why Choose Us?</h3>\n<ul>\n<li>Quality Products</li>\n<li>Great Prices</li>\n<li>Fast Shipping</li>\n</ul>`,
      CUSTOM: `<h2>${title}</h2>\n<p>Welcome to ${storeName}'s ${title.toLowerCase()} page.</p>`,
    };

    const updates = {
      excerpt: excerptTemplates[type] || excerptTemplates.STATIC,
      content: contentTemplates[type] || contentTemplates.STATIC,
      metaTitle,
      metaDescription: excerptTemplates[type] || excerptTemplates.STATIC,
    };

    if (editingPage) {
      setEditingPage({ ...editingPage, ...updates });
    } else {
      setPageForm({ ...pageForm, ...updates });
    }

    toast.success('Content Generated!', 'Fields have been auto-filled based on your page title and type.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-success-muted text-success-muted-foreground border-success/30';
      case 'DRAFT':
        return 'bg-warning-muted text-warning border-warning/30';
      case 'ARCHIVED':
        return 'bg-muted text-foreground border-border';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'STATIC':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'BLOG':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'FAQ':
        return 'bg-success-muted text-success-muted-foreground border-success/30';
      case 'POLICY':
        return 'bg-warning-muted text-warning border-warning/30';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  // Load content pages when settings are loaded
  useEffect(() => {
    if (settings?.contentPages) {
      // Cast the content pages from settings to our ContentPage type
      setContentPages(settings.contentPages as ContentPage[]);
    } else {
      setContentPages([]);
    }
  }, [settings?.contentPages]);

  // Show storefront selector first, then loading/content (only when not embedded)
  if (!selectedStorefront) {
    // When embedded, show minimal loading state since parent controls store selection
    if (embedded) {
      if (loadingStorefronts) {
        return (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        );
      }
      return (
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Select a store from the sidebar to customize its theme.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Store Selector */}
        <StoreSelector
          storefronts={storefronts}
          selectedStorefront={selectedStorefront}
          onSelect={handleStorefrontSelect}
          onStorefrontCreated={handleStorefrontCreated}
          loading={loadingStorefronts}
          vendorId={vendorId}
          showQuickActions={false}
          showUrlInfo={false}
          className="mb-6"
        />

        {/* Info Card */}
        <div className="bg-muted rounded-xl border border-primary/30 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-2">How Storefronts Work</h4>
              <ul className="text-sm text-primary space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Each storefront gets its own <strong>unique subdomain</strong> (e.g., <code className="bg-primary/20 px-1.5 py-0.5 rounded text-xs">your-store.{getStorefrontDomain()}</code>)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Storefronts are <strong>automatically live</strong> once created - no manual setup needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Customize theme, colors, and branding for each storefront independently</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {storefronts.length === 0 && !loadingStorefronts && (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Storefronts Found
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create a storefront in the General tab first to customize its appearance.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {!embedded && (
          <StoreSelector
            storefronts={storefronts}
            selectedStorefront={selectedStorefront}
            onSelect={handleStorefrontSelect}
            onStorefrontCreated={handleStorefrontCreated}
            loading={loadingStorefronts}
            vendorId={vendorId}
            showQuickActions={false}
            showUrlInfo={false}
            className="mb-6"
          />
        )}
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading storefront settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        {!embedded && (
          <StoreSelector
            storefronts={storefronts}
            selectedStorefront={selectedStorefront}
            onSelect={handleStorefrontSelect}
            onStorefrontCreated={handleStorefrontCreated}
            loading={loadingStorefronts}
            vendorId={vendorId}
            showQuickActions={false}
            showUrlInfo={false}
            className="mb-6"
          />
        )}
        <div className="bg-card rounded-lg border border-destructive/30 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Failed to load settings for this storefront</p>
          <Button onClick={loadSettings} size="sm" className="bg-primary hover:bg-primary/90 text-white">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.STOREFRONTS_MANAGE}
      fallback="styled"
      fallbackTitle="Storefront Settings"
      fallbackDescription="You don't have permission to manage storefront themes."
    >
      <div className={cn('space-y-4', embedded && 'p-6')}>
        {/* Action Bar - Compact when embedded */}
        <div className={cn('flex items-center justify-between', embedded ? 'mb-4' : 'mb-6')}>
          {!embedded ? (
            <StoreSelector
              storefronts={storefronts}
              selectedStorefront={selectedStorefront}
              onSelect={handleStorefrontSelect}
              onStorefrontCreated={handleStorefrontCreated}
              loading={loadingStorefronts}
              vendorId={vendorId}
              showQuickActions={false}
              showUrlInfo={false}
            />
          ) : (
            <div className="text-sm text-muted-foreground">
              Customizing: <span className="font-medium text-foreground">{selectedStorefront?.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
            >
              <Eye className="h-3.5 w-3.5" />
              {showPreview ? 'Hide' : 'Preview'}
            </Button>
            {hasChanges && (
              <Button onClick={handleDiscard} variant="outline" size="sm" className="h-8 text-xs">
                Discard
              </Button>
            )}
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              Save
            </Button>
          </div>
        </div>

        {/* Mobile: Dropdown navigation */}
        <div className="md:hidden mb-4">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabId)}
            className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm font-medium focus:outline-none focus:border-primary"
          >
            {TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop: Horizontal tabs */}
        <div className="hidden md:block border-b border-border mb-6">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className={cn('grid gap-4', showPreview ? 'grid-cols-1 lg:grid-cols-12' : '')}>
          {/* Main Content */}
          <div className={cn(showPreview ? 'lg:col-span-8' : '')}>
            <div className={cn('bg-card rounded-xl border border-border shadow-sm', embedded ? 'p-4' : 'p-6')}>
              {/* Theme & Colors Tab */}
              {activeTab === 'theme' && (
                <div className="space-y-6">
                  {/* Theme Templates */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-foreground">Theme Template</h3>
                      <span className="text-xs text-muted-foreground">Hover for details</span>
                    </div>
                    <ThemeSelector
                      selectedTheme={settings.themeTemplate}
                      onThemeSelect={(theme) => {
                        const preset = THEME_PRESETS.find((p) => p.id === theme);
                        if (preset) {
                          // Always save all colors from the preset when changing theme
                          updateSettings({
                            themeTemplate: theme,
                            primaryColor: preset.primaryColor,
                            secondaryColor: preset.secondaryColor,
                            accentColor: preset.accentColor,
                          });
                        } else {
                          updateSettings({ themeTemplate: theme });
                        }
                      }}
                    />
                  </div>

                  {/* Color Mode Setting */}
                  <div className="border-t border-border pt-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Color Mode</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { id: 'light' as ColorMode, label: 'Light', icon: Sun },
                        { id: 'dark' as ColorMode, label: 'Dark', icon: Moon },
                        { id: 'both' as ColorMode, label: 'Toggle', icon: Monitor },
                        { id: 'system' as ColorMode, label: 'System', icon: Monitor },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => updateSettings({ colorMode: mode.id })}
                          className={cn(
                            'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all',
                            settings.colorMode === mode.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50 text-muted-foreground'
                          )}
                        >
                          <mode.icon className="h-4 w-4" />
                          <span className="font-medium text-sm">{mode.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <ColorPairPicker
                      primaryColor={settings.primaryColor}
                      secondaryColor={settings.secondaryColor}
                      onPrimaryChange={(color) => updateSettings({ primaryColor: color })}
                      onSecondaryChange={(color) => updateSettings({ secondaryColor: color })}
                      defaultPrimary={
                        THEME_PRESETS.find((p) => p.id === settings.themeTemplate)?.primaryColor
                      }
                      defaultSecondary={
                        THEME_PRESETS.find((p) => p.id === settings.themeTemplate)?.secondaryColor
                      }
                    />
                  </div>

                  <div className="border-t border-border pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ImagePlus className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Logo & Branding</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                      Upload your store logo and favicon to establish brand identity across your storefront.
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Store Logo Card */}
                      <div className="bg-muted/30 rounded-xl p-5 border border-border">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Store className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">Store Logo</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Displayed in header, emails, and invoices
                            </p>
                          </div>
                        </div>
                        <AssetUploader
                          type="logo"
                          description="Recommended: 400x120px, PNG or SVG with transparent background"
                          currentUrl={settings.logoUrl}
                          onUpload={(url) => updateSettings({ logoUrl: url })}
                          onRemove={() => updateSettings({ logoUrl: undefined })}
                          aspectRatio="banner"
                          maxSizeMB={5}
                        />
                        <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-lg">
                          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <span>For best results, use a horizontal logo with transparent background. SVG format is recommended for sharp display at all sizes.</span>
                        </div>
                      </div>

                      {/* Favicon Card */}
                      <div className="bg-muted/30 rounded-xl p-5 border border-border">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Bookmark className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">Favicon</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Browser tab icon and bookmarks
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <AssetUploader
                            type="favicon"
                            description="32x32px or 64x64px, ICO or PNG"
                            currentUrl={settings.faviconUrl}
                            onUpload={(url) => updateSettings({ faviconUrl: url })}
                            onRemove={() => updateSettings({ faviconUrl: undefined })}
                            aspectRatio="square"
                            size="md"
                            maxSizeMB={1}
                          />
                          {/* Favicon Preview */}
                          <div className="flex-1 flex flex-col items-center justify-center bg-muted/50 rounded-lg p-3 min-h-[120px]">
                            <p className="text-xs text-muted-foreground mb-2">Preview</p>
                            <div className="flex items-center gap-2 bg-background rounded-md px-3 py-1.5 border shadow-sm">
                              {settings.faviconUrl ? (
                                <img src={settings.faviconUrl} alt="Favicon" className="h-4 w-4 object-contain" />
                              ) : (
                                <div className="h-4 w-4 bg-muted rounded" />
                              )}
                              <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                                {selectedStorefront?.name || 'Your Store'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-lg">
                          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <span>Square image that appears in browser tabs. Use a simple, recognizable icon version of your logo.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Homepage Tab */}
              {activeTab === 'homepage' && (
                <div className="space-y-8">
                  {/* Hero Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Hero Section</h3>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.homepageConfig.heroEnabled}
                          onChange={(e) =>
                            updateHomepageConfig({ heroEnabled: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium">Enable hero section</span>
                      </label>

                      {settings.homepageConfig.heroEnabled && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Hero Title
                            </label>
                            <input
                              type="text"
                              value={settings.homepageConfig.heroTitle || ''}
                              onChange={(e) =>
                                updateHomepageConfig({ heroTitle: e.target.value })
                              }
                              placeholder="Welcome to Our Store"
                              className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Hero Subtitle
                            </label>
                            <input
                              type="text"
                              value={settings.homepageConfig.heroSubtitle || ''}
                              onChange={(e) =>
                                updateHomepageConfig({ heroSubtitle: e.target.value })
                              }
                              placeholder="Discover amazing products"
                              className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              CTA Button Text
                            </label>
                            <input
                              type="text"
                              value={settings.homepageConfig.heroCtaText || ''}
                              onChange={(e) =>
                                updateHomepageConfig({ heroCtaText: e.target.value })
                              }
                              placeholder="Shop Now"
                              className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              CTA Button Link
                            </label>
                            <input
                              type="text"
                              value={settings.homepageConfig.heroCtaLink || ''}
                              onChange={(e) =>
                                updateHomepageConfig({ heroCtaLink: e.target.value })
                              }
                              placeholder="/products"
                              className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-primary"
                            />
                          </div>
                          {/* Hero Background Type Selector */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Background Type
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                              {[
                                { id: 'animated', label: 'Animated Gradient' },
                                { id: 'static', label: 'Static Gradient' },
                                { id: 'image', label: 'Custom Image' },
                                { id: 'video', label: 'Video' },
                                { id: 'color', label: 'Solid Color' },
                              ].map((type) => (
                                <button
                                  key={type.id}
                                  type="button"
                                  onClick={() => updateHomepageConfig({ heroBackgroundType: type.id as 'animated' | 'static' | 'image' | 'video' | 'color' })}
                                  className={`p-3 rounded-lg border text-center transition-all ${
                                    (settings.homepageConfig.heroBackgroundType || 'animated') === type.id
                                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                >
                                  <span className="text-sm font-medium">{type.label}</span>
                                </button>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {(settings.homepageConfig.heroBackgroundType || 'animated') === 'animated' && 'Animated gradient using your theme colors with particle effects'}
                              {settings.homepageConfig.heroBackgroundType === 'static' && 'Static gradient using your theme colors without animation'}
                              {settings.homepageConfig.heroBackgroundType === 'image' && 'Upload a custom background image for your hero section'}
                              {settings.homepageConfig.heroBackgroundType === 'video' && 'Use a video as your hero background (coming soon)'}
                              {settings.homepageConfig.heroBackgroundType === 'color' && 'Solid primary color background for a clean minimal look'}
                            </p>
                          </div>

                          {/* Hero Background Image - only show when image type selected */}
                          {settings.homepageConfig.heroBackgroundType === 'image' && (
                            <div className="md:col-span-2">
                              <AssetUploader
                                type="hero"
                                label="Hero Background Image"
                                description="Recommended: 1920x800px"
                                currentUrl={settings.homepageConfig.heroImage}
                                onUpload={(url) => updateHomepageConfig({ heroImage: url })}
                                onRemove={() => updateHomepageConfig({ heroImage: undefined })}
                                aspectRatio="banner"
                              />
                            </div>
                          )}

                          {/* Animation Toggle - only show for animated background */}
                          {(settings.homepageConfig.heroBackgroundType === 'animated' || !settings.homepageConfig.heroBackgroundType) && (
                            <div className="md:col-span-2">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={settings.homepageConfig.heroAnimationsEnabled !== false}
                                  onChange={(e) =>
                                    updateHomepageConfig({ heroAnimationsEnabled: e.target.checked })
                                  }
                                  className="rounded border-border text-primary focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium">Enable floating blob animations</span>
                              </label>
                              <p className="text-xs text-muted-foreground mt-1 ml-6">
                                Decorative animated color blobs that add depth to the hero section
                              </p>
                            </div>
                          )}

                          {/* Hero Text Color - always visible */}
                          <div className="md:col-span-2 pt-4 border-t border-border mt-4">
                            <h4 className="text-sm font-semibold mb-3">Text Styling</h4>
                            <div className="grid gap-4 md:grid-cols-2">
                              <ColorPicker
                                label="Hero Text Color"
                                description="Color for title, subtitle and stats text"
                                value={settings.homepageConfig.heroTextColor || ''}
                                onChange={(color) => updateHomepageConfig({ heroTextColor: color || undefined })}
                                defaultValue="#ffffff"
                                showContrastWarning={false}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Homepage Sections */}
                  <div className="border-t border-border pt-8">
                    <SectionEditor
                      sections={settings.homepageConfig.sections}
                      onChange={(sections) => updateHomepageConfig({ sections })}
                    />
                  </div>

                  {/* Newsletter */}
                  <div className="border-t border-border pt-8">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.homepageConfig.showNewsletter}
                        onChange={(e) =>
                          updateHomepageConfig({ showNewsletter: e.target.checked })
                        }
                        className="rounded border-border text-primary focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium">Show newsletter signup</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Header Tab */}
              {activeTab === 'header' && (
                <div className="space-y-8">
                  {/* Announcement Bar */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Announcement Bar</h3>
                    <div className="space-y-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.headerConfig.showAnnouncement}
                          onChange={(e) =>
                            updateHeaderConfig({ showAnnouncement: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium">Show announcement bar</span>
                      </label>

                      {settings.headerConfig.showAnnouncement && (
                        <div className="space-y-6">
                          {/* Content Section */}
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Announcement Text
                              </label>
                              <input
                                type="text"
                                value={settings.headerConfig.announcementText || ''}
                                onChange={(e) =>
                                  updateHeaderConfig({ announcementText: e.target.value })
                                }
                                placeholder="🎉 Free shipping on orders over $50!"
                                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Link (optional)
                              </label>
                              <input
                                type="text"
                                value={settings.headerConfig.announcementLink || ''}
                                onChange={(e) =>
                                  updateHeaderConfig({ announcementLink: e.target.value })
                                }
                                placeholder="/shipping"
                                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Icon/Emoji (optional)
                              </label>
                              <input
                                type="text"
                                value={settings.headerConfig.announcementIcon || ''}
                                onChange={(e) =>
                                  updateHeaderConfig({ announcementIcon: e.target.value })
                                }
                                placeholder="🎉 or 🔥 or ⚡"
                                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-primary"
                              />
                              <p className="text-xs text-muted-foreground mt-1">Add an emoji to grab attention</p>
                            </div>
                          </div>

                          {/* Style Section */}
                          <div className="border-t border-border pt-4">
                            <h4 className="text-sm font-semibold mb-3">Appearance</h4>
                            <div className="grid gap-4 md:grid-cols-2">
                              <ColorPicker
                                label="Background Color"
                                description="Leave empty for theme gradient"
                                value={settings.headerConfig.announcementBgColor || ''}
                                onChange={(color) => updateHeaderConfig({ announcementBgColor: color || undefined })}
                                showContrastWarning={false}
                              />
                              <ColorPicker
                                label="Text Color"
                                description="Leave empty for white"
                                value={settings.headerConfig.announcementTextColor || ''}
                                onChange={(color) => updateHeaderConfig({ announcementTextColor: color || undefined })}
                                defaultValue="#ffffff"
                                showContrastWarning={false}
                              />
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Animation Style
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { id: 'static', label: 'Static', desc: 'No animation' },
                                  { id: 'pulse', label: 'Pulse', desc: 'Subtle glow effect' },
                                  { id: 'marquee', label: 'Marquee', desc: 'Scrolling text' },
                                ].map((style) => (
                                  <button
                                    key={style.id}
                                    type="button"
                                    onClick={() => updateHeaderConfig({ announcementStyle: style.id as 'static' | 'pulse' | 'marquee' })}
                                    className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                                      (settings.headerConfig.announcementStyle || 'static') === style.id
                                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                                        : 'border-border hover:border-primary/50'
                                    }`}
                                  >
                                    {style.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Behavior Section */}
                          <div className="border-t border-border pt-4">
                            <h4 className="text-sm font-semibold mb-3">Behavior</h4>
                            <div className="space-y-3">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={settings.headerConfig.announcementDismissible || false}
                                  onChange={(e) =>
                                    updateHeaderConfig({ announcementDismissible: e.target.checked })
                                  }
                                  className="rounded border-border text-primary focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium">Allow visitors to dismiss</span>
                              </label>
                              <p className="text-xs text-muted-foreground ml-6">
                                Shows a close button. Dismissal is remembered for the session.
                              </p>
                            </div>

                            {/* Countdown Timer */}
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Countdown Timer (optional)
                              </label>
                              <input
                                type="datetime-local"
                                value={settings.headerConfig.announcementCountdownEnd?.slice(0, 16) || ''}
                                onChange={(e) =>
                                  updateHeaderConfig({
                                    announcementCountdownEnd: e.target.value || undefined
                                  })
                                }
                                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-primary"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Time is in your store&apos;s timezone. Shows &quot;Sale ends in 2d 5h 30m&quot;
                              </p>
                              {settings.headerConfig.announcementCountdownEnd && (
                                <button
                                  type="button"
                                  onClick={() => updateHeaderConfig({ announcementCountdownEnd: undefined })}
                                  className="text-xs text-destructive hover:underline mt-1"
                                >
                                  Remove countdown
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="border-t border-border pt-8">
                    <NavigationBuilder
                      links={settings.headerConfig.navLinks}
                      onChange={(navLinks) => updateHeaderConfig({ navLinks })}
                      maxLinks={10}
                      maxDepth={2}
                    />
                  </div>

                  {/* Header Options */}
                  <div className="border-t border-border pt-8">
                    <h4 className="font-medium text-foreground mb-4">Header Options</h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.headerConfig.stickyHeader}
                          onChange={(e) =>
                            updateHeaderConfig({ stickyHeader: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Sticky header (stays visible on scroll)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.headerConfig.showSearch}
                          onChange={(e) =>
                            updateHeaderConfig({ showSearch: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show search bar</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.headerConfig.showCart}
                          onChange={(e) => updateHeaderConfig({ showCart: e.target.checked })}
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show cart icon</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.headerConfig.showAccount}
                          onChange={(e) =>
                            updateHeaderConfig({ showAccount: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show account icon</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Tab */}
              {activeTab === 'footer' && (
                <div className="space-y-6">
                  <FooterBuilder
                    config={settings.footerConfig}
                    onChange={updateFooterConfig}
                  />

                  {/* Content Pages Hint */}
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                    <h4 className="font-medium text-primary mb-2">Content Pages</h4>
                    <p className="text-sm text-primary mb-3">
                      Create pages like Privacy Policy, Terms of Service, About Us, etc. in{' '}
                      <Link href="/settings/content-pages" className="underline font-medium">
                        Content Pages
                      </Link>{' '}
                      and enable &quot;Show in Footer&quot; to automatically add them to your footer.
                    </p>
                    <Button variant="outline" size="sm" asChild className="bg-white">
                      <Link href="/settings/content-pages">
                        Manage Content Pages
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {/* Products Tab */}
              {activeTab === 'products' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Product Display Settings</h3>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Grid Columns (Desktop)
                        </label>
                        <select
                          value={settings.productConfig.gridColumns}
                          onChange={(e) =>
                            updateProductConfig({
                              gridColumns: parseInt(e.target.value) as 2 | 3 | 4,
                            })
                          }
                          className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-primary"
                        >
                          <option value={2}>2 Columns</option>
                          <option value={3}>3 Columns</option>
                          <option value={4}>4 Columns</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Card Style
                        </label>
                        <select
                          value={settings.productConfig.cardStyle}
                          onChange={(e) =>
                            updateProductConfig({ cardStyle: e.target.value as any })
                          }
                          className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-primary"
                        >
                          <option value="default">Default</option>
                          <option value="minimal">Minimal</option>
                          <option value="bordered">Bordered</option>
                          <option value="elevated">Elevated (Shadow)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Image Aspect Ratio
                        </label>
                        <select
                          value={settings.productConfig.imageAspectRatio}
                          onChange={(e) =>
                            updateProductConfig({ imageAspectRatio: e.target.value as any })
                          }
                          className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-primary"
                        >
                          <option value="square">Square (1:1)</option>
                          <option value="portrait">Portrait (3:4)</option>
                          <option value="landscape">Landscape (4:3)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Hover Effect
                        </label>
                        <select
                          value={settings.productConfig.hoverEffect}
                          onChange={(e) =>
                            updateProductConfig({ hoverEffect: e.target.value as any })
                          }
                          className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-primary"
                        >
                          <option value="none">None</option>
                          <option value="zoom">Zoom</option>
                          <option value="fade">Fade</option>
                          <option value="slide">Slide</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <h4 className="font-medium text-foreground mb-4">Display Options</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.productConfig.showQuickView}
                          onChange={(e) =>
                            updateProductConfig({ showQuickView: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Enable quick view</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.productConfig.showWishlist}
                          onChange={(e) =>
                            updateProductConfig({ showWishlist: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show wishlist button</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.productConfig.showRatings}
                          onChange={(e) =>
                            updateProductConfig({ showRatings: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show ratings</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.productConfig.showSaleBadge}
                          onChange={(e) =>
                            updateProductConfig({ showSaleBadge: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show sale badges</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.productConfig.showStockStatus}
                          onChange={(e) =>
                            updateProductConfig({ showStockStatus: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show stock status</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Checkout Tab */}
              {activeTab === 'checkout' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Checkout Settings</h3>

                    <div className="space-y-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.checkoutConfig.guestCheckoutEnabled}
                          onChange={(e) =>
                            updateCheckoutConfig({ guestCheckoutEnabled: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium">Allow guest checkout</span>
                        <span className="text-xs text-muted-foreground">
                          (Customers can checkout without creating an account)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <h4 className="font-medium text-foreground mb-4">Required Fields</h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.checkoutConfig.requirePhone}
                          onChange={(e) =>
                            updateCheckoutConfig({ requirePhone: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Require phone number</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.checkoutConfig.requireCompany}
                          onChange={(e) =>
                            updateCheckoutConfig({ requireCompany: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Require company name</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <h4 className="font-medium text-foreground mb-4">Additional Options</h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.checkoutConfig.showOrderNotes}
                          onChange={(e) =>
                            updateCheckoutConfig({ showOrderNotes: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Allow order notes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.checkoutConfig.showGiftOptions}
                          onChange={(e) =>
                            updateCheckoutConfig({ showGiftOptions: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show gift options</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.checkoutConfig.showTrustBadges}
                          onChange={(e) =>
                            updateCheckoutConfig({ showTrustBadges: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show trust badges</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.checkoutConfig.showPaymentIcons}
                          onChange={(e) =>
                            updateCheckoutConfig({ showPaymentIcons: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show payment method icons</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <h4 className="font-medium text-foreground mb-4">Terms & Conditions</h4>
                    <label className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        checked={settings.checkoutConfig.showTermsCheckbox}
                        onChange={(e) =>
                          updateCheckoutConfig({ showTermsCheckbox: e.target.checked })
                        }
                        className="rounded border-border text-primary focus:ring-purple-500"
                      />
                      <span className="text-sm">Require terms acceptance</span>
                    </label>

                    {settings.checkoutConfig.showTermsCheckbox && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Terms Text
                          </label>
                          <input
                            type="text"
                            value={settings.checkoutConfig.termsText || ''}
                            onChange={(e) =>
                              updateCheckoutConfig({ termsText: e.target.value })
                            }
                            placeholder="I agree to the terms and conditions"
                            className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Terms Page Link
                          </label>
                          <input
                            type="text"
                            value={settings.checkoutConfig.termsLink || ''}
                            onChange={(e) =>
                              updateCheckoutConfig({ termsLink: e.target.value })
                            }
                            placeholder="/terms"
                            className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pages Tab */}
              {activeTab === 'pages' && (
                <div className="space-y-6">
                  {/* Inline Form - Create/Edit */}
                  {showPageForm ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          {editingPage ? 'Edit Page' : 'Create New Page'}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={resetPageForm} disabled={savingPages}>
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSavePage}
                            disabled={savingPages}
                            className="bg-primary text-primary-foreground"
                          >
                            {savingPages ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            {editingPage ? 'Update' : 'Create'}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Details */}
                        <div className="space-y-4">
                          <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-foreground">Page Details</h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={autoGenerateContent}
                                disabled={!(editingPage?.title || pageForm.title)}
                              >
                                <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                                Auto Generate
                              </Button>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
                              <Input
                                placeholder="About Us"
                                value={editingPage?.title || pageForm.title}
                                onChange={(e) => handlePageTitleChange(e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">URL Slug *</label>
                              <Input
                                placeholder="about-us"
                                value={editingPage?.slug || pageForm.slug}
                                onChange={(e) => {
                                  const slug = generateSlug(e.target.value);
                                  if (editingPage) {
                                    setEditingPage({ ...editingPage, slug });
                                  } else {
                                    setPageForm({ ...pageForm, slug });
                                  }
                                }}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                URL: /{editingPage?.slug || pageForm.slug || 'page-slug'}
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                              <Select
                                value={editingPage?.type || pageForm.type}
                                onChange={(value) => {
                                  if (editingPage) {
                                    setEditingPage({ ...editingPage, type: value as ContentPageType });
                                  } else {
                                    setPageForm({ ...pageForm, type: value as ContentPageType });
                                  }
                                }}
                                options={pageTypeOptions.filter((t) => t.value !== '')}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">Excerpt</label>
                              <textarea
                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                                rows={2}
                                placeholder="Short description..."
                                value={editingPage?.excerpt || pageForm.excerpt}
                                onChange={(e) => {
                                  if (editingPage) {
                                    setEditingPage({ ...editingPage, excerpt: e.target.value });
                                  } else {
                                    setPageForm({ ...pageForm, excerpt: e.target.value });
                                  }
                                }}
                              />
                            </div>

                            <div className="flex flex-wrap gap-4">
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editingPage?.showInMenu || pageForm.showInMenu}
                                  onChange={(e) => {
                                    if (editingPage) {
                                      setEditingPage({ ...editingPage, showInMenu: e.target.checked });
                                    } else {
                                      setPageForm({ ...pageForm, showInMenu: e.target.checked });
                                    }
                                  }}
                                  className="rounded border-border text-primary"
                                />
                                Show in Menu
                              </label>
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editingPage?.showInFooter || pageForm.showInFooter}
                                  onChange={(e) => {
                                    if (editingPage) {
                                      setEditingPage({ ...editingPage, showInFooter: e.target.checked });
                                    } else {
                                      setPageForm({ ...pageForm, showInFooter: e.target.checked });
                                    }
                                  }}
                                  className="rounded border-border text-primary"
                                />
                                Show in Footer
                              </label>
                            </div>
                          </div>

                          {/* SEO */}
                          <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                            <h4 className="font-medium text-foreground">SEO Settings</h4>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">Meta Title</label>
                              <Input
                                placeholder="About Us - Store Name"
                                value={editingPage?.metaTitle || pageForm.metaTitle}
                                onChange={(e) => {
                                  if (editingPage) {
                                    setEditingPage({ ...editingPage, metaTitle: e.target.value });
                                  } else {
                                    setPageForm({ ...pageForm, metaTitle: e.target.value });
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">Meta Description</label>
                              <textarea
                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                                rows={2}
                                placeholder="Description for search engines..."
                                value={editingPage?.metaDescription || pageForm.metaDescription}
                                onChange={(e) => {
                                  if (editingPage) {
                                    setEditingPage({ ...editingPage, metaDescription: e.target.value });
                                  } else {
                                    setPageForm({ ...pageForm, metaDescription: e.target.value });
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Content */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Content</label>
                          <RichTextEditor
                            value={editingPage?.content || pageForm.content}
                            onChange={(value) => {
                              if (editingPage) {
                                setEditingPage({ ...editingPage, content: value });
                              } else {
                                setPageForm({ ...pageForm, content: value });
                              }
                            }}
                            placeholder="Write your page content..."
                            minHeight="400px"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Header with Create Button */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Content Pages</h3>
                          <p className="text-sm text-muted-foreground">
                            Create and manage pages for your storefront
                          </p>
                        </div>
                        <Button onClick={startCreatePage} disabled={savingPages} className="bg-primary text-primary-foreground hover:opacity-90">
                          <Plus className="h-4 w-4 mr-2" />
                          New Page
                        </Button>
                      </div>

                      {/* Filters */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">Search</label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Search pages..."
                              value={pageSearchQuery}
                              onChange={(e) => setPageSearchQuery(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
                          <Select value={pageTypeFilter} onChange={setPageTypeFilter} options={pageTypeOptions} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                          <Select value={pageStatusFilter} onChange={setPageStatusFilter} options={pageStatusOptions} />
                        </div>
                      </div>

                      {/* Pages List */}
                      {filteredPages.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h4 className="font-semibold text-foreground mb-2">
                            {contentPages.length === 0 ? 'No Content Pages Yet' : 'No Pages Match Filters'}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            {contentPages.length === 0
                              ? 'Create your first content page to get started.'
                              : 'Try adjusting your search or filter criteria.'}
                          </p>
                          {contentPages.length === 0 && (
                            <Button onClick={startCreatePage} className="bg-primary text-primary-foreground">
                              <Plus className="h-4 w-4 mr-2" />
                              Create First Page
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-border rounded-lg">
                          <table className="w-full">
                            <thead className="bg-muted border-b border-border">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase">Title</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase">Updated</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-foreground uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {filteredPages.map((page) => (
                                <tr key={page.id} className="hover:bg-muted/50 transition-colors">
                                  <td className="px-4 py-3">
                                    <div>
                                      <p className="font-medium text-foreground">{page.title}</p>
                                      <p className="text-xs text-muted-foreground font-mono">/{page.slug}</p>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        {page.showInMenu && (
                                          <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">Menu</span>
                                        )}
                                        {page.showInFooter && (
                                          <span className="text-xs bg-success-muted text-success-muted-foreground px-1.5 py-0.5 rounded font-medium">Footer</span>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-medium border', getTypeColor(page.type))}>
                                      {page.type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-medium border', getStatusColor(page.status))}>
                                      {page.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {new Date(page.updatedAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex gap-1 justify-end">
                                      {page.status === 'DRAFT' && (
                                        <Button variant="ghost" size="sm" onClick={() => handlePublishPage(page.id)} disabled={savingPages} title="Publish">
                                          <Globe className="h-4 w-4 text-success" />
                                        </Button>
                                      )}
                                      {page.status === 'PUBLISHED' && (
                                        <Button variant="ghost" size="sm" onClick={() => handleUnpublishPage(page.id)} disabled={savingPages} title="Unpublish">
                                          <Globe className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                      )}
                                      <Button variant="ghost" size="sm" onClick={() => startEditPage(page)} disabled={savingPages} title="Edit">
                                        <Edit className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => handleDeletePage(page.id)} disabled={savingPages} title="Delete">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Live Preview Panel */}
          {showPreview && (
            <div className="lg:col-span-4">
              <LivePreview
                settings={settings}
                tenantSlug={selectedStorefront?.slug}
                className="sticky top-4 h-[calc(100vh-12rem)]"
              />
            </div>
          )}
        </div>
      </div>
    </PermissionGate>
  );
}
