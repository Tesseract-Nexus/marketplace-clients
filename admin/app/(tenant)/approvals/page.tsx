'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { PageLoading, PageError, EmptyState } from '@/components/common';
import { approvalService, ApprovalRequest, ApprovalStatus, ApprovalType } from '@/lib/services/approvalService';
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
    cancelled: 'outline',
    expired: 'outline',
  };
  const labels: Record<ApprovalStatus, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    expired: 'Expired',
  };
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
};

const getTypeBadge = (type: ApprovalType) => {
  const labels: Record<ApprovalType, string> = {
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
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('pending');
  const [typeFilter, setTypeFilter] = useState<ApprovalType | 'all'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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

  const handleApprove = async (approval: ApprovalRequest) => {
    try {
      setActionLoading(approval.id);
      await approvalService.approve(approval.id);
      await loadApprovals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDialog = (approval: ApprovalRequest) => {
    setSelectedApproval(approval);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedApproval || !rejectReason.trim()) return;
    try {
      setActionLoading(selectedApproval.id);
      await approvalService.reject(selectedApproval.id, { comment: rejectReason });
      setRejectDialogOpen(false);
      setSelectedApproval(null);
      setRejectReason('');
      await loadApprovals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const navigateToEntity = (approval: ApprovalRequest) => {
    if (approval.entityType === 'order') {
      router.push(`/orders/${approval.entityId}`);
    }
  };

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <PermissionGate
      permission={Permission.APPROVALS_READ}
      fallback="styled"
      fallbackTitle="Approvals Access Required"
      fallbackDescription="You don't have the required permissions to view approvals. Please contact your administrator to request access."
      loading={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
    >
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Approval Requests"
            description={`${pendingCount} pending ${pendingCount === 1 ? 'request' : 'requests'} awaiting your review`}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Team' },
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
          <Card>
            <CardContent className="py-4">
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
            </CardContent>
          </Card>

          {/* Error State */}
          {error && (
            <PageError
              message={error}
              onRetry={loadApprovals}
              onDismiss={() => setError(null)}
            />
          )}

          {/* Loading State */}
          {loading && (
            <PageLoading message="Loading approvals..." />
          )}

          {/* Empty State */}
          {!loading && approvals.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={CheckCircle}
                  title="No Pending Approvals"
                  message="All approval requests have been processed."
                />
              </CardContent>
            </Card>
          )}

          {!loading && approvals.length > 0 && (
            <div className="space-y-4">
              {approvals.map((approval) => (
                <Card key={approval.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Left: Icon and Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className={cn(
                          "p-3 rounded-xl",
                          approval.status === 'pending' ? "bg-secondary" :
                          approval.status === 'approved' ? "bg-primary/10" :
                          approval.status === 'rejected' ? "bg-error-muted" : "bg-muted"
                        )}>
                          {getTypeIcon(approval.approvalType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {getTypeBadge(approval.approvalType)}
                            {getStatusBadge(approval.status)}
                            {approval.amount && (
                              <span className="text-lg font-bold text-foreground">
                                {formatCurrency(approval.amount, approval.currency)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground mb-1">
                            <span className="font-medium">{approval.entityReference}</span>
                            {approval.reason && (
                              <span className="text-muted-foreground"> - {approval.reason}</span>
                            )}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Requested by {approval.requestedByName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(approval.createdAt)}
                            </span>
                            {approval.expiresAt && approval.status === 'pending' && (
                              <span className="flex items-center gap-1 text-error">
                                <Clock className="w-3 h-3" />
                                Expires {formatDate(approval.expiresAt)}
                              </span>
                            )}
                          </div>
                          {approval.status === 'rejected' && approval.rejectionReason && (
                            <p className="mt-2 text-sm text-error bg-error-muted px-3 py-1 rounded-lg inline-block">
                              Reason: {approval.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateToEntity(approval)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <PermissionGate permission={Permission.APPROVALS_APPROVE}>
                          {approval.status === 'pending' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApprove(approval)}
                                disabled={actionLoading === approval.id}
                              >
                                {actionLoading === approval.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <ThumbsUp className="w-4 h-4 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openRejectDialog(approval)}
                                disabled={actionLoading === approval.id}
                              >
                                <ThumbsDown className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </PermissionGate>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Reject Dialog */}
          <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Approval Request</DialogTitle>
                <DialogDescription>
                  Please provide a reason for rejecting this request. This will be visible to the requester.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea
                  placeholder="Enter rejection reason..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading !== null}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Reject Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PermissionGate>
  );
}
