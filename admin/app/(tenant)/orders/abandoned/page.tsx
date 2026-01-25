'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { useDialog } from '@/contexts/DialogContext';
import { abandonedCartService, AbandonedCart } from '@/lib/services/abandonedCartService';
import {
  ShoppingCart,
  Search,
  Eye,
  Mail,
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
  AlertCircle,
  Send,
  Trash2,
  Package,
} from 'lucide-react';
import { LastUpdatedStatus } from '@/components/LastUpdatedStatus';
import { DataPageLayout, SidebarSection, SidebarStatItem, HealthWidgetConfig } from '@/components/DataPageLayout';

// Abandoned cart status types
type CartStatus = 'ABANDONED' | 'RECOVERED' | 'EXPIRED' | 'CONTACTED';

interface AbandonedCartDisplay {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: CartStatus;
  items: {
    id: string;
    productName: string;
    productImage?: string;
    quantity: number;
    price: string;
  }[];
  subtotal: string;
  abandonedAt: string;
  lastContactedAt?: string;
  recoveryAttempts: number;
  sessionDuration: number; // in minutes
}

const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-lg border bg-card shadow-sm", className)} {...props}>
    {children}
  </div>
);

const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6", className)} {...props}>
    {children}
  </div>
);

const Badge = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", className)} {...props}>
    {children}
  </div>
);

