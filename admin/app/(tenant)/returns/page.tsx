'use client';

import React, { useState, useEffect } from 'react';
import { PackageX, Check, X, Eye, RefreshCw, Search, Clock, Truck, Package, CheckCircle, XCircle, RotateCcw, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { formatDistanceToNow, format } from 'date-fns';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';

interface ReturnItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  reason: string;
  receivedCondition?: string;
  isDefective: boolean;
  canResell: boolean;
}

interface Return {
  id: string;
  rmaNumber: string;
  orderNumber?: string;
  orderId: string;
  customerId: string;
  status: string;
  reason: string;
  returnType: string;
  customerNotes: string;
  adminNotes: string;
  refundAmount: number;
  refundMethod: string;
  restockingFee: number;
  returnTrackingNumber: string;
  returnCarrier: string;
  items: ReturnItem[];
  timeline: Array<{ status: string; message: string; createdAt: string }>;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  order?: {
    orderNumber: string;
    customer?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending Review', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200', icon: Clock },
  APPROVED: { label: 'Approved', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', icon: XCircle },
  IN_TRANSIT: { label: 'In Transit', color: 'text-primary', bgColor: 'bg-primary/10 border-primary/30', icon: Truck },
  RECEIVED: { label: 'Received', color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200', icon: Package },
  INSPECTING: { label: 'Inspecting', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200', icon: Eye },
  COMPLETED: { label: 'Completed', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-foreground', bgColor: 'bg-muted border-border', icon: XCircle },
};

const reasonLabels: Record<string, string> = {
  DEFECTIVE: 'Product Defective',
  WRONG_ITEM: 'Wrong Item Received',
  NOT_AS_DESCRIBED: 'Not as Described',
  CHANGED_MIND: 'Changed Mind',
  BETTER_PRICE: 'Found Better Price',
  NO_LONGER_NEEDED: 'No Longer Needed',
  OTHER: 'Other Reason',
};

export default function ReturnsPage() {
  const { showAlert } = useDialog();
  const { currentTenant } = useTenant();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [refundMethod, setRefundMethod] = useState('ORIGINAL_PAYMENT');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentTenant?.id) {
      fetchReturns();
    }
  }, [statusFilter, searchQuery, currentTenant?.id]);

  const fetchReturns = async () => {
    if (!currentTenant?.id) return;

    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/returns?${params}`, {
        headers: {
          'x-jwt-claim-tenant-id': currentTenant.id,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch returns');

      const data = await response.json();
      setReturns(data.data || data.returns || []);
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedReturn || !actionType || !currentTenant?.id) return;

    try {
      let url = `/api/returns/${selectedReturn.id}/${actionType}`;
      let body: any = {};

      switch (actionType) {
        case 'approve':
          body = { notes: actionNotes };
          break;
        case 'reject':
          body = { reason: actionNotes };
          break;
        case 'complete':
          body = { refundMethod };
          break;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-jwt-claim-tenant-id': currentTenant.id,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`Failed to ${actionType} return`);

      setIsActionDialogOpen(false);
      setActionNotes('');
      fetchReturns();
      if (isDetailsOpen) {
        loadReturnDetails(selectedReturn.id);
      }
    } catch (error) {
      console.error('Error processing action:', error);
      await showAlert({ title: 'Error', message: `Failed to ${actionType} return` });
    }
  };

  const loadReturnDetails = async (id: string) => {
    if (!currentTenant?.id) return;

    try {
      const response = await fetch(`/api/returns/${id}`, {
        headers: {
          'x-jwt-claim-tenant-id': currentTenant.id,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch return details');

      const data = await response.json();
      setSelectedReturn(data);
    } catch (error) {
      console.error('Error loading return details:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.bgColor} ${config.color}`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    );
  };

