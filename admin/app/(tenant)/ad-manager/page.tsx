'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Eye,
  MousePointer,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  Plus,
  ArrowRight,
  BarChart3,
  Image as ImageIcon,
  Store,
  FileCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenant } from '@/contexts/TenantContext';
import { adManagerService } from '@/lib/services/adManagerService';
import type { AdCampaign, AdCampaignStats, AdSubmission } from '@/lib/api/types';

// Status badge variant mapping
const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  PENDING_APPROVAL: 'outline',
  APPROVED: 'default',
  REJECTED: 'destructive',
  ACTIVE: 'default',
  PAUSED: 'secondary',
  COMPLETED: 'secondary',
  ARCHIVED: 'secondary',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <Skeleton className="h-8 w-32 mt-4" />
          <Skeleton className="h-3 w-20 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <p className="text-2xl font-bold mt-2">{value}</p>
        {change !== undefined && (
          <p className={`text-xs mt-1 ${change >= 0 ? 'text-success' : 'text-error'}`}>
            {change >= 0 ? '+' : ''}
            {change}% {changeLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  variant = 'default',
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  variant?: 'default' | 'primary';
}) {
  return (
    <Link href={href}>
      <Card
        className={`hover:shadow-lg transition-all cursor-pointer h-full ${
          variant === 'primary'
            ? 'bg-primary/10 border-primary/20'
            : ''
        }`}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                variant === 'primary' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CampaignRow({ campaign }: { campaign: AdCampaign }) {
  return (
    <Link href={`/ad-manager/campaigns/${campaign.id}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{campaign.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(campaign.spentTotal)} / {formatCurrency(campaign.budgetTotal)} spent
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4 pl-13 sm:pl-0">
          <div className="text-left sm:text-right">
            <p className="text-sm font-medium">{formatNumber(campaign.impressions)} impr.</p>
            <p className="text-xs text-muted-foreground">{campaign.ctr.toFixed(2)}% CTR</p>
          </div>
          <Badge variant={statusVariants[campaign.status] || 'secondary'} className="shrink-0">
            {statusLabels[campaign.status] || campaign.status}
          </Badge>
        </div>
      </div>
    </Link>
  );
}

function SubmissionRow({ submission }: { submission: AdSubmission }) {
  return (
    <Link href={`/ad-manager/approvals/${submission.id}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-warning-muted flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-warning" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{submission.vendorName}</p>
            <p className="text-sm text-muted-foreground truncate">
              {submission.submissionType} - {submission.submittedByName}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 pl-13 sm:pl-0">
          <Badge variant="outline" className="bg-warning-muted text-warning-foreground border-warning/30 shrink-0">
            Pending Review
          </Badge>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(submission.submittedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function AdManagerDashboard() {
  const { currentTenant } = useTenant();
  const [stats, setStats] = useState<AdCampaignStats | null>(null);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [submissions, setSubmissions] = useState<AdSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const isStoreOwner = ['owner', 'admin', 'store_owner', 'store_admin'].includes(
    currentTenant?.role || ''
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsRes, campaignsRes, submissionsRes] = await Promise.all([
          adManagerService.getStats(),
          adManagerService.getCampaigns({ limit: 5 }),
          isStoreOwner
            ? adManagerService.getIncomingSubmissions()
            : adManagerService.getOutgoingSubmissions(),
        ]);

        if (statsRes.success) {
          setStats(statsRes.data);
        }
        if (campaignsRes.success) {
          setCampaigns(campaignsRes.data);
        }
        if (submissionsRes.success) {
          setSubmissions(submissionsRes.data.slice(0, 5));
        }
      } catch (error) {
        console.error('Failed to load ad manager data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isStoreOwner]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Ad Manager</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                {isStoreOwner
                  ? 'Manage ad placements and review submissions'
                  : 'Create and manage advertising campaigns'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button variant="outline" asChild className="justify-center">
                <Link href="/ad-manager/analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
              </Button>
              <Button asChild className="justify-center">
                <Link href="/ad-manager/campaigns/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Active Campaigns"
            value={stats?.activeCampaigns || 0}
            icon={Megaphone}
            loading={loading}
          />
          <StatCard
            title="Total Impressions"
            value={formatNumber(stats?.totalImpressions || 0)}
            icon={Eye}
            loading={loading}
          />
          <StatCard
            title="Avg. Click Rate"
            value={`${(stats?.avgCtr || 0).toFixed(2)}%`}
            icon={MousePointer}
            loading={loading}
          />
          <StatCard
            title={isStoreOwner ? 'Ad Revenue' : 'Total Spend'}
            value={formatCurrency(isStoreOwner ? stats?.totalRevenue || 0 : stats?.totalSpend || 0)}
            icon={DollarSign}
            loading={loading}
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              title="Create Campaign"
              description="Launch a new advertising campaign"
              icon={Plus}
              href="/ad-manager/campaigns/new"
              variant="primary"
            />
            <QuickActionCard
              title="Upload Creative"
              description="Add new images or videos"
              icon={ImageIcon}
              href="/ad-manager/creatives"
            />
            {isStoreOwner ? (
              <QuickActionCard
                title="Review Submissions"
                description={`${submissions.length} pending approvals`}
                icon={FileCheck}
                href="/ad-manager/approvals/incoming"
              />
            ) : (
              <QuickActionCard
                title="Track Submissions"
                description="View your submission status"
                icon={FileCheck}
                href="/ad-manager/approvals/outgoing"
              />
            )}
            <QuickActionCard
              title="Browse Storefronts"
              description="Find placement opportunities"
              icon={Store}
              href="/ad-manager/storefronts"
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Recent Campaigns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Campaigns</CardTitle>
                  <CardDescription>Your latest advertising campaigns</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/ad-manager/campaigns">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24 mt-1" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No campaigns yet</p>
                    <Button className="mt-4" asChild>
                      <Link href="/ad-manager/campaigns/new">Create Your First Campaign</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {campaigns.map((campaign) => (
                      <CampaignRow key={campaign.id} campaign={campaign} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending Approvals / Submissions */}
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>
                    {isStoreOwner ? 'Pending Approvals' : 'Your Submissions'}
                  </CardTitle>
                  <CardDescription>
                    {isStoreOwner ? 'Ads waiting for your review' : 'Track your submission status'}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/ad-manager/approvals/${isStoreOwner ? 'incoming' : 'outgoing'}`}>
                    View All
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-20 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {isStoreOwner ? 'No pending approvals' : 'No submissions yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {submissions.map((submission) => (
                      <SubmissionRow key={submission.id} submission={submission} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Clicks</span>
                    <span className="font-medium">{formatNumber(stats?.totalClicks || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg. ROAS</span>
                    <span className="font-medium">{(stats?.avgRoas || 0).toFixed(2)}x</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Paused Campaigns</span>
                    <span className="font-medium">{stats?.pausedCampaigns || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pending Approval</span>
                    <span className="font-medium">{stats?.pendingApproval || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
