'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { useDialog } from '@/contexts/DialogContext';
import { returnsService, Return } from '@/lib/services/returnsService';
import {
  RotateCcw,
  Search,
  Eye,
  Package,
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
  ArrowLeft,
  Ban,
  Check,
} from 'lucide-react';

// Return status types
type ReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
type RefundStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

// Map backend reason codes to display text
const REASON_DISPLAY_MAP: Record<string, string> = {
  DEFECTIVE: 'Product is defective',
  DAMAGED: 'Product damaged during shipping',
  WRONG_ITEM: 'Wrong item received',
  WRONG_SIZE: 'Wrong size received',
  NOT_AS_DESCRIBED: 'Product not as described',
  CHANGED_MIND: 'Changed my mind',
  OTHER: 'Other reason',
};

interface ReturnRequest {
  id: string;
  rmaNumber: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  status: ReturnStatus;
  refundStatus: RefundStatus;
  items: {
    id: string;
    productName: string;
    quantity: number;
    price: string;
  }[];
  totalAmount: string;
  refundAmount: string;
  createdAt: string;
  updatedAt: string;
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

export default function ReturnsPage() {
  const { showSuccess, showError, showConfirm } = useDialog();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReturnStatus>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const loadReturns = useCallback(async (isBackground = false) => {
    try {
      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch returns from the API
      const response = await returnsService.getReturns({
        page: 1,
        pageSize: 100,
      });

      // Transform the response to match the display format
      const displayReturns: ReturnRequest[] = (response.data || []).map((ret: Return) => {
        const customerName = ret.order?.customer
          ? `${ret.order.customer.firstName || ''} ${ret.order.customer.lastName || ''}`.trim()
          : 'Unknown Customer';
        const customerEmail = ret.order?.customer?.email || '';

        // Determine refund status based on return status
        let refundStatus: RefundStatus = 'PENDING';
        if (ret.status === 'COMPLETED') {
          refundStatus = 'COMPLETED';
        } else if (ret.status === 'APPROVED') {
          refundStatus = 'PROCESSING';
        } else if (ret.status === 'REJECTED' || ret.status === 'CANCELLED') {
          refundStatus = 'FAILED';
        }

        return {
          id: ret.id,
          rmaNumber: ret.rmaNumber || '',
          orderNumber: ret.order?.orderNumber || ret.orderId || '',
          customerId: ret.customerId,
          customerName,
          customerEmail,
          reason: REASON_DISPLAY_MAP[ret.reason] || ret.reason || 'Not specified',
          status: ret.status as ReturnStatus,
          refundStatus,
          items: (ret.items || []).map((item, idx) => ({
            id: item.id || `item-${idx}`,
            productName: item.productName || 'Unknown Product',
            quantity: item.quantity || 1,
            price: String(item.unitPrice || 0),
          })),
          totalAmount: String(ret.refundAmount || 0),
          refundAmount: String(ret.refundAmount || 0),
          createdAt: ret.createdAt,
          updatedAt: ret.updatedAt,
        };
      });

      setReturns(displayReturns);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load returns:', err);
      setError(err instanceof Error ? err.message : 'Failed to load returns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch (no polling - data is fetched on demand)
  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString();
  };

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = ret.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || ret.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredReturns.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReturns = filteredReturns.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const getStatusBadge = (status: ReturnStatus) => {
    const styles: Record<ReturnStatus, string> = {
      PENDING: 'bg-warning-muted text-warning-foreground border-warning/30',
      APPROVED: 'bg-primary/20 text-primary border-primary/30',
      REJECTED: 'bg-error-muted text-error border-error/30',
      PROCESSING: 'bg-primary/10 text-primary border-primary/30',
      COMPLETED: 'bg-success/10 text-success border-success/30',
      CANCELLED: 'bg-muted text-foreground border-border',
    };
    return <Badge className={styles[status]}>{status}</Badge>;
  };

  const getRefundBadge = (status: RefundStatus) => {
    const styles: Record<RefundStatus, string> = {
      PENDING: 'bg-warning-muted text-warning-foreground border-warning/30',
      PROCESSING: 'bg-primary/20 text-primary border-primary/30',
      COMPLETED: 'bg-success/10 text-success border-success/30',
      FAILED: 'bg-error-muted text-error border-error/30',
    };
    return <Badge className={styles[status]}>Refund: {status}</Badge>;
  };

  const handleApprove = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Approve Return',
      message: 'Are you sure you want to approve this return request?',
      confirmLabel: 'Approve',
      cancelLabel: 'Cancel',
    });
    if (confirmed) {
      try {
        await returnsService.approveReturn(id);
        showSuccess('Success', 'Return request approved');
        // Refresh the list to get updated data
        loadReturns();
      } catch (err) {
        console.error('Failed to approve return:', err);
        showError('Error', 'Failed to approve return request');
      }
    }
  };

  const handleReject = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Reject Return',
      message: 'Are you sure you want to reject this return request?',
      confirmLabel: 'Reject',
      cancelLabel: 'Cancel',
    });
    if (confirmed) {
      try {
        await returnsService.rejectReturn(id, 'Rejected by admin');
        showSuccess('Success', 'Return request rejected');
        // Refresh the list to get updated data
        loadReturns();
      } catch (err) {
        console.error('Failed to reject return:', err);
        showError('Error', 'Failed to reject return request');
      }
    }
  };

  const stats = [
    {
      label: "Total Returns",
      value: returns.length,
      icon: RotateCcw,
      textColor: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      label: "Pending",
      value: returns.filter(r => r.status === 'PENDING').length,
      icon: Clock,
      textColor: "text-warning",
      bgColor: "bg-warning/10"
    },
    {
      label: "Completed",
      value: returns.filter(r => r.status === 'COMPLETED').length,
      icon: CheckCircle,
      textColor: "text-success",
      bgColor: "bg-success/10"
    },
    {
      label: "Total Refunded",
      value: `$${returns.filter(r => r.refundStatus === 'COMPLETED').reduce((sum, r) => sum + parseFloat(r.refundAmount), 0).toFixed(2)}`,
      icon: DollarSign,
      textColor: "text-primary",
      bgColor: "bg-primary/10"
    }
  ];

  if (loading && returns.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading returns...</p>
        </div>
      </div>
    );
  }

  if (error && returns.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-error" />
          <h2 className="text-xl font-semibold text-foreground">Failed to load returns</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => loadReturns()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.ORDERS_MANAGE}
      fallback="styled"
      fallbackTitle="Order Returns Access Required"
      fallbackDescription="You don't have the required permissions to view order returns. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Returns & Refunds"
          description="Manage return requests and process refunds"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Orders', href: '/orders' },
            { label: 'Returns & Refunds' },
          ]}
          badge={{
            label: `${returns.length} Returns`,
            variant: 'default',
          }}
          actions={
            <div className="flex items-center gap-2">
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
                onClick={() => loadReturns()}
                disabled={loading || refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-border/50 hover:border-primary/50/50 transition-all duration-300 group">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className={`text-3xl font-bold ${stat.textColor} mt-2`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor} border border-border group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search and Filters */}
        <Card className="border-border/50">
          <CardContent>
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
                  Filters
                </Button>
              </div>

              {showFilters && (
                <div className="flex flex-wrap gap-4 p-5 bg-white/80 rounded-xl border-2 border-border">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-bold text-foreground mb-2 block">Return Status</label>
                    <Select
                      value={statusFilter}
                      onChange={(value) => setStatusFilter(value as any)}
                      options={[
                        { value: 'ALL', label: 'All Status' },
                        { value: 'PENDING', label: 'Pending' },
                        { value: 'APPROVED', label: 'Approved' },
                        { value: 'REJECTED', label: 'Rejected' },
                        { value: 'PROCESSING', label: 'Processing' },
                        { value: 'COMPLETED', label: 'Completed' },
                        { value: 'CANCELLED', label: 'Cancelled' },
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

        {/* Returns List */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Refund
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      <RotateCcw className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p>No return requests found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedReturns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-muted transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{ret.rmaNumber || ret.orderNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {ret.rmaNumber && ret.orderNumber ? ret.orderNumber : ''} {new Date(ret.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{ret.customerName}</div>
                        <div className="text-sm text-muted-foreground">{ret.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground max-w-xs truncate">
                        {ret.reason}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(ret.status)}
                      </td>
                      <td className="px-6 py-4">
                        {getRefundBadge(ret.refundStatus)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-foreground">${parseFloat(ret.refundAmount).toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedReturn(ret); setShowDetails(true); }}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                            title="View Details"
                            aria-label="View return details"
                          >
                            <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                          </Button>
                          {ret.status === 'PENDING' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(ret.id)}
                                className="h-8 w-8 p-0 rounded-lg hover:bg-success-muted transition-colors"
                                title="Approve"
                                aria-label="Approve return"
                              >
                                <Check className="w-4 h-4 text-success" aria-hidden="true" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReject(ret.id)}
                                className="h-8 w-8 p-0 rounded-lg hover:bg-error-muted transition-colors"
                                title="Reject"
                                aria-label="Reject return"
                              >
                                <Ban className="w-4 h-4 text-error" aria-hidden="true" />
                              </Button>
                            </>
                          )}
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
        {filteredReturns.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}

        {/* Details Modal */}
        {showDetails && selectedReturn && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
            <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-card">
                <h2 className="text-2xl font-bold">Return Details</h2>
                <Button onClick={() => setShowDetails(false)} className="p-2 hover:bg-muted rounded-lg" variant="ghost">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">RMA Number</p>
                    <p className="text-lg font-bold">{selectedReturn.rmaNumber || 'N/A'}</p>
                    {selectedReturn.orderNumber && (
                      <p className="text-sm text-muted-foreground">Order: {selectedReturn.orderNumber}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Status</p>
                    <div className="mt-1 flex gap-2">
                      {getStatusBadge(selectedReturn.status)}
                      {getRefundBadge(selectedReturn.refundStatus)}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-foreground mb-3">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedReturn.customerName}</p>
                    <p><strong>Email:</strong> {selectedReturn.customerEmail}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-foreground mb-3">Return Reason</h3>
                  <p className="text-foreground">{selectedReturn.reason}</p>
                </div>

                <div>
                  <h3 className="font-bold text-foreground mb-3">Items</h3>
                  <div className="space-y-2">
                    {selectedReturn.items.map((item) => (
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
                    <span className="font-semibold">Total Refund Amount:</span>
                    <span className="text-2xl font-bold text-success">${parseFloat(selectedReturn.refundAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </PermissionGate>
  );
}
