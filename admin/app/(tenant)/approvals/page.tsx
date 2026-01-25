'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { PageLoading, PageError, EmptyState } from '@/components/common';
import { approvalService, ApprovalRequest, ApprovalStatus, ApprovalType } from '@/lib/services/approvalService';
import { useToast } from '@/contexts/ToastContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Package,
  User,
  Calendar,
  RefreshCw,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Filter,
  ShoppingCart,
  Ban,
  Loader2,
  Box,
  FolderTree,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Currency formatting helper
const formatCurrency = (amount: number | null | undefined, currencyCode: string = 'INR'): string => {
  const numAmount = amount ?? 0;
  const symbols: Record<string, string> = { INR: '\u20B9', USD: '$', EUR: '\u20AC', GBP: '\u00A3', AUD: 'A$' };
  const symbol = symbols[currencyCode] || currencyCode + ' ';
  return `${symbol}${numAmount.toFixed(2)}`;
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadge = (status: ApprovalStatus) => {
  const variants: Record<ApprovalStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    approved: 'default',
    rejected: 'destructive',
    request_changes: 'outline',
    cancelled: 'outline',
    expired: 'outline',
  };
  const labels: Record<ApprovalStatus, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    request_changes: 'Needs Review',
    cancelled: 'Cancelled',
    expired: 'Expired',
  };
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
};

const getTypeBadge = (type: ApprovalType) => {
  const labels: Record<ApprovalType, string> = {
    product_creation: 'New Product',
    product_update: 'Product Update',
    category_creation: 'New Category',
    category_update: 'Category Update',
    order_refund: 'Refund',
    order_cancel: 'Cancellation',
    vendor_payout: 'Vendor Payout',
    price_override: 'Price Override',
    vendor_onboarding: 'Vendor Onboarding',
    vendor_status_change: 'Vendor Status',
    vendor_commission_change: 'Commission Change',
    vendor_contract_change: 'Contract Change',
    vendor_large_payout: 'Large Payout',
  };
  return <Badge variant="outline">{labels[type] || type}</Badge>;
};

const getTypeIcon = (type: ApprovalType) => {
  switch (type) {
    case 'product_creation':
    case 'product_update':
      return <Box className="w-4 h-4" />;
    case 'category_creation':
    case 'category_update':
      return <FolderTree className="w-4 h-4" />;
    case 'order_refund':
      return <DollarSign className="w-4 h-4" />;
    case 'order_cancel':
      return <Ban className="w-4 h-4" />;
    case 'vendor_payout':
    case 'vendor_large_payout':
      return <DollarSign className="w-4 h-4" />;
    case 'price_override':
      return <Package className="w-4 h-4" />;
    case 'vendor_onboarding':
    case 'vendor_status_change':
      return <User className="w-4 h-4" />;
    case 'vendor_commission_change':
    case 'vendor_contract_change':
      return <Package className="w-4 h-4" />;
    default:
      return <ShoppingCart className="w-4 h-4" />;
  }
};

