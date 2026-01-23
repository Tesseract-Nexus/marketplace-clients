'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Store,
  ChevronDown,
  Search,
  Plus,
  CheckCircle2,
  Loader2,
  Globe,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoreHealthWidget } from './StoreHealthWidget';
import { useFavoriteStores } from '@/lib/hooks/useFavoriteStores';
import { getStorefrontUrl } from '@/lib/utils/tenant';
import type { Storefront } from '@/lib/api/types';

interface StoreSettings {
  store: {
    name: string;
    email: string;
    phone: string;
    country: string;
  };
  business: {
    currency: string;
  };
}

interface SettingsSidebarProps {
  storefronts: Storefront[];
  selectedStorefront: Storefront | null;
  settings: StoreSettings;
  onSelectStorefront: (storefront: Storefront) => void;
  onCreateStorefront: () => void;
  onPublishToggle: (shouldPublish: boolean) => void;
  onPreview: () => void;
  onFieldClick: (fieldKey: string) => void;
  loading?: boolean;
  isPublishing?: boolean;
  vendorId?: string;
}

export function SettingsSidebar({
  storefronts,
  selectedStorefront,
  settings,
  onSelectStorefront,
  onCreateStorefront,
  onPublishToggle,
  onPreview,
  onFieldClick,
  loading = false,
  isPublishing = false,
  vendorId = '',
}: SettingsSidebarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Favorites management
  const { favorites, isFavorite, toggleFavorite, canAddMore, maxFavorites } =
    useFavoriteStores(vendorId);

  // Filter and sort storefronts
  const filteredStorefronts = useMemo(() => {
    let filtered = storefronts;

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
      if (aIsFavorite && bIsFavorite) {
        return favorites.indexOf(a.id) - favorites.indexOf(b.id);
      }
      return a.name.localeCompare(b.name);
    });
  }, [storefronts, searchQuery, favorites]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  const handleToggleFavorite = (e: React.MouseEvent, storeId: string) => {
    e.stopPropagation();
    toggleFavorite(storeId);
  };

  return (
    <aside className="w-72 border-r border-border bg-card flex flex-col h-full">
      {/* Store Selector */}
      <div className="p-4 border-b border-border">
        <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Store
        </label>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={loading}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-background border border-border rounded-lg hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : selectedStorefront ? (
              <div className="flex items-center gap-2.5 min-w-0">
                {isFavorite(selectedStorefront.id) && (
                  <Star className="h-3.5 w-3.5 text-warning fill-warning flex-shrink-0" />
                )}
                <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                  {selectedStorefront.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-sm text-foreground truncate">
                  {selectedStorefront.name}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Select store...</span>
            )}
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => {
                  setIsDropdownOpen(false);
                  setSearchQuery('');
                }}
              />
              <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-20 overflow-hidden">
                {/* Search */}
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search stores..."
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                    />
                  </div>
                </div>

                {/* Store List */}
                <div className="max-h-56 overflow-y-auto">
                  {favorites.length > 0 && (
                    <div className="px-3 py-1.5 bg-warning/10 border-b border-warning/20 flex items-center gap-1.5">
                      <Star className="h-3 w-3 text-warning fill-warning" />
                      <span className="text-[10px] font-medium text-warning">
                        {favorites.length}/{maxFavorites} favorites
                      </span>
                    </div>
                  )}
                  {filteredStorefronts.length === 0 ? (
                    <div className="px-3 py-6 text-center text-muted-foreground">
                      <Store className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No stores found</p>
                    </div>
                  ) : (
                    filteredStorefronts.map((sf, index) => {
                      const isStarred = isFavorite(sf.id);
                      const showDivider =
                        index > 0 &&
                        isFavorite(filteredStorefronts[index - 1].id) &&
                        !isStarred;

                      return (
                        <React.Fragment key={sf.id}>
                          {showDivider && (
                            <div className="border-t border-dashed border-border mx-3 my-1" />
                          )}
                          <button
                            onClick={() => {
                              onSelectStorefront(sf);
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors ${
                              sf.id === selectedStorefront?.id
                                ? 'bg-primary/10'
                                : ''
                            } ${isStarred ? 'bg-warning/5' : ''}`}
                          >
                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(e, sf.id)}
                              className={`p-0.5 rounded transition-colors flex-shrink-0 ${
                                isStarred
                                  ? 'text-warning'
                                  : canAddMore
                                  ? 'text-muted-foreground/40 hover:text-warning'
                                  : 'text-muted-foreground/20 cursor-not-allowed'
                              }`}
                              disabled={!isStarred && !canAddMore}
                            >
                              <Star
                                className={`h-3 w-3 ${isStarred ? 'fill-warning' : ''}`}
                              />
                            </button>
                            <div
                              className={`w-6 h-6 rounded flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 ${
                                sf.id === selectedStorefront?.id
                                  ? 'bg-primary'
                                  : 'bg-muted-foreground/30'
                              }`}
                            >
                              {sf.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm truncate flex-1">{sf.name}</span>
                            {sf.id === selectedStorefront?.id && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            )}
                          </button>
                        </React.Fragment>
                      );
                    })
                  )}
                </div>

                {/* Create New */}
                <div className="p-2 border-t border-border">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onCreateStorefront();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    New Store
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Store Health Widget */}
      {selectedStorefront && (
        <div className="flex-1 p-4 overflow-y-auto">
          <StoreHealthWidget
            storefront={selectedStorefront}
            settings={settings}
            isPublishing={isPublishing}
            onPublishToggle={onPublishToggle}
            onPreview={onPreview}
            onFieldClick={onFieldClick}
          />
        </div>
      )}

      {/* Secondary Actions */}
      <div className="p-4 border-t border-border mt-auto">
        <Link
          href="/settings/domains"
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
        >
          <Globe className="h-4 w-4" />
          <span>Custom Domains</span>
        </Link>
      </div>
    </aside>
  );
}

export default SettingsSidebar;
