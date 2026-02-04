'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Store, ChevronDown, Check, Plus, Search, Loader2, ChevronsUpDown, Building2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTenant, Tenant } from '@/contexts/TenantContext';
import { buildAdminUrl } from '@/lib/utils/tenant';

interface TenantSwitcherProps {
  className?: string;
  variant?: 'sidebar' | 'header' | 'compact';
}

export function TenantSwitcher({ className, variant = 'sidebar' }: TenantSwitcherProps) {
  const { currentTenant, tenants, isLoading, switchTenant, setDefaultTenant, isPlatformAdmin } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
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

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Filter tenants by search query
  const filteredTenants = useMemo(() => {
    return tenants.filter(
      (tenant) =>
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tenants, searchQuery]);

  // Group tenants by ownership (owner vs member vs platform)
  const groupedTenants = useMemo(() => {
    const owned = filteredTenants.filter((t) => t.role === 'owner');
    const memberOf = filteredTenants.filter((t) => t.role !== 'owner' && t.role !== 'platform_admin');
    const platformTenants = filteredTenants.filter((t) => t.role === 'platform_admin');
    return { owned, memberOf, platformTenants };
  }, [filteredTenants]);

  const handleSelectTenant = (tenant: Tenant) => {
    switchTenant(tenant.slug);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCreateNewBusiness = () => {
    // Navigate to onboarding page within admin app
    window.location.href = '/onboarding';
    setIsOpen(false);
  };

  const handleSetDefault = async (tenant: Tenant, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent tenant selection
    if (tenant.isDefault) return; // Already default

    setSettingDefault(tenant.id);
    const success = await setDefaultTenant(tenant.id);
    setSettingDefault(null);

    if (!success) {
      console.error('Failed to set default tenant');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'admin':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'platform_admin':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'manager':
        return 'bg-success-muted text-success-foreground border-success/30';
      case 'staff':
      case 'member':
        return 'bg-muted text-foreground border-border';
      case 'viewer':
        return 'bg-warning-muted text-warning border-warning/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const isCompact = variant === 'compact';
  const isSidebar = variant === 'sidebar' || isCompact;

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn(
        'flex items-center gap-2',
        isCompact ? 'h-9 px-2' : 'gap-3 px-3 py-3',
        isSidebar && 'w-full',
        className
      )}>
        <div className={cn(
          "rounded-lg bg-sidebar-accent/50 flex items-center justify-center",
          isCompact ? "w-6 h-6" : "w-10 h-10 rounded-xl"
        )}>
          <Loader2 className={cn("animate-spin text-sidebar-text", isCompact ? "w-3.5 h-3.5" : "w-5 h-5")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn("bg-sidebar-accent/50 rounded animate-pulse", isCompact ? "h-3 w-16" : "h-4 w-24")} />
        </div>
      </div>
    );
  }

  // No tenant selected
  if (!currentTenant) {
    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center w-full rounded-lg transition-all duration-200',
          'hover:bg-sidebar-accent border border-transparent hover:border-sidebar-border',
          isCompact ? 'h-9 gap-2 px-2' : 'gap-3 px-3 py-3 rounded-xl',
          className
        )}
      >
        <div className={cn(
          "bg-sidebar-accent flex items-center justify-center",
          isCompact ? "w-6 h-6 rounded-lg" : "w-10 h-10 rounded-xl"
        )}>
          <Building2 className={cn("text-sidebar-text", isCompact ? "w-3.5 h-3.5" : "w-5 h-5")} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className={cn("font-medium text-sidebar-text truncate", isCompact ? "text-xs" : "text-sm")}>
            Select Business
          </p>
        </div>
        <ChevronDown className={cn("text-sidebar-text flex-shrink-0", isCompact ? "w-3.5 h-3.5" : "w-4 h-4")} />
      </button>
    );
  }

  return (
    <div className={cn('relative', isSidebar && 'w-full', className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center w-full rounded-lg transition-all duration-200 border',
          isCompact ? 'h-9 gap-2 px-2' : 'gap-3 px-3 py-3 rounded-xl',
          isOpen
            ? 'bg-sidebar-accent border-sidebar-border'
            : 'hover:bg-sidebar-accent border-transparent hover:border-sidebar-border'
        )}
      >
        {/* Business Logo/Avatar */}
        <div
          className={cn(
            "flex items-center justify-center text-white font-bold flex-shrink-0",
            isCompact ? "w-6 h-6 rounded-md text-xs" : "w-10 h-10 rounded-xl text-sm shadow-lg"
          )}
          style={{ backgroundColor: currentTenant.primaryColor || '#6366f1' }}
        >
          {currentTenant.logoUrl ? (
            <img
              src={currentTenant.logoUrl}
              alt={currentTenant.name}
              className={cn("w-full h-full object-cover", isCompact ? "rounded-md" : "rounded-xl")}
            />
          ) : (
            currentTenant.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Business Name */}
        <div className="flex-1 min-w-0 text-left">
          <p className={cn(
            "font-medium text-sidebar-active-text truncate",
            isCompact ? "text-xs" : "text-sm font-semibold"
          )}>
            {currentTenant.name}
          </p>
          {!isCompact && (
            <p className="text-xs text-sidebar-text-muted capitalize">{currentTenant.role}</p>
          )}
        </div>

        {/* Dropdown Indicator */}
        <ChevronDown
          className={cn(
            'text-sidebar-text transition-transform duration-200 flex-shrink-0',
            isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={cn(
          'absolute left-0 right-0 bg-card border border-border rounded-xl shadow-2xl z-[9999] overflow-hidden',
          'animate-in fade-in duration-200',
          isCompact
            ? 'bottom-full mb-2 slide-in-from-bottom-2'
            : 'top-full mt-2 slide-in-from-top-2'
        )}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-muted">
            <h3 className="text-sm font-bold text-foreground">Switch Business</h3>
            <p className="text-xs text-muted-foreground">Select a business to manage</p>
          </div>

          {/* Search Input - Show when more than 3 tenants */}
          {tenants.length > 3 && (
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search businesses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 border border-border rounded-md bg-background text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus:border-primary"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Tenant List - Grouped by Role */}
          <div className="max-h-[320px] overflow-y-auto">
            {filteredTenants.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No businesses found
              </div>
            ) : (
              <>
                {/* Owned Businesses */}
                {groupedTenants.owned.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-muted border-b border-border">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Your Businesses
                      </span>
                    </div>
                    {groupedTenants.owned.map((tenant) => (
                      <TenantItem
                        key={tenant.id}
                        tenant={tenant}
                        isSelected={tenant.id === currentTenant?.id}
                        onSelect={handleSelectTenant}
                        onSetDefault={handleSetDefault}
                        isSettingDefault={settingDefault === tenant.id}
                        getRoleBadgeColor={getRoleBadgeColor}
                      />
                    ))}
                  </div>
                )}

                {/* Member of Businesses */}
                {groupedTenants.memberOf.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-muted border-b border-border">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Member Of
                      </span>
                    </div>
                    {groupedTenants.memberOf.map((tenant) => (
                      <TenantItem
                        key={tenant.id}
                        tenant={tenant}
                        isSelected={tenant.id === currentTenant?.id}
                        onSelect={handleSelectTenant}
                        onSetDefault={handleSetDefault}
                        isSettingDefault={settingDefault === tenant.id}
                        getRoleBadgeColor={getRoleBadgeColor}
                      />
                    ))}
                  </div>
                )}

                {/* Platform Tenants - Only shown to platform admins */}
                {isPlatformAdmin && groupedTenants.platformTenants.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-primary/5 border-b border-primary/20">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        All Platform Tenants
                      </span>
                    </div>
                    {groupedTenants.platformTenants.map((tenant) => (
                      <TenantItem
                        key={tenant.id}
                        tenant={tenant}
                        isSelected={tenant.id === currentTenant?.id}
                        onSelect={handleSelectTenant}
                        onSetDefault={handleSetDefault}
                        isSettingDefault={settingDefault === tenant.id}
                        getRoleBadgeColor={getRoleBadgeColor}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer - Create New Business */}
          <div className="border-t border-border p-3 bg-muted">
            <button
              onClick={handleCreateNewBusiness}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 hover:shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Business</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Extracted tenant item component for cleaner code
interface TenantItemProps {
  tenant: Tenant;
  isSelected: boolean;
  onSelect: (tenant: Tenant) => void;
  onSetDefault: (tenant: Tenant, e: React.MouseEvent) => void;
  isSettingDefault: boolean;
  getRoleBadgeColor: (role: string) => string;
}

function TenantItem({ tenant, isSelected, onSelect, onSetDefault, isSettingDefault, getRoleBadgeColor }: TenantItemProps) {
  return (
    <div
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 group cursor-pointer',
        'hover:hover:bg-primary/5',
        isSelected && 'bg-muted'
      )}
      onClick={() => onSelect(tenant)}
    >
      {/* Tenant Avatar */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-md group-hover:scale-105 transition-transform flex-shrink-0"
        style={{ backgroundColor: tenant.primaryColor || '#6366f1' }}
      >
        {tenant.logoUrl ? (
          <img
            src={tenant.logoUrl}
            alt={tenant.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          tenant.name.charAt(0).toUpperCase()
        )}
      </div>

      {/* Tenant Info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate">
            {tenant.name}
          </span>
          {tenant.isDefault && (
            <span className="text-[10px] bg-warning-muted text-warning-foreground border border-warning/30 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
              DEFAULT
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{tenant.slug}</span>
      </div>

      {/* Role Badge & Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {tenant.role !== 'owner' && (
          <span
            className={cn(
              'text-[10px] px-2 py-0.5 rounded font-semibold border capitalize',
              getRoleBadgeColor(tenant.role)
            )}
          >
            {tenant.role === 'platform_admin' ? 'Platform' : tenant.role}
          </span>
        )}

        {/* Set as Default button - only show if not already default */}
        {!tenant.isDefault && (
          <button
            onClick={(e) => onSetDefault(tenant, e)}
            disabled={isSettingDefault}
            className={cn(
              'p-1.5 rounded-md transition-all duration-150',
              'text-muted-foreground hover:text-warning hover:bg-warning-muted',
              'opacity-0 group-hover:opacity-100',
              isSettingDefault && 'opacity-100'
            )}
            title="Set as default"
          >
            {isSettingDefault ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Star className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Filled star for default tenant */}
        {tenant.isDefault && (
          <Star className="w-4 h-4 text-warning fill-amber-500" />
        )}

        {/* Check mark for selected */}
        {isSelected && (
          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

export default TenantSwitcher;
