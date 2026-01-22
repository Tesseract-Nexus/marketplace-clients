'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  Loader2,
  ExternalLink,
  Search,
  MoreVertical,
  Copy,
  EyeOff,
  GripVertical,
  Palette,
  Menu,
  Globe,
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

interface StorefrontPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

// Mock pages data - in production this would come from API
const MOCK_PAGES: StorefrontPage[] = [
  {
    id: '1',
    title: 'About Us',
    slug: 'about',
    content: '<h1>About Our Store</h1><p>Welcome to our store...</p>',
    isPublished: true,
    metaTitle: 'About Us - Our Story',
    metaDescription: 'Learn about our company and mission',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: '2',
    title: 'Contact',
    slug: 'contact',
    content: '<h1>Contact Us</h1><p>Get in touch with us...</p>',
    isPublished: true,
    metaTitle: 'Contact Us',
    metaDescription: 'Reach out to our team',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-18T09:15:00Z',
  },
  {
    id: '3',
    title: 'Shipping Policy',
    slug: 'shipping',
    content: '<h1>Shipping Policy</h1><p>Our shipping information...</p>',
    isPublished: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '4',
    title: 'Return Policy',
    slug: 'returns',
    content: '<h1>Return Policy</h1><p>Our return process...</p>',
    isPublished: false,
    createdAt: '2024-01-16T11:00:00Z',
    updatedAt: '2024-01-16T11:00:00Z',
  },
];

export default function StorefrontPagesPage() {
  const params = useParams();
  const router = useRouter();
  const storefrontId = params?.id as string;
  const { showSuccess, showError, showConfirm } = useDialog();
  const { currentTenant } = useTenant();

  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [pages, setPages] = useState<StorefrontPage[]>(MOCK_PAGES);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPage, setEditingPage] = useState<StorefrontPage | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

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
      }
    } catch (error) {
      console.error('Error loading storefront:', error);
      showError('Error', 'Failed to load storefront');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePage = () => {
    setEditingPage({
      id: '',
      title: '',
      slug: '',
      content: '',
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsEditorOpen(true);
  };

  const handleEditPage = (page: StorefrontPage) => {
    setEditingPage(page);
    setIsEditorOpen(true);
  };

  const handleDeletePage = async (page: StorefrontPage) => {
    const confirmed = await showConfirm({
      title: 'Delete Page',
      message: `Are you sure you want to delete "${page.title}"? This cannot be undone.`,
    });

    if (confirmed) {
      setPages(pages.filter((p) => p.id !== page.id));
      showSuccess('Success', 'Page deleted successfully');
    }
  };

  const handleTogglePublish = (page: StorefrontPage) => {
    setPages(
      pages.map((p) =>
        p.id === page.id ? { ...p, isPublished: !p.isPublished } : p
      )
    );
    showSuccess('Success', `Page ${page.isPublished ? 'unpublished' : 'published'}`);
  };

  const handleDuplicatePage = (page: StorefrontPage) => {
    const newPage: StorefrontPage = {
      ...page,
      id: Date.now().toString(),
      title: `${page.title} (Copy)`,
      slug: `${page.slug}-copy`,
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPages([...pages, newPage]);
    showSuccess('Success', 'Page duplicated');
  };

  const handleSavePage = () => {
    if (!editingPage) return;

    if (editingPage.id) {
      // Update existing
      setPages(pages.map((p) => (p.id === editingPage.id ? editingPage : p)));
    } else {
      // Create new
      setPages([...pages, { ...editingPage, id: Date.now().toString() }]);
    }
    setIsEditorOpen(false);
    setEditingPage(null);
    showSuccess('Success', 'Page saved successfully');
  };

  const filteredPages = pages.filter(
    (page) =>
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-pink-50/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pages...</p>
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
      fallbackTitle="Storefront Pages Access Required"
      fallbackDescription="You don't have the required permissions to view storefront pages. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-pink-50/20">
      <div className="p-8 space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title={`Pages: ${storefront.name}`}
          description="Create and manage custom pages for your storefront"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Storefronts', href: '/storefronts' },
            { label: storefront.name, href: `/storefronts/${storefrontId}/edit` },
            { label: 'Pages' },
          ]}
          actions={
            <div className="flex gap-2">
              <a
                href={getStorefrontUrl(storefront)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted"
              >
                <ExternalLink className="h-4 w-4" />
                View Store
              </a>
              <Button
                onClick={handleCreatePage}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Page
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
          <Link href={`/storefronts/${storefrontId}/branding`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Globe className="h-4 w-4" />
              Branding
            </Button>
          </Link>
          <Link href={`/storefronts/${storefrontId}/navigation`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Menu className="h-4 w-4" />
              Navigation
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Pages List */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {filteredPages.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No pages found</h3>
              <p className="text-muted-foreground mb-4">Create your first custom page</p>
              <Button onClick={handleCreatePage} className="bg-purple-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Page
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredPages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted transition-colors group"
                >
                  <div className="text-gray-300 cursor-grab">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium text-foreground">{page.title}</h4>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          page.isPublished
                            ? 'bg-success-muted text-success-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {page.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">/{page.slug}</p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={getStorefrontUrl(storefront, `/${page.slug}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => handleEditPage(page)}
                      className="p-2 rounded-lg hover:bg-primary/10 text-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleTogglePublish(page)}
                      className={cn(
                        'p-2 rounded-lg',
                        page.isPublished
                          ? 'hover:bg-orange-50 text-orange-600'
                          : 'hover:bg-success-muted text-success'
                      )}
                    >
                      {page.isPublished ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDuplicatePage(page)}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePage(page)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Page Editor Modal */}
        {isEditorOpen && editingPage && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {editingPage.id ? 'Edit Page' : 'Create New Page'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditorOpen(false);
                    setEditingPage(null);
                  }}
                >
                  Cancel
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Page Title
                    </label>
                    <input
                      type="text"
                      value={editingPage.title}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, title: e.target.value })
                      }
                      placeholder="About Us"
                      className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      URL Slug
                    </label>
                    <div className="flex items-center">
                      <span className="text-muted-foreground text-sm mr-1">/</span>
                      <input
                        type="text"
                        value={editingPage.slug}
                        onChange={(e) =>
                          setEditingPage({
                            ...editingPage,
                            slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                          })
                        }
                        placeholder="about-us"
                        className="flex-1 px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Page Content
                  </label>
                  <textarea
                    value={editingPage.content}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, content: e.target.value })
                    }
                    placeholder="Enter your page content (HTML supported)..."
                    rows={12}
                    className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You can use HTML to format your content
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Meta Title (SEO)
                    </label>
                    <input
                      type="text"
                      value={editingPage.metaTitle || ''}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, metaTitle: e.target.value })
                      }
                      placeholder="Page title for search engines"
                      className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Meta Description (SEO)
                    </label>
                    <input
                      type="text"
                      value={editingPage.metaDescription || ''}
                      onChange={(e) =>
                        setEditingPage({
                          ...editingPage,
                          metaDescription: e.target.value,
                        })
                      }
                      placeholder="Brief description for search engines"
                      className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPage.isPublished}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, isPublished: e.target.checked })
                    }
                    className="rounded border-border text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium">Publish this page</span>
                </label>
              </div>

              <div className="p-6 border-t border-border flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditorOpen(false);
                    setEditingPage(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePage}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Page
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </PermissionGate>
  );
}
