"use client";

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  Save,
  Filter,
  Store,
  Globe,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
  Palette,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/Pagination';
import { storefrontService } from '@/lib/services/storefrontService';
import { Storefront } from '@/lib/api/types';
import { useTenant } from '@/contexts/TenantContext';
import { getStorefrontUrl } from '@/lib/utils/tenant';
import { PermissionGate, Permission } from '@/components/permission-gate';

type ViewMode = 'list' | 'detail';

export default function StorefrontsPage() {
  const { currentTenant, isLoading: isTenantLoading } = useTenant();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Load storefronts when tenant changes
  useEffect(() => {
    // Wait for tenant to be loaded before fetching storefronts
    if (!isTenantLoading && currentTenant?.id) {
      loadStorefronts();
    }
  }, [currentTenant?.id, isTenantLoading]);

  const loadStorefronts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await storefrontService.getStorefronts();
      setStorefronts(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load storefronts');
      console.error('Error loading storefronts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStorefronts = storefronts.filter(storefront => {
    const matchesSearch = storefront.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      storefront.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && storefront.isActive) ||
      (statusFilter === 'INACTIVE' && !storefront.isActive);
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalItems = filteredStorefronts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStorefronts = filteredStorefronts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleViewStorefront = (storefront: Storefront) => {
    setSelectedStorefront(storefront);
    setViewMode('detail');
  };

  const handleDeleteStorefront = (storefront: Storefront) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Storefront',
      message: `Are you sure you want to delete "${storefront.name}"? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await storefrontService.deleteStorefront(storefront.id);
          await loadStorefronts();
          setModalConfig({ ...modalConfig, isOpen: false });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to delete storefront');
        }
      },
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-success-muted text-success-foreground border-success/30">Active</Badge>;
    }
    return <Badge className="bg-muted text-foreground border-border">Inactive</Badge>;
  };

  if (viewMode === 'detail' && selectedStorefront) {
    return (
      <PermissionGate
        permission={Permission.STOREFRONTS_VIEW}
        fallback="styled"
        fallbackTitle="Storefronts Access Required"
        fallbackDescription="You don't have the required permissions to view storefronts. Please contact your administrator to request access."
      >
      <div className="min-h-screen bg-background p-8">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Storefront Details"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Storefronts', href: '/storefronts' },
              { label: selectedStorefront.name },
            ]}
            actions={
            <>
              <Link href={`/storefronts/${selectedStorefront.id}/edit`}>
                <Button
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
                >
                  <Edit className="w-5 h-5" />
                  Edit
                </Button>
              </Link>
              <Link href={`/storefronts/${selectedStorefront.id}/theme`}>
                <Button
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
                >
                  <Palette className="w-5 h-5" />
                  Customize Theme
                </Button>
              </Link>
              <Button
                onClick={() => setViewMode('list')}
                className="px-6 py-3 bg-card border-2 border-border text-foreground rounded-xl hover:bg-muted transition-all duration-200 flex items-center gap-2 font-semibold"
              >
                <X className="w-5 h-5" />
                Close
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Storefront Name</p>
                <p className="font-semibold text-lg">{selectedStorefront.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Slug</p>
                <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{selectedStorefront.slug}</code>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(selectedStorefront.isActive)}</div>
              </div>
              {selectedStorefront.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-foreground">{selectedStorefront.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                URLs & Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Storefront URL</p>
                <div className="flex items-center gap-2 mt-1">
                  <a
                    href={getStorefrontUrl(selectedStorefront)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    {getStorefrontUrl(selectedStorefront)}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              {selectedStorefront.customDomain && (
                <div>
                  <p className="text-sm text-muted-foreground">Custom Domain</p>
                  <a
                    href={`https://${selectedStorefront.customDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    {selectedStorefront.customDomain}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Vendor ID</p>
                <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{selectedStorefront.vendorId}</code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedStorefront.logoUrl ? (
                <div>
                  <p className="text-sm text-muted-foreground">Logo</p>
                  <img src={selectedStorefront.logoUrl} alt="Logo" className="h-12 mt-2" />
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">Logo</p>
                  <p className="text-muted-foreground">No logo uploaded</p>
                </div>
              )}
              {selectedStorefront.metaTitle && (
                <div>
                  <p className="text-sm text-muted-foreground">Meta Title</p>
                  <p className="font-semibold">{selectedStorefront.metaTitle}</p>
                </div>
              )}
              {selectedStorefront.metaDescription && (
                <div>
                  <p className="text-sm text-muted-foreground">Meta Description</p>
                  <p className="text-foreground">{selectedStorefront.metaDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-semibold">{new Date(selectedStorefront.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-semibold">{new Date(selectedStorefront.updatedAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
      </PermissionGate>
    );
  }

  return (
    <PermissionGate
      permission={Permission.STOREFRONTS_VIEW}
      fallback="styled"
      fallbackTitle="Storefronts Access Required"
      fallbackDescription="You don't have the required permissions to view storefronts. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Storefront Management"
          description="Manage your vendor storefronts and their configurations"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Storefronts' },
          ]}
          actions={
          <Link href="/storefronts/create">
            <Button
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Create Storefront
            </Button>
          </Link>
        }
      />

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border-2 border-destructive/30 rounded-xl text-destructive flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search storefronts by name or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
            </div>

            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-4 py-3 rounded-xl transition-all flex items-center gap-2 font-medium",
                showFilters
                  ? "bg-primary/20 text-primary border-2 border-primary/50"
                  : "bg-muted text-foreground border-2 border-border hover:bg-muted"
              )}
            >
              <Filter className="w-5 h-5" />
              Filters
              {statusFilter !== 'ALL' && (
                <Badge className="bg-primary/20 text-primary border-primary/30">1</Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-muted rounded-xl border-2 border-border">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: 'ALL', label: 'All Statuses' },
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' },
                  ]}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading storefronts...</p>
            </div>
          ) : filteredStorefronts.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No storefronts found</p>
              <p className="text-muted-foreground mt-2">Try adjusting your search or create a new storefront</p>
              <Link href="/storefronts/create">
                <Button className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-xl">
                  <Plus className="w-5 h-5 mr-2" />
                  Create First Storefront
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left p-4 font-semibold text-foreground">Storefront</th>
                    <th className="text-left p-4 font-semibold text-foreground">Slug</th>
                    <th className="text-left p-4 font-semibold text-foreground">Status</th>
                    <th className="text-left p-4 font-semibold text-foreground">URL</th>
                    <th className="text-left p-4 font-semibold text-foreground">Created</th>
                    <th className="text-right p-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStorefronts.map((storefront) => (
                    <tr
                      key={storefront.id}
                      className="border-b border-border hover:bg-primary/10/50 transition-colors cursor-pointer"
                      onClick={() => handleViewStorefront(storefront)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {storefront.logoUrl ? (
                            <img src={storefront.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                              <Store className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-foreground">{storefront.name}</p>
                            {storefront.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">{storefront.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{storefront.slug}</code>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(storefront.isActive)}
                      </td>
                      <td className="p-4">
                        <a
                          href={getStorefrontUrl(storefront)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          /{storefront.slug}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-muted-foreground">
                          {new Date(storefront.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewStorefront(storefront);
                            }}
                            className="p-1.5 h-auto rounded-lg hover:bg-primary/10 transition-colors"
                            title="View Details"
                            aria-label="View storefront details"
                          >
                            <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                          </Button>
                          <Link href={`/storefronts/${storefront.id}/edit`} onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1.5 h-auto rounded-lg hover:bg-primary/10 transition-colors"
                              title="Edit"
                              aria-label="Edit storefront"
                            >
                              <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
                            </Button>
                          </Link>
                          <Link href="/settings/storefront-theme" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1.5 h-auto rounded-lg hover:bg-primary/10 transition-colors"
                              title="Customize Theme"
                              aria-label="Customize storefront theme"
                            >
                              <Palette className="w-4 h-4 text-primary" aria-hidden="true" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStorefront(storefront);
                            }}
                            className="p-1.5 h-auto rounded-lg hover:bg-destructive/10 transition-colors"
                            title="Delete"
                            aria-label="Delete storefront"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && filteredStorefronts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

        <ConfirmModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          variant={modalConfig.variant}
        />
      </div>
    </div>
    </PermissionGate>
  );
}
