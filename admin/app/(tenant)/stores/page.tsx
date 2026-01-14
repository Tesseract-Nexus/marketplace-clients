"use client";

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Store,
  Globe,
  ExternalLink,
  Loader2,
  Building2,
  ArrowRight,
  Check,
  Crown,
  Users,
  ShoppingBag,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { storefrontService } from '@/lib/services/storefrontService';
import { Storefront } from '@/lib/api/types';
import { useTenant, Tenant } from '@/contexts/TenantContext';

type StoreType = 'all' | 'independent' | 'storefronts';

export default function StoresPage() {
  const { currentTenant, tenants, isLoading: isTenantLoading } = useTenant();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [storeTypeFilter, setStoreTypeFilter] = useState<StoreType>('all');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Get independent stores (tenants user owns)
  const ownedTenants = tenants.filter(t => t.role === 'owner' || t.role === 'admin');

  // Load storefronts for current tenant
  useEffect(() => {
    if (!isTenantLoading && currentTenant?.id) {
      loadStorefronts();
    }
  }, [currentTenant?.id, isTenantLoading]);

  const loadStorefronts = async () => {
    try {
      setLoading(true);
      const response = await storefrontService.getStorefronts();
      setStorefronts(response.data || []);
    } catch (err) {
      console.error('Error loading storefronts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter based on search
  const filteredTenants = ownedTenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStorefronts = storefronts.filter(storefront =>
    storefront.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    storefront.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200 flex items-center gap-1"><Crown className="w-3 h-3" /> Owner</Badge>;
      case 'admin':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Admin</Badge>;
      default:
        return <Badge className="bg-muted text-foreground border-border capitalize">{role}</Badge>;
    }
  };

  return (
    <PermissionGate
      permission={Permission.STOREFRONTS_VIEW}
      fallback="styled"
      fallbackTitle="Stores Access Required"
      fallbackDescription="You don't have the required permissions to view stores. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Store Management"
          description="Manage your independent stores and storefronts"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Stores' },
          ]}
          actions={
            <Button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Create Store
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Independent Stores</p>
                  <p className="text-3xl font-bold mt-1">{ownedTenants.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Storefronts</p>
                  <p className="text-3xl font-bold mt-1">{storefronts.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-violet-100 text-sm font-medium">Total Stores</p>
                  <p className="text-3xl font-bold mt-1">{ownedTenants.length + storefronts.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search stores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setStoreTypeFilter('all')}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-all',
                    storeTypeFilter === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-muted text-foreground hover:bg-muted'
                  )}
                >
                  All
                </Button>
                <Button
                  onClick={() => setStoreTypeFilter('independent')}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-all',
                    storeTypeFilter === 'independent'
                      ? 'bg-primary text-white'
                      : 'bg-muted text-foreground hover:bg-muted'
                  )}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Independent
                </Button>
                <Button
                  onClick={() => setStoreTypeFilter('storefronts')}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-all',
                    storeTypeFilter === 'storefronts'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted text-foreground hover:bg-muted'
                  )}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Storefronts
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Independent Stores Section */}
        {(storeTypeFilter === 'all' || storeTypeFilter === 'independent') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Independent Stores
              </h2>
              <Link href="/stores/create-independent">
                <Button className="text-primary hover:bg-primary/10 flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Add Independent Store
                </Button>
              </Link>
            </div>

            {isTenantLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading stores...</p>
                </CardContent>
              </Card>
            ) : filteredTenants.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground">No independent stores found</p>
                  <p className="text-sm text-muted-foreground mt-1">Create a new independent store with full data isolation</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTenants.map((tenant) => (
                  <Card
                    key={tenant.id}
                    className={cn(
                      'hover:shadow-lg transition-all cursor-pointer group',
                      tenant.id === currentTenant?.id && 'ring-2 ring-blue-500'
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
                          style={{ backgroundColor: tenant.primaryColor || '#3b82f6' }}
                        >
                          {tenant.logoUrl ? (
                            <img src={tenant.logoUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            <Building2 className="w-6 h-6" />
                          )}
                        </div>
                        {tenant.id === currentTenant?.id && (
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            <Check className="w-3 h-3 mr-1" />
                            Current
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {tenant.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{tenant.slug}</p>

                      <div className="flex items-center gap-2 mt-4">
                        {getRoleBadge(tenant.role)}
                      </div>

                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Independent Store</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Storefronts Section */}
        {(storeTypeFilter === 'all' || storeTypeFilter === 'storefronts') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                Storefronts
                <span className="text-sm font-normal text-muted-foreground">(within {currentTenant?.name})</span>
              </h2>
              <Link href="/storefronts/create">
                <Button className="text-emerald-600 hover:bg-emerald-50 flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Add Storefront
                </Button>
              </Link>
            </div>

            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading storefronts...</p>
                </CardContent>
              </Card>
            ) : filteredStorefronts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground">No storefronts found</p>
                  <p className="text-sm text-muted-foreground mt-1">Create a new storefront to share data with your other brands</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStorefronts.map((storefront) => (
                  <Link
                    key={storefront.id}
                    href={`/storefronts/${storefront.id}/edit`}
                  >
                    <Card className="hover:shadow-lg transition-all cursor-pointer group h-full">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                            {storefront.logoUrl ? (
                              <img src={storefront.logoUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                            ) : (
                              <Globe className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <Badge className={cn(
                            storefront.isActive
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-muted text-muted-foreground border-border'
                          )}>
                            {storefront.isActive ? 'Active' : 'Draft'}
                          </Badge>
                        </div>

                        <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                          {storefront.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{storefront.slug}</p>

                        {storefront.customDomain && (
                          <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600">
                            <ExternalLink className="w-3 h-3" />
                            {storefront.customDomain}
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Storefront</span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Store Modal */}
        {showCreateModal && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowCreateModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-bold text-foreground">Create New Store</h2>
                  <p className="text-muted-foreground mt-1">Choose the type of store you want to create</p>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Independent Store Option */}
                  <Link
                    href="/stores/create-independent"
                    onClick={() => setShowCreateModal(false)}
                    className="block"
                  >
                    <div className="p-6 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/10/50 transition-all cursor-pointer group">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Building2 className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary">
                        Independent Store
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Create a completely separate business with its own products, customers, and settings.
                      </p>
                      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          Full data isolation
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          Separate billing
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          Own user management
                        </li>
                      </ul>
                    </div>
                  </Link>

                  {/* Storefront Option */}
                  <Link
                    href="/storefronts/create"
                    onClick={() => setShowCreateModal(false)}
                    className="block"
                  >
                    <div className="p-6 border-2 border-border rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-all cursor-pointer group">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Globe className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-600">
                        New Storefront
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Create a new brand or channel that shares data with your current store.
                      </p>
                      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          Shared products & inventory
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          Shared customers
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          Different branding/theme
                        </li>
                      </ul>
                    </div>
                  </Link>
                </div>

                <div className="p-6 border-t border-border flex justify-end">
                  <Button
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </PermissionGate>
  );
}
