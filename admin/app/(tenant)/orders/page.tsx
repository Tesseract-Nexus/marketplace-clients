'use client';

// Orders page - Updated: 2025-12-31
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { PageError } from '@/components/PageError';
import { PageLoading } from '@/components/common';
import {
  AdminUIText,
  AdminButtonText,
  AdminFormLabel,
  AdminMessage,
} from '@/components/translation/AdminTranslatedText';
import { Pagination } from '@/components/Pagination';
import { FilterPanel, QuickFilters, QuickFilter } from '@/components/data-listing';
import { DataPageLayout, SidebarSection, SidebarStatItem, HealthWidgetConfig } from '@/components/DataPageLayout';
import { orderService } from '@/lib/services/orderService';
import {
  Order,
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
} from '@/lib/api/types';
import {
  ShoppingCart,
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Calendar,
  RefreshCw,
  X,
  Loader2,
  MoreVertical,
  Copy,
  Mail,
  FileText,
  ChevronRight,
  Download,
  ExternalLink,
} from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { LastUpdatedStatus } from '@/components/LastUpdatedStatus';

// Currency formatting helper
const formatCurrency = (amount: string | number | null | undefined, currencyCode: string = 'INR'): string => {
  const numAmount = amount == null ? 0 : (typeof amount === 'string' ? parseFloat(amount) : amount);
  const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$' };
  const symbol = symbols[currencyCode] || currencyCode + ' ';
  return `${symbol}${(isNaN(numAmount) ? 0 : numAmount).toFixed(2)}`;
};

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [generatingReceiptId, setGeneratingReceiptId] = useState<string | null>(null);

  // Initialize filters from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>((searchParams.get('status') as OrderStatus) || 'ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | PaymentStatus>((searchParams.get('payment') as PaymentStatus) || 'ALL');
  const [fulfillmentStatusFilter, setFulfillmentStatusFilter] = useState<'ALL' | FulfillmentStatus>((searchParams.get('fulfillment') as FulfillmentStatus) || 'ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

  // Quick actions menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadOrders = useCallback(async (isBackground = false) => {
    try {
      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const response = await orderService.getOrders();
      setOrders(response?.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch (no polling - data is fetched on demand)
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Sync filters to URL
  useEffect(() => {
    updateUrlParams({
      q: searchQuery,
      status: statusFilter,
      payment: paymentStatusFilter,
      fulfillment: fulfillmentStatusFilter,
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
    });
  }, [searchQuery, statusFilter, paymentStatusFilter, fulfillmentStatusFilter, currentPage, itemsPerPage, updateUrlParams]);


  const navigateToOrder = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  // Quick action handlers
  const handleCopyOrderNumber = (e: React.MouseEvent, orderNumber: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(orderNumber);
    setCopiedId(orderNumber);
    setTimeout(() => setCopiedId(null), 2000);
    setOpenMenuId(null);
  };

  const handleQuickAction = (e: React.MouseEvent, action: string, order: Order) => {
    e.stopPropagation();
    setOpenMenuId(null);

    switch (action) {
      case 'view':
        navigateToOrder(order.id);
        break;
      case 'ship':
        router.push(`/orders/${order.id}/ship`);
        break;
      case 'email':
        if (order.customerEmail) {
          window.location.href = `mailto:${order.customerEmail}?subject=Re: Order ${order.orderNumber}`;
        }
        break;
      case 'invoice':
        if (order.receiptShortUrl) {
          window.open(order.receiptShortUrl, '_blank', 'noopener,noreferrer');
        } else {
          router.push(`/orders/${order.id}?tab=invoice`);
        }
        break;
    }
  };

  const handleGenerateReceipt = async (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    setGeneratingReceiptId(order.id);
    try {
      const response = await orderService.generateReceipt(order.id);
      const result = response?.data || response;
      // Update the order in state with receipt info
      setOrders(prev => prev.map(o => {
        if (o.id === order.id) {
          const doc = result as Record<string, unknown>;
          return {
            ...o,
            receiptNumber: (doc.receiptNumber as string) || o.receiptNumber,
            receiptShortUrl: (doc.shortUrl as string) || o.receiptShortUrl,
            receiptDocumentId: (doc.id as string) || o.receiptDocumentId,
            receiptGeneratedAt: (doc.createdAt as string) || new Date().toISOString(),
          };
        }
        return o;
      }));
    } catch (err) {
      console.error('Failed to generate receipt:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate receipt');
    } finally {
      setGeneratingReceiptId(null);
    }
  };

  const toggleMenu = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === orderId ? null : orderId);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const filteredOrders = (orders || []).filter(order => {
    const matchesSearch = order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesPaymentStatus = paymentStatusFilter === 'ALL' || order.paymentStatus === paymentStatusFilter;
    const matchesFulfillmentStatus = fulfillmentStatusFilter === 'ALL' || order.fulfillmentStatus === fulfillmentStatusFilter;
    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesFulfillmentStatus;
  });

  // Pagination calculations
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, paymentStatusFilter, fulfillmentStatusFilter]);

  // Order status mapping using semantic tokens
  const getOrderStatusType = (status: OrderStatus): StatusType => {
    const mapping: Record<OrderStatus, StatusType> = {
      PLACED: 'warning',
      CONFIRMED: 'info',
      PROCESSING: 'info',
      SHIPPED: 'info',
      DELIVERED: 'success',
      COMPLETED: 'success',
      CANCELLED: 'error',
    };
    return mapping[status] || 'neutral';
  };

  const getStatusBadge = (status: OrderStatus) => {
    return (
      <StatusBadge status={getOrderStatusType(status)} showIcon={false}>
        {status}
      </StatusBadge>
    );
  };

  // Payment status mapping using semantic tokens
  const getPaymentStatusType = (status: PaymentStatus): StatusType => {
    const mapping: Record<PaymentStatus, StatusType> = {
      PENDING: 'warning',
      PAID: 'success',
      FAILED: 'error',
      PARTIALLY_REFUNDED: 'warning',
      REFUNDED: 'error',
    };
    return mapping[status] || 'neutral';
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    return (
      <StatusBadge status={getPaymentStatusType(status)} showIcon={false}>
        {status.replace('_', ' ')}
      </StatusBadge>
    );
  };

  // Fulfillment status mapping using semantic tokens
  const getFulfillmentStatusType = (status: FulfillmentStatus): StatusType => {
    const mapping: Record<FulfillmentStatus, StatusType> = {
      UNFULFILLED: 'neutral',
      PROCESSING: 'info',
      PACKED: 'info',
      DISPATCHED: 'info',
      IN_TRANSIT: 'info',
      OUT_FOR_DELIVERY: 'info',
      DELIVERED: 'success',
      FAILED_DELIVERY: 'error',
      RETURNED: 'warning',
    };
    return mapping[status] || 'neutral';
  };

  const getFulfillmentBadge = (status: FulfillmentStatus) => {
    const labels: Record<FulfillmentStatus, string> = {
      UNFULFILLED: 'Unfulfilled',
      PROCESSING: 'Processing',
      PACKED: 'Packed',
      DISPATCHED: 'Dispatched',
      IN_TRANSIT: 'In Transit',
      OUT_FOR_DELIVERY: 'Out for Delivery',
      DELIVERED: 'Delivered',
      FAILED_DELIVERY: 'Failed',
      RETURNED: 'Returned',
    };
    return (
      <StatusBadge status={getFulfillmentStatusType(status)} showIcon={false}>
        {labels[status]}
      </StatusBadge>
    );
  };

  // NEW: Get fulfillment progress percentage
  const getFulfillmentProgress = (status: FulfillmentStatus): number => {
    const progressMap: Record<FulfillmentStatus, number> = {
      UNFULFILLED: 0,
      PROCESSING: 15,
      PACKED: 30,
      DISPATCHED: 45,
      IN_TRANSIT: 60,
      OUT_FOR_DELIVERY: 80,
      DELIVERED: 100,
      FAILED_DELIVERY: 0,
      RETURNED: 0,
    };
    return progressMap[status] || 0;
  };

  // NEW: Get status icon
  const getStatusIcon = (status: OrderStatus) => {
    const icons: Record<OrderStatus, React.ReactNode> = {
      PLACED: <Clock className="w-4 h-4" />,
      CONFIRMED: <CheckCircle className="w-4 h-4" />,
      PROCESSING: <Package className="w-4 h-4" />,
      SHIPPED: <Truck className="w-4 h-4" />,
      DELIVERED: <CheckCircle className="w-4 h-4" />,
      COMPLETED: <CheckCircle className="w-4 h-4" />,
      CANCELLED: <XCircle className="w-4 h-4" />,
    };
    return icons[status];
  };

  // Calculate stats
  const totalOrders = (orders || []).length;
  const awaitingPayment = (orders || []).filter(o => o.status === 'PLACED').length;
  const inFulfillment = (orders || []).filter(o =>
    o.fulfillmentStatus === 'PROCESSING' ||
    o.fulfillmentStatus === 'PACKED' ||
    o.fulfillmentStatus === 'DISPATCHED' ||
    o.fulfillmentStatus === 'IN_TRANSIT' ||
    o.fulfillmentStatus === 'OUT_FOR_DELIVERY'
  ).length;
  const completedOrders = (orders || []).filter(o => o.status === 'COMPLETED').length;
  const cancelledOrders = (orders || []).filter(o => o.status === 'CANCELLED').length;
  const paidOrders = (orders || []).filter(o => o.paymentStatus === 'PAID').length;
  const totalRevenue = (orders || []).filter(o => o.paymentStatus === 'PAID').reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);

  // Quick filters configuration
  const quickFilters: QuickFilter[] = useMemo(() => [
    { id: 'PLACED', label: 'Awaiting', icon: Clock, color: 'warning', count: awaitingPayment },
    { id: 'PROCESSING', label: 'Processing', icon: Package, color: 'info', count: (orders || []).filter(o => o.status === 'PROCESSING').length },
    { id: 'SHIPPED', label: 'Shipped', icon: Truck, color: 'info', count: (orders || []).filter(o => o.status === 'SHIPPED').length },
    { id: 'COMPLETED', label: 'Completed', icon: CheckCircle, color: 'success', count: completedOrders },
  ], [awaitingPayment, completedOrders, orders]);

  // Active quick filter state
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);

  const handleQuickFilterToggle = (filterId: string) => {
    if (statusFilter === filterId) {
      setStatusFilter('ALL');
      setActiveQuickFilters([]);
    } else {
      setStatusFilter(filterId as 'ALL' | OrderStatus);
      setActiveQuickFilters([filterId]);
    }
  };

  const clearAllFilters = () => {
    setStatusFilter('ALL');
    setPaymentStatusFilter('ALL');
    setFulfillmentStatusFilter('ALL');
    setSearchQuery('');
    setActiveQuickFilters([]);
    setShowFilters(false);
  };

  // Calculate active filter count
  const activeFilterCount =
    (statusFilter !== 'ALL' ? 1 : 0) +
    (paymentStatusFilter !== 'ALL' ? 1 : 0) +
    (fulfillmentStatusFilter !== 'ALL' ? 1 : 0);

  // Sidebar configuration for DataPageLayout
  const sidebarConfig = useMemo(() => {
    const healthWidget: HealthWidgetConfig = {
      label: 'Order Health',
      currentValue: completedOrders,
      totalValue: totalOrders || 1,
      status: cancelledOrders === 0 && completedOrders > 0 ? 'healthy' : cancelledOrders > 5 ? 'attention' : 'normal',
      segments: [
        { value: completedOrders, color: 'success' },
        { value: inFulfillment, color: 'primary' },
        { value: awaitingPayment, color: 'warning' },
      ],
    };

    const sections: SidebarSection[] = [
      {
        title: 'Order Status',
        items: [
          {
            id: 'total',
            label: 'Total Orders',
            value: totalOrders,
            icon: ShoppingCart,
            color: 'muted',
            onClick: () => { setStatusFilter('ALL'); setPaymentStatusFilter('ALL'); setFulfillmentStatusFilter('ALL'); setActiveQuickFilters([]); },
            isActive: statusFilter === 'ALL' && paymentStatusFilter === 'ALL' && fulfillmentStatusFilter === 'ALL',
          },
          {
            id: 'awaiting',
            label: 'Awaiting Payment',
            value: awaitingPayment,
            icon: Clock,
            color: 'warning',
            onClick: () => { setStatusFilter('PLACED'); setPaymentStatusFilter('ALL'); setFulfillmentStatusFilter('ALL'); setActiveQuickFilters(['PLACED']); },
            isActive: statusFilter === 'PLACED',
          },
          {
            id: 'fulfilling',
            label: 'In Fulfillment',
            value: inFulfillment,
            icon: Package,
            color: 'primary',
            onClick: () => { setStatusFilter('ALL'); setPaymentStatusFilter('ALL'); setFulfillmentStatusFilter('PROCESSING'); setActiveQuickFilters([]); },
            isActive: fulfillmentStatusFilter === 'PROCESSING',
          },
          {
            id: 'completed',
            label: 'Completed',
            value: completedOrders,
            icon: CheckCircle,
            color: 'success',
            onClick: () => { setStatusFilter('COMPLETED'); setPaymentStatusFilter('ALL'); setFulfillmentStatusFilter('ALL'); setActiveQuickFilters(['COMPLETED']); },
            isActive: statusFilter === 'COMPLETED',
          },
          {
            id: 'cancelled',
            label: 'Cancelled',
            value: cancelledOrders,
            icon: XCircle,
            color: 'error',
            onClick: () => { setStatusFilter('CANCELLED'); setPaymentStatusFilter('ALL'); setFulfillmentStatusFilter('ALL'); setActiveQuickFilters([]); },
            isActive: statusFilter === 'CANCELLED',
          },
        ],
      },
      {
        title: 'Revenue',
        items: [
          {
            id: 'revenue',
            label: 'Total Revenue',
            value: formatCurrency(totalRevenue, 'INR'),
            icon: DollarSign,
            color: 'success',
          },
          {
            id: 'paid',
            label: 'Paid Orders',
            value: paidOrders,
            icon: CheckCircle,
            color: 'success',
          },
        ],
      },
    ];

    return { healthWidget, sections };
  }, [totalOrders, awaitingPayment, inFulfillment, completedOrders, cancelledOrders, paidOrders, totalRevenue, statusFilter, paymentStatusFilter, fulfillmentStatusFilter]);

  // Mobile stats for DataPageLayout
  const mobileStats: SidebarStatItem[] = useMemo(() => [
    {
      id: 'total',
      label: 'Total',
      value: totalOrders,
      icon: ShoppingCart,
      color: 'default',
      onClick: () => { setStatusFilter('ALL'); setActiveQuickFilters([]); },
    },
    {
      id: 'awaiting',
      label: 'Awaiting',
      value: awaitingPayment,
      icon: Clock,
      color: 'warning',
      onClick: () => { setStatusFilter('PLACED'); setActiveQuickFilters(['PLACED']); },
    },
    {
      id: 'fulfilling',
      label: 'Fulfilling',
      value: inFulfillment,
      icon: Package,
      color: 'primary',
    },
    {
      id: 'completed',
      label: 'Complete',
      value: completedOrders,
      icon: CheckCircle,
      color: 'success',
      onClick: () => { setStatusFilter('COMPLETED'); setActiveQuickFilters(['COMPLETED']); },
    },
  ], [totalOrders, awaitingPayment, inFulfillment, completedOrders]);

  return (
    <PermissionGate
      permission={Permission.ORDERS_READ}
      fallback="styled"
      fallbackTitle="Orders Access Required"
      fallbackDescription="You don't have the required permissions to view orders. Please contact your administrator to request access."
      loading={<PageLoading fullScreen />}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Orders Management"
          description="Track and manage customer orders"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Orders', href: '/orders' },
          ]}
          status={
            <LastUpdatedStatus lastUpdated={lastUpdated} isFetching={refreshing} />
          }
          actions={
            <Button
              variant="ghost"
              onClick={() => loadOrders()}
              disabled={loading || refreshing}
              className="p-2.5 rounded-md bg-muted hover:bg-muted transition-all"
              title="Refresh"
            >
              <RefreshCw className={cn("w-5 h-5 text-muted-foreground", (loading || refreshing) && "animate-spin")} />
            </Button>
          }
        />

      {/* Error Alert */}
      <PageError error={error} onDismiss={() => setError(null)} />

      <DataPageLayout sidebar={sidebarConfig} mobileStats={mobileStats}>
      {/* Search and Filters */}
      {!loading && (
        <FilterPanel
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by order number, customer name, or email..."
          expanded={showFilters}
          onExpandedChange={setShowFilters}
          activeFilterCount={activeFilterCount}
          onClearAll={clearAllFilters}
          className="mb-6"
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
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Order Status</label>
            <Select
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value as any);
                setActiveQuickFilters(value !== 'ALL' ? [value] : []);
              }}
              options={[
                { value: 'ALL', label: 'All Status' },
                { value: 'PLACED', label: 'Placed' },
                { value: 'CONFIRMED', label: 'Confirmed' },
                { value: 'PROCESSING', label: 'Processing' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Status</label>
            <Select
              value={paymentStatusFilter}
              onChange={(value) => setPaymentStatusFilter(value as any)}
              options={[
                { value: 'ALL', label: 'All Status' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'PAID', label: 'Paid' },
                { value: 'FAILED', label: 'Failed' },
                { value: 'PARTIALLY_REFUNDED', label: 'Partial Refund' },
                { value: 'REFUNDED', label: 'Refunded' },
              ]}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Fulfillment Status</label>
            <Select
              value={fulfillmentStatusFilter}
              onChange={(value) => setFulfillmentStatusFilter(value as any)}
              options={[
                { value: 'ALL', label: 'All Status' },
                { value: 'UNFULFILLED', label: 'Unfulfilled' },
                { value: 'PROCESSING', label: 'Processing' },
                { value: 'PACKED', label: 'Packed' },
                { value: 'DISPATCHED', label: 'Dispatched' },
                { value: 'IN_TRANSIT', label: 'In Transit' },
                { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
                { value: 'DELIVERED', label: 'Delivered' },
                { value: 'FAILED_DELIVERY', label: 'Failed Delivery' },
                { value: 'RETURNED', label: 'Returned' },
              ]}
            />
          </div>
        </FilterPanel>
      )}

      {/* Active Filters Chips */}
      {!loading && (searchQuery || statusFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || fulfillmentStatusFilter !== 'ALL') && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium"><AdminUIText text="Active filters:" /></span>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors group"
            >
              <Search className="w-3.5 h-3.5" />
              &quot;{searchQuery}&quot;
              <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </button>
          )}

          {statusFilter !== 'ALL' && (
            <button
              onClick={() => setStatusFilter('ALL')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/10 transition-colors group"
            >
              Status: {statusFilter}
              <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </button>
          )}

          {paymentStatusFilter !== 'ALL' && (
            <button
              onClick={() => setPaymentStatusFilter('ALL')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success rounded-full text-sm font-medium hover:bg-success/20 transition-colors group"
            >
              Payment: {paymentStatusFilter.replace('_', ' ')}
              <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </button>
          )}

          {fulfillmentStatusFilter !== 'ALL' && (
            <button
              onClick={() => setFulfillmentStatusFilter('ALL')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-foreground rounded-full text-sm font-medium hover:bg-accent transition-colors group"
            >
              Fulfillment: {fulfillmentStatusFilter.replace('_', ' ')}
              <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </button>
          )}

          <span className="text-sm text-muted-foreground ml-2">
            Showing {filteredOrders.length} of {orders.length} orders
          </span>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-medium"><AdminUIText text="Loading orders..." /></p>
            <p className="text-muted-foreground text-sm mt-1"><AdminUIText text="Please wait while we fetch your data" /></p>
          </div>
        ) : paginatedOrders.length === 0 ? (
          <div className="p-16 text-center">
            <div className="bg-muted p-8 rounded-full border border-border inline-block">
              <ShoppingCart className="w-16 h-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mt-6">No Orders Found</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || fulfillmentStatusFilter !== 'ALL'
                ? "Try adjusting your search criteria or filters to find what you're looking for."
                : "Orders will appear here once customers start placing them."}
            </p>
            {(searchQuery || statusFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || fulfillmentStatusFilter !== 'ALL') && (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setPaymentStatusFilter('ALL');
                  setFulfillmentStatusFilter('ALL');
                }}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider">Order</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider hidden md:table-cell">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider hidden lg:table-cell">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider hidden lg:table-cell">Fulfillment</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-foreground uppercase tracking-wider hidden lg:table-cell">Receipt</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-muted/50 transition-colors group cursor-pointer"
                  onClick={() => navigateToOrder(order.id)}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        order.status === 'COMPLETED' && "bg-success/10 text-success",
                        order.status === 'CANCELLED' && "bg-error-muted text-error",
                        order.status === 'PROCESSING' && "bg-primary/10 text-primary",
                        order.status === 'CONFIRMED' && "bg-primary/20 text-primary",
                        order.status === 'PLACED' && "bg-warning-muted text-warning"
                      )}>
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {order.orderNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.totalItems} items
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground truncate max-w-[150px]" title={order.customerName}>
                          {order.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={order.customerEmail}>
                          {order.customerEmail}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    {getPaymentBadge(order.paymentStatus)}
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <div className="space-y-1">
                      {order.fulfillmentStatus && getFulfillmentBadge(order.fulfillmentStatus)}
                      {order.fulfillmentStatus && order.fulfillmentStatus !== 'UNFULFILLED' && (
                        <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full",
                              order.fulfillmentStatus === 'DELIVERED' && "bg-success",
                              order.fulfillmentStatus === 'FAILED_DELIVERY' && "bg-error",
                              order.fulfillmentStatus === 'RETURNED' && "bg-warning",
                              !['DELIVERED', 'FAILED_DELIVERY', 'RETURNED'].includes(order.fulfillmentStatus) && "bg-primary"
                            )}
                            style={{ width: `${getFulfillmentProgress(order.fulfillmentStatus)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(order.total, order.currencyCode)}
                    </p>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <div className="flex items-center justify-center">
                      {order.receiptNumber ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (order.receiptShortUrl) {
                              window.open(order.receiptShortUrl, '_blank', 'noopener,noreferrer');
                            } else {
                              router.push(`/orders/${order.id}?tab=invoice`);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
                          title={`Receipt: ${order.receiptNumber}${order.invoiceNumber ? ` | Invoice: ${order.invoiceNumber}` : ''}`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[80px]">{order.receiptNumber}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </button>
                      ) : (order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED' || order.paymentStatus === 'PARTIALLY_REFUNDED') ? (
                        <button
                          onClick={(e) => handleGenerateReceipt(e, order)}
                          disabled={generatingReceiptId === order.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground bg-muted rounded-md hover:bg-muted/80 hover:text-foreground transition-colors disabled:opacity-50"
                          title="Generate receipt"
                        >
                          {generatingReceiptId === order.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>{generatingReceiptId === order.id ? 'Generating...' : 'Generate'}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1 relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); navigateToOrder(order.id); }}
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        title="View order"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => toggleMenu(e, order.id)}
                        className={cn(
                          "h-8 w-8 p-0",
                          openMenuId === order.id ? "bg-muted" : "hover:bg-muted"
                        )}
                        title="More actions"
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>

                      {/* Dropdown menu */}
                      {openMenuId === order.id && (
                        <div className="absolute right-0 top-10 w-48 bg-card rounded-lg border border-border py-1 z-50 shadow-lg">
                          <button
                            onClick={(e) => handleCopyOrderNumber(e, order.orderNumber)}
                            className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 transition-colors"
                          >
                            {copiedId === order.orderNumber ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-success" />
                                <span className="text-success font-medium">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 text-muted-foreground" />
                                <span>Copy Order #</span>
                              </>
                            )}
                          </button>
                          <div className="h-px bg-muted my-1" />
                          {order.paymentStatus === 'PAID' && order.fulfillmentStatus === 'UNFULFILLED' && (
                            <button
                              onClick={(e) => handleQuickAction(e, 'ship', order)}
                              className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-primary/10 flex items-center gap-3 transition-colors"
                            >
                              <Truck className="w-4 h-4 text-primary" />
                              <span className="text-primary font-medium">Create Shipment</span>
                            </button>
                          )}
                          <button
                            onClick={(e) => handleQuickAction(e, 'email', order)}
                            className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 transition-colors"
                            disabled={!order.customerEmail}
                          >
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span>Email Customer</span>
                          </button>
                          <button
                            onClick={(e) => handleQuickAction(e, 'invoice', order)}
                            className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 transition-colors"
                          >
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span>{order.receiptNumber ? `Receipt ${order.receiptNumber}` : 'View Invoice'}</span>
                            {order.receiptShortUrl && <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredOrders.length > 0 && (
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
      </div>
    </div>
    </PermissionGate>
  );
}
