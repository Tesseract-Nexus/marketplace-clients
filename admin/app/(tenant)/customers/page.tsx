'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, Eye, Edit, Trash2, Users, TrendingUp, DollarSign, ShoppingCart, AlertCircle, X, Loader2, Home, UserCircle, Sparkles, Crown, CheckCircle, XCircle, Lock, Unlock, MoreVertical, RefreshCw } from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge, getStatusFromMapping } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Select } from '@/components/Select';
import { Stepper, StepperNavigation, Step } from '@/components/Stepper';
import { PageHeader } from '@/components/PageHeader';
import { PageError } from '@/components/PageError';
import { PageLoading } from '@/components/common';
import { Pagination } from '@/components/Pagination';
import { FilterPanel, QuickFilters, QuickFilter } from '@/components/data-listing';
import { DataPageLayout, SidebarSection, SidebarStatItem, HealthWidgetConfig } from '@/components/DataPageLayout';
import { customerService } from '@/lib/services/customerService';
import { useToast } from '@/contexts/ToastContext';
import type { Customer, CreateCustomerRequest, CustomerStatus, CustomerType } from '@/lib/api/types';
import { LockUnlockDialog } from './components/LockUnlockDialog';

const customerStatusOptions = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'BLOCKED', label: 'Blocked' },
];

const customerTypeOptions = [
  { value: 'ALL', label: 'All Types' },
  { value: 'RETAIL', label: 'Retail' },
  { value: 'WHOLESALE', label: 'Wholesale' },
  { value: 'VIP', label: 'VIP' },
];