export default function AbandonedCartsPage() {
  const { showSuccess, showError, showConfirm } = useDialog();
  const [carts, setCarts] = useState<AbandonedCartDisplay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CartStatus>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedCart, setSelectedCart] = useState<AbandonedCartDisplay | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const loadCarts = useCallback(async (isBackground = false) => {
    try {
      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch abandoned carts from the API (carts not updated in 1+ hours)
      const response = await abandonedCartService.getAbandonedCarts({
        abandonedAfterMinutes: 60, // Carts abandoned for 1+ hour
      });

      // Transform the response to match the display format
      const displayCarts: AbandonedCartDisplay[] = (response.data || []).map((cart: AbandonedCart) => ({
        id: cart.id,
        customerId: cart.customerId,
        customerName: cart.customerName || 'Unknown Customer',
        customerEmail: cart.customerEmail || '',
        status: cart.status as CartStatus,
        items: (cart.items || []).map((item, idx) => ({
          id: item.id || `item-${idx}`,
          productName: item.productName || 'Unknown Product',
          productImage: item.image,
          quantity: item.quantity || 1,
          price: String(item.price || 0),
        })),
        subtotal: cart.subtotal || '0.00',
        abandonedAt: cart.abandonedAt,
        lastContactedAt: cart.lastContactedAt,
        recoveryAttempts: cart.recoveryAttempts || 0,
        sessionDuration: cart.sessionDuration || 0,
      }));

      setCarts(displayCarts);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load abandoned carts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load abandoned carts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch (no polling - data is fetched on demand)
  useEffect(() => {
    loadCarts();
  }, [loadCarts]);


  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return `${diffMins}m ago`;
  };

  const filteredCarts = carts.filter(cart => {
    const matchesSearch = cart.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cart.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || cart.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredCarts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCarts = filteredCarts.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const getStatusBadge = (status: CartStatus) => {
    const styles: Record<CartStatus, string> = {
      ABANDONED: 'bg-warning-muted text-warning-foreground border-warning/30',
      CONTACTED: 'bg-primary/20 text-primary border-primary/30',
      RECOVERED: 'bg-success/10 text-success border-success/30',
      EXPIRED: 'bg-muted text-foreground border-border',
    };
    return <Badge className={styles[status]}>{status}</Badge>;
  };

  const handleSendRecoveryEmail = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Send Recovery Email',
      message: 'Send a cart recovery email to this customer?',
      confirmLabel: 'Send Email',
      cancelLabel: 'Cancel',
    });
    if (confirmed) {
      showSuccess('Email Sent', 'Recovery email has been sent to the customer');
      setCarts(prev => prev.map(c =>
        c.id === id
          ? { ...c, status: 'CONTACTED' as CartStatus, recoveryAttempts: c.recoveryAttempts + 1, lastContactedAt: new Date().toISOString() }
          : c
      ));
    }
  };

  const handleDeleteCart = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Cart',
      message: 'Are you sure you want to delete this abandoned cart record?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (confirmed) {
      showSuccess('Deleted', 'Abandoned cart record has been deleted');
      setCarts(prev => prev.filter(c => c.id !== id));
    }
  };

  // Calculate stats
  const totalCarts = carts.length;
  const abandonedCount = carts.filter(c => c.status === 'ABANDONED').length;
  const contactedCount = carts.filter(c => c.status === 'CONTACTED').length;
  const recoveredCount = carts.filter(c => c.status === 'RECOVERED').length;
  const expiredCount = carts.filter(c => c.status === 'EXPIRED').length;
  const potentialRevenue = carts.filter(c => c.status !== 'RECOVERED' && c.status !== 'EXPIRED').reduce((sum, c) => sum + parseFloat(c.subtotal), 0);

  // Sidebar configuration for DataPageLayout
  const sidebarConfig = useMemo(() => {
    const healthWidget: HealthWidgetConfig = {
      label: 'Recovery Health',
      currentValue: recoveredCount,
      totalValue: totalCarts || 1,
      status: abandonedCount > 20 ? 'critical' : abandonedCount > 10 ? 'attention' : 'healthy',
      segments: [
        { value: recoveredCount, color: 'success' },
        { value: contactedCount, color: 'primary' },
        { value: abandonedCount, color: 'warning' },
        { value: expiredCount, color: 'muted' },
      ],
    };

    const sections: SidebarSection[] = [
      {
        title: 'Cart Status',
        items: [
          {
            id: 'abandoned',
            label: 'Abandoned',
            value: abandonedCount,
            icon: ShoppingCart,
            color: 'warning',
            onClick: () => setStatusFilter('ABANDONED'),
            isActive: statusFilter === 'ABANDONED',
          },
          {
            id: 'contacted',
            label: 'Contacted',
            value: contactedCount,
            icon: Mail,
            color: 'primary',
            onClick: () => setStatusFilter('CONTACTED'),
            isActive: statusFilter === 'CONTACTED',
          },
          {
            id: 'recovered',
            label: 'Recovered',
            value: recoveredCount,
            icon: CheckCircle,
            color: 'success',
            onClick: () => setStatusFilter('RECOVERED'),
            isActive: statusFilter === 'RECOVERED',
          },
          {
            id: 'expired',
            label: 'Expired',
            value: expiredCount,
            icon: XCircle,
            color: 'muted',
            onClick: () => setStatusFilter('EXPIRED'),
            isActive: statusFilter === 'EXPIRED',
          },
        ],
      },
      {
        title: 'Revenue',
        items: [
          {
            id: 'potential',
            label: 'Potential',
            value: `$${potentialRevenue.toFixed(0)}`,
            icon: DollarSign,
            color: 'warning',
          },
        ],
      },
    ];

    return { healthWidget, sections };
  }, [totalCarts, abandonedCount, contactedCount, recoveredCount, expiredCount, potentialRevenue, statusFilter]);

  // Mobile stats for DataPageLayout
  const mobileStats: SidebarStatItem[] = useMemo(() => [
    { id: 'abandoned', label: 'Abandoned', value: abandonedCount, icon: ShoppingCart, color: 'warning' },
    { id: 'contacted', label: 'Contacted', value: contactedCount, icon: Mail, color: 'primary' },
    { id: 'recovered', label: 'Recovered', value: recoveredCount, icon: CheckCircle, color: 'success' },
    { id: 'potential', label: 'Potential', value: `$${potentialRevenue.toFixed(0)}`, icon: DollarSign, color: 'primary' },
  ], [abandonedCount, contactedCount, recoveredCount, potentialRevenue]);

  if (loading && carts.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading abandoned carts...</p>
        </div>
      </div>
    );
  }

  if (error && carts.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-error" />
          <h2 className="text-xl font-semibold text-foreground">Failed to load abandoned carts</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => loadCarts()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.ORDERS_VIEW}
      fallback="styled"
      fallbackTitle="Abandoned Carts Access Required"
      fallbackDescription="You don't have the required permissions to view abandoned carts. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Abandoned Carts"
          description="Recover lost sales by reaching out to customers"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Orders', href: '/orders' },
            { label: 'Abandoned Carts' },
          ]}
          badge={{
            label: `${carts.filter(c => c.status === 'ABANDONED').length} Active`,
            variant: 'warning',
          }}
          status={
            <LastUpdatedStatus lastUpdated={lastUpdated} isFetching={refreshing} />
          }
          actions={
            <Button
              variant="outline"
              onClick={() => loadCarts()}
              disabled={loading || refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          }
        />

        <DataPageLayout
          sidebar={sidebarConfig}
          mobileStats={mobileStats}
        >
        {/* Search and Filters */}
        <Card className="border-border/50">
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by customer name or email..."
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
                  Filters
                </Button>
              </div>

              {showFilters && (
                <div className="flex flex-wrap gap-4 p-5 bg-white/80 rounded-xl border-2 border-border">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-bold text-foreground mb-2 block">Cart Status</label>
                    <Select
                      value={statusFilter}
                      onChange={(value) => setStatusFilter(value as any)}
                      options={[
                        { value: 'ALL', label: 'All Status' },
                        { value: 'ABANDONED', label: 'Abandoned' },
                        { value: 'CONTACTED', label: 'Contacted' },
                        { value: 'RECOVERED', label: 'Recovered' },
                        { value: 'EXPIRED', label: 'Expired' },
                      ]}
                      variant="filter"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      setStatusFilter('ALL');
                      setSearchQuery('');
                    }}
                    className="px-5 py-2.5 bg-card border-2 border-border rounded-xl text-sm font-semibold hover:bg-muted transition-all self-end"
                    variant="outline"
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Carts List */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Abandoned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Attempts
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedCarts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p>No abandoned carts found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedCarts.map((cart) => (
                    <tr key={cart.id} className="hover:bg-muted transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{cart.customerName}</div>
                        <div className="text-sm text-muted-foreground">{cart.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{cart.items.length} item(s)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-foreground">${parseFloat(cart.subtotal).toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground">{formatTimeAgo(cart.abandonedAt)}</div>
                        <div className="text-xs text-muted-foreground">{cart.sessionDuration}m session</div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(cart.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {cart.recoveryAttempts}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedCart(cart); setShowDetails(true); }}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                            title="View Details"
                            aria-label="View cart details"
                          >
                            <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                          </Button>
                          {(cart.status === 'ABANDONED' || cart.status === 'CONTACTED') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendRecoveryEmail(cart.id)}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-success-muted transition-colors"
                              title="Send Recovery Email"
                              aria-label="Send recovery email"
                            >
                              <Send className="w-4 h-4 text-success" aria-hidden="true" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCart(cart.id)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-error-muted transition-colors"
                            title="Delete"
                            aria-label="Delete cart"
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
        </div>

        {/* Pagination */}
        {filteredCarts.length > 0 && (
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

        {/* Details Modal */}
        {showDetails && selectedCart && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
            <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-card">
                <h2 className="text-2xl font-bold">Cart Details</h2>
                <Button onClick={() => setShowDetails(false)} className="p-2 hover:bg-muted rounded-lg" variant="ghost">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Customer</p>
                    <p className="text-lg font-bold">{selectedCart.customerName}</p>
                    <p className="text-sm text-muted-foreground">{selectedCart.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedCart.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs font-semibold text-muted-foreground">Abandoned</p>
                    <p className="text-sm font-bold">{formatTimeAgo(selectedCart.abandonedAt)}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs font-semibold text-muted-foreground">Session Duration</p>
                    <p className="text-sm font-bold">{selectedCart.sessionDuration} minutes</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs font-semibold text-muted-foreground">Recovery Attempts</p>
                    <p className="text-sm font-bold">{selectedCart.recoveryAttempts}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-foreground mb-3">Cart Items</h3>
                  <div className="space-y-2">
                    {selectedCart.items.map((item) => (
                      <div key={item.id} className="flex justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-semibold">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-bold">${parseFloat(item.price).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Cart Total:</span>
                    <span className="text-2xl font-bold text-primary">${parseFloat(selectedCart.subtotal).toFixed(2)}</span>
                  </div>
                </div>

                {(selectedCart.status === 'ABANDONED' || selectedCart.status === 'CONTACTED') && (
                  <div className="pt-4">
                    <Button
                      onClick={() => {
                        handleSendRecoveryEmail(selectedCart.id);
                        setShowDetails(false);
                      }}
                      className="w-full bg-primary text-primary-foreground hover:opacity-90"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Recovery Email
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </PermissionGate>
  );
}
