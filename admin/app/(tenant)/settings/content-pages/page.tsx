'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  FileText,
  Globe,
  Loader2,
  Save,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/Select';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { PageHeader } from '@/components/PageHeader';
import { StoreSelector } from '@/components/settings/StoreSelector';
import { cn } from '@/lib/utils';
import { useDialog } from '@/contexts/DialogContext';
import { settingsService } from '@/lib/services/settingsService';
import { storefrontService } from '@/lib/services/storefrontService';
import type { Storefront } from '@/lib/api/types';
import type { ContentPage, ContentPageType, ContentPageStatus } from '@/lib/types/settings';

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'STATIC', label: 'Static' },
  { value: 'BLOG', label: 'Blog' },
  { value: 'FAQ', label: 'FAQ' },
  { value: 'POLICY', label: 'Policy' },
  { value: 'LANDING', label: 'Landing' },
  { value: 'CUSTOM', label: 'Custom' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const DEFAULT_CREATE_FORM = {
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
};

export default function ContentPagesSettingsPage() {
  const { showConfirm, showSuccess, showError } = useDialog();

  // Storefront state
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);

  // Settings state
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [existingEcommerce, setExistingEcommerce] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPage, setSelectedPage] = useState<ContentPage | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [editForm, setEditForm] = useState<ContentPage | null>(null);
  const [isModalExpanded, setIsModalExpanded] = useState(false);

  // Load storefronts on mount
  useEffect(() => {
    loadStorefronts();
  }, []);

  // Load settings when storefront changes
  useEffect(() => {
    if (selectedStorefront) {
      loadSettings(selectedStorefront.id);
    }
  }, [selectedStorefront?.id]);

  const loadStorefronts = async () => {
    try {
      setLoadingStorefronts(true);
      const result = await storefrontService.getStorefronts();
      const sfList = result.data || [];
      setStorefronts(sfList);

      if (sfList.length > 0) {
        setSelectedStorefront(sfList[0]);
      }
    } catch (error) {
      console.error('Failed to load storefronts:', error);
    } finally {
      setLoadingStorefronts(false);
    }
  };

  const loadSettings = async (storefrontId: string) => {
    try {
      setLoading(true);
      // Fetch from storefront settings API (storefront_theme_settings table)
      // This is where the storefront reads content pages from
      const response = await fetch('/api/storefront/settings', {
        headers: {
          'X-Storefront-ID': storefrontId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load storefront settings');
      }

      const result = await response.json();
      const settings = result.data;

      if (settings?.contentPages && Array.isArray(settings.contentPages)) {
        setPages(settings.contentPages);
        setSettingsId(settings.id);
      } else {
        setPages([]);
        setSettingsId(settings?.id || null);
      }

      // Store any other ecommerce data for potential future use
      setExistingEcommerce({});
    } catch (error) {
      console.error('Failed to load content pages:', error);
      setPages([]);
      setExistingEcommerce({});
      setSettingsId(null);
    } finally {
      setLoading(false);
    }
  };

  const savePages = async (updatedPages: ContentPage[]) => {
    if (!selectedStorefront) {
      showError('Error', 'Please select a storefront first');
      return;
    }

    try {
      setSaving(true);

      // Save to storefront settings API (storefront_theme_settings table)
      // This is where the storefront reads content pages from
      const response = await fetch('/api/storefront/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Storefront-ID': selectedStorefront.id,
        },
        body: JSON.stringify({
          contentPages: updatedPages,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to save content pages');
      }

      const result = await response.json();
      if (result.data?.id) {
        setSettingsId(result.data.id);
      }

      setPages(updatedPages);
    } catch (error) {
      console.error('Failed to save content pages:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Computed stats
  const stats = {
    totalPages: pages.length,
    publishedPages: pages.filter((p) => p.status === 'PUBLISHED').length,
    draftPages: pages.filter((p) => p.status === 'DRAFT').length,
    totalViews: pages.reduce((sum, p) => sum + p.viewCount, 0),
  };

  // Filtered pages
  const filteredPages = pages.filter((page) => {
    const matchesSearch =
      !searchQuery ||
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || page.type === typeFilter;
    const matchesStatus = !statusFilter || page.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

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
      case 'LANDING':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'CUSTOM':
        return 'bg-muted text-foreground border-border';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    const slug = generateSlug(title);
    setCreateForm({ ...createForm, title, slug });
  };

  // Auto-generate content based on page title and type
  const autoGenerateContent = () => {
    if (!createForm.title) {
      showError('Title Required', 'Please enter a page title first');
      return;
    }

    const title = createForm.title;
    const type = createForm.type;
    const storeName = selectedStorefront?.name || 'Our Store';

    // Generate meta title
    const metaTitle = `${title} | ${storeName}`;

    // Generate excerpt based on page type
    const excerptTemplates: Record<string, string> = {
      STATIC: `Learn more about ${title.toLowerCase()} at ${storeName}. We're committed to providing you with the best experience.`,
      BLOG: `Read our latest insights about ${title.toLowerCase()}. Stay updated with news and tips from ${storeName}.`,
      FAQ: `Find answers to frequently asked questions about ${title.toLowerCase()}. Get the help you need at ${storeName}.`,
      POLICY: `Review our ${title.toLowerCase()} to understand how ${storeName} operates and protects your interests.`,
      LANDING: `Discover ${title.toLowerCase()} at ${storeName}. Explore our offerings and find what you're looking for.`,
      CUSTOM: `Explore ${title.toLowerCase()} at ${storeName}. We're here to serve you better.`,
    };

    // Generate meta description
    const metaDescription = excerptTemplates[type] || excerptTemplates.STATIC;

    // Generate content template based on page type
    const contentTemplates: Record<string, string> = {
      STATIC: `<h2>${title}</h2>
<p>Welcome to our ${title.toLowerCase()} page. Here at ${storeName}, we believe in transparency and building lasting relationships with our customers.</p>

<h3>Our Commitment</h3>
<p>We are dedicated to providing exceptional service and products that meet your needs. Our team works tirelessly to ensure your satisfaction.</p>

<h3>What We Offer</h3>
<ul>
<li>Quality products carefully selected for you</li>
<li>Excellent customer service</li>
<li>Fast and reliable shipping</li>
<li>Easy returns and exchanges</li>
</ul>

<h3>Get in Touch</h3>
<p>Have questions? We'd love to hear from you. Contact our team and we'll get back to you as soon as possible.</p>`,

      BLOG: `<h2>${title}</h2>
<p><em>Published on ${new Date().toLocaleDateString()}</em></p>

<p>Welcome to this article about ${title.toLowerCase()}. We're excited to share our insights with you.</p>

<h3>Introduction</h3>
<p>In this post, we'll explore the key aspects of ${title.toLowerCase()} and why it matters to you.</p>

<h3>Key Points</h3>
<ul>
<li>First important point about the topic</li>
<li>Second important point to consider</li>
<li>Third insight you should know</li>
</ul>

<h3>Conclusion</h3>
<p>Thank you for reading! Stay tuned for more updates from ${storeName}.</p>`,

      FAQ: `<h2>${title}</h2>
<p>Find answers to the most common questions about ${storeName}.</p>

<h3>General Questions</h3>

<p><strong>Q: What is ${storeName}?</strong></p>
<p>A: ${storeName} is your trusted destination for quality products and excellent service.</p>

<p><strong>Q: How can I contact customer support?</strong></p>
<p>A: You can reach our support team through the contact page or email us directly.</p>

<p><strong>Q: What are your business hours?</strong></p>
<p>A: We're available Monday through Friday, 9 AM to 6 PM.</p>

<h3>Orders & Shipping</h3>

<p><strong>Q: How long does shipping take?</strong></p>
<p>A: Standard shipping typically takes 3-5 business days.</p>

<p><strong>Q: Can I track my order?</strong></p>
<p>A: Yes! Once your order ships, you'll receive a tracking number via email.</p>`,

      POLICY: `<h2>${title}</h2>
<p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>

<h3>Overview</h3>
<p>This ${title.toLowerCase()} outlines the terms and conditions for ${storeName}. Please read carefully.</p>

<h3>Scope</h3>
<p>This policy applies to all customers and users of ${storeName} services.</p>

<h3>Terms</h3>
<p>By using our services, you agree to comply with and be bound by the following terms and conditions.</p>

<h3>Contact Us</h3>
<p>If you have any questions about this ${title.toLowerCase()}, please contact us.</p>`,

      LANDING: `<h2>${title}</h2>
<p class="lead">Discover amazing products and services at ${storeName}.</p>

<h3>Why Choose Us?</h3>
<ul>
<li><strong>Quality Products</strong> - Carefully curated selection</li>
<li><strong>Great Prices</strong> - Competitive pricing guaranteed</li>
<li><strong>Fast Shipping</strong> - Quick and reliable delivery</li>
<li><strong>24/7 Support</strong> - Always here to help</li>
</ul>

<h3>Featured Highlights</h3>
<p>Explore our latest collections and exclusive offers designed just for you.</p>

<h3>Get Started Today</h3>
<p>Join thousands of satisfied customers. Shop now and experience the difference!</p>`,

      CUSTOM: `<h2>${title}</h2>
<p>Welcome to ${storeName}'s ${title.toLowerCase()} page.</p>

<h3>About This Page</h3>
<p>This is a custom page where you can add your own unique content.</p>

<h3>Your Content Here</h3>
<p>Edit this section to add your specific information, images, and more.</p>`,
    };

    const content = contentTemplates[type] || contentTemplates.STATIC;
    const excerpt = excerptTemplates[type] || excerptTemplates.STATIC;

    setCreateForm({
      ...createForm,
      excerpt,
      content,
      metaTitle,
      metaDescription: excerpt,
    });

    showSuccess('Content Generated!', 'Fields have been auto-filled based on your page title and type.');
  };

  const handleCreatePage = async () => {
    if (!createForm.title || !createForm.slug) {
      showError('Error', 'Title and slug are required');
      return;
    }

    // Check for duplicate slug
    if (pages.some((p) => p.slug === createForm.slug)) {
      showError('Error', 'A page with this slug already exists');
      return;
    }

    const now = new Date().toISOString();
    const newPage: ContentPage = {
      id: crypto.randomUUID(),
      type: createForm.type,
      status: 'DRAFT',
      title: createForm.title,
      slug: createForm.slug,
      excerpt: createForm.excerpt || undefined,
      content: createForm.content,
      metaTitle: createForm.metaTitle || undefined,
      metaDescription: createForm.metaDescription || undefined,
      viewCount: 0,
      showInMenu: createForm.showInMenu,
      showInFooter: createForm.showInFooter,
      isFeatured: createForm.isFeatured,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await savePages([...pages, newPage]);
      setShowCreateModal(false);
      setCreateForm(DEFAULT_CREATE_FORM);
      showSuccess('Success', 'Page created successfully!');
    } catch (error) {
      showError('Error', 'Failed to create page');
    }
  };

  const handleUpdatePage = async () => {
    if (!editForm) return;

    // Check for duplicate slug (excluding current page)
    if (pages.some((p) => p.slug === editForm.slug && p.id !== editForm.id)) {
      showError('Error', 'A page with this slug already exists');
      return;
    }

    const updatedPages = pages.map((p) =>
      p.id === editForm.id ? { ...editForm, updatedAt: new Date().toISOString() } : p
    );

    try {
      await savePages(updatedPages);
      setShowEditModal(false);
      setEditForm(null);
      setSelectedPage(null);
      showSuccess('Success', 'Page updated successfully!');
    } catch (error) {
      showError('Error', 'Failed to update page');
    }
  };

  const handlePublish = async (id: string) => {
    const updatedPages = pages.map((p) =>
      p.id === id
        ? {
            ...p,
            status: 'PUBLISHED' as ContentPageStatus,
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : p
    );

    try {
      await savePages(updatedPages);
      showSuccess('Success', 'Page published!');
    } catch (error) {
      showError('Error', 'Failed to publish page');
    }
  };

  const handleUnpublish = async (id: string) => {
    const updatedPages = pages.map((p) =>
      p.id === id
        ? {
            ...p,
            status: 'DRAFT' as ContentPageStatus,
            updatedAt: new Date().toISOString(),
          }
        : p
    );

    try {
      await savePages(updatedPages);
      showSuccess('Success', 'Page unpublished');
    } catch (error) {
      showError('Error', 'Failed to unpublish page');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Page',
      message: 'Are you sure you want to delete this page? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (confirmed) {
      const updatedPages = pages.filter((p) => p.id !== id);
      try {
        await savePages(updatedPages);
        showSuccess('Success', 'Page deleted');
      } catch (error) {
        showError('Error', 'Failed to delete page');
      }
    }
  };

  const openEditModal = (page: ContentPage) => {
    setSelectedPage(page);
    setEditForm({ ...page });
    setShowEditModal(true);
  };

  const handleStorefrontSelect = (storefront: Storefront) => {
    setSelectedStorefront(storefront);
  };

  const handleStorefrontCreated = (storefront: Storefront) => {
    setStorefronts((prev) => [...prev, storefront]);
    setSelectedStorefront(storefront);
  };

  // Show loading state
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
    <PermissionGate
      permission={Permission.SETTINGS_VIEW}
      fallback="styled"
      fallbackTitle="Content Pages"
      fallbackDescription="You don't have permission to view content pages settings."
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Content Pages"
          description="Manage your website content, blog posts, and pages"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Content Pages' },
          ]}
          actions={
            <Button
              onClick={() => setShowCreateModal(true)}
              disabled={!selectedStorefront || saving}
              className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Page
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
              <p className="text-muted-foreground">Loading content pages...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Pages</p>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-primary">
                    {stats.totalPages}
                  </p>
                </div>

                <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">Published</p>
                    <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                      <Globe className="h-6 w-6 text-success" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-success">
                    {stats.publishedPages}
                  </p>
                </div>

                <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                    <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                      <Edit className="h-6 w-6 text-warning" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-warning">
                    {stats.draftPages}
                  </p>
                </div>

                <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Eye className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-primary">
                    {formatNumber(stats.totalViews)}
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search pages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Type
                    </label>
                    <Select value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Status
                    </label>
                    <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
                  </div>
                </div>
              </div>

              {/* Pages Table */}
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                {filteredPages.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {pages.length === 0 ? 'No Content Pages Yet' : 'No Pages Match Filters'}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {pages.length === 0
                        ? 'Create your first content page to get started.'
                        : 'Try adjusting your search or filter criteria.'}
                    </p>
                    {pages.length === 0 && (
                      <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-primary text-primary-foreground hover:opacity-90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Page
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Views
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                            Updated
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredPages.map((page) => (
                          <tr key={page.id} className="hover:bg-muted transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-semibold text-foreground">{page.title}</p>
                                <p className="text-sm text-muted-foreground font-mono">/{page.slug}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {page.showInMenu && (
                                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
                                      Menu
                                    </span>
                                  )}
                                  {page.showInFooter && (
                                    <span className="text-xs bg-success-muted text-success-muted-foreground px-2 py-0.5 rounded-full font-semibold">
                                      Footer
                                    </span>
                                  )}
                                  {page.isFeatured && (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                                      Featured
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={cn(
                                  'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border',
                                  getTypeColor(page.type)
                                )}
                              >
                                {page.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={cn(
                                  'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border',
                                  getStatusColor(page.status)
                                )}
                              >
                                {page.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-foreground">
                              <div className="flex items-center justify-end gap-1">
                                <Eye className="h-3 w-3 text-muted-foreground" />
                                {formatNumber(page.viewCount)}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {new Date(page.updatedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex gap-2 justify-end">
                                {page.status === 'DRAFT' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePublish(page.id)}
                                    disabled={saving}
                                    title="Publish"
                                    aria-label="Publish page"
                                  >
                                    <Globe className="h-4 w-4 text-success" aria-hidden="true" />
                                  </Button>
                                )}
                                {page.status === 'PUBLISHED' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUnpublish(page.id)}
                                    disabled={saving}
                                    title="Unpublish"
                                    aria-label="Unpublish page"
                                  >
                                    <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(page)}
                                  disabled={saving}
                                  title="Edit"
                                  aria-label="Edit page"
                                >
                                  <Edit className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(page.id)}
                                  disabled={saving}
                                  title="Delete"
                                  aria-label="Delete page"
                                >
                                  <Trash2 className="h-4 w-4 text-error" aria-hidden="true" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )
        ) : (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Create Your First Storefront
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by creating a storefront to manage content pages.
            </p>
          </div>
        )}
      </div>

      {/* Create Page Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => {
            setShowCreateModal(false);
            setIsModalExpanded(false);
          }}
        >
          <div
            className={cn(
              'bg-card rounded-xl shadow-2xl flex flex-col animate-in zoom-in duration-200 transition-all',
              isModalExpanded
                ? 'w-full h-full max-w-none max-h-none rounded-none'
                : 'max-w-4xl w-full max-h-[90vh]'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-primary/5 rounded-t-xl shrink-0">
              <div>
                <h2 className="text-xl font-bold text-foreground">Create New Page</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Add a new content page for {selectedStorefront?.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalExpanded(!isModalExpanded)}
                  className="p-2 rounded-lg hover:bg-white/80 text-muted-foreground hover:text-foreground transition-colors"
                  title={isModalExpanded ? 'Minimize' : 'Expand'}
                >
                  {isModalExpanded ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setIsModalExpanded(false);
                  }}
                  className="p-2 rounded-lg hover:bg-white/80 text-muted-foreground hover:text-foreground transition-colors"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className={cn(
              'p-6 overflow-y-auto flex-1',
              isModalExpanded ? 'px-8' : ''
            )}>
              <div className={cn(
                'grid gap-6',
                isModalExpanded ? 'grid-cols-3' : 'grid-cols-2'
              )}>
                {/* Left Column - Basic Info */}
                <div className={cn('space-y-4', isModalExpanded ? 'col-span-1' : 'col-span-2')}>
                  <div className="bg-muted rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">Page Details</h3>
                      <Button
                        type="button"
                        onClick={autoGenerateContent}
                        disabled={!createForm.title}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all hover:shadow-md"
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        Auto Generate
                      </Button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Page Title <span className="text-error">*</span>
                      </label>
                      <Input
                        placeholder="About Us"
                        value={createForm.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter a title, then click "Auto Generate" to fill all fields
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        URL Slug <span className="text-error">*</span>
                      </label>
                      <Input
                        placeholder="about-us"
                        value={createForm.slug}
                        onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">URL: /{createForm.slug || 'page-slug'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Page Type
                      </label>
                      <Select
                        value={createForm.type}
                        onChange={(value) => setCreateForm({ ...createForm, type: value as ContentPageType })}
                        options={typeOptions.filter((t) => t.value !== '')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Display Options
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={createForm.showInMenu}
                            onChange={(e) =>
                              setCreateForm({ ...createForm, showInMenu: e.target.checked })
                            }
                            className="rounded border-border text-primary focus:ring-ring"
                          />
                          Show in Menu
                        </label>
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={createForm.showInFooter}
                            onChange={(e) =>
                              setCreateForm({ ...createForm, showInFooter: e.target.checked })
                            }
                            className="rounded border-border text-primary focus:ring-ring"
                          />
                          Show in Footer
                        </label>
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={createForm.isFeatured}
                            onChange={(e) =>
                              setCreateForm({ ...createForm, isFeatured: e.target.checked })
                            }
                            className="rounded border-border text-primary focus:ring-ring"
                          />
                          Featured Page
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Excerpt
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
                        rows={3}
                        placeholder="Short description of this page..."
                        value={createForm.excerpt}
                        onChange={(e) => setCreateForm({ ...createForm, excerpt: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* SEO Section */}
                  <div className="bg-muted rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">SEO Settings</h3>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Meta Title
                      </label>
                      <Input
                        placeholder="About Us - Company Name"
                        value={createForm.metaTitle}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, metaTitle: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Meta Description
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
                        rows={3}
                        placeholder="Meta description for search engines..."
                        value={createForm.metaDescription}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, metaDescription: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Content Editor */}
                <div className={cn(isModalExpanded ? 'col-span-2' : 'col-span-2')}>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Content
                  </label>
                  <RichTextEditor
                    value={createForm.content}
                    onChange={(value) => setCreateForm({ ...createForm, content: value })}
                    placeholder="Start writing your page content..."
                    minHeight={isModalExpanded ? '500px' : '300px'}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border px-6 py-4 flex justify-end gap-3 bg-muted rounded-b-xl shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setIsModalExpanded(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePage}
                disabled={saving || !createForm.title || !createForm.slug}
                className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Page
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Page Modal */}
      {showEditModal && editForm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => {
            setShowEditModal(false);
            setEditForm(null);
            setIsModalExpanded(false);
          }}
        >
          <div
            className={cn(
              'bg-card rounded-xl shadow-2xl flex flex-col animate-in zoom-in duration-200 transition-all',
              isModalExpanded
                ? 'w-full h-full max-w-none max-h-none rounded-none'
                : 'max-w-4xl w-full max-h-[90vh]'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-primary/5 rounded-t-xl shrink-0">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Edit Page</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">/{editForm.slug}</p>
                </div>
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-semibold',
                    editForm.status === 'PUBLISHED'
                      ? 'bg-success-muted text-success-muted-foreground'
                      : editForm.status === 'DRAFT'
                      ? 'bg-warning-muted text-warning'
                      : 'bg-muted text-foreground'
                  )}
                >
                  {editForm.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalExpanded(!isModalExpanded)}
                  className="p-2 rounded-lg hover:bg-white/80 text-muted-foreground hover:text-foreground transition-colors"
                  title={isModalExpanded ? 'Minimize' : 'Expand'}
                >
                  {isModalExpanded ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditForm(null);
                    setIsModalExpanded(false);
                  }}
                  className="p-2 rounded-lg hover:bg-white/80 text-muted-foreground hover:text-foreground transition-colors"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className={cn(
              'p-6 overflow-y-auto flex-1',
              isModalExpanded ? 'px-8' : ''
            )}>
              <div className={cn(
                'grid gap-6',
                isModalExpanded ? 'grid-cols-3' : 'grid-cols-2'
              )}>
                {/* Left Column - Basic Info */}
                <div className={cn('space-y-4', isModalExpanded ? 'col-span-1' : 'col-span-2')}>
                  <div className="bg-muted rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">Page Details</h3>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Page Title <span className="text-error">*</span>
                      </label>
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        URL Slug <span className="text-error">*</span>
                      </label>
                      <Input
                        value={editForm.slug}
                        onChange={(e) => setEditForm({ ...editForm, slug: generateSlug(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">URL: /{editForm.slug}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Page Type
                      </label>
                      <Select
                        value={editForm.type}
                        onChange={(value) => setEditForm({ ...editForm, type: value as ContentPageType })}
                        options={typeOptions.filter((t) => t.value !== '')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Display Options
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.showInMenu}
                            onChange={(e) => setEditForm({ ...editForm, showInMenu: e.target.checked })}
                            className="rounded border-border text-primary focus:ring-ring"
                          />
                          Show in Menu
                        </label>
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.showInFooter}
                            onChange={(e) => setEditForm({ ...editForm, showInFooter: e.target.checked })}
                            className="rounded border-border text-primary focus:ring-ring"
                          />
                          Show in Footer
                        </label>
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.isFeatured}
                            onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })}
                            className="rounded border-border text-primary focus:ring-ring"
                          />
                          Featured Page
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Excerpt
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
                        rows={3}
                        value={editForm.excerpt || ''}
                        onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* SEO Section */}
                  <div className="bg-muted rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">SEO Settings</h3>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Meta Title
                      </label>
                      <Input
                        value={editForm.metaTitle || ''}
                        onChange={(e) => setEditForm({ ...editForm, metaTitle: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Meta Description
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
                        rows={3}
                        value={editForm.metaDescription || ''}
                        onChange={(e) => setEditForm({ ...editForm, metaDescription: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="bg-muted rounded-lg p-4">
                    <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide mb-4">Page Statistics</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-card border border-primary/30 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-primary">
                          {formatNumber(editForm.viewCount)}
                        </p>
                        <p className="text-xs text-primary mt-1">Views</p>
                      </div>
                      <div className="bg-card border border-success/30 rounded-lg p-3 text-center">
                        <p className="text-xs font-bold text-success">
                          {editForm.publishedAt
                            ? new Date(editForm.publishedAt).toLocaleDateString()
                            : 'Not Published'}
                        </p>
                        <p className="text-xs text-success mt-1">Published</p>
                      </div>
                      <div className="bg-card border border-primary/30 rounded-lg p-3 text-center">
                        <p className="text-xs font-bold text-primary">
                          {new Date(editForm.updatedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-primary mt-1">Updated</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Content Editor */}
                <div className={cn(isModalExpanded ? 'col-span-2' : 'col-span-2')}>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Content
                  </label>
                  <RichTextEditor
                    value={editForm.content}
                    onChange={(value) => setEditForm({ ...editForm, content: value })}
                    placeholder="Edit your page content..."
                    minHeight={isModalExpanded ? '500px' : '300px'}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border px-6 py-4 flex justify-between items-center bg-muted rounded-b-xl shrink-0">
              <div className="flex items-center gap-2">
                {editForm.status === 'DRAFT' && (
                  <Button
                    variant="outline"
                    onClick={() => handlePublish(editForm.id)}
                    disabled={saving}
                    className="text-success border-success/40 hover:bg-success-muted"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Publish
                  </Button>
                )}
                {editForm.status === 'PUBLISHED' && (
                  <Button
                    variant="outline"
                    onClick={() => handleUnpublish(editForm.id)}
                    disabled={saving}
                    className="text-muted-foreground border-border hover:bg-muted"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Unpublish
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditForm(null);
                    setIsModalExpanded(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdatePage}
                  disabled={saving || !editForm.title || !editForm.slug}
                  className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGate>
  );
}
