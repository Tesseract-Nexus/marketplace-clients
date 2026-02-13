'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  FileText,
  Loader2,
  Save,
  Maximize2,
  Minimize2,
  X,
  Menu,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/Select';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { cn } from '@/lib/utils';
import { useDialog } from '@/contexts/DialogContext';
import { useToast } from '@/contexts/ToastContext';
import { storefrontApi, setCurrentStorefrontId, setCurrentTenantId } from '@/lib/api/storefront';
import type { ContentPage, ContentPageType, ContentPageStatus } from '@/lib/types/settings';

interface ContentPagesEditorProps {
  storefrontId: string;
  storefrontSlug?: string;
  tenantId?: string;
  className?: string;
}

const PAGE_TYPES: { value: ContentPageType; label: string; description: string }[] = [
  { value: 'STATIC', label: 'Static Page', description: 'General information page' },
  { value: 'POLICY', label: 'Policy', description: 'Privacy, Terms, etc.' },
  { value: 'FAQ', label: 'FAQ', description: 'Frequently asked questions' },
  { value: 'BLOG', label: 'Blog Post', description: 'News and updates' },
  { value: 'LANDING', label: 'Landing Page', description: 'Marketing pages' },
  { value: 'CUSTOM', label: 'Custom', description: 'Fully custom page' },
];

const DEFAULT_PAGE: Omit<ContentPage, 'id' | 'createdAt' | 'updatedAt'> = {
  type: 'STATIC',
  status: 'DRAFT',
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  metaTitle: '',
  metaDescription: '',
  viewCount: 0,
  showInMenu: false,
  showInFooter: true,
  isFeatured: false,
};