  // Stats calculation
  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.status === 'PENDING').length,
    approved: returns.filter(r => r.status === 'APPROVED').length,
    completed: returns.filter(r => r.status === 'COMPLETED').length,
    totalRefund: returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading returns...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.ORDERS_MANAGE}
      fallback="styled"
      fallbackTitle="Returns Access Required"
      fallbackDescription="You don't have the required permissions to view returns. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Returns & Refunds"
          description="Manage return requests and process refunds"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Orders' },
            { label: 'Returns' },
          ]}
          actions={
            <Button onClick={fetchReturns} className="bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Returns</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-amber-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-green-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-emerald-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-primary/30 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Refunds</p>
                <p className="text-2xl font-bold text-primary">${stats.totalRefund.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by RMA number, order, or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted border-border focus:bg-white"
              />
            </div>
            <div className="w-64">
              <Select value={statusFilter} onChange={setStatusFilter} options={[
                { value: '', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'IN_TRANSIT', label: 'In Transit' },
                { value: 'RECEIVED', label: 'Received' },
                { value: 'INSPECTING', label: 'Inspecting' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'REJECTED', label: 'Rejected' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]} />
            </div>
          </div>
        </div>

        {/* Returns List */}
        {returns.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <PackageX className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No returns found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">Returns will appear here when customers request them from their order history.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {returns.map((ret) => {
              const config = statusConfig[ret.status] || statusConfig.PENDING;
              return (
                <div
                  key={ret.id}
                  className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: RMA & Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-foreground">{ret.rmaNumber}</h3>
                          {getStatusBadge(ret.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span>Order: <span className="font-medium text-foreground">{ret.order?.orderNumber || ret.orderId.substring(0, 8)}</span></span>
                          {ret.order?.customer && (
                            <span>Customer: <span className="font-medium text-foreground">{ret.order.customer.firstName} {ret.order.customer.lastName}</span></span>
                          )}
                          <span>Created: <span className="font-medium text-foreground">{formatDistanceToNow(new Date(ret.createdAt), { addSuffix: true })}</span></span>
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Refund Amount</p>
                          <p className="text-xl font-bold text-foreground">${ret.refundAmount?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div className="flex items-center gap-1 border-l border-border pl-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReturn(ret);
                              loadReturnDetails(ret.id);
                              setIsDetailsOpen(true);
                            }}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {ret.status === 'PENDING' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedReturn(ret);
                                  setActionType('approve');
                                  setIsActionDialogOpen(true);
                                }}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedReturn(ret);
                                  setActionType('reject');
                                  setIsActionDialogOpen(true);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {(ret.status === 'INSPECTING' || ret.status === 'RECEIVED') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedReturn(ret);
                                setActionType('complete');
                                setIsActionDialogOpen(true);
                              }}
                              className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Reason:</span>
                        <Badge variant="secondary" className="font-normal">
                          {reasonLabels[ret.reason] || ret.reason.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-gray-300">|</span>
                        <span className="text-muted-foreground">Items:</span>
                        <span className="font-medium text-foreground">{ret.items?.length || 0}</span>
                        {ret.items?.slice(0, 2).map((item, idx) => (
                          <span key={item.id} className="text-muted-foreground">
                            {idx === 0 ? ' — ' : ', '}{item.productName}
                          </span>
                        ))}
                        {ret.items?.length > 2 && (
                          <span className="text-muted-foreground">+{ret.items.length - 2} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Details Dialog */}
        {isDetailsOpen && selectedReturn && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsDetailsOpen(false)}>
            <div className="bg-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 px-6 py-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedReturn.rmaNumber}</h2>
                  <p className="text-blue-100 text-sm">Order: {selectedReturn.order?.orderNumber || selectedReturn.orderId.substring(0, 8)}</p>
                </div>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Status Banner */}
                <div className={`rounded-xl p-4 mb-6 border ${statusConfig[selectedReturn.status]?.bgColor || 'bg-muted border-border'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {React.createElement(statusConfig[selectedReturn.status]?.icon || Clock, {
                        className: `h-6 w-6 ${statusConfig[selectedReturn.status]?.color || 'text-muted-foreground'}`
                      })}
                      <div>
                        <p className={`font-semibold ${statusConfig[selectedReturn.status]?.color || 'text-foreground'}`}>
                          {statusConfig[selectedReturn.status]?.label || selectedReturn.status}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created {format(new Date(selectedReturn.createdAt), 'MMM d, yyyy at h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Refund Amount</p>
                      <p className="text-2xl font-bold text-foreground">${selectedReturn.refundAmount?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Return Type</label>
                      <p className="text-foreground font-medium capitalize">{selectedReturn.returnType.toLowerCase().replace('_', ' ')}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Reason</label>
                      <p className="text-foreground font-medium">{reasonLabels[selectedReturn.reason] || selectedReturn.reason.replace(/_/g, ' ')}</p>
                    </div>
                    {selectedReturn.order?.customer && (
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Customer</label>
                        <p className="text-foreground font-medium">{selectedReturn.order.customer.firstName} {selectedReturn.order.customer.lastName}</p>
                        <p className="text-sm text-muted-foreground">{selectedReturn.order.customer.email}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {selectedReturn.restockingFee > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Restocking Fee</label>
                        <p className="text-foreground font-medium">${selectedReturn.restockingFee.toFixed(2)}</p>
                      </div>
                    )}
                    {selectedReturn.returnTrackingNumber && (
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Return Tracking</label>
                        <p className="text-foreground font-medium">{selectedReturn.returnTrackingNumber}</p>
                        {selectedReturn.returnCarrier && <p className="text-sm text-muted-foreground">{selectedReturn.returnCarrier}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Return Items ({selectedReturn.items?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {selectedReturn.items?.map((item) => (
                      <div key={item.id} className="bg-muted border border-border rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-muted-foreground">Qty: <span className="font-medium text-foreground">{item.quantity}</span></span>
                              <span className="text-muted-foreground">Unit: <span className="font-medium text-foreground">${item.unitPrice.toFixed(2)}</span></span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">${item.refundAmount.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">refund</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {(selectedReturn.customerNotes || selectedReturn.adminNotes) && (
                  <div className="space-y-4">
                    {selectedReturn.customerNotes && (
                      <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                        <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2">Customer Notes</label>
                        <p className="text-foreground">{selectedReturn.customerNotes}</p>
                      </div>
                    )}
                    {selectedReturn.adminNotes && (
                      <div className="bg-muted border border-border rounded-xl p-4">
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Admin Notes</label>
                        <p className="text-foreground">{selectedReturn.adminNotes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {selectedReturn.status === 'PENDING' && (
                  <div className="mt-6 pt-6 border-t border-border flex gap-3">
                    <Button
                      onClick={() => {
                        setActionType('approve');
                        setIsDetailsOpen(false);
                        setIsActionDialogOpen(true);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve Return
                    </Button>
                    <Button
                      onClick={() => {
                        setActionType('reject');
                        setIsDetailsOpen(false);
                        setIsActionDialogOpen(true);
                      }}
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject Return
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Dialog */}
        {isActionDialogOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsActionDialogOpen(false)}>
            <div className="bg-card rounded-2xl max-w-md w-full shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className={`px-6 py-4 ${
                actionType === 'approve' ? 'bg-green-600' :
                actionType === 'reject' ? 'bg-red-600' :
                'bg-primary'
              }`}>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {actionType === 'approve' && <><Check className="h-5 w-5" /> Approve Return</>}
                  {actionType === 'reject' && <><X className="h-5 w-5" /> Reject Return</>}
                  {actionType === 'complete' && <><CheckCircle className="h-5 w-5" /> Complete Return</>}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {actionType === 'complete' && (
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Refund Method</label>
                    <Select value={refundMethod} onChange={setRefundMethod} options={[
                      { value: 'ORIGINAL_PAYMENT', label: 'Original Payment Method' },
                      { value: 'STORE_CREDIT', label: 'Store Credit' },
                      { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                    ]} />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    {actionType === 'reject' ? 'Rejection Reason *' : 'Notes (Optional)'}
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder={actionType === 'reject' ? 'Explain why this return is being rejected...' : 'Add any notes...'}
                    rows={4}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                  />
                </div>
              </div>
              <div className="bg-muted px-6 py-4 flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAction}
                  className={
                    actionType === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' :
                    actionType === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' :
                    'bg-primary hover:bg-primary text-white'
                  }
                >
                  {actionType === 'approve' && 'Approve Return'}
                  {actionType === 'reject' && 'Reject Return'}
                  {actionType === 'complete' && 'Complete & Process Refund'}
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