export default function ApprovalsPage() {
  const router = useRouter();
  const toast = useToast();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('pending');
  const [typeFilter, setTypeFilter] = useState<ApprovalType | 'all'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog state
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_changes'>('approve');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewApproval, setViewApproval] = useState<ApprovalRequest | null>(null);

  const loadApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await approvalService.listApprovals({
        status: statusFilter === 'all' ? undefined : statusFilter,
        approvalType: typeFilter === 'all' ? undefined : typeFilter,
        limit: 50,
      });
      setApprovals(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals');
      console.error('Error loading approvals:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  // Quick approve without dialog
  const handleQuickApprove = async (approval: ApprovalRequest) => {
    try {
      setActionLoading(approval.id);
      await approvalService.approve(approval.id);
      toast.success('Request Approved', `${approval.title} has been approved successfully`);
      await loadApprovals();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to approve';
      toast.error('Approval Failed', errorMsg);
      setError(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  // Open action dialog
  const openActionDialog = (approval: ApprovalRequest, type: 'approve' | 'reject' | 'request_changes') => {
    setSelectedApproval(approval);
    setActionType(type);
    setActionComment('');
    setActionDialogOpen(true);
  };

  // Handle action submission from dialog
  const handleActionSubmit = async () => {
    if (!selectedApproval) return;

    // Reject and request_changes require a comment
    if ((actionType === 'reject' || actionType === 'request_changes') && !actionComment.trim()) return;

    try {
      setActionLoading(selectedApproval.id);

      if (actionType === 'approve') {
        await approvalService.approve(selectedApproval.id, actionComment ? { comment: actionComment } : undefined);
        toast.success('Request Approved', `${selectedApproval.title} has been approved successfully`);
      } else if (actionType === 'request_changes') {
        await approvalService.requestChanges(selectedApproval.id, { comment: actionComment });
        toast.info('Changes Requested', `Changes requested for ${selectedApproval.title}`);
      } else {
        await approvalService.reject(selectedApproval.id, { comment: actionComment });
        toast.warning('Request Rejected', `${selectedApproval.title} has been rejected`);
      }

      setActionDialogOpen(false);
      setSelectedApproval(null);
      setActionComment('');
      await loadApprovals();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : `Failed to ${actionType === 'approve' ? 'approve' : 'reject'}`;
      toast.error('Action Failed', errorMsg);
      setError(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const getEntityUrl = (approval: ApprovalRequest): string | null => {
    switch (approval.entityType) {
      case 'order':
        return `/orders/${approval.entityId}`;
      case 'product':
        return `/catalog/products/${approval.entityId}`;
      case 'category':
        return `/catalog/categories/${approval.entityId}`;
      default:
        return null;
    }
  };

  const navigateToEntity = (approval: ApprovalRequest) => {
    const url = getEntityUrl(approval);
    if (url) {
      router.push(url);
    }
  };

  const openViewDialog = (approval: ApprovalRequest) => {
    setViewApproval(approval);
    setViewDialogOpen(true);
  };

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <PermissionGate
      permission={Permission.APPROVALS_READ}
      fallback="styled"
      fallbackTitle="Approvals Access Required"
      fallbackDescription="You don't have the required permissions to view approvals. Please contact your administrator to request access."
      loading={<PageLoading fullScreen />}
    >
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Approval Requests"
            description={`${pendingCount} pending ${pendingCount === 1 ? 'request' : 'requests'} awaiting your review`}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Team', href: '/staff' },
              { label: 'Approvals' },
            ]}
            actions={
              <Button
                variant="outline"
                onClick={loadApprovals}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            }
          />

          {/* Filters */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Filters:</span>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApprovalStatus | 'all')}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="request_changes">Needs Review</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ApprovalType | 'all')}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="product_creation">New Products</SelectItem>
                      <SelectItem value="product_update">Product Updates</SelectItem>
                      <SelectItem value="category_creation">New Categories</SelectItem>
                      <SelectItem value="category_update">Category Updates</SelectItem>
                      <SelectItem value="order_refund">Refunds</SelectItem>
                      <SelectItem value="order_cancel">Cancellations</SelectItem>
                      <SelectItem value="vendor_payout">Vendor Payouts</SelectItem>
                      <SelectItem value="price_override">Price Overrides</SelectItem>
                      <SelectItem value="vendor_onboarding">Vendor Onboarding</SelectItem>
                      <SelectItem value="vendor_status_change">Vendor Status</SelectItem>
                      <SelectItem value="vendor_commission_change">Commission Change</SelectItem>
                      <SelectItem value="vendor_contract_change">Contract Change</SelectItem>
                      <SelectItem value="vendor_large_payout">Large Payouts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          <PageError
            error={error}
            onRetry={loadApprovals}
            onDismiss={() => setError(null)}
          />

          {/* Loading State */}
          {loading && (
            <PageLoading message="Loading approvals..." />
          )}

          {/* Empty State */}
          {!loading && approvals.length === 0 && (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="py-12">
                <EmptyState
                  icon={CheckCircle}
                  title="No Pending Approvals"
                  message="All approval requests have been processed."
                />
              </div>
            </div>
          )}

          {/* Approvals Table */}
          {!loading && approvals.length > 0 && (
            <div className="bg-card rounded-lg border border-border overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                      Request
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                      Requester
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider hidden md:table-cell">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider hidden lg:table-cell">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {approvals.map((approval) => (
                    <tr
                      key={approval.id}
                      className={cn(
                        'hover:bg-muted/50 transition-colors',
                        approval.status === 'pending' && 'bg-warning-muted/20',
                        approval.status === 'rejected' && 'bg-error-muted/20'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg flex-shrink-0",
                            approval.status === 'pending' ? "bg-warning-muted" :
                            approval.status === 'approved' ? "bg-success-muted" :
                            approval.status === 'rejected' ? "bg-error-muted" : "bg-muted"
                          )}>
                            {getTypeIcon(approval.approvalType)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate max-w-[200px]">
                              {approval.title || approval.entityReference}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {approval.reason || `ID: ${approval.id.slice(0, 8)}...`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getTypeBadge(approval.approvalType)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm text-foreground">{approval.requestedByName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(approval.status)}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        {approval.amount ? (
                          <span className="font-semibold text-foreground">
                            {formatCurrency(approval.amount, approval.currency)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="text-sm">
                          <p className="text-foreground">{formatDate(approval.createdAt)}</p>
                          {approval.expiresAt && approval.status === 'pending' && (
                            <p className="text-xs text-error flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              Expires {formatDate(approval.expiresAt)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewDialog(approval)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-primary" />
                          </Button>
                          <PermissionGate permission={Permission.APPROVALS_APPROVE}>
                            {approval.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-success-muted"
                                  onClick={() => handleQuickApprove(approval)}
                                  disabled={actionLoading === approval.id}
                                  title="Approve"
                                >
                                  {actionLoading === approval.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-success" />
                                  ) : (
                                    <ThumbsUp className="w-4 h-4 text-success" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-warning-muted"
                                  onClick={() => openActionDialog(approval, 'request_changes')}
                                  disabled={actionLoading === approval.id}
                                  title="Request Changes"
                                >
                                  <Clock className="w-4 h-4 text-warning" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-error-muted"
                                  onClick={() => openActionDialog(approval, 'reject')}
                                  disabled={actionLoading === approval.id}
                                  title="Reject"
                                >
                                  <ThumbsDown className="w-4 h-4 text-error" />
                                </Button>
                              </>
                            )}
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Dialog - Approve/Reject/Review */}
          <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {actionType === 'approve' && 'Approve Request'}
                  {actionType === 'reject' && 'Reject Request'}
                  {actionType === 'request_changes' && 'Request Changes'}
                </DialogTitle>
                <DialogDescription>
                  {actionType === 'approve' && 'Add an optional comment for your approval.'}
                  {actionType === 'reject' && 'Please provide a reason for rejecting this request. This is required.'}
                  {actionType === 'request_changes' && 'Provide feedback on what changes are needed before approval.'}
                </DialogDescription>
              </DialogHeader>

              {/* Request Details */}
              {selectedApproval && (
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(selectedApproval.approvalType)}
                    {getTypeBadge(selectedApproval.approvalType)}
                    {selectedApproval.amount && (
                      <span className="font-semibold">
                        {formatCurrency(selectedApproval.amount, selectedApproval.currency)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium">{selectedApproval.entityReference}</p>
                  {selectedApproval.reason && (
                    <p className="text-sm text-muted-foreground">{selectedApproval.reason}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Requested by {selectedApproval.requestedByName || 'Unknown'} on {formatDate(selectedApproval.createdAt)}
                  </p>
                </div>
              )}

              <div className="py-2">
                <label className="text-sm font-medium mb-2 block">
                  {actionType === 'approve' ? 'Comment (Optional)' : 'Comment (Required)'}
                </label>
                <Textarea
                  placeholder={
                    actionType === 'approve'
                      ? 'Add an optional comment...'
                      : actionType === 'request_changes'
                      ? 'Describe what changes are needed...'
                      : 'Enter rejection reason...'
                  }
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  rows={4}
                />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant={actionType === 'reject' ? 'destructive' : 'default'}
                  className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                  onClick={handleActionSubmit}
                  disabled={
                    ((actionType === 'reject' || actionType === 'request_changes') && !actionComment.trim()) ||
                    actionLoading !== null
                  }
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {actionType === 'approve' && 'Approve'}
                  {actionType === 'reject' && 'Reject'}
                  {actionType === 'request_changes' && 'Request Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Dialog - Show request details */}
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {viewApproval && getTypeIcon(viewApproval.approvalType)}
                  Approval Request Details
                </DialogTitle>
                <DialogDescription>
                  Review the details of this approval request
                </DialogDescription>
              </DialogHeader>

              {viewApproval && (
                <div className="space-y-4">
                  {/* Status and Type */}
                  <div className="flex flex-wrap items-center gap-2">
                    {getTypeBadge(viewApproval.approvalType)}
                    {getStatusBadge(viewApproval.status)}
                    {viewApproval.amount && (
                      <span className="text-lg font-bold">
                        {formatCurrency(viewApproval.amount, viewApproval.currency)}
                      </span>
                    )}
                  </div>

                  {/* Entity Reference */}
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {viewApproval.entityType === 'product' ? 'Product' :
                         viewApproval.entityType === 'category' ? 'Category' :
                         viewApproval.entityType === 'order' ? 'Order' : 'Entity'}
                      </label>
                      <p className="font-semibold text-lg">{viewApproval.entityReference}</p>
                    </div>

                    {viewApproval.reason && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Reason
                        </label>
                        <p className="text-sm">{viewApproval.reason}</p>
                      </div>
                    )}

                    {/* Request metadata if available */}
                    {viewApproval.metadata && Object.keys(viewApproval.metadata).length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Details
                        </label>
                        <div className="mt-1 text-sm bg-background rounded p-2 overflow-auto max-h-40">
                          <pre className="whitespace-pre-wrap text-xs">
                            {JSON.stringify(viewApproval.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Requester and Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Requested By
                      </label>
                      <p className="text-sm flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {viewApproval.requestedByName || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Created At
                      </label>
                      <p className="text-sm flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(viewApproval.createdAt)}
                      </p>
                    </div>
                    {viewApproval.expiresAt && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Expires At
                        </label>
                        <p className={cn(
                          "text-sm flex items-center gap-1",
                          viewApproval.status === 'pending' && new Date(viewApproval.expiresAt) < new Date() && "text-error"
                        )}>
                          <Clock className="w-3 h-3" />
                          {formatDate(viewApproval.expiresAt)}
                        </p>
                      </div>
                    )}
                    {viewApproval.approvedByName && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {viewApproval.status === 'approved' ? 'Approved By' : 'Actioned By'}
                        </label>
                        <p className="text-sm flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {viewApproval.approvedByName}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Rejection reason */}
                  {viewApproval.rejectionReason && (
                    <div className="bg-error-muted rounded-lg p-4">
                      <label className="text-xs font-medium text-error uppercase tracking-wide">
                        Rejection Reason
                      </label>
                      <p className="text-sm mt-1">{viewApproval.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                {viewApproval && getEntityUrl(viewApproval) && (
                  <Button
                    variant="default"
                    onClick={() => {
                      navigateToEntity(viewApproval);
                      setViewDialogOpen(false);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View {viewApproval.entityType === 'product' ? 'Product' :
                          viewApproval.entityType === 'category' ? 'Category' :
                          viewApproval.entityType === 'order' ? 'Order' : 'Entity'}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PermissionGate>
  );
}
