'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  ChevronDown,
  Search,
  Plus,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Globe,
  X,
  Star,
} from 'lucide-react';
import { useFavoriteStores } from '@/lib/hooks/useFavoriteStores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Storefront } from '@/lib/api/types';
import { storefrontService } from '@/lib/services/storefrontService';
import { useDialog } from '@/contexts/DialogContext';
import { getStorefrontDomain, getStorefrontUrl } from '@/lib/utils/tenant';

interface StoreSelectorProps {
  storefronts: Storefront[];
  selectedStorefront: Storefront | null;
  onSelect: (storefront: Storefront) => void;
  onCreateNew?: () => void;
  onStorefrontCreated?: (storefront: Storefront) => void;
  loading?: boolean;
  showCreateButton?: boolean;
  showQuickActions?: boolean;
  showUrlInfo?: boolean;
  vendorId?: string;
  className?: string;
}

export function StoreSelector({
  storefronts,
  selectedStorefront,
  onSelect,
  onCreateNew,
  onStorefrontCreated,
  loading = false,
  showCreateButton = true,
  showQuickActions = true,
  showUrlInfo = true,
  vendorId = '05e0fa2c-bac3-4f2a-a9bf-5c9e3c0d7962',
  className = '',
}: StoreSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Favorites management
  const { favorites, isFavorite, toggleFavorite, canAddMore, maxFavorites } = useFavoriteStores(vendorId);

  // For preview URLs before creation (when we only have a slug), use dynamic domain
  const getPreviewUrl = (slug: string) => {
    const domain = getStorefrontDomain();
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${slug}.${domain}`;
  };

  // Filter and sort storefronts: favorites first, then alphabetically
  const filteredStorefronts = useMemo(() => {
    let filtered = storefronts;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = storefronts.filter(
        (sf) =>
          sf.name.toLowerCase().includes(query) ||
          sf.slug.toLowerCase().includes(query)
      );
    }

    // Sort: favorites first, then alphabetically
    return [...filtered].sort((a, b) => {
      const aIsFavorite = favorites.includes(a.id);
      const bIsFavorite = favorites.includes(b.id);

      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;

      // If both are favorites, maintain their order in favorites array
      if (aIsFavorite && bIsFavorite) {
        return favorites.indexOf(a.id) - favorites.indexOf(b.id);
      }

      // Non-favorites: sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [storefronts, searchQuery, favorites]);

  // Handle favorite toggle
  const handleToggleFavorite = (e: React.MouseEvent, storeId: string) => {
    e.stopPropagation(); // Prevent store selection
    toggleFavorite(storeId);
    // Max favorites limit is handled by the toggleFavorite function
  };

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleCreateNew = () => {
    setIsOpen(false);
    setSearchQuery('');
    if (onCreateNew) {
      onCreateNew();
    } else {
      setShowCreateModal(true);
    }
  };

  const handleStorefrontCreated = (storefront: Storefront) => {
    setShowCreateModal(false);
    if (onStorefrontCreated) {
      onStorefrontCreated(storefront);
    }
    onSelect(storefront);
  };

  return (
    <>
      <div className={`bg-card rounded-xl border border-border p-6 shadow-sm ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Store Details</h3>
            <p className="text-sm text-muted-foreground">Select a store to configure its settings</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Store Selector Dropdown */}
          <div className="flex-1 relative">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Select Store <span className="text-destructive">*</span>
            </label>
            <button
              onClick={() => setIsOpen(!isOpen)}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-3 bg-card border border-border rounded-lg hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading stores...</span>
                </div>
              ) : selectedStorefront ? (
                <div className="flex items-center gap-3">
                  {isFavorite(selectedStorefront.id) && (
                    <Star className="h-4 w-4 text-warning fill-amber-500 flex-shrink-0" />
                  )}
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {selectedStorefront.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{selectedStorefront.name}</p>
                      {isFavorite(selectedStorefront.id) && (
                        <span className="text-[10px] bg-warning-muted text-warning-foreground px-1.5 py-0.5 rounded font-medium">
                          Favorite
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{getStorefrontUrl(selectedStorefront)}</p>
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground">Select a store...</span>
              )}
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => {
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                />
                <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                  {/* Search Input */}
                  <div className="p-3 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search stores..."
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  {/* Store List */}
                  <div className="max-h-64 overflow-y-auto">
                    {/* Favorites count indicator */}
                    {favorites.length > 0 && (
                      <div className="px-4 py-2 bg-warning-muted border-b border-warning/20 flex items-center gap-2">
                        <Star className="h-3.5 w-3.5 text-warning fill-amber-500" />
                        <span className="text-xs font-medium text-warning-foreground">
                          {favorites.length} of {maxFavorites} favorites
                        </span>
                      </div>
                    )}
                    {filteredStorefronts.length === 0 ? (
                      <div className="px-4 py-8 text-center text-muted-foreground">
                        <Store className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm">No stores found</p>
                      </div>
                    ) : (
                      filteredStorefronts.map((sf, index) => {
                        const isStarred = isFavorite(sf.id);
                        const showDivider = index > 0 &&
                          isFavorite(filteredStorefronts[index - 1].id) &&
                          !isStarred;

                        return (
                          <React.Fragment key={sf.id}>
                            {/* Divider between favorites and non-favorites */}
                            {showDivider && (
                              <div className="border-t-2 border-dashed border-border mx-4 my-1" />
                            )}
                            <button
                              onClick={() => {
                                onSelect(sf);
                                setIsOpen(false);
                                setSearchQuery('');
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/10 transition-colors ${
                                sf.id === selectedStorefront?.id
                                  ? 'bg-primary/10 border-l-4 border-l-purple-500'
                                  : 'border-l-4 border-l-transparent'
                              } ${isStarred ? 'bg-warning-muted/50' : ''}`}
                            >
                              {/* Favorite Star Toggle */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleFavorite(e, sf.id)}
                                className={`p-1 rounded-full transition-colors flex-shrink-0 ${
                                  isStarred
                                    ? 'text-warning hover:bg-warning-muted'
                                    : canAddMore
                                    ? 'text-muted-foreground hover:text-warning hover:bg-warning-muted'
                                    : 'text-muted cursor-not-allowed'
                                }`}
                                title={
                                  isStarred
                                    ? 'Remove from favorites'
                                    : canAddMore
                                    ? 'Add to favorites'
                                    : `Maximum ${maxFavorites} favorites reached`
                                }
                                disabled={!isStarred && !canAddMore}
                              >
                                <Star
                                  className={`h-4 w-4 ${isStarred ? 'fill-amber-500' : ''}`}
                                />
                              </button>

                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                                sf.id === selectedStorefront?.id
                                  ? 'bg-primary'
                                  : 'bg-border'
                              }`}>
                                {sf.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground truncate">{sf.name}</p>
                                  {isStarred && (
                                    <span className="text-[10px] bg-warning-muted text-warning-foreground px-1.5 py-0.5 rounded font-medium">
                                      Favorite
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{getStorefrontUrl(sf)}</p>
                              </div>
                              {sf.id === selectedStorefront?.id && (
                                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                              )}
                            </button>
                          </React.Fragment>
                        );
                      })
                    )}
                  </div>

                  {/* Create New Store */}
                  {showCreateButton && (
                    <div className="p-3 border-t border-border bg-muted">
                      <button
                        onClick={handleCreateNew}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                      >
                        <Plus className="h-4 w-4" />
                        Create New Store
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          {showQuickActions && selectedStorefront && (
            <div className="flex items-center gap-2 md:self-end md:pb-0.5">
              <a
                href={getStorefrontUrl(selectedStorefront)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/10 rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Visit Store
              </a>
              {showCreateButton && (
                <Button
                  onClick={handleCreateNew}
                  variant="outline"
                  size="sm"
                  className="border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Store
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Store URL Info */}
        {showUrlInfo && selectedStorefront && (
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Your store is live at:</span>
              <a
                href={getStorefrontUrl(selectedStorefront)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-primary hover:text-primary hover:underline"
              >
                {getStorefrontUrl(selectedStorefront)}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Create Storefront Modal */}
      {showCreateModal && (
        <CreateStorefrontModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleStorefrontCreated}
          vendorId={vendorId}
        />
      )}
    </>
  );
}

// Create Storefront Modal Component
function CreateStorefrontModal({
  isOpen,
  onClose,
  onCreated,
  vendorId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (storefront: Storefront) => void;
  vendorId: string;
}) {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const { showSuccess, showError } = useDialog();

  // Generate slug from name
  const slug = useMemo(() => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }, [name]);

  // Preview URL for showing the user what the URL will look like before creation
  // After creation, the actual URL comes from the backend
  // Use dynamic domain detection for preview URL
  const storefrontDomain = getStorefrontDomain();
  const storefrontProtocol = storefrontDomain.includes('localhost') ? 'http' : 'https';
  const storefrontUrl = slug ? `${storefrontProtocol}://${slug}.${storefrontDomain}` : '';

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a store name');
      return;
    }

    if (slug.length < 3) {
      setError('Store name must be at least 3 characters');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // Check slug availability
      const isAvailable = await storefrontService.checkSlugAvailability(slug);
      if (!isAvailable) {
        setError('This store URL is already taken. Try a different name.');
        setIsCreating(false);
        return;
      }

      // Create storefront with minimal data
      const result = await storefrontService.createStorefront({
        vendorId,
        name: name.trim(),
        slug,
        description: undefined,
        customDomain: undefined,
        logoUrl: undefined,
        faviconUrl: undefined,
        metaTitle: undefined,
        metaDescription: undefined,
      });

      showSuccess('Storefront Created', `${name} is now live at ${storefrontUrl}`);
      onCreated(result.data);
      setName('');
      onClose();
    } catch (err: any) {
      console.error('Failed to create storefront:', err);
      setError(err.message || 'Failed to create storefront');
      showError('Error', err.message || 'Failed to create storefront');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-primary px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Store className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Create New Storefront</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Create a new storefront with just a name. You can fill in other details later.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Store Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="e.g., My Awesome Store"
                className="w-full"
                autoFocus
              />
            </div>

            {/* URL Preview */}
            {slug && (
              <div className="bg-muted rounded-lg p-3 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Your storefront URL will be:
                </p>
                <p className="text-sm font-mono text-primary break-all">
                  {storefrontUrl}
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg border border-destructive/30">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
            className="bg-primary text-white"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Storefront
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default StoreSelector;
