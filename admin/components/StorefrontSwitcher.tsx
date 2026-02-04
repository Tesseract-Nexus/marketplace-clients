'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Store, ChevronDown, Check, Plus, Search, Loader2, Globe, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStorefront, Storefront } from '@/contexts/StorefrontContext';
import { useTenant } from '@/contexts/TenantContext';
import Link from 'next/link';

interface StorefrontSwitcherProps {
  className?: string;
}

export function StorefrontSwitcher({ className }: StorefrontSwitcherProps) {
  const { currentStorefront, storefronts, isLoading, switchStorefront, hasMultipleStorefronts } = useStorefront();
  const { currentTenant } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter storefronts by search query
  const filteredStorefronts = storefronts.filter(
    (storefront) =>
      storefront.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      storefront.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectStorefront = (storefront: Storefront) => {
    switchStorefront(storefront.id);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2', className)}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // Show "Add Storefront" button only when no storefronts exist
  if (storefronts.length === 0) {
    return (
      <Link
        href="/storefronts/create"
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/70 hover:bg-primary/10 transition-all duration-200',
          className
        )}
      >
        <Plus className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Add Storefront</span>
      </Link>
    );
  }

  // Always show dropdown when storefronts exist (even if just one)
  // This allows users to switch storefronts and create new ones

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-9 flex items-center gap-2 px-2 rounded-lg border transition-all duration-200',
          isOpen
            ? 'bg-primary/10 border-primary/30 shadow-md'
            : 'bg-background border-border hover:border-primary/30 hover:bg-primary/10'
        )}
      >
        {/* Storefront Icon */}
        <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shadow-sm flex-shrink-0">
          {currentStorefront?.logoUrl ? (
            <img
              src={currentStorefront.logoUrl}
              alt={currentStorefront.name}
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <Globe className="w-3.5 h-3.5 text-primary-foreground" />
          )}
        </div>

        {/* Storefront Name - hidden on smaller screens */}
        <span className="hidden lg:block text-sm font-medium text-foreground truncate max-w-[100px]">
          {currentStorefront?.name || 'Select'}
        </span>

        {/* Dropdown Arrow */}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-muted">
            <h3 className="text-sm font-bold text-foreground">Switch Storefront</h3>
            <p className="text-xs text-muted-foreground">Select a storefront to manage</p>
          </div>

          {/* Search Input */}
          {storefronts.length > 3 && (
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search storefronts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 border border-border rounded-md bg-background text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus:border-primary"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Storefront List */}
          <div className="max-h-[280px] overflow-y-auto">
            {filteredStorefronts.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No storefronts found
              </div>
            ) : (
              filteredStorefronts.map((storefront) => (
                <button
                  key={storefront.id}
                  onClick={() => handleSelectStorefront(storefront)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 hover:bg-primary/10 transition-all duration-150 group',
                    storefront.id === currentStorefront?.id && 'bg-primary/10'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Storefront Avatar */}
                    <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      {storefront.logoUrl ? (
                        <img
                          src={storefront.logoUrl}
                          alt={storefront.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Globe className="w-4 h-4 text-primary-foreground" />
                      )}
                    </div>

                    {/* Storefront Info */}
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-foreground">
                        {storefront.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">{storefront.slug}</span>
                        {storefront.customDomain && (
                          <span className="text-xs text-primary flex items-center gap-0.5">
                            <ExternalLink className="w-3 h-3" />
                            {storefront.customDomain}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status & Check */}
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        storefront.isActive
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {storefront.isActive ? 'Active' : 'Draft'}
                    </span>

                    {/* Check mark for selected */}
                    {storefront.id === currentStorefront?.id && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer - Create New Storefront */}
          <div className="border-t border-border p-3 bg-muted">
            <Link
              href="/storefronts/create"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Storefront</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default StorefrontSwitcher;
