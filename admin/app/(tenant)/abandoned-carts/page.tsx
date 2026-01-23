'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Mail,
  Eye,
  Send,
  RefreshCw,
  Loader2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { StatsGrid } from '@/components/data-listing/StatsGrid';
import { cn } from '@/lib/utils';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api/client';
import { useTenantCurrency } from '@/hooks/useTenantCurrency';
import type {
  AbandonedCart,
  AbandonedCartStats,
  AbandonedCartListResponse,
  AbandonedCartItem,
} from '@/lib/api/types';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'REMINDED', label: 'Reminded' },
  { value: 'RECOVERED', label: 'Recovered' },
  { value: 'EXPIRED', label: 'Expired' },
];

export default function AbandonedCartsPage() {
  const { showAlert, showConfirm } = useDialog();
  const { currency } = useTenantCurrency();

  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [stats, setStats] = useState<AbandonedCartStats | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCartIds, setSelectedCartIds] = useState<Set<string>>(new Set());

  // Get eligible carts for selection (only PENDING or REMINDED status)
  const eligibleCarts = carts.filter(cart => cart.status === 'PENDING' || cart.status === 'REMINDED');
  const allEligibleSelected = eligibleCarts.length > 0 && eligibleCarts.every(cart => selectedCartIds.has(cart.id));

  const toggleCartSelection = (cartId: string) => {
    setSelectedCartIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cartId)) {
        newSet.delete(cartId);
      } else {
        newSet.add(cartId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (allEligibleSelected) {
      // Deselect all
      setSelectedCartIds(new Set());
    } else {
      // Select all eligible carts
      setSelectedCartIds(new Set(eligibleCarts.map(cart => cart.id)));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      PENDING: 'bg-warning-muted text-warning border-warning/30',
      REMINDED: 'bg-primary/20 text-primary border-primary/30',
      RECOVERED: 'bg-success-muted text-success-foreground border-success/30',
      EXPIRED: 'bg-muted text-foreground border-border',
    };
    return classes[status] || classes.PENDING;
  };

  const fetchCarts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (filterStatus) {
        params.append('status', filterStatus);
      }

      const response = await apiClient.get<AbandonedCartListResponse>(
        `/carts/abandoned?${params.toString()}`
      );

      if (response) {
        setCarts(response.carts || []);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch abandoned carts:', error);
      setCarts([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get<AbandonedCartStats>('/carts/abandoned/stats');
      if (response) {
        setStats(response);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchCarts();
    fetchStats();
  }, [fetchCarts, fetchStats]);

  const handleSendReminders = async (cartIds?: string[]) => {
    const isSelectedOnly = cartIds && cartIds.length > 0;
    const count = isSelectedOnly ? cartIds.length : eligibleCarts.length;

    const confirmed = await showConfirm({
      title: 'Send Reminders',
      message: isSelectedOnly
        ? `This will send reminder emails to ${count} selected cart${count > 1 ? 's' : ''}. Continue?`
        : 'This will send reminder emails to all eligible abandoned carts. Continue?',
    });

    if (!confirmed) return;

    try {
      setSending(true);
      const response = await apiClient.post<{ sent: number }>('/carts/abandoned/send-reminders', {
        cartIds: isSelectedOnly ? cartIds : undefined,
      });
      await showAlert({
        title: 'Reminders Sent',
        message: `Successfully sent ${response?.sent || 0} reminder emails.`,
      });
      setSelectedCartIds(new Set());
      fetchCarts();
      fetchStats();
    } catch (error) {
      await showAlert({
        title: 'Error',
        message: 'Failed to send reminders. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendToSelected = () => {
    handleSendReminders(Array.from(selectedCartIds));
  };

  const handleViewDetails = (cart: AbandonedCart) => {
    setSelectedCart(cart);
    setShowDetailsModal(true);
  };

  const parseCartItems = (items: AbandonedCartItem[] | string): AbandonedCartItem[] => {
    if (typeof items === 'string') {
      try {
        return JSON.parse(items);
      } catch {
        return [];
      }
    }
    return items || [];
  };

  const getCustomerName = (cart: AbandonedCart) => {
    if (cart.customerFirstName || cart.customerLastName) {
      return `${cart.customerFirstName || ''} ${cart.customerLastName || ''}`.trim();
    }
    return 'Guest';
  };

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
          title="Abandoned Cart Recovery"
          description="Track and recover abandoned shopping carts to increase revenue"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Orders', href: '/orders' },
            { label: 'Abandoned Carts' },
          ]}
        />

        {/* Summary Cards */}
        <StatsGrid
          stats={[
            { label: 'Total Abandoned', value: formatNumber(stats?.totalAbandoned || 0), icon: ShoppingCart, color: 'primary' },
            { label: 'Pending Recovery', value: formatNumber(stats?.pendingCount || 0), icon: Mail, color: 'warning' },
            { label: 'Recovered', value: formatNumber(stats?.totalRecovered || 0), icon: TrendingUp, color: 'success' },
            { label: 'Recovered Value', value: formatCurrency(stats?.totalRecoveredValue || 0), icon: DollarSign, color: 'primary' },
          ]}
          columns={4}
        />

        {/* Filters and Actions */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <Select value={filterStatus} onChange={(val) => { setFilterStatus(val); setPage(1); }} options={statusOptions} />
            <div className="flex items-center gap-2">
              {selectedCartIds.size > 0 && (
                <span className="text-sm text-muted-foreground mr-2">
                  {selectedCartIds.size} selected
                </span>
              )}
              <Button
                variant="outline"
                onClick={() => { fetchCarts(); fetchStats(); }}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
              {selectedCartIds.size > 0 ? (
                <Button
                  onClick={handleSendToSelected}
                  disabled={sending}
                  className="bg-primary text-primary-foreground"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send to Selected ({selectedCartIds.size})
                </Button>
              ) : (
                <Button
                  onClick={() => handleSendReminders()}
                  disabled={sending || eligibleCarts.length === 0}
                  className="bg-primary text-primary-foreground"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send All Reminders
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Carts Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted">
            <h3 className="text-lg font-bold text-foreground">Abandoned Carts</h3>
            <p className="text-sm text-muted-foreground">View and manage abandoned shopping carts</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">
                      <button
                        onClick={toggleSelectAll}
                        className="p-1 rounded hover:bg-muted transition-colors"
                        title={allEligibleSelected ? 'Deselect all' : 'Select all eligible'}
                        disabled={eligibleCarts.length === 0}
                      >
                        {allEligibleSelected ? (
                          <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                      Items
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                      Cart Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                      Abandoned
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                      Attempts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                      Last Reminder
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {carts.length > 0 ? (
                    carts.map((cart) => {
                      const isEligible = cart.status === 'PENDING' || cart.status === 'REMINDED';
                      const isSelected = selectedCartIds.has(cart.id);
                      return (
                      <tr key={cart.id} className={cn("hover:bg-muted transition-colors", isSelected && "bg-primary/10")}>
                        <td className="px-4 py-4 text-center">
                          {isEligible ? (
                            <button
                              onClick={() => toggleCartSelection(cart.id)}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-5 w-5 text-primary" />
                              ) : (
                                <Square className="h-5 w-5 text-muted-foreground" />
                              )}
                            </button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground">
                            {getCustomerName(cart)}
                          </p>
                          {cart.customerEmail && (
                            <p className="text-sm text-muted-foreground">{cart.customerEmail}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-foreground">
                          {cart.itemCount}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-foreground">
                          {formatCurrency(cart.subtotal)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                              getStatusBadgeClass(cart.status)
                            )}
                          >
                            {cart.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-foreground">
                            {formatRelativeTime(cart.abandonedAt)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(cart.abandonedAt).toLocaleString()}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-foreground">
                          {cart.reminderCount}
                        </td>
                        <td className="px-6 py-4">
                          {cart.lastReminderAt ? (
                            <p className="text-sm text-foreground">
                              {formatRelativeTime(cart.lastReminderAt)}
                            </p>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(cart)}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                              title="View Details"
                              aria-label="View cart details"
                            >
                              <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );})
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                        No abandoned carts found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Cart Details Modal */}
        {showDetailsModal && selectedCart && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="border-b border-border px-6 py-4 sticky top-0 bg-white">
                <h2 className="text-2xl font-bold text-primary">
                  Abandoned Cart Details
                </h2>
                <p className="text-sm text-muted-foreground">
                  Cart abandoned {formatRelativeTime(selectedCart.abandonedAt)}
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Customer</p>
                    <p className="text-sm text-foreground">
                      {getCustomerName(selectedCart)}
                    </p>
                  </div>
                  {selectedCart.customerEmail && (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Email</p>
                      <p className="text-sm text-foreground">{selectedCart.customerEmail}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Status</p>
                    <span
                      className={cn(
                        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                        getStatusBadgeClass(selectedCart.status)
                      )}
                    >
                      {selectedCart.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Recovery Attempts</p>
                    <p className="text-sm text-foreground">{selectedCart.reminderCount}</p>
                  </div>
                </div>

                {/* Cart Items */}
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">Cart Items</p>
                  <div className="space-y-3">
                    {parseCartItems(selectedCart.items).map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Product ID: {item.productId}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {formatCurrency(item.price)}
                          </p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cart Summary */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(selectedCart.subtotal)}</span>
                  </div>
                </div>

                {/* Recovery Info */}
                {selectedCart.status === 'RECOVERED' && selectedCart.recoveredValue && (
                  <div className="bg-success-muted border border-success/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-success">Cart Recovered!</p>
                        <p className="text-xs text-success-foreground">
                          Recovered on{' '}
                          {new Date(selectedCart.recoveredAt || '').toLocaleString()}
                        </p>
                        {selectedCart.recoverySource && (
                          <p className="text-xs text-success-foreground">
                            Source: {selectedCart.recoverySource}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-success">
                          {formatCurrency(selectedCart.recoveredValue)}
                        </p>
                        <p className="text-xs text-success-foreground">Revenue recovered</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border px-6 py-4 flex justify-end gap-3 sticky bottom-0 bg-white">
                <Button onClick={() => setShowDetailsModal(false)} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </PermissionGate>
  );
}
