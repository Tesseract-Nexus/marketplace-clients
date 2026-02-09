'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { approvalService, ApprovalRequest, ApprovalStatus, ApprovalType } from '@/lib/services/approvalService';
import { useToast } from '@/contexts/ToastContext';
import {
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Package,
  User,
  Calendar,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  ShoppingCart,
  Ban,
  Loader2,
  Box,
  FolderTree,
  ArrowLeft,
  ExternalLink,
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
    settings_change: 'Settings Change',
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

const getEntityLabel = (entityType: string): string => {
  switch (entityType) {
    case 'product': return 'Product';
    case 'category': return 'Category';
    case 'order': return 'Order';
    default: return 'Entity';
  }
};

export default function ApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const approvalId = params.id as string;

  const [approval, setApproval] = useState<ApprovalRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Action dialog state
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_changes'>('approve');
  const [actionComment, setActionComment] = useState('');

  const loadApproval = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await approvalService.getApproval(approvalId);
      const data = response?.data || response;
      setApproval(data as ApprovalRequest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approval');
      console.error('Error loading approval:', err);
    } finally {
      setLoading(false);
    }
  }, [approvalId]);

  useEffect(() => {
    loadApproval();
  }, [loadApproval]);

  const openActionDialog = (type: 'approve' | 'reject' | 'request_changes') => {
    setActionType(type);
    setActionComment('');
    setActionDialogOpen(true);
  };

  const handleActionSubmit = async () => {
    if (!approval) return;
    if ((actionType === 'reject' || actionType === 'request_changes') && !actionComment.trim()) return;

    try {
      setActionLoading(true);

      const entityName = approval.entityReference || 'Request';
      if (actionType === 'approve') {
        await approvalService.approve(approval.id, actionComment ? { comment: actionComment } : undefined);
        toast.success('Request Approved', `${entityName} has been approved successfully`);
      } else if (actionType === 'request_changes') {
        await approvalService.requestChanges(approval.id, { comment: actionComment });
        toast.info('Changes Requested', `Changes requested for ${entityName}`);
      } else {
        await approvalService.reject(approval.id, { comment: actionComment });
        toast.warning('Request Rejected', `${entityName} has been rejected`);
      }

      setActionDialogOpen(false);
      setActionComment('');
      await loadApproval();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : `Failed to ${actionType === 'approve' ? 'approve' : 'reject'}`;
      toast.error('Action Failed', errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">Loading approval details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !approval) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto py-12">
          <div className="bg-card rounded-lg border border-error/30 p-12 text-center">
            <XCircle className="w-16 h-16 mx-auto text-error mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Approval Not Found</h2>
            <p className="text-muted-foreground mb-6">{error || 'The requested approval could not be found.'}</p>
            <Button onClick={() => router.push('/approvals')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Approvals
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.APPROVALS_READ}
      fallback="styled"
      fallbackTitle="Approvals Access Required"
      fallbackDescription="You don't have the required permissions to view approvals."
    >
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title={approval.entityReference || 'Approval Details'}
            description="Review the details of this approval request"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Team', href: '/staff' },
              { label: 'Approvals', href: '/approvals' },
              { label: approval.entityReference || 'Details' },
            ]}
            actions={
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={loadApproval}
                  disabled={loading}
                  className="p-2.5 rounded-md bg-muted hover:bg-muted transition-all"
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" onClick={() => router.push('/approvals')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Approvals
                </Button>
              </div>
            }
          />

          <div className="max-w-4xl space-y-6">
            {/* Status and Type Badges */}
            <div className="flex flex-wrap items-center gap-3">
              {getTypeIcon(approval.approvalType)}
              {getTypeBadge(approval.approvalType)}
              {getStatusBadge(approval.status)}
              {approval.amount && (
                <span className="text-lg font-bold">
                  {formatCurrency(approval.amount, approval.currency)}
                </span>
              )}
            </div>

            {/* Entity Reference Card */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {getEntityLabel(approval.entityType)}
                </label>
                <p className="font-semibold text-xl mt-1">{approval.entityReference}</p>
              </div>

              {approval.reason && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Reason
                  </label>
                  <p className="text-sm mt-1">{approval.reason}</p>
                </div>
              )}

              {/* Metadata */}
              {approval.metadata && Object.keys(approval.metadata).length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Details
                  </label>
                  <div className="mt-1 text-sm bg-muted rounded-lg p-3 overflow-auto max-h-48">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(approval.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Requester and Dates */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Requested By
                  </label>
                  <p className="text-sm flex items-center gap-1.5 mt-1">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    {approval.requestedByName || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Created At
                  </label>
                  <p className="text-sm flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    {formatDate(approval.createdAt)}
                  </p>
                </div>
                {approval.expiresAt && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Expires At
                    </label>
                    <p className={cn(
                      "text-sm flex items-center gap-1.5 mt-1",
                      approval.status === 'pending' && new Date(approval.expiresAt) < new Date() && "text-error"
                    )}>
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(approval.expiresAt)}
                    </p>
                  </div>
                )}
                {approval.approvedByName && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {approval.status === 'approved' ? 'Approved By' : 'Actioned By'}
                    </label>
                    <p className="text-sm flex items-center gap-1.5 mt-1">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      {approval.approvedByName}
                    </p>
                  </div>
                )}
                {approval.approvedAt && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {approval.status === 'approved' ? 'Approved At' : 'Actioned At'}
                    </label>
                    <p className="text-sm flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {formatDate(approval.approvedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Rejection Reason */}
            {approval.rejectionReason && (
              <div className="bg-error-muted rounded-lg border border-error/20 p-6">
                <label className="text-xs font-medium text-error uppercase tracking-wide">
                  Rejection Reason
                </label>
                <p className="text-sm mt-1">{approval.rejectionReason}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {getEntityUrl(approval) && (
                <Button
                  variant="outline"
                  onClick={() => router.push(getEntityUrl(approval)!)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View {getEntityLabel(approval.entityType)}
                </Button>
              )}
              <PermissionGate permission={Permission.APPROVALS_APPROVE}>
                {approval.status === 'pending' && (
                  <>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => openActionDialog('approve')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <ThumbsUp className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openActionDialog('request_changes')}
                      disabled={actionLoading}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Request Changes
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => openActionDialog('reject')}
                      disabled={actionLoading}
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
              </PermissionGate>
            </div>
          </div>

          {/* Action Dialog */}
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

              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {getTypeIcon(approval.approvalType)}
                  {getTypeBadge(approval.approvalType)}
                  {approval.amount && (
                    <span className="font-semibold">
                      {formatCurrency(approval.amount, approval.currency)}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium">{approval.entityReference}</p>
                {approval.reason && (
                  <p className="text-sm text-muted-foreground">{approval.reason}</p>
                )}
              </div>

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
                    actionLoading
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
        </div>
      </div>
    </PermissionGate>
  );
}
