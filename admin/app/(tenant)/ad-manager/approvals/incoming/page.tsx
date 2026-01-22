'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Check,
  X,
  MessageSquare,
  Building2,
  Calendar,
  User,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageError } from '@/components/PageError';
import { Textarea } from '@/components/ui/textarea';
import { PermissionGate } from '@/components/permission-gate';
import { Permissions } from '@/hooks/usePermission';
import { useDialog } from '@/contexts/DialogContext';
import { adManagerService } from '@/lib/services/adManagerService';
import type { AdSubmission } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType; className: string }> = {
  PENDING: { variant: 'outline', icon: Clock, className: 'bg-warning-muted text-warning-foreground border-warning/30' },
  APPROVED: { variant: 'default', icon: CheckCircle, className: 'bg-success-muted text-success-foreground' },
  REJECTED: { variant: 'destructive', icon: XCircle, className: 'bg-error-muted text-error' },
  REVISION_REQUESTED: { variant: 'secondary', icon: MessageSquare, className: 'bg-accent text-primary' },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function SubmissionCard({
  submission,
  onApprove,
  onReject,
  isProcessing,
}: {
  submission: AdSubmission;
  onApprove: (id: string, conditions?: string) => void;
  onReject: (id: string, reason: string) => void;
  isProcessing: string | null;
}) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [conditions, setConditions] = useState('');

  const config = statusConfig[submission.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;

  const handleApprove = () => {
    onApprove(submission.id, conditions || undefined);
    setShowApproveForm(false);
    setConditions('');
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    onReject(submission.id, rejectReason);
    setShowRejectForm(false);
    setRejectReason('');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{submission.vendorName}</h3>
                <p className="text-sm text-muted-foreground">
                  {submission.submissionType} Submission
                </p>
              </div>
              <Badge className={cn('ml-auto', config.className)}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {submission.status}
              </Badge>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Submitted by:</span>
                <span className="font-medium">{submission.submittedByName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Submitted:</span>
                <span className="font-medium">{formatDate(submission.submittedAt)}</span>
              </div>
              {submission.campaignId && (
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-muted-foreground" />
                  <Link
                    href={`/ad-manager/campaigns/${submission.campaignId}`}
                    className="text-primary hover:underline font-medium"
                  >
                    View Campaign
                  </Link>
                </div>
              )}
            </div>

            {/* Message */}
            {submission.message && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-1">Message from vendor:</p>
                <p className="text-sm text-muted-foreground">{submission.message}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {submission.status === 'PENDING' && (
            <div className="flex flex-col gap-2 lg:w-48">
              {!showRejectForm && !showApproveForm && (
                <>
                  <Button
                    onClick={() => setShowApproveForm(true)}
                    disabled={isProcessing === submission.id}
                    className="bg-success hover:bg-success"
                  >
                    {isProcessing === submission.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(true)}
                    disabled={isProcessing === submission.id}
                    className="border-error/30 text-error hover:bg-error-muted"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/ad-manager/approvals/${submission.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                </>
              )}

              {/* Approve Form */}
              {showApproveForm && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add conditions (optional)"
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                    className="text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleApprove}
                      disabled={isProcessing === submission.id}
                      className="flex-1 bg-success hover:bg-success"
                    >
                      {isProcessing === submission.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Confirm'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowApproveForm(false);
                        setConditions('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Reject Form */}
              {showRejectForm && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Reason for rejection (required)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleReject}
                      disabled={!rejectReason.trim() || isProcessing === submission.id}
                      className="flex-1 bg-error hover:bg-error"
                    >
                      {isProcessing === submission.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Reject'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function IncomingApprovalsPage() {
  const { showAlert } = useDialog();
  const [submissions, setSubmissions] = useState<AdSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adManagerService.getIncomingSubmissions();

      if (response.success) {
        setSubmissions(response.data);
      } else {
        throw new Error('Failed to fetch submissions');
      }
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
      setError('Failed to load submissions. Please try again.');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleApprove = async (id: string, conditions?: string) => {
    try {
      setProcessing(id);
      const response = await adManagerService.approveSubmission(id, { conditions });
      if (response.success) {
        await showAlert({ title: 'Success', message: 'Submission approved successfully!' });
        fetchSubmissions();
      }
    } catch (err) {
      console.error('Failed to approve submission:', err);
      await showAlert({ title: 'Error', message: 'Failed to approve submission. Please try again.' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      setProcessing(id);
      const response = await adManagerService.rejectSubmission(id, { reason });
      if (response.success) {
        await showAlert({ title: 'Success', message: 'Submission rejected.' });
        fetchSubmissions();
      }
    } catch (err) {
      console.error('Failed to reject submission:', err);
      await showAlert({ title: 'Error', message: 'Failed to reject submission. Please try again.' });
    } finally {
      setProcessing(null);
    }
  };

  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;

  return (
    <PermissionGate permission={Permissions.ADS_APPROVALS_VIEW} fallback="styled">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Link href="/ad-manager" className="hover:text-primary transition-colors">
                    Ad Manager
                  </Link>
                  <span>/</span>
                  <span>Approvals</span>
                  <span>/</span>
                  <span>Incoming</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold">Incoming Approvals</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Review and approve ad submissions from vendors
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {pendingCount > 0 && (
                  <Badge className="bg-warning-muted text-warning-foreground border-warning/30">
                    {pendingCount} Pending
                  </Badge>
                )}
                <Button variant="outline" onClick={fetchSubmissions} disabled={loading} className="justify-center">
                  <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mt-6 border-b -mb-px overflow-x-auto">
              <Link
                href="/ad-manager/approvals/incoming"
                className="px-4 py-2 border-b-2 border-primary text-primary font-medium -mb-px whitespace-nowrap"
              >
                Incoming
              </Link>
              <Link
                href="/ad-manager/approvals/outgoing"
                className="px-4 py-2 border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                Outgoing
              </Link>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Error State */}
          <PageError error={error} onRetry={fetchSubmissions} onDismiss={() => setError(null)} />

          {/* Submissions List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-success-muted flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">All caught up!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                No pending approvals at the moment. New submissions from vendors will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isProcessing={processing}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PermissionGate>
  );
}
