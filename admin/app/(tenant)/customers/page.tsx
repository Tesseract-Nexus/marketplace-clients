'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Eye, Edit, Trash2, Users, TrendingUp, DollarSign, ShoppingCart, AlertCircle, X, Loader2, Home, UserCircle, Sparkles, Crown } from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge, getStatusFromMapping } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Select } from '@/components/Select';
import { Stepper, StepperNavigation, Step } from '@/components/Stepper';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { customerService } from '@/lib/services/customerService';
import type { Customer, CreateCustomerRequest, CustomerStatus, CustomerType } from '@/lib/api/types';

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

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
      setShowCreateModal(false);
      resetForm();
      loadCustomers();
    } catch (error) {
      console.error('Error creating customer:', error);
      setError(error instanceof Error ? error.message : 'Failed to create customer. Please try again.');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      setError(null);
      await customerService.deleteCustomer(customerToDelete);
      setShowDeleteModal(false);
      setCustomerToDelete(null);
      loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete customer. Please try again.');
    }
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
  const totalRevenue = (customers || []).reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalOrders = (customers || []).reduce((sum, c) => sum + (c.totalOrders || 0), 0);

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
      loading={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
    >
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Customers"
          description="Manage customer accounts and view customer insights"
          breadcrumbs={[
            { label: 'Home', href: '/', icon: Home },
            { label: 'Customers', icon: Users },
          ]}
          actions={
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        }
      />

      {/* Error Alert */}
      {error && (
        <div className="bg-error-muted border border-error/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-error">Error</h3>
            <p className="text-error-muted-foreground text-sm mt-1">{error}</p>
          </div>
          <Button
            onClick={() => setError(null)}
            className="p-1 rounded-lg hover:bg-error/10 transition-colors"
            aria-label="Dismiss error message"
            variant="ghost"
          >
            <X className="h-4 w-4 text-error" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">Total Customers</p>
              <p className="text-xl sm:text-3xl font-bold text-primary mt-1 sm:mt-2">
                {totalCustomers}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">Active Customers</p>
              <p className="text-xl sm:text-3xl font-bold text-success mt-1 sm:mt-2">
                {activeCustomers}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">Total Revenue</p>
              <p className="text-xl sm:text-3xl font-bold text-primary mt-1 sm:mt-2">
                ${totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">Total Orders</p>
              <p className="text-xl sm:text-3xl font-bold text-warning mt-1 sm:mt-2">
                {totalOrders}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-sm mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="sm:col-span-2 md:col-span-2">
            <div className="relative">
              <label htmlFor="customer-search" className="sr-only">Search customers by name or email</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="customer-search"
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Search customers"
              />
            </div>
          </div>

          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={customerStatusOptions}
          />

          <Select
            value={typeFilter}
            onChange={(value) => setTypeFilter(value)}
            options={customerTypeOptions}
          />
        </div>
      </div>

      {/* Customers Table - Desktop */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
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
            <tbody className="divide-y divide-gray-200">
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
      </div>

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          First Name *
                        </label>
                        <Input
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Last Name *
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
                        Email *
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
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                        rows={4}
                      />
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg border border-border">
                      <input
                        type="checkbox"
                        id="marketingOptIn"
                        checked={formData.marketingOptIn || false}
                        onChange={(e) => setFormData({ ...formData, marketingOptIn: e.target.checked })}
                        className="w-5 h-5 text-primary border-border rounded focus:ring-ring"
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

                      <div className="grid grid-cols-2 gap-4 text-sm">
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
      </div>
    </div>
    </PermissionGate>
  );
}