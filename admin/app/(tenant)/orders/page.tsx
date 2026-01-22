'use client';

// Orders page - Updated: 2025-12-31
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import {
  AdminUIText,
  AdminButtonText,
  AdminFormLabel,
  AdminMessage,
} from '@/components/translation/AdminTranslatedText';
import { Pagination } from '@/components/Pagination';
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
  Filter,
  RefreshCw,
  X,
  Loader2,
  MoreVertical,
  Copy,
  Mail,
  FileText,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';

// Currency formatting helper
const formatCurrency = (amount: string | number | null | undefined, currencyCode: string = 'INR'): string => {
  const numAmount = amount == null ? 0 : (typeof amount === 'string' ? parseFloat(amount) : amount);
  const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$' };
  const symbol = symbols[currencyCode] || currencyCode + ' ';
  return `${symbol}${(isNaN(numAmount) ? 0 : numAmount).toFixed(2)}`;
};

const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-2xl border bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300", className)} {...props}>
    {children}
  </div>
);

const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}>
    {children}
  </div>
);

const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props}>
    {children}
  </h3>
);

const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props}>
    {children}
  </div>
);

const Badge = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", className)} {...props}>
    {children}
  </div>
);

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [fulfillmentStatusFilter, setFulfillmentStatusFilter] = useState<'ALL' | FulfillmentStatus>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

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

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString();
  };

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
        // TODO: Generate invoice
        router.push(`/orders/${order.id}?tab=invoice`);
        break;
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

  const stats = [
    {
      labelKey: "Total Orders",
      value: (orders || []).length,
      icon: ShoppingCart,
      textColor: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      labelKey: "Awaiting Payment",
      value: (orders || []).filter(o => o.status === 'PLACED').length,
      icon: Clock,
      textColor: "text-warning",
      bgColor: "bg-warning/10"
    },
    {
      labelKey: "In Fulfillment",
      value: (orders || []).filter(o =>
        o.fulfillmentStatus === 'PROCESSING' ||
        o.fulfillmentStatus === 'PACKED' ||
        o.fulfillmentStatus === 'DISPATCHED' ||
        o.fulfillmentStatus === 'IN_TRANSIT' ||
        o.fulfillmentStatus === 'OUT_FOR_DELIVERY'
      ).length,
      icon: Truck,
      textColor: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      labelKey: "Completed",
      value: (orders || []).filter(o => o.status === 'COMPLETED').length,
      icon: CheckCircle,
      textColor: "text-success",
      bgColor: "bg-success/10"
    },
    {
      labelKey: "Revenue",
      value: formatCurrency(
        (orders || []).filter(o => o.paymentStatus === 'PAID').reduce((sum, o) => sum + parseFloat(o.total || '0'), 0),
        orders[0]?.currencyCode || 'INR'
      ),
      icon: DollarSign,
      textColor: "text-primary",
      bgColor: "bg-primary/10"
    }
  ];

  return (
    <PermissionGate
      permission={Permission.ORDERS_READ}
      fallback="styled"
      fallbackTitle="Orders Access Required"
      fallbackDescription="You don't have the required permissions to view orders. Please contact your administrator to request access."
      loading={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Orders Management"
          description="Track and manage customer orders"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Orders' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              {/* Last Updated & Auto-refresh indicator */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                {refreshing && <Loader2 className="h-3 w-3 animate-spin" />}
                {lastUpdated && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatLastUpdated()}
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => loadOrders()}
                disabled={loading || refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
                <AdminButtonText text="Refresh" />
              </Button>
            </div>
          }
        />

      {/* Error Alert */}
      {error && (
        <div className="bg-error-muted border-2 border-error/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-error"><AdminUIText text="Error" /></h3>
            <p className="text-error-muted-foreground text-sm mt-1"><AdminMessage text={error} /></p>
          </div>
          <Button onClick={() => setError(null)} className="p-1 rounded-lg hover:bg-error/10 transition-colors" variant="ghost">
            <X className="w-4 h-4 text-error" />
          </Button>
        </div>
      )}

      {/* Stats */}
      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="border-border/50 hover:border-primary/50/50 transition-all duration-300 group overflow-hidden relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Decorative gradient background on hover */}
                <div className={`absolute inset-0 ${stat.bgColor} opacity-0 group-hover:opacity-50 transition-opacity duration-300`} />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors"><AdminUIText text={stat.labelKey} /></p>
                      <p className={`text-3xl font-bold ${stat.textColor}`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-4 rounded-2xl ${stat.bgColor} border border-border group-hover:scale-110 group-hover:shadow-lg group-hover:rotate-3 transition-all duration-300`}>
                      <Icon className="w-7 h-7 text-foreground" />
                    </div>
                  </div>
                  {/* Subtle bottom accent line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${stat.textColor} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Search and Filters */}
      {!loading && (
        <Card className="border-border/50 overflow-visible relative z-40">
          <CardContent className="p-6 overflow-visible relative">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by order number, customer name, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "px-4 py-3 rounded-xl transition-all flex items-center gap-2",
                    showFilters
                      ? "bg-primary/20 text-primary border-2 border-primary/50"
                      : "bg-muted text-foreground border-2 border-border hover:bg-muted"
                  )}
                  variant="ghost"
                >
                  <Filter className="w-5 h-5" />
                  <AdminButtonText text="Filters" />
                </Button>
              </div>

              {showFilters && (
                <div className="flex flex-wrap gap-4 p-5 bg-white/80 rounded-xl border-2 border-border">
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-xs font-bold text-foreground mb-2 block"><AdminFormLabel text="Order Status" as="span" /></label>
                    <Select
                      value={statusFilter}
                      onChange={(value) => setStatusFilter(value as any)}
                      options={[
                        { value: 'ALL', label: 'All Status' },
                        { value: 'PLACED', label: 'Placed' },
                        { value: 'CONFIRMED', label: 'Confirmed' },
                        { value: 'PROCESSING', label: 'Processing' },
                        { value: 'COMPLETED', label: 'Completed' },
                        { value: 'CANCELLED', label: 'Cancelled' },
                      ]}
                      variant="filter"
                    />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-xs font-bold text-foreground mb-2 block"><AdminFormLabel text="Payment Status" as="span" /></label>
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
                      variant="filter"
                    />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-xs font-bold text-foreground mb-2 block"><AdminFormLabel text="Fulfillment Status" as="span" /></label>
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
                      variant="filter"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      setStatusFilter('ALL');
                      setPaymentStatusFilter('ALL');
                      setFulfillmentStatusFilter('ALL');
                      setSearchQuery('');
                    }}
                    className="px-5 py-2.5 bg-card border-2 border-border rounded-xl text-sm font-semibold hover:bg-muted transition-all self-end"
                    variant="outline"
                  >
                    <AdminButtonText text="Clear All" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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

      {/* Orders List */}
      {loading ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-primary/20 animate-pulse" />
              </div>
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4 relative" />
            </div>
            <p className="text-muted-foreground font-medium mt-8"><AdminUIText text="Loading orders..." /></p>
            <p className="text-muted-foreground text-sm mt-1"><AdminUIText text="Please wait while we fetch your data" /></p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map((order, idx) => (
            <Card
              key={order.id}
              className="border-border/50 hover:border-primary/50/50 hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden"
              onClick={() => navigateToOrder(order.id)}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Mini Fulfillment Progress Bar at top of card */}
              {order.fulfillmentStatus && order.fulfillmentStatus !== 'UNFULFILLED' && (
                <div className="h-1 bg-muted">
                  <div
                    className={cn(
                      "h-full transition-all duration-700 ease-out",
                      order.fulfillmentStatus === 'DELIVERED' && "bg-success",
                      order.fulfillmentStatus === 'FAILED_DELIVERY' && "bg-destructive",
                      order.fulfillmentStatus === 'RETURNED' && "bg-warning",
                      !['DELIVERED', 'FAILED_DELIVERY', 'RETURNED'].includes(order.fulfillmentStatus) && "bg-primary"
                    )}
                    style={{ width: `${getFulfillmentProgress(order.fulfillmentStatus)}%` }}
                  />
                </div>
              )}

              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          {/* Order Status Icon */}
                          <div className={cn(
                            "p-2 rounded-xl transition-all",
                            order.status === 'COMPLETED' && "bg-success/10 text-success",
                            order.status === 'CANCELLED' && "bg-destructive/10 text-destructive",
                            order.status === 'PROCESSING' && "bg-primary/10 text-primary",
                            order.status === 'CONFIRMED' && "bg-primary/20 text-primary",
                            order.status === 'PLACED' && "bg-warning-muted text-warning"
                          )}>
                            {getStatusIcon(order.status)}
                          </div>
                          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{order.orderNumber}</h3>
                          <div className="flex gap-2 flex-wrap">
                            {getStatusBadge(order.status)}
                            {getPaymentBadge(order.paymentStatus)}
                            {order.fulfillmentStatus && getFulfillmentBadge(order.fulfillmentStatus)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-lg">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {order.customerName}
                          </span>
                          <span className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-lg">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(order.orderDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-lg">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            {order.totalItems} items
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-border">
                      <div className="group/item">
                        <p className="text-xs text-muted-foreground font-semibold">Subtotal</p>
                        <p className="text-sm font-bold text-foreground group-hover/item:text-primary transition-colors">{formatCurrency(order.subtotal, order.currencyCode)}</p>
                      </div>
                      <div className="group/item">
                        <p className="text-xs text-muted-foreground font-semibold">Tax</p>
                        <p className="text-sm font-bold text-foreground group-hover/item:text-primary transition-colors">{formatCurrency(order.tax, order.currencyCode)}</p>
                      </div>
                      <div className="group/item">
                        <p className="text-xs text-muted-foreground font-semibold">Shipping</p>
                        <p className="text-sm font-bold text-foreground group-hover/item:text-primary transition-colors">{formatCurrency(order.shippingCost, order.currencyCode)}</p>
                      </div>
                      <div className="bg-primary/5 -m-2 p-2 rounded-xl border border-primary/20">
                        <p className="text-xs text-primary font-semibold">Total</p>
                        <p className="text-xl font-bold text-primary">
                          {formatCurrency(order.total, order.currencyCode)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex lg:flex-col gap-2 items-center justify-center relative">
                    {/* View button */}
                    <div className="h-10 w-10 rounded-xl bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-all duration-300 border border-primary/30 group-hover:border-primary/70">
                      <Eye className="w-4 h-4 text-primary group-hover:text-white transition-colors" />
                    </div>

                    {/* Quick actions menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => toggleMenu(e, order.id)}
                        className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 border",
                          openMenuId === order.id
                            ? "bg-muted border-border"
                            : "bg-muted border-border hover:bg-muted hover:border-border"
                        )}
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {/* Dropdown menu */}
                      {openMenuId === order.id && (
                        <div className="absolute right-0 top-12 w-48 bg-card rounded-xl shadow-xl border border-border py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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

                          <button
                            onClick={(e) => handleQuickAction(e, 'view', order)}
                            className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 transition-colors"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground" />
                            <span>View Details</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                          </button>

                          {order.paymentStatus === 'PAID' && order.fulfillmentStatus === 'UNFULFILLED' && (
                            <button
                              onClick={(e) => handleQuickAction(e, 'ship', order)}
                              className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-primary/10 flex items-center gap-3 transition-colors"
                            >
                              <Truck className="w-4 h-4 text-primary" />
                              <span className="text-primary font-medium">Create Shipment</span>
                            </button>
                          )}

                          <div className="h-px bg-muted my-1" />

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
                            <span>View Invoice</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {paginatedOrders.length === 0 && (
            <Card className="border-border/50 border-dashed border-2">
              <CardContent className="p-16 text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl opacity-50" />
                  <div className="relative bg-muted p-8 rounded-full border-2 border-border">
                    <ShoppingCart className="w-16 h-16 text-muted-foreground" />
                  </div>
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
                    className="mt-4 px-6 py-2 bg-primary hover:from-blue-600 hover:to-violet-600 text-white rounded-xl transition-all"
                  >
                    Clear All Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
      </div>
    </div>
    </PermissionGate>
  );
}
