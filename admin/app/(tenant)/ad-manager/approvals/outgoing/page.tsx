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
  Send,
  MessageSquare,
  Calendar,
  User,
  FileCheck,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageError } from '@/components/PageError';
import { PermissionGate } from '@/components/permission-gate';
import { Permissions } from '@/hooks/usePermission';
import { adManagerService } from '@/lib/services/adManagerService';
import type { AdSubmission } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType; className: string; label: string }> = {
  PENDING: { variant: 'outline', icon: Clock, className: 'bg-warning-muted text-warning-foreground border-warning/30', label: 'Pending Review' },
  APPROVED: { variant: 'default', icon: CheckCircle, className: 'bg-success-muted text-success-foreground', label: 'Approved' },
  REJECTED: { variant: 'destructive', icon: XCircle, className: 'bg-error-muted text-error', label: 'Rejected' },
  REVISION_REQUESTED: { variant: 'secondary', icon: MessageSquare, className: 'bg-accent text-primary', label: 'Revision Requested' },
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

function SubmissionCard({ submission }: { submission: AdSubmission }) {
  const config = statusConfig[submission.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0',
                submission.status === 'PENDING' ? 'bg-warning-muted' :
                submission.status === 'APPROVED' ? 'bg-success-muted' :
                submission.status === 'REJECTED' ? 'bg-error-muted' : 'bg-accent'
              )}>
                <StatusIcon className={cn(
                  'h-6 w-6',
                  submission.status === 'PENDING' ? 'text-warning' :
                  submission.status === 'APPROVED' ? 'text-success' :
                  submission.status === 'REJECTED' ? 'text-error' : 'text-primary'
                )} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{submission.submissionType} Submission</h3>
                <p className="text-sm text-muted-foreground">
                  Submitted to review queue
                </p>
              </div>
              <Badge className={cn('ml-auto', config.className)}>
                {config.label}
              </Badge>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Submitted:</span>
                <span className="font-medium">{formatDate(submission.submittedAt)}</span>
              </div>
              {submission.reviewedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Reviewed:</span>
                  <span className="font-medium">{formatDate(submission.reviewedAt)}</span>
                </div>
              )}
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
                <p className="text-sm font-medium mb-1">Your message:</p>
                <p className="text-sm text-muted-foreground">{submission.message}</p>
              </div>
            )}

            {/* Rejection reason or conditions */}
            {submission.status === 'REJECTED' && submission.rejectionReason && (
              <div className="bg-error-muted border border-error/30 rounded-lg p-4">
                <p className="text-sm font-medium mb-1 text-error">Rejection reason:</p>
                <p className="text-sm text-error">{submission.rejectionReason}</p>
              </div>
            )}

            {submission.status === 'APPROVED' && submission.conditions && (
              <div className="bg-success-muted border border-success/30 rounded-lg p-4">
                <p className="text-sm font-medium mb-1 text-success-foreground">Approval conditions:</p>
                <p className="text-sm text-success">{submission.conditions}</p>
              </div>
            )}

            {submission.reviewedByName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Reviewed by:</span>
                <span className="font-medium">{submission.reviewedByName}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 lg:w-40">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/ad-manager/approvals/${submission.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Link>
            </Button>
            {submission.status === 'REJECTED' && submission.campaignId && (
              <Button size="sm" asChild>
                <Link href={`/ad-manager/campaigns/${submission.campaignId}/edit`}>
                  Edit & Resubmit
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OutgoingApprovalsPage() {
  const [submissions, setSubmissions] = useState<AdSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adManagerService.getOutgoingSubmissions();

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

  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;
  const approvedCount = submissions.filter((s) => s.status === 'APPROVED').length;
  const rejectedCount = submissions.filter((s) => s.status === 'REJECTED').length;

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
                  <span>Outgoing</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold">Your Submissions</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Track the status of your campaign submissions
                </p>
              </div>
              <div className="flex items-center">
                <Button variant="outline" onClick={fetchSubmissions} disabled={loading} className="justify-center p-2.5" title="Refresh">
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mt-6 border-b -mb-px overflow-x-auto">
              <Link
                href="/ad-manager/approvals/incoming"
                className="px-4 py-2 border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                Incoming
              </Link>
              <Link
                href="/ad-manager/approvals/outgoing"
                className="px-4 py-2 border-b-2 border-primary text-primary font-medium -mb-px whitespace-nowrap"
              >
                Outgoing
              </Link>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-warning-muted flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-success-muted flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedCount}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-error-muted flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rejectedCount}</p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </CardContent>
            </Card>
          </div>

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
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Send className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No submissions yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                When you submit campaigns for approval, they will appear here so you can track their status.
              </p>
              <Button asChild>
                <Link href="/ad-manager/campaigns">
                  View Your Campaigns
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <SubmissionCard key={submission.id} submission={submission} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PermissionGate>
  );
}