const newCustomerTypeOptions = [
  { value: 'RETAIL', label: 'Retail' },
  { value: 'WHOLESALE', label: 'Wholesale' },
  { value: 'VIP', label: 'VIP' },
];

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize filters from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  // Lock/Unlock dialog state
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [lockAction, setLockAction] = useState<'lock' | 'unlock'>('lock');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Pagination - also from URL
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get('limit') || '25', 10));

  // Update URL when filters change
  const updateUrlParams = useCallback((params: Record<string, string>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'ALL' && value !== '1' && value !== '25') {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  // Create form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    customerType: 'RETAIL' as CustomerType,
    tags: [],
    notes: '',
    marketingOptIn: false,
  });
  const [tagInput, setTagInput] = useState('');

  // Load customers
  useEffect(() => {
    loadCustomers();
  }, [statusFilter, typeFilter]);

  // Sync filters to URL
  useEffect(() => {
    updateUrlParams({
      q: searchQuery,
      status: statusFilter,
      type: typeFilter,
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
    });
  }, [searchQuery, statusFilter, typeFilter, currentPage, itemsPerPage, updateUrlParams]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerService.getCustomers({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        customerType: typeFilter !== 'ALL' ? typeFilter : undefined,
      });
      setCustomers(response?.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      setError(error instanceof Error ? error.message : 'Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = (customers || []).filter((customer) =>
    customer.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  const handleCreateCustomer = async () => {
    try {
      setError(null);
      await customerService.createCustomer(formData);
      toast.success('Customer Created', 'The customer has been added successfully');
      setShowCreateModal(false);
      resetForm();
      loadCustomers();
    } catch (error) {
      console.error('Error creating customer:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to create customer. Please try again.';
      toast.error('Failed to Create Customer', errorMsg);
      setError(errorMsg);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      setError(null);
      await customerService.deleteCustomer(customerToDelete);
      toast.success('Customer Deleted', 'The customer has been removed successfully');
      setShowDeleteModal(false);
      setCustomerToDelete(null);
      loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete customer. Please try again.';
      toast.error('Failed to Delete Customer', errorMsg);
      setError(errorMsg);
    }
  };

  const handleLockClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setLockAction('lock');
    setShowLockDialog(true);
  };

  const handleUnlockClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setLockAction('unlock');
    setShowLockDialog(true);
  };

  const handleLockSuccess = (updatedCustomer: Customer) => {
    // Update customer in list
    setCustomers(prev => prev.map(c =>
      c.id === updatedCustomer.id ? updatedCustomer : c
    ));
    setShowLockDialog(false);
    setSelectedCustomer(null);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      customerType: 'RETAIL' as CustomerType,
      tags: [],
      notes: '',
      marketingOptIn: false,
    });
    setCurrentStep(1);
    setTagInput('');
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  // Customer type badge styling using semantic tokens
  const getTypeBadgeClass = (type: CustomerType) => {
    const classes = {
      RETAIL: 'bg-info-muted text-info-muted-foreground border-transparent',
      WHOLESALE: 'bg-primary/20 text-primary border-transparent',
      VIP: 'bg-warning-muted text-warning-muted-foreground border-transparent',
    };
    return classes[type] || classes.RETAIL;
  };

  const getTypeIcon = (type: CustomerType) => {
    const icons = {
      RETAIL: Users,
      WHOLESALE: Sparkles,
      VIP: Crown,
    };
    return icons[type] || icons.RETAIL;
  };

  // Calculate summary metrics
  const totalCustomers = (customers || []).length;
  const activeCustomers = (customers || []).filter((c) => c.status === 'ACTIVE').length;
  const inactiveCustomers = (customers || []).filter((c) => c.status === 'INACTIVE').length;
  const blockedCustomers = (customers || []).filter((c) => c.status === 'BLOCKED').length;
  const totalRevenue = (customers || []).reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalOrders = (customers || []).reduce((sum, c) => sum + (c.totalOrders || 0), 0);
  const vipCustomers = (customers || []).filter((c) => c.customerType === 'VIP').length;

  // Quick filters configuration
  const quickFilters: QuickFilter[] = useMemo(() => [
    { id: 'ACTIVE', label: 'Active', icon: CheckCircle, color: 'success', count: activeCustomers },
    { id: 'INACTIVE', label: 'Inactive', icon: XCircle, color: 'warning', count: inactiveCustomers },
    { id: 'BLOCKED', label: 'Blocked', icon: XCircle, color: 'error', count: blockedCustomers },
    { id: 'VIP', label: 'VIP', icon: Crown, color: 'info', count: vipCustomers },
  ], [activeCustomers, inactiveCustomers, blockedCustomers, vipCustomers]);

  // Active quick filter state
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);

  const handleQuickFilterToggle = (filterId: string) => {
    // For status filters (ACTIVE, INACTIVE, BLOCKED), set the status filter
    if (['ACTIVE', 'INACTIVE', 'BLOCKED'].includes(filterId)) {
      if (statusFilter === filterId) {
        setStatusFilter('ALL');
        setActiveQuickFilters([]);
      } else {
        setStatusFilter(filterId);
        setActiveQuickFilters([filterId]);
      }
    }
    // For type filters (VIP), set the type filter
    else if (filterId === 'VIP') {
      if (typeFilter === 'VIP') {
        setTypeFilter('ALL');
        setActiveQuickFilters(prev => prev.filter(f => f !== 'VIP'));
      } else {
        setTypeFilter('VIP');
        setActiveQuickFilters(prev => [...prev.filter(f => !['ACTIVE', 'INACTIVE', 'BLOCKED'].includes(f)), 'VIP']);
      }
    }
  };

  const clearAllFilters = () => {
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setSearchQuery('');
    setActiveQuickFilters([]);
  };

  // Calculate active filter count
  const activeFilterCount = (statusFilter !== 'ALL' ? 1 : 0) + (typeFilter !== 'ALL' ? 1 : 0);

  // Sidebar configuration for DataPageLayout
  const sidebarConfig = useMemo(() => {
    const healthWidget: HealthWidgetConfig = {
      label: 'Customer Health',
      currentValue: activeCustomers,
      totalValue: totalCustomers || 1,
      status: blockedCustomers > 5 ? 'critical' : inactiveCustomers > totalCustomers * 0.3 ? 'attention' : 'healthy',
      segments: [
        { value: activeCustomers, color: 'success' },
        { value: inactiveCustomers, color: 'warning' },
        { value: blockedCustomers, color: 'error' },
      ],
    };

    const sections: SidebarSection[] = [
      {
        title: 'Customer Status',
        items: [
          {
            id: 'total',
            label: 'Total',
            value: totalCustomers,
            icon: Users,
            color: 'default',
          },
          {
            id: 'active',
            label: 'Active',
            value: activeCustomers,
            icon: CheckCircle,
            color: 'success',
            onClick: () => {
              setStatusFilter('ACTIVE');
              setActiveQuickFilters(['ACTIVE']);
            },
            isActive: statusFilter === 'ACTIVE',
          },
          {
            id: 'inactive',
            label: 'Inactive',
            value: inactiveCustomers,
            icon: XCircle,
            color: 'warning',
            onClick: () => {
              setStatusFilter('INACTIVE');
              setActiveQuickFilters(['INACTIVE']);
            },
            isActive: statusFilter === 'INACTIVE',
          },
          {
            id: 'blocked',
            label: 'Blocked',
            value: blockedCustomers,
            icon: XCircle,
            color: 'error',
            onClick: () => {
              setStatusFilter('BLOCKED');
              setActiveQuickFilters(['BLOCKED']);
            },
            isActive: statusFilter === 'BLOCKED',
          },
        ],
      },
      {
        title: 'Customer Value',
        items: [
          {
            id: 'revenue',
            label: 'Revenue',
            value: `$${totalRevenue.toFixed(0)}`,
            icon: DollarSign,
            color: 'primary',
          },
          {
            id: 'orders',
            label: 'Orders',
            value: totalOrders,
            icon: ShoppingCart,
            color: 'default',
          },
          {
            id: 'vip',
            label: 'VIP',
            value: vipCustomers,
            icon: Crown,
            color: 'warning',
            onClick: () => {
              setTypeFilter('VIP');
              setActiveQuickFilters(prev => [...prev.filter(f => !['ACTIVE', 'INACTIVE', 'BLOCKED'].includes(f)), 'VIP']);
            },
            isActive: typeFilter === 'VIP',
          },
        ],
      },
    ];

    return { healthWidget, sections };
  }, [totalCustomers, activeCustomers, inactiveCustomers, blockedCustomers, totalRevenue, totalOrders, vipCustomers, statusFilter, typeFilter]);

  // Mobile stats for DataPageLayout
  const mobileStats: SidebarStatItem[] = useMemo(() => [
    { id: 'total', label: 'Total', value: totalCustomers, icon: Users, color: 'default' },
    { id: 'active', label: 'Active', value: activeCustomers, icon: CheckCircle, color: 'success' },
    { id: 'revenue', label: 'Revenue', value: `$${totalRevenue.toFixed(0)}`, icon: DollarSign, color: 'primary' },
    { id: 'orders', label: 'Orders', value: totalOrders, icon: ShoppingCart, color: 'default' },
  ], [totalCustomers, activeCustomers, totalRevenue, totalOrders]);

  const steps: Step[] = [
    { number: 1, title: 'Basic Info', description: 'Customer details' },
    { number: 2, title: 'Type & Tags', description: 'Classification' },
    { number: 3, title: 'Preferences', description: 'Settings' },
    { number: 4, title: 'Review', description: 'Confirm details' },
  ];

  return (
    <PermissionGate
      permission={Permission.CUSTOMERS_READ}
      fallback="styled"
      fallbackTitle="Customers Access Required"
      fallbackDescription="You don't have the required permissions to view customers. Please contact your administrator to request access."
      loading={<PageLoading fullScreen />}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Customers"
          description="Manage customer accounts and view customer insights"
          breadcrumbs={[
            { label: 'Home', href: '/', icon: Home },
            { label: 'Customers', icon: Users },
          ]}
      />

      {/* Error Alert */}
      <PageError error={error} onDismiss={() => setError(null)} />

      <DataPageLayout
        sidebar={sidebarConfig}
        mobileStats={mobileStats}
      >
      {/* Filters and Search */}
      <FilterPanel
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name or email..."
        activeFilterCount={activeFilterCount}
        onClearAll={clearAllFilters}
        className="mb-4 sm:mb-6"
        quickFilters={
          <QuickFilters
            filters={quickFilters}
            activeFilters={activeQuickFilters}
            onFilterToggle={handleQuickFilterToggle}
            onClearAll={clearAllFilters}
            showClearAll={false}
            size="sm"
          />
        }
      >
        <Select
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setActiveQuickFilters(value !== 'ALL' ? [value] : []);
          }}
          options={customerStatusOptions}
        />
        <Select
          value={typeFilter}
          onChange={(value) => {
            setTypeFilter(value);
            if (value === 'VIP') {
              setActiveQuickFilters(prev => [...prev.filter(f => !['VIP'].includes(f)), 'VIP']);
            } else {
              setActiveQuickFilters(prev => prev.filter(f => f !== 'VIP'));
            }
          }}
          options={customerTypeOptions}
        />
        <Button
          onClick={loadCustomers}
          disabled={loading}
          variant="ghost"
          className="p-2.5 rounded-md bg-muted hover:bg-muted transition-all"
          title="Refresh"
          aria-label="Refresh customers list"
        >
          <RefreshCw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin")} aria-hidden="true" />
        </Button>
      </FilterPanel>

      {/* Customers Table - Desktop */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-foreground">Customer</th>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-foreground">Contact</th>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-foreground">Type</th>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-foreground">Orders</th>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-foreground">Total Spent</th>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-foreground">LTV</th>
                <th className="px-4 lg:px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                      <span className="text-muted-foreground">Loading customers...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    No customers found
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted transition-colors">
                    <td className="px-4 lg:px-6 py-4">
                      <div>
                        <div className="font-semibold text-foreground">
                          {customer.firstName} {customer.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground truncate max-w-[150px]">ID: {customer.id}</div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-sm">
                        <div className="text-foreground truncate max-w-[200px]">{customer.email}</div>
                        {customer.phone && <div className="text-muted-foreground">{customer.phone}</div>}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      {(() => {
                        const TypeIcon = getTypeIcon(customer.customerType);
                        return (
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2 lg:px-3 py-1 rounded-full text-xs font-semibold border',
                            getTypeBadgeClass(customer.customerType)
                          )}>
                            <TypeIcon className="w-3 h-3" aria-hidden="true" />
                            {customer.customerType}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <StatusBadge status={getStatusFromMapping('user', customer.status)}>
                        {customer.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-foreground">{customer.totalOrders}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm font-semibold text-foreground">
                      ${customer.totalSpent.toFixed(2)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm font-semibold text-primary">
                      ${customer.lifetimeValue.toFixed(2)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/customers/${customer.id}`)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                          title="View Details"
                          aria-label="View customer details"
                        >
                          <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                        </Button>
                        {customer.status === 'ACTIVE' || customer.status === 'INACTIVE' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLockClick(customer)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-warning-muted transition-colors"
                            title="Lock Account"
                            aria-label="Lock customer account"
                          >
                            <Lock className="w-4 h-4 text-warning" aria-hidden="true" />
                          </Button>
                        ) : customer.status === 'BLOCKED' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnlockClick(customer)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-success-muted transition-colors"
                            title="Unlock Account"
                            aria-label="Unlock customer account"
                          >
                            <Unlock className="w-4 h-4 text-success" aria-hidden="true" />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCustomerToDelete(customer.id);
                            setShowDeleteModal(true);
                          }}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-error-muted transition-colors"
                          title="Delete"
                          aria-label="Delete customer"
                        >
                          <Trash2 className="w-4 h-4 text-error" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          {loading ? (
            <div className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <span className="text-muted-foreground">Loading customers...</span>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No customers found
            </div>
          ) : (
            <div className="divide-y divide-border">
              {paginatedCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer"
                  onClick={() => router.push(`/customers/${customer.id}`)}
                >
                  {/* Customer Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground">
                        {customer.firstName} {customer.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">{customer.email}</div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {(() => {
                        const TypeIcon = getTypeIcon(customer.customerType);
                        return (
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
                            getTypeBadgeClass(customer.customerType)
                          )}>
                            <TypeIcon className="w-3 h-3" aria-hidden="true" />
                            {customer.customerType}
                          </span>
                        );
                      })()}
                      <StatusBadge
                        status={getStatusFromMapping('user', customer.status)}
                        size="sm"
                      >
                        {customer.status}
                      </StatusBadge>
                    </div>
                  </div>

                  {/* Customer Stats */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Orders</div>
                      <div className="font-medium text-foreground">{customer.totalOrders}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Spent</div>
                      <div className="font-semibold text-foreground">${customer.totalSpent.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">LTV</div>
                      <div className="font-semibold text-primary">${customer.lifetimeValue.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/customers/${customer.id}`);
                      }}
                      className="h-9 px-3 text-xs"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View
                    </Button>
                    {customer.status === 'ACTIVE' || customer.status === 'INACTIVE' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLockClick(customer);
                        }}
                        className="h-9 px-3 text-xs text-warning border-warning/30 hover:bg-warning-muted"
                      >
                        <Lock className="w-3.5 h-3.5 mr-1.5" />
                        Lock
                      </Button>
                    ) : customer.status === 'BLOCKED' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlockClick(customer);
                        }}
                        className="h-9 px-3 text-xs text-success border-success/30 hover:bg-success-muted"
                      >
                        <Unlock className="w-3.5 h-3.5 mr-1.5" />
                        Unlock
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomerToDelete(customer.id);
                        setShowDeleteModal(true);
                      }}
                      className="h-9 px-3 text-xs text-error border-error/30 hover:bg-error-muted"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
        {!loading && filteredCustomers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </DataPageLayout>

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 z-10">
              <h2 className="text-2xl font-bold text-primary">
                Add New Customer
              </h2>
            </div>

            <div className="p-6">
              <Stepper steps={steps} currentStep={currentStep} />

              <div className="mt-8">
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          First Name <span className="text-error">*</span>
                        </label>
                        <Input
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Last Name <span className="text-error">*</span>
                        </label>
                        <Input
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Email <span className="text-error">*</span>
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john.doe@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Phone
                      </label>
                      <Input
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1-555-0123"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Customer Type
                      </label>
                      <Select
                        value={formData.customerType || 'RETAIL'}
                        onChange={(value) => setFormData({ ...formData, customerType: value as CustomerType })}
                        options={newCustomerTypeOptions}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Tags
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                          placeholder="Add tag and press Enter"
                        />
                        <Button onClick={handleAddTag} type="button">
                          Add
                        </Button>
                      </div>
                      {formData.tags && formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary/20 text-primary border border-primary/30"
                            >
                              {tag}
                              <Button
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-primary"
                              >
                                ×
                              </Button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Notes
                      </label>
                      <textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Additional notes about the customer..."
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                        rows={4}
                      />
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-md border border-border">
                      <input
                        type="checkbox"
                        id="marketingOptIn"
                        checked={formData.marketingOptIn || false}
                        onChange={(e) => setFormData({ ...formData, marketingOptIn: e.target.checked })}
                        className="h-4 w-4 rounded-md border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0"
                      />
                      <label htmlFor="marketingOptIn" className="text-sm font-medium text-foreground">
                        Subscribe to marketing communications
                      </label>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="bg-primary/5 rounded-lg p-6 border border-primary/30">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Review Customer Details</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground font-medium">Name:</span>
                          <p className="text-foreground font-semibold">{formData.firstName} {formData.lastName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium">Email:</span>
                          <p className="text-foreground font-semibold">{formData.email}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium">Phone:</span>
                          <p className="text-foreground font-semibold">{formData.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium">Type:</span>
                          <p className="text-foreground font-semibold">{formData.customerType}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground font-medium">Tags:</span>
                          <p className="text-foreground font-semibold">
                            {formData.tags && formData.tags.length > 0 ? formData.tags.join(', ') : 'None'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground font-medium">Marketing Opt-in:</span>
                          <p className="text-foreground font-semibold">{formData.marketingOptIn ? 'Yes' : 'No'}</p>
                        </div>
                        {formData.notes && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground font-medium">Notes:</span>
                            <p className="text-foreground">{formData.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <StepperNavigation
                currentStep={currentStep}
                totalSteps={steps.length}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onCancel={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                onSave={handleCreateCustomer}
                nextDisabled={
                  !((currentStep === 1 && !!formData.firstName && !!formData.lastName && !!formData.email) ||
                  currentStep > 1)
                }
              />
            </div>
          </div>
        </div>
      )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setCustomerToDelete(null);
          }}
          onConfirm={handleDeleteCustomer}
          title="Delete Customer"
          message="Are you sure you want to delete this customer? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />

        {/* Lock/Unlock Dialog */}
        <LockUnlockDialog
          isOpen={showLockDialog}
          onClose={() => {
            setShowLockDialog(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          action={lockAction}
          onSuccess={handleLockSuccess}
        />
      </div>
    </div>
    </PermissionGate>
  );
}