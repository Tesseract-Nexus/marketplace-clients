'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Menu,
  Plus,
  Edit,
  Trash2,
  Save,
  Loader2,
  ExternalLink,
  GripVertical,
  ChevronRight,
  Link as LinkIcon,
  Home,
  ShoppingBag,
  Tag,
  FileText,
  Phone,
  Palette,
  Globe,
  Layout,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { useDialog } from '@/contexts/DialogContext';
import { useToast } from '@/contexts/ToastContext';
import { useTenant } from '@/contexts/TenantContext';
import { useUser } from '@/contexts/UserContext';
import { storefrontService } from '@/lib/services/storefrontService';
import { storefrontApi, setCurrentStorefrontId, setCurrentTenantId, setCurrentUserInfo } from '@/lib/api/storefront';
import { Storefront, StorefrontNavLink } from '@/lib/api/types';
import { getStorefrontUrl } from '@/lib/utils/tenant';

// Link type icons
const LINK_ICONS: Record<string, React.ElementType> = {
  home: Home,
  products: ShoppingBag,
  categories: Tag,
  page: FileText,
  contact: Phone,
  custom: LinkIcon,
};

// Predefined link templates
const LINK_TEMPLATES = [
  { label: 'Home', href: '/', icon: 'home' },
  { label: 'Products', href: '/products', icon: 'products' },
  { label: 'Categories', href: '/categories', icon: 'categories' },
  { label: 'About', href: '/about', icon: 'page' },
  { label: 'Contact', href: '/contact', icon: 'contact' },
];