export function ContentPagesEditor({ storefrontId, storefrontSlug, tenantId, className }: ContentPagesEditorProps) {
  const { showConfirm } = useDialog();
  const toast = useToast();
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'mark8ly.com';

  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isModalExpanded, setIsModalExpanded] = useState(false);

  // Set storefront context for API calls
  useEffect(() => {
    if (storefrontId) {
      setCurrentStorefrontId(storefrontId);
    }
    if (tenantId) {
      setCurrentTenantId(tenantId);
    }
  }, [storefrontId, tenantId]);

  // Load content pages
  useEffect(() => {
    if (storefrontId) {
      loadSettings();
    }
  }, [storefrontId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Use same API as theme settings
      const response = await storefrontApi.settings.getSettings();
      if (response.success && response.data?.contentPages) {
        setPages(response.data.contentPages as ContentPage[]);
      } else {
        setPages([]);
      }
    } catch (error) {
      console.error('Failed to load content pages:', error);
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  const savePages = async (updatedPages: ContentPage[]) => {
    try {
      setSaving(true);
      // Save via storefront settings API (same as theme)
      const response = await storefrontApi.settings.updateSettings({
        contentPages: updatedPages,
      } as any);

      if (response.success) {
        setPages(updatedPages);
        toast.success('Success', 'Content pages saved successfully');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Error', 'Failed to save content pages');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePage = () => {
    const newPage: ContentPage = {
      ...DEFAULT_PAGE,
      id: `page-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingPage(newPage);
    setIsCreating(true);
  };

  const handleEditPage = (page: ContentPage) => {
    setEditingPage({ ...page });
    setIsCreating(false);
  };

  const handleSavePage = async () => {
    if (!editingPage) return;

    if (!editingPage.title.trim()) {
      toast.error('Validation Error', 'Title is required');
      return;
    }

    if (!editingPage.slug.trim()) {
      toast.error('Validation Error', 'Slug is required');
      return;
    }

    const updatedPage = {
      ...editingPage,
      updatedAt: new Date().toISOString(),
    };

    let updatedPages: ContentPage[];
    if (isCreating) {
      updatedPages = [...pages, updatedPage];
    } else {
      updatedPages = pages.map((p) => (p.id === updatedPage.id ? updatedPage : p));
    }

    try {
      await savePages(updatedPages);
      setEditingPage(null);
      setIsCreating(false);
    } catch {
      // Error already shown
    }
  };

  const handleDeletePage = async (page: ContentPage) => {
    const confirmed = await showConfirm({
      title: 'Delete Page',
      message: `Are you sure you want to delete "${page.title}"? This cannot be undone.`,
    });

    if (confirmed) {
      const updatedPages = pages.filter((p) => p.id !== page.id);
      await savePages(updatedPages);
    }
  };

  const handlePublish = async (page: ContentPage) => {
    const updatedPages = pages.map((p) =>
      p.id === page.id
        ? { ...p, status: 'PUBLISHED' as ContentPageStatus, publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : p
    );
    await savePages(updatedPages);
  };

  const handleUnpublish = async (page: ContentPage) => {
    const updatedPages = pages.map((p) =>
      p.id === page.id
        ? { ...p, status: 'DRAFT' as ContentPageStatus, updatedAt: new Date().toISOString() }
        : p
    );
    await savePages(updatedPages);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const filteredPages = pages.filter(
    (page) =>
      !searchQuery ||
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: pages.length,
    published: pages.filter((p) => p.status === 'PUBLISHED').length,
    draft: pages.filter((p) => p.status === 'DRAFT').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/30">
          <p className="text-2xl font-bold text-primary">{stats.total}</p>
          <p className="text-sm text-primary">Total Pages</p>
        </div>
        <div className="bg-success/10 rounded-xl p-4 border border-success/30">
          <p className="text-2xl font-bold text-success-foreground">{stats.published}</p>
          <p className="text-sm text-success">Published</p>
        </div>
        <div className="bg-warning/10 rounded-xl p-4 border border-warning/30">
          <p className="text-2xl font-bold text-warning">{stats.draft}</p>
          <p className="text-sm text-warning">Drafts</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleCreatePage} className="gap-2 bg-primary text-primary-foreground">
          <Plus className="h-4 w-4" />
          New Page
        </Button>
      </div>

      {/* Pages List */}
      <div className="bg-muted rounded-xl border border-border overflow-hidden">
        {filteredPages.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              {pages.length === 0 ? 'No content pages yet' : 'No pages match your search'}
            </p>
            {pages.length === 0 && (
              <Button onClick={handleCreatePage} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Page
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPages.map((page) => (
              <div
                key={page.id}
                className="p-4 bg-card hover:bg-muted transition-colors flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground truncate">{page.title}</p>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0',
                        page.status === 'PUBLISHED'
                          ? 'bg-success-muted text-success-foreground border-success/30'
                          : 'bg-warning-muted text-warning border-warning/30'
                      )}
                    >
                      {page.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">/pages/{page.slug}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {page.showInMenu && <span className="flex items-center gap-1"><Menu className="h-3 w-3" /> Menu</span>}
                    {page.showInFooter && <span className="flex items-center gap-1"><ChevronDown className="h-3 w-3" /> Footer</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  {storefrontSlug && page.status === 'PUBLISHED' && (
                    <a
                      href={`https://${storefrontSlug}.${baseDomain}/pages/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {page.status === 'DRAFT' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePublish(page)}
                      disabled={saving}
                      className="text-success hover:text-success-foreground hover:bg-success-muted"
                    >
                      Publish
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnpublish(page)}
                      disabled={saving}
                      className="text-warning hover:text-warning hover:bg-warning-muted"
                    >
                      Unpublish
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleEditPage(page)} className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePage(page)}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingPage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className={cn(
              'bg-card rounded-2xl shadow-2xl flex flex-col transition-all duration-300',
              isModalExpanded ? 'w-full h-full max-w-none' : 'w-full max-w-4xl max-h-[90vh]'
            )}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h3 className="text-lg font-bold text-foreground">
                {isCreating ? 'Create New Page' : `Edit: ${editingPage.title || 'Untitled'}`}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsModalExpanded(!isModalExpanded)}
                  className="h-8 w-8"
                >
                  {isModalExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingPage(null);
                    setIsCreating(false);
                  }}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
                  <Input
                    value={editingPage.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setEditingPage({
                        ...editingPage,
                        title,
                        slug: editingPage.slug || generateSlug(title),
                      });
                    }}
                    placeholder="About Us"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">URL Slug *</label>
                  <Input
                    value={editingPage.slug}
                    onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                    placeholder="about-us"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Will be accessible at /pages/{editingPage.slug || 'slug'}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Page Type</label>
                  <Select
                    value={editingPage.type}
                    onChange={(value) => setEditingPage({ ...editingPage, type: value as ContentPageType })}
                    options={PAGE_TYPES.map((type) => ({ value: type.value, label: type.label }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                  <Select
                    value={editingPage.status}
                    onChange={(value) => setEditingPage({ ...editingPage, status: value as ContentPageStatus })}
                    options={[
                      { value: 'DRAFT', label: 'Draft' },
                      { value: 'PUBLISHED', label: 'Published' },
                      { value: 'ARCHIVED', label: 'Archived' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Excerpt</label>
                <Input
                  value={editingPage.excerpt || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, excerpt: e.target.value })}
                  placeholder="A brief description of this page..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Content</label>
                <RichTextEditor
                  value={editingPage.content}
                  onChange={(content) => setEditingPage({ ...editingPage, content })}
                  placeholder="Write your page content here..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Meta Title (SEO)</label>
                  <Input
                    value={editingPage.metaTitle || ''}
                    onChange={(e) => setEditingPage({ ...editingPage, metaTitle: e.target.value })}
                    placeholder="Page title for search engines"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Meta Description (SEO)</label>
                  <Input
                    value={editingPage.metaDescription || ''}
                    onChange={(e) => setEditingPage({ ...editingPage, metaDescription: e.target.value })}
                    placeholder="Description for search engines"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="font-medium text-foreground mb-3">Display Options</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="p-3 rounded-lg border border-border hover:bg-muted">
                    <Checkbox
                      checked={editingPage.showInMenu}
                      onCheckedChange={(checked) => setEditingPage({ ...editingPage, showInMenu: checked })}
                      label="Show in Menu"
                      description="Add to navigation"
                    />
                  </div>
                  <div className="p-3 rounded-lg border border-border hover:bg-muted">
                    <Checkbox
                      checked={editingPage.showInFooter}
                      onCheckedChange={(checked) => setEditingPage({ ...editingPage, showInFooter: checked })}
                      label="Show in Footer"
                      description="Add to footer links"
                    />
                  </div>
                  <div className="p-3 rounded-lg border border-border hover:bg-muted">
                    <Checkbox
                      checked={editingPage.isFeatured}
                      onCheckedChange={(checked) => setEditingPage({ ...editingPage, isFeatured: checked })}
                      label="Featured"
                      description="Highlight this page"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingPage(null);
                  setIsCreating(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePage}
                disabled={saving}
                className="gap-2 bg-primary text-primary-foreground"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isCreating ? 'Create Page' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
