'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  RefreshCw,
  Loader2,
  AlertCircle,
  Megaphone,
  Eye,
  Edit2,
  Trash2,
  Pause,
  Play,
  Search,
  Filter,
  MoreHorizontal,
  TrendingUp,
  DollarSign,
  MousePointer,
  Clock,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Send,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select } from '@/components/Select';
import { PermissionGate } from '@/components/permission-gate';
import { Permissions } from '@/hooks/usePermission';
import { useDialog } from '@/contexts/DialogContext';
import { adManagerService } from '@/lib/services/adManagerService';
import type { AdCampaign, AdCampaignStats } from '@/lib/api/types';
import { cn } from '@/lib/utils';

// Status options for filter
const statusOptions = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ARCHIVED', label: 'Archived' },
];

// Status badge styling
const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType; className?: string }> = {
  DRAFT: { variant: 'secondary', icon: Clock, className: 'bg-slate-100 text-slate-700' },
  PENDING_APPROVAL: { variant: 'outline', icon: Send, className: 'bg-warning-muted text-warning-foreground border-warning/30' },
  APPROVED: { variant: 'default', icon: CheckCircle2, className: 'bg-success-muted text-success-foreground' },
  ACTIVE: { variant: 'default', icon: Play, className: 'bg-emerald-100 text-emerald-700' },
  PAUSED: { variant: 'secondary', icon: PauseCircle, className: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { variant: 'secondary', icon: CheckCircle2, className: 'bg-blue-100 text-blue-700' },
  REJECTED: { variant: 'destructive', icon: XCircle, className: 'bg-red-100 text-red-700' },
  ARCHIVED: { variant: 'secondary', icon: Clock, className: 'bg-gray-100 text-gray-600' },
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  ARCHIVED: 'Archived',
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {trend && (
          <p className={cn('text-xs mt-1', trend.value >= 0 ? 'text-success' : 'text-red-600')}>
            {trend.value >= 0 ? '+' : ''}
            {trend.value}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Mobile-friendly campaign card for smaller screens
function CampaignCard({
  campaign,
  onPause,
  onResume,
  onDelete,
  onSubmitForApproval,
}: {
  campaign: AdCampaign;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
  onSubmitForApproval: (id: string) => void;
}) {
  const config = statusConfig[campaign.status] || statusConfig.DRAFT;
  const StatusIcon = config.icon;
  const budgetProgress = campaign.budgetTotal > 0 ? (campaign.spentTotal / campaign.budgetTotal) * 100 : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Link href={`/ad-manager/campaigns/${campaign.id}`} className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{campaign.name}</p>
              <p className="text-sm text-muted-foreground truncate">{campaign.description || 'No description'}</p>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/ad-manager/campaigns/${campaign.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {campaign.status === 'DRAFT' && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/ad-manager/campaigns/${campaign.id}/edit`}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSubmitForApproval(campaign.id)}>
                    <Send className="w-4 h-4 mr-2" />
                    Submit for Approval
                  </DropdownMenuItem>
                </>
              )}
              {campaign.status === 'ACTIVE' && (
                <DropdownMenuItem onClick={() => onPause(campaign.id)}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </DropdownMenuItem>
              )}
              {campaign.status === 'PAUSED' && (
                <DropdownMenuItem onClick={() => onResume(campaign.id)}>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(campaign.id)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Badge className={cn('inline-flex items-center gap-1', config.className)}>
            <StatusIcon className="h-3 w-3" />
            {statusLabels[campaign.status]}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatDate(campaign.startDate)}</span>
        </div>

        {/* Budget progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Budget</span>
            <span className="font-medium">{formatCurrency(campaign.spentTotal)} / {formatCurrency(campaign.budgetTotal)}</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                budgetProgress > 90 ? 'bg-red-500' : budgetProgress > 70 ? 'bg-warning' : 'bg-primary'
              )}
              style={{ width: `${Math.min(budgetProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Impr.</p>
            <p className="text-sm font-semibold">{formatNumber(campaign.impressions)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Clicks</p>
            <p className="text-sm font-semibold">{formatNumber(campaign.clicks)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">CTR</p>
            <p className="text-sm font-semibold">{campaign.ctr.toFixed(1)}%</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">ROAS</p>
            <p className="text-sm font-semibold">{campaign.roas.toFixed(1)}x</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Desktop table row
function CampaignRow({
  campaign,
  onPause,
  onResume,
  onDelete,
  onSubmitForApproval,
}: {
  campaign: AdCampaign;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
  onSubmitForApproval: (id: string) => void;
}) {
  const config = statusConfig[campaign.status] || statusConfig.DRAFT;
  const StatusIcon = config.icon;

  const budgetProgress = campaign.budgetTotal > 0 ? (campaign.spentTotal / campaign.budgetTotal) * 100 : 0;

  return (
    <tr className="hover:bg-muted/50 transition-colors group">
      <td className="px-6 py-4">
        <Link href={`/ad-manager/campaigns/${campaign.id}`} className="block">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {campaign.name}
              </p>
              <p className="text-sm text-muted-foreground truncate max-w-xs">
                {campaign.description || 'No description'}
              </p>
            </div>
          </div>
        </Link>
      </td>
      <td className="px-6 py-4">
        <Badge className={cn('inline-flex items-center gap-1.5', config.className)}>
          <StatusIcon className="h-3 w-3" />
          {statusLabels[campaign.status] || campaign.status}
        </Badge>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{formatCurrency(campaign.spentTotal)}</span>
            <span className="text-muted-foreground">/ {formatCurrency(campaign.budgetTotal)}</span>
          </div>
          <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                budgetProgress > 90 ? 'bg-red-500' : budgetProgress > 70 ? 'bg-warning' : 'bg-primary'
              )}
              style={{ width: `${Math.min(budgetProgress, 100)}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatNumber(campaign.impressions)}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <MousePointer className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatNumber(campaign.clicks)}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <span className={cn('font-semibold', campaign.ctr > 2 ? 'text-success' : campaign.ctr > 1 ? 'text-warning' : '')}>
          {campaign.ctr.toFixed(2)}%
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <span className={cn('font-semibold', campaign.roas > 3 ? 'text-success' : campaign.roas > 1 ? 'text-warning' : '')}>
          {campaign.roas.toFixed(2)}x
        </span>
      </td>
      <td className="px-6 py-4 text-right text-sm text-muted-foreground">
        {formatDate(campaign.startDate)}
        {campaign.endDate && (
          <>
            <br />
            <span className="text-xs">to {formatDate(campaign.endDate)}</span>
          </>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
            <Link href={`/ad-manager/campaigns/${campaign.id}`}>
              <Eye className="w-4 h-4 text-muted-foreground" />
            </Link>
          </Button>
          {(campaign.status === 'DRAFT' || campaign.status === 'PAUSED' || campaign.status === 'REJECTED') && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <Link href={`/ad-manager/campaigns/${campaign.id}/edit`}>
                <Edit2 className="w-4 h-4 text-muted-foreground" />
              </Link>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/ad-manager/campaigns/${campaign.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {campaign.status === 'DRAFT' && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/ad-manager/campaigns/${campaign.id}/edit`}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Campaign
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSubmitForApproval(campaign.id)}>
                    <Send className="w-4 h-4 mr-2" />
                    Submit for Approval
                  </DropdownMenuItem>
                </>
              )}
              {campaign.status === 'ACTIVE' && (
                <DropdownMenuItem onClick={() => onPause(campaign.id)}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause Campaign
                </DropdownMenuItem>
              )}
              {campaign.status === 'PAUSED' && (
                <DropdownMenuItem onClick={() => onResume(campaign.id)}>
                  <Play className="w-4 h-4 mr-2" />
                  Resume Campaign
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href={`/ad-manager/analytics?campaignId=${campaign.id}`}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(campaign.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Campaign
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

export default function AdCampaignsPage() {
  const { showAlert, showConfirm } = useDialog();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [stats, setStats] = useState<AdCampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adManagerService.getCampaigns({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchQuery || undefined,
        page,
        limit,
      });

      if (response.success) {
        setCampaigns(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      } else {
        throw new Error('Failed to fetch campaigns');
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, page, limit]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await adManagerService.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
  }, [fetchCampaigns, fetchStats]);

  // Debounced search
  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1);
      fetchCampaigns();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, statusFilter]);

  const handlePause = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Pause Campaign',
      message: 'Are you sure you want to pause this campaign? You can resume it later.',
    });

    if (!confirmed) return;

    try {
      const response = await adManagerService.pauseCampaign(id);
      if (response.success) {
        await showAlert({ title: 'Success', message: 'Campaign paused successfully!' });
        fetchCampaigns();
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to pause campaign:', err);
      await showAlert({ title: 'Error', message: 'Failed to pause campaign. Please try again.' });
    }
  };

  const handleResume = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Resume Campaign',
      message: 'Are you sure you want to resume this campaign?',
    });

    if (!confirmed) return;

    try {
      const response = await adManagerService.resumeCampaign(id);
      if (response.success) {
        await showAlert({ title: 'Success', message: 'Campaign resumed successfully!' });
        fetchCampaigns();
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to resume campaign:', err);
      await showAlert({ title: 'Error', message: 'Failed to resume campaign. Please try again.' });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Campaign',
      message: 'Are you sure you want to delete this campaign? This action cannot be undone.',
    });

    if (!confirmed) return;

    try {
      const response = await adManagerService.deleteCampaign(id);
      if (response.success) {
        await showAlert({ title: 'Success', message: 'Campaign deleted successfully!' });
        fetchCampaigns();
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to delete campaign:', err);
      await showAlert({ title: 'Error', message: 'Failed to delete campaign. Please try again.' });
    }
  };

  const handleSubmitForApproval = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Submit for Approval',
      message: 'Submit this campaign for review? Store owners will review and approve or reject it.',
    });

    if (!confirmed) return;

    try {
      const response = await adManagerService.submitForApproval({
        campaignId: id,
        submissionType: 'CAMPAIGN',
        message: 'Campaign ready for review',
      });
      if (response.success) {
        await showAlert({ title: 'Success', message: 'Campaign submitted for approval!' });
        fetchCampaigns();
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to submit campaign:', err);
      await showAlert({ title: 'Error', message: 'Failed to submit campaign. Please try again.' });
    }
  };

  return (
    <PermissionGate permission={Permissions.ADS_CAMPAIGNS_VIEW} fallback="styled">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Link href="/ad-manager" className="hover:text-primary transition-colors">
                    Ad Manager
                  </Link>
                  <span>/</span>
                  <span>Campaigns</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold">Campaigns</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Create and manage your advertising campaigns
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    fetchCampaigns();
                    fetchStats();
                  }}
                  disabled={loading}
                  className="justify-center"
                >
                  <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                  Refresh
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
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-6">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchCampaigns} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Campaigns"
              value={stats?.totalCampaigns || 0}
              icon={Megaphone}
              loading={statsLoading}
            />
            <StatCard
              title="Active Campaigns"
              value={stats?.activeCampaigns || 0}
              icon={Play}
              loading={statsLoading}
            />
            <StatCard
              title="Total Spend"
              value={formatCurrency(stats?.totalSpend || 0)}
              icon={DollarSign}
              loading={statsLoading}
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats?.totalRevenue || 0)}
              icon={TrendingUp}
              loading={statsLoading}
            />
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search campaigns..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={statusOptions}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns - Cards on mobile, Table on desktop */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading campaigns...</span>
            </div>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Megaphone className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {searchQuery || statusFilter !== 'ALL'
                      ? 'No campaigns match your filters'
                      : 'No campaigns yet'}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {searchQuery || statusFilter !== 'ALL'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Create your first advertising campaign to start reaching customers.'}
                  </p>
                  {!(searchQuery || statusFilter !== 'ALL') && (
                    <Button asChild>
                      <Link href="/ad-manager/campaigns/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Campaign
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {campaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onPause={handlePause}
                    onResume={handleResume}
                    onDelete={handleDelete}
                    onSubmitForApproval={handleSubmitForApproval}
                  />
                ))}
              </div>

              {/* Desktop Table View */}
              <Card className="hidden lg:block">
                <CardHeader className="border-b">
                  <CardTitle>All Campaigns</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                            Campaign
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                            Budget
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Impressions
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Clicks
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            CTR
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            ROAS
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Dates
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {campaigns.map((campaign) => (
                          <CampaignRow
                            key={campaign.id}
                            campaign={campaign}
                            onPause={handlePause}
                            onResume={handleResume}
                            onDelete={handleDelete}
                            onSubmitForApproval={handleSubmitForApproval}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card rounded-lg border">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PermissionGate>
  );
}