export default function StorefrontNavigationPage() {
  const params = useParams();
  const router = useRouter();
  const storefrontId = params?.id as string;
  const { showConfirm } = useDialog();
  const toast = useToast();
  const { currentTenant } = useTenant();
  const { user } = useUser();

  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [headerLinks, setHeaderLinks] = useState<StorefrontNavLink[]>([]);
  const [footerLinks, setFooterLinks] = useState<StorefrontNavLink[]>([]);
  const [savedHeaderLinks, setSavedHeaderLinks] = useState<StorefrontNavLink[]>([]);
  const [savedFooterLinks, setSavedFooterLinks] = useState<StorefrontNavLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'header' | 'footer'>('header');
  const [editingLink, setEditingLink] = useState<StorefrontNavLink | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Set tenant ID for API calls
  useEffect(() => {
    if (currentTenant?.id) {
      setCurrentTenantId(currentTenant.id);
    }
  }, [currentTenant?.id]);

  // Set user info for API authentication
  useEffect(() => {
    if (user?.id) {
      setCurrentUserInfo(user.id, user.email || null);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (storefrontId) {
      loadStorefrontAndNavigation();
    }
  }, [storefrontId]);

  const loadStorefrontAndNavigation = async () => {
    setIsLoading(true);
    try {
      // Load storefront
      const sfResponse = await storefrontService.getStorefront(storefrontId);
      if (sfResponse.data) {
        setStorefront(sfResponse.data);
        setCurrentStorefrontId(storefrontId);
      }

      // Load settings for navigation
      const settingsResponse = await storefrontApi.settings.getSettings();
      if (settingsResponse.success && settingsResponse.data) {
        const navLinks = settingsResponse.data.headerConfig?.navLinks || [];
        // Footer uses linkGroups structure - flatten for simple editing
        const footerLinkGroups = settingsResponse.data.footerConfig?.linkGroups || [];
        const footerNavLinks: StorefrontNavLink[] = footerLinkGroups.flatMap(group =>
          (group.links || []).map((link, index) => ({
            id: link.id || String(index),
            label: link.label,
            href: link.href,
            isExternal: link.isExternal,
            position: link.position ?? index,
          }))
        );
        setHeaderLinks(navLinks);
        setFooterLinks(footerNavLinks);
        setSavedHeaderLinks(navLinks);
        setSavedFooterLinks(footerNavLinks);
      }
    } catch (error) {
      console.error('Error loading storefront:', error);
      toast.error('Error', 'Failed to load navigation settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await storefrontApi.settings.getSettings();
      if (response.success && response.data) {
        // Convert footer links back to linkGroups structure
        const footerLinkGroup = {
          id: 'main',
          title: 'Quick Links',
          links: footerLinks.map((link, index) => ({
            id: String(index),
            label: link.label,
            href: link.href,
            isExternal: link.isExternal || false,
            position: index,
          })),
        };

        const updatedSettings = {
          ...response.data,
          headerConfig: {
            ...response.data.headerConfig,
            navLinks: headerLinks,
          },
          footerConfig: {
            ...response.data.footerConfig,
            linkGroups: [footerLinkGroup],
          },
        };

        const saveResponse = await storefrontApi.settings.saveSettings(updatedSettings);
        if (saveResponse.success) {
          setSavedHeaderLinks(headerLinks);
          setSavedFooterLinks(footerLinks);
          toast.success('Success', 'Navigation saved! Changes will reflect on your storefront.');
        } else {
          toast.error('Error', 'Failed to save navigation');
        }
      }
    } catch (error) {
      toast.error('Error', 'Failed to save navigation settings');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    JSON.stringify(headerLinks) !== JSON.stringify(savedHeaderLinks) ||
    JSON.stringify(footerLinks) !== JSON.stringify(savedFooterLinks);

  const currentLinks = activeSection === 'header' ? headerLinks : footerLinks;
  const setCurrentLinks = activeSection === 'header' ? setHeaderLinks : setFooterLinks;

  const handleAddLink = () => {
    setEditingLink({
      id: `new-${Date.now()}`,
      label: '',
      href: '/',
      isExternal: false,
      position: currentLinks.length,
    });
    setIsEditorOpen(true);
  };

  const handleEditLink = (link: StorefrontNavLink, index: number) => {
    setEditingLink({ ...link, _index: index } as any);
    setIsEditorOpen(true);
  };

  const handleDeleteLink = async (index: number) => {
    const confirmed = await showConfirm({
      title: 'Delete Link',
      message: 'Are you sure you want to delete this navigation link?',
    });

    if (confirmed) {
      const newLinks = [...currentLinks];
      newLinks.splice(index, 1);
      setCurrentLinks(newLinks);
    }
  };

  const handleSaveLink = () => {
    if (!editingLink) return;

    const { _index, ...linkData } = editingLink as any;
    const newLinks = [...currentLinks];

    if (typeof _index === 'number') {
      // Update existing
      newLinks[_index] = linkData;
    } else {
      // Add new
      newLinks.push(linkData);
    }

    setCurrentLinks(newLinks);
    setIsEditorOpen(false);
    setEditingLink(null);
  };

  const handleAddTemplate = (template: typeof LINK_TEMPLATES[0]) => {
    setCurrentLinks([
      ...currentLinks,
      {
        id: `template-${Date.now()}`,
        label: template.label,
        href: template.href,
        isExternal: false,
        position: currentLinks.length,
      },
    ]);
  };

  const moveLink = (index: number, direction: 'up' | 'down') => {
    const newLinks = [...currentLinks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newLinks.length) return;
    [newLinks[index], newLinks[newIndex]] = [newLinks[newIndex], newLinks[index]];
    setCurrentLinks(newLinks);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading navigation...</p>
        </div>
      </div>
    );
  }

  if (!storefront) {
    return (
      <div className="min-h-screen bg-muted p-8">
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
      fallbackTitle="Storefront Navigation Access Required"
      fallbackDescription="You don't have the required permissions to view storefront navigation. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-muted">
      <div className="p-8 space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title={`Navigation: ${storefront.name}`}
          description="Configure header and footer navigation links"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Storefronts', href: '/storefronts' },
            { label: storefront.name, href: `/storefronts/${storefrontId}/edit` },
            { label: 'Navigation' },
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
                View Store
              </a>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
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
          <Link href={`/storefronts/${storefrontId}/branding`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Globe className="h-4 w-4" />
              Branding
            </Button>
          </Link>
          <Link href={`/storefronts/${storefrontId}/pages`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Layout className="h-4 w-4" />
              Pages
            </Button>
          </Link>
        </div>

        {/* Section Tabs */}
        <div className="bg-card rounded-xl border border-border p-2 inline-flex gap-1">
          <button
            onClick={() => setActiveSection('header')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium text-sm transition-all',
              activeSection === 'header'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            Header Navigation
          </button>
          <button
            onClick={() => setActiveSection('footer')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium text-sm transition-all',
              activeSection === 'footer'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            Footer Links
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Links List */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  {activeSection === 'header' ? 'Header' : 'Footer'} Links
                </h3>
                <Button
                  onClick={handleAddLink}
                  size="sm"
                  className="bg-primary text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Link
                </Button>
              </div>

              {currentLinks.length === 0 ? (
                <div className="p-12 text-center">
                  <Menu className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No links yet</h3>
                  <p className="text-muted-foreground mb-4">Add navigation links for your storefront</p>
                  <Button onClick={handleAddLink} className="bg-primary text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Link
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {currentLinks.map((link, index) => {
                    // Determine icon based on href pattern
                    const getIconForLink = (href: string) => {
                      if (href === '/') return LINK_ICONS.home;
                      if (href.includes('product')) return LINK_ICONS.products;
                      if (href.includes('categor')) return LINK_ICONS.categories;
                      if (href.includes('contact')) return LINK_ICONS.contact;
                      return LINK_ICONS.custom;
                    };
                    const IconComponent = getIconForLink(link.href) || LinkIcon;
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 hover:bg-muted transition-colors group"
                      >
                        <div className="text-muted-foreground cursor-grab">
                          <GripVertical className="h-5 w-5" />
                        </div>

                        <div className="p-2 bg-muted rounded-lg">
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground">{link.label}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {link.href}
                            {link.isExternal && (
                              <span className="ml-2 text-xs text-primary">(external)</span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => moveLink(index, 'up')}
                            disabled={index === 0}
                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30"
                          >
                            <ChevronRight className="h-4 w-4 -rotate-90" />
                          </button>
                          <button
                            onClick={() => moveLink(index, 'down')}
                            disabled={index === currentLinks.length - 1}
                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30"
                          >
                            <ChevronRight className="h-4 w-4 rotate-90" />
                          </button>
                          <button
                            onClick={() => handleEditLink(link, index)}
                            className="p-2 rounded-lg hover:bg-primary/10 text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLink(index)}
                            className="p-2 rounded-lg hover:bg-error-muted text-error"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Add Templates */}
          <div>
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold text-foreground mb-4">Quick Add</h3>
              <div className="space-y-2">
                {LINK_TEMPLATES.map((template) => {
                  const IconComponent = LINK_ICONS[template.icon] || LinkIcon;
                  const alreadyAdded = currentLinks.some(
                    (l) => l.href === template.href
                  );
                  return (
                    <button
                      key={template.href}
                      onClick={() => !alreadyAdded && handleAddTemplate(template)}
                      disabled={alreadyAdded}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all',
                        alreadyAdded
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'bg-muted hover:bg-primary/10 text-foreground hover:text-primary'
                      )}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span className="font-medium">{template.label}</span>
                      {alreadyAdded && (
                        <span className="ml-auto text-xs text-muted-foreground">Added</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-card rounded-xl border border-border p-4 mt-4">
              <h3 className="font-semibold text-foreground mb-4">Preview</h3>
              <div className="bg-foreground rounded-lg p-4">
                <div className="flex items-center justify-center gap-4">
                  {currentLinks.slice(0, 5).map((link, index) => (
                    <span key={index} className="text-white text-sm">
                      {link.label}
                    </span>
                  ))}
                  {currentLinks.length > 5 && (
                    <span className="text-muted-foreground text-sm">
                      +{currentLinks.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Link Editor Modal */}
        {isEditorOpen && editingLink && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {(editingLink as any)._index !== undefined ? 'Edit Link' : 'Add Link'}
                </h2>
                <button
                  onClick={() => {
                    setIsEditorOpen(false);
                    setEditingLink(null);
                  }}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={editingLink.label}
                    onChange={(e) =>
                      setEditingLink({ ...editingLink, label: e.target.value })
                    }
                    placeholder="Home"
                    className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    URL
                  </label>
                  <input
                    type="text"
                    value={editingLink.href}
                    onChange={(e) =>
                      setEditingLink({ ...editingLink, href: e.target.value })
                    }
                    placeholder="/about or https://..."
                    className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingLink.isExternal || false}
                    onChange={(e) =>
                      setEditingLink({ ...editingLink, isExternal: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0"
                  />
                  <span className="text-sm">Open in new tab (external link)</span>
                </label>
              </div>

              <div className="p-6 border-t border-border flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditorOpen(false);
                    setEditingLink(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveLink}
                  disabled={!editingLink.label || !editingLink.href}
                  className="bg-primary text-primary-foreground"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Link
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
