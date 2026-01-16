'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  MapPin,
  StickyNote,
  Edit2,
  Trash2,
  Plus,
  Save,
  X,
  Loader2,
  AlertCircle,
  Check,
  User,
  Clock,
  Tag,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Select } from '@/components/Select';
import { useTenant } from '@/contexts/TenantContext';
import type {
  Customer,
  CustomerAddress,
  CustomerStatus,
  CustomerType,
  Order,
} from '@/lib/api/types';

// Customer Note type (not in types.ts yet)
interface CustomerNote {
  id: string;
  customerId: string;
  note: string;
  createdBy?: string;
  createdAt: string;
}

// Customer Segment type
interface CustomerSegment {
  id: string;
  name: string;
  description?: string;
  segmentType: 'STATIC' | 'DYNAMIC';
  memberCount: number;
  createdAt: string;
}

type TabType = 'overview' | 'orders' | 'addresses' | 'notes' | 'segments';

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'BLOCKED', label: 'Blocked' },
];

const typeOptions = [
  { value: 'RETAIL', label: 'Retail' },
  { value: 'WHOLESALE', label: 'Wholesale' },
  { value: 'VIP', label: 'VIP' },
];

const addressTypeOptions = [
  { value: 'SHIPPING', label: 'Shipping' },
  { value: 'BILLING', label: 'Billing' },
  { value: 'BOTH', label: 'Both' },
];

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentTenant } = useTenant();
  const customerId = params.id as string;

  // State
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
  const [allSegments, setAllSegments] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Segment modal state
  const [showAddSegmentModal, setShowAddSegmentModal] = useState(false);
  const [addingToSegment, setAddingToSegment] = useState(false);
  const [removingFromSegment, setRemovingFromSegment] = useState<string | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});
  const [saving, setSaving] = useState(false);

  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [addressForm, setAddressForm] = useState({
    addressType: 'SHIPPING' as string,
    isDefault: false,
    firstName: '',
    lastName: '',
    company: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
  });

  // Note state
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'address' | 'note'; id: string } | null>(null);

  // Fetch customer data
  useEffect(() => {
    if (customerId && currentTenant?.id) {
      fetchCustomerData();
    }
  }, [customerId, currentTenant?.id]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers: Record<string, string> = { 'X-Tenant-ID': currentTenant!.id };

      // Fetch customer details
      const customerRes = await fetch(`/api/customers/${customerId}`, { headers, credentials: 'include' });
      if (!customerRes.ok) throw new Error('Failed to fetch customer');
      const customerData = await customerRes.json();
      setCustomer(customerData.data || customerData);

      // Fetch customer orders
      const ordersRes = await fetch(`/api/orders?customerId=${customerId}`, { headers, credentials: 'include' });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.data || ordersData.orders || []);
      }

      // Fetch addresses
      const addressesRes = await fetch(`/api/customers/${customerId}/addresses`, { headers, credentials: 'include' });
      if (addressesRes.ok) {
        const addressesData = await addressesRes.json();
        setAddresses(addressesData.data || addressesData || []);
      }

      // Fetch notes
      const notesRes = await fetch(`/api/customers/${customerId}/notes`, { headers, credentials: 'include' });
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData.data || notesData || []);
      }

      // Fetch all segments and determine which ones the customer belongs to
      const segmentsRes = await fetch('/api/segments', { headers, credentials: 'include' });
      if (segmentsRes.ok) {
        const segmentsData = await segmentsRes.json();
        const segments = segmentsData.data || segmentsData || [];
        setAllSegments(segments);

        // For each segment, check if customer is a member
        const memberSegments: CustomerSegment[] = [];
        for (const segment of segments) {
          try {
            const membersRes = await fetch(`/api/segments/${segment.id}/customers`, { headers });
            if (membersRes.ok) {
              const membersData = await membersRes.json();
              const members = membersData.data || membersData || [];
              if (members.some((m: { id: string }) => m.id === customerId)) {
                memberSegments.push(segment);
              }
            }
          } catch {
            // Ignore errors for individual segment member checks
          }
        }
        setCustomerSegments(memberSegments);
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (customer) {
      setEditForm({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        status: customer.status,
        customerType: customer.customerType,
        marketingOptIn: customer.marketingOptIn,
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': currentTenant!.id,
        },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error('Failed to update customer');

      const data = await res.json();
      setCustomer(data.data || data);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async () => {
    try {
      setSaving(true);
      const url = editingAddress
        ? `/api/customers/${customerId}/addresses/${editingAddress.id}`
        : `/api/customers/${customerId}/addresses`;
      const method = editingAddress ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': currentTenant!.id,
        },
        body: JSON.stringify(addressForm),
      });

      if (!res.ok) throw new Error('Failed to save address');

      setShowAddressModal(false);
      setEditingAddress(null);
      resetAddressForm();
      fetchCustomerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setAddingNote(true);
      const res = await fetch(`/api/customers/${customerId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': currentTenant!.id,
        },
        body: JSON.stringify({ note: newNote }),
      });

      if (!res.ok) throw new Error('Failed to add note');

      setNewNote('');
      fetchCustomerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const url =
        deleteTarget.type === 'address'
          ? `/api/customers/${customerId}/addresses/${deleteTarget.id}`
          : `/api/customers/${customerId}/notes/${deleteTarget.id}`;

      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'X-Tenant-ID': currentTenant!.id },
      });

      if (!res.ok) throw new Error(`Failed to delete ${deleteTarget.type}`);

      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchCustomerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleAddToSegment = async (segmentId: string) => {
    try {
      setAddingToSegment(true);
      const res = await fetch(`/api/segments/${segmentId}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': currentTenant!.id,
        },
        body: JSON.stringify({ customerIds: [customerId] }),
      });

      if (!res.ok) throw new Error('Failed to add customer to segment');

      setShowAddSegmentModal(false);
      fetchCustomerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to segment');
    } finally {
      setAddingToSegment(false);
    }
  };

  const handleRemoveFromSegment = async (segmentId: string) => {
    try {
      setRemovingFromSegment(segmentId);
      const res = await fetch(`/api/segments/${segmentId}/customers`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': currentTenant!.id,
        },
        body: JSON.stringify({ customerIds: [customerId] }),
      });

      if (!res.ok) throw new Error('Failed to remove customer from segment');

      fetchCustomerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from segment');
    } finally {
      setRemovingFromSegment(null);
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      addressType: 'SHIPPING',
      isDefault: false,
      firstName: '',
      lastName: '',
      company: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phone: '',
    });
  };

  const openEditAddress = (address: CustomerAddress) => {
    setEditingAddress(address);
    setAddressForm({
      addressType: address.addressType,
      isDefault: address.isDefault,
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      company: address.company || '',
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state || '',
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone || '',
    });
    setShowAddressModal(true);
  };

  const getStatusBadge = (status: CustomerStatus) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-700 border-green-200',
      INACTIVE: 'bg-muted text-foreground border-border',
      BLOCKED: 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[status] || styles.ACTIVE;
  };

  const getTypeBadge = (type: CustomerType) => {
    const styles = {
      RETAIL: 'bg-primary/20 text-primary border-primary/30',
      WHOLESALE: 'bg-purple-100 text-purple-700 border-purple-200',
      VIP: 'bg-amber-100 text-amber-700 border-amber-200',
    };
    return styles[type] || styles.RETAIL;
  };

  const getOrderStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PLACED: 'bg-primary/20 text-primary',
      CONFIRMED: 'bg-indigo-100 text-indigo-700',
      PROCESSING: 'bg-yellow-100 text-yellow-700',
      SHIPPED: 'bg-purple-100 text-purple-700',
      DELIVERED: 'bg-green-100 text-green-700',
      COMPLETED: 'bg-emerald-100 text-emerald-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-muted text-foreground';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading customer...</span>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg mx-auto">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700 mt-1">{error || 'Customer not found'}</p>
              <Button
                onClick={() => router.push('/customers')}
                variant="outline"
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Customers
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: User },
    { id: 'orders' as TabType, label: 'Orders', icon: ShoppingCart, count: orders.length },
    { id: 'addresses' as TabType, label: 'Addresses', icon: MapPin, count: addresses.length },
    { id: 'notes' as TabType, label: 'Notes', icon: StickyNote, count: notes.length },
    { id: 'segments' as TabType, label: 'Segments', icon: Users, count: customerSegments.length },
  ];

  // Get segments that customer is not yet a member of
  const availableSegments = allSegments.filter(
    (s) => s.segmentType === 'STATIC' && !customerSegments.some((cs) => cs.id === s.id)
  );

  return (
    <PermissionGate
      permission={Permission.CUSTOMERS_VIEW}
      fallback="styled"
      fallbackTitle="Customer Details Access Required"
      fallbackDescription="You don't have the required permissions to view customer details. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title={`${customer.firstName} ${customer.lastName}`}
          description={customer.email}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Customers', href: '/customers' },
            { label: `${customer.firstName} ${customer.lastName}` },
          ]}
          actions={
            <div className="flex items-center gap-3">
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium border', getStatusBadge(customer.status))}>
                {customer.status}
              </span>
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium border', getTypeBadge(customer.customerType))}>
                {customer.customerType}
              </span>
              {!isEditing && (
                <Button onClick={handleEdit} variant="outline">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          }
        />

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700">{error}</p>
            </div>
            <Button onClick={() => setError(null)} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-foreground mt-2">{customer.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Spent</p>
                <p className="text-3xl font-bold text-foreground mt-2">${customer.totalSpent.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Avg Order Value</p>
                <p className="text-3xl font-bold text-foreground mt-2">${customer.averageOrderValue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Lifetime Value</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mt-2">
                  ${customer.lifetimeValue.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-purple-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="border-b border-border">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={cn(
                      'ml-1 px-2 py-0.5 rounded-full text-xs',
                      activeTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                        <Input
                          value={editForm.firstName || ''}
                          onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                        <Input
                          value={editForm.lastName || ''}
                          onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                        <Input
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                        <Input
                          value={editForm.phone || ''}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                        <Select
                          value={editForm.status || 'ACTIVE'}
                          onChange={(value) => setEditForm({ ...editForm, status: value as CustomerStatus })}
                          options={statusOptions}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                        <Select
                          value={editForm.customerType || 'RETAIL'}
                          onChange={(value) => setEditForm({ ...editForm, customerType: value as CustomerType })}
                          options={typeOptions}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="marketingOptIn"
                        checked={editForm.marketingOptIn || false}
                        onChange={(e) => setEditForm({ ...editForm, marketingOptIn: e.target.checked })}
                        className="h-4 w-4 text-primary rounded"
                      />
                      <label htmlFor="marketingOptIn" className="text-sm text-foreground">
                        Subscribed to marketing emails
                      </label>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground">Contact Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Customer since {formatDate(customer.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground">Preferences</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {customer.marketingOptIn ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-muted-foreground">
                            {customer.marketingOptIn ? 'Subscribed to marketing' : 'Not subscribed to marketing'}
                          </span>
                        </div>
                        {customer.lastOrderDate && (
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Last order: {formatDate(customer.lastOrderDate)}</span>
                          </div>
                        )}
                        {customer.tags && customer.tags.length > 0 && (
                          <div className="flex items-start gap-3">
                            <Tag className="h-4 w-4 text-muted-foreground mt-1" />
                            <div className="flex flex-wrap gap-2">
                              {customer.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-muted text-foreground rounded text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No orders yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Order</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Items</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orders.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-muted cursor-pointer"
                            onClick={() => router.push(`/orders/${order.id}`)}
                          >
                            <td className="px-4 py-3">
                              <span className="font-medium text-primary">{order.orderNumber}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn('px-2 py-1 rounded text-xs font-medium', getOrderStatusBadge(order.status))}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{order.totalItems} items</td>
                            <td className="px-4 py-3 text-right font-medium">${order.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      resetAddressForm();
                      setEditingAddress(null);
                      setShowAddressModal(true);
                    }}
                    className="bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </div>
                {addresses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No addresses saved</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className="border border-border rounded-lg p-4 relative"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium px-2 py-0.5 bg-muted text-foreground rounded">
                                {address.addressType}
                              </span>
                              {address.isDefault && (
                                <span className="text-xs font-medium px-2 py-0.5 bg-primary/20 text-primary rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="font-medium text-foreground">
                              {address.firstName} {address.lastName}
                            </p>
                            {address.company && <p className="text-sm text-muted-foreground">{address.company}</p>}
                            <p className="text-sm text-muted-foreground">{address.addressLine1}</p>
                            {address.addressLine2 && <p className="text-sm text-muted-foreground">{address.addressLine2}</p>}
                            <p className="text-sm text-muted-foreground">
                              {address.city}, {address.state} {address.postalCode}
                            </p>
                            <p className="text-sm text-muted-foreground">{address.country}</p>
                            {address.phone && <p className="text-sm text-muted-foreground mt-1">{address.phone}</p>}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditAddress(address)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeleteTarget({ type: 'address', id: address.id });
                                setShowDeleteModal(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note about this customer..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.trim()}
                    className="bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {addingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
                {notes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <StickyNote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No notes yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="border border-border rounded-lg p-4 bg-yellow-50/50"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-foreground whitespace-pre-wrap">{note.note}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteTarget({ type: 'note', id: note.id });
                              setShowDeleteModal(true);
                            }}
                            className="h-8 w-8 p-0 flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDateTime(note.createdAt)}
                          {note.createdBy && ` by ${note.createdBy}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Segments Tab */}
            {activeTab === 'segments' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Customer belongs to {customerSegments.length} segment{customerSegments.length !== 1 ? 's' : ''}
                  </p>
                  {availableSegments.length > 0 && (
                    <Button
                      onClick={() => setShowAddSegmentModal(true)}
                      className="bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Segment
                    </Button>
                  )}
                </div>
                {customerSegments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Not assigned to any segments</p>
                    {availableSegments.length > 0 && (
                      <Button
                        onClick={() => setShowAddSegmentModal(true)}
                        className="mt-4 bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Segment
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customerSegments.map((segment) => (
                      <div
                        key={segment.id}
                        className="border border-border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-foreground">{segment.name}</h4>
                              <span className={cn(
                                'text-xs font-medium px-2 py-0.5 rounded',
                                segment.segmentType === 'DYNAMIC'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-primary/20 text-primary'
                              )}>
                                {segment.segmentType}
                              </span>
                            </div>
                            {segment.description && (
                              <p className="text-sm text-muted-foreground mb-2">{segment.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {segment.memberCount} member{segment.memberCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          {segment.segmentType === 'STATIC' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFromSegment(segment.id)}
                              disabled={removingFromSegment === segment.id}
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              {removingFromSegment === segment.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              ) : (
                                <X className="h-4 w-4 text-red-500" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {customerSegments.some((s) => s.segmentType === 'DYNAMIC') && (
                  <p className="text-xs text-muted-foreground italic mt-4">
                    Dynamic segments are automatically managed based on rules and cannot be manually removed.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add to Segment Modal */}
      {showAddSegmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-xl font-bold text-foreground">Add to Segment</h2>
              <p className="text-sm text-muted-foreground mt-1">Select a segment to add this customer to</p>
            </div>
            <div className="p-6">
              {availableSegments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No available segments. All static segments already contain this customer.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableSegments.map((segment) => (
                    <button
                      key={segment.id}
                      onClick={() => handleAddToSegment(segment.id)}
                      disabled={addingToSegment}
                      className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-foreground">{segment.name}</h4>
                          {segment.description && (
                            <p className="text-sm text-muted-foreground">{segment.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {segment.memberCount} members
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-border px-6 py-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAddSegmentModal(false)}
                disabled={addingToSegment}
              >
                {addingToSegment ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  'Cancel'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4">
              <h2 className="text-xl font-bold text-foreground">
                {editingAddress ? 'Edit Address' : 'Add Address'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Address Type</label>
                  <Select
                    value={addressForm.addressType}
                    onChange={(value) => setAddressForm({ ...addressForm, addressType: value })}
                    options={addressTypeOptions}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="h-4 w-4 text-primary rounded"
                    />
                    <span className="text-sm text-foreground">Set as default</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                  <Input
                    value={addressForm.firstName}
                    onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                  <Input
                    value={addressForm.lastName}
                    onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Company (optional)</label>
                <Input
                  value={addressForm.company}
                  onChange={(e) => setAddressForm({ ...addressForm, company: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Address Line 1 *</label>
                <Input
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Address Line 2</label>
                <Input
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">City *</label>
                  <Input
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">State</label>
                  <Input
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Postal Code *</label>
                  <Input
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Country *</label>
                  <Input
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                <Input
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddressModal(false);
                  setEditingAddress(null);
                  resetAddressForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddAddress}
                disabled={saving || !addressForm.addressLine1 || !addressForm.city || !addressForm.postalCode || !addressForm.country}
                className="bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {editingAddress ? 'Update' : 'Add'} Address
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.type === 'address' ? 'Address' : 'Note'}`}
        message={`Are you sure you want to delete this ${deleteTarget?.type}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
    </PermissionGate>
  );
}
