'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Send,
  Eye,
  Edit2,
  TrendingUp,
  Mail,
  RefreshCw,
  Loader2,
  AlertCircle,
  MessageSquare,
  Megaphone,
  ShoppingCart,
  Sparkles,
  UserPlus,
  Heart,
  Rocket,
  Newspaper,
  Layers,
  Users,
  Timer,
  CheckCircle2,
  Clock,
  XCircle,
  PauseCircle,
  PlayCircle,
  Code,
  FileText,
  Target,
  Pause,
  Play,
  BarChart3,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { PageError } from '@/components/PageError';
import { PageLoading } from '@/components/common';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { DataPageLayout, SidebarSection, SidebarStatItem, HealthWidgetConfig } from '@/components/DataPageLayout';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { StatusBadge, type StatusType } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';
import { useDialog } from '@/contexts/DialogContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api/client';
import type {
  Campaign,
  CampaignType,
  CampaignChannel,
  CampaignStats,
  CreateCampaignRequest,
} from '@/lib/api/types';

// Segment type for campaign targeting
interface Segment {
  id: string;
  name: string;
  description?: string;
  customerCount: number;
  type: 'STATIC' | 'DYNAMIC';
  isActive: boolean;
}

// API Response wrapper type
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

// Campaign list response can have different formats
interface CampaignListResponse {
  campaigns?: Campaign[];
  data?: Campaign[];
}

const campaignTypes = [
  { value: '', label: 'All Types' },
  { value: 'PROMOTION', label: 'Promotion' },
  { value: 'ABANDONED_CART', label: 'Abandoned Cart' },
  { value: 'WELCOME', label: 'Welcome' },
  { value: 'WINBACK', label: 'Win-back' },
  { value: 'PRODUCT_LAUNCH', label: 'Product Launch' },
  { value: 'NEWSLETTER', label: 'Newsletter' },
];

const channels = [
  { value: '', label: 'All Channels' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
  { value: 'MULTI', label: 'Multi-Channel' },
];

const statuses = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'SENDING', label: 'Sending' },
  { value: 'SENT', label: 'Sent' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const DEFAULT_STATS: CampaignStats = {
  totalCampaigns: 0,
  totalSent: 0,
  avgOpenRate: 0,
  avgClickRate: 0,
  totalRevenue: 0,
  activeCampaigns: 0,
  draftCampaigns: 0,
  scheduledCampaigns: 0,
};

export default function CampaignsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert, showConfirm } = useDialog();
  const toast = useToast();

  // Data state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterType, setFilterType] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Inline form state
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [pausingResuming, setPausingResuming] = useState<string | null>(null);

  // Segments state
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loadingSegments, setLoadingSegments] = useState(false);

  // Content editor mode
  const [contentMode, setContentMode] = useState<'text' | 'html'>('text');

  // Form state
  const [createForm, setCreateForm] = useState<CreateCampaignRequest>({
    name: '',
    description: '',
    type: 'PROMOTION' as CampaignType,
    channel: 'EMAIL' as CampaignChannel,
    subject: '',
    content: '',
    segmentId: undefined,
    htmlContent: '',
  });

  // Edit state
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterChannel) params.append('channel', filterChannel);
      if (filterStatus) params.append('status', filterStatus);
      if (searchQuery) params.append('search', searchQuery);

      const queryString = params.toString();
      const url = queryString ? `/campaigns?${queryString}` : '/campaigns';

      const response = await apiClient.get<ApiResponse<Campaign[] | CampaignListResponse> | CampaignListResponse>(url);

      // Handle both wrapped {success, data} and raw backend response formats
      let campaignData: Campaign[] = [];
      if ('success' in response && response.data) {
        // Wrapped format: {success: true, data: ...}
        const data = response.data;
        campaignData = Array.isArray(data)
          ? data
          : ((data as CampaignListResponse).campaigns || (data as CampaignListResponse).data || []);
      } else if ('campaigns' in response) {
        // Raw backend format: {campaigns: [...], total: ...}
        campaignData = (response as CampaignListResponse).campaigns || [];
      } else if (Array.isArray(response)) {
        campaignData = response;
      }
      setCampaigns(campaignData);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterChannel, filterStatus, searchQuery]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get<ApiResponse<CampaignStats> | CampaignStats>('/campaigns/stats');
      // Handle both wrapped {success, data} and raw backend response formats
      if ('success' in response && response.data) {
        setStats(response.data);
      } else if ('totalCampaigns' in response) {
        // Raw backend format
        setStats(response as CampaignStats);
      }
    } catch (err) {
      console.error('Failed to fetch campaign stats:', err);
      // Keep default stats on error
    }
  }, []);

  // Fetch segments for targeting
  const fetchSegments = useCallback(async () => {
    try {
      setLoadingSegments(true);
      const response = await apiClient.get<ApiResponse<{ segments: Segment[] }> | { segments: Segment[] }>('/marketing/segments');
      let segmentList: Segment[] = [];
      if ('success' in response && response.data) {
        segmentList = (response.data as { segments: Segment[] }).segments || [];
      } else if ('segments' in response) {
        segmentList = (response as { segments: Segment[] }).segments || [];
      }
      setSegments(segmentList.filter(s => s.isActive));
    } catch (err) {
      console.error('Failed to fetch segments:', err);
      setSegments([]);
    } finally {
      setLoadingSegments(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCampaigns();
    fetchStats();
    fetchSegments();
  }, [fetchCampaigns, fetchStats, fetchSegments]);

  // Refetch on filter changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCampaigns();
    }, 300);
    return () => clearTimeout(debounce);
  }, [filterType, filterChannel, filterStatus, searchQuery, fetchCampaigns]);

  // Deep-link: redirect to detail page when ?id= is present
  useEffect(() => {
    const campaignId = searchParams.get('id');
    if (campaignId) {
      router.replace(`/campaigns/${campaignId}`);
    }
  }, [searchParams, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-muted text-foreground border-border';
      case 'SCHEDULED':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'SENDING':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'SENT':
        return 'bg-success-muted text-success-foreground border-success/30';
      case 'COMPLETED':
        return 'bg-success/10 text-success border-success/30';
      case 'PAUSED':
        return 'bg-warning-muted text-warning border-warning/30';
      case 'CANCELLED':
        return 'bg-error-muted text-error border-error/30';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Clock className="h-3 w-3" />;
      case 'SCHEDULED':
        return <Timer className="h-3 w-3" />;
      case 'SENDING':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'SENT':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'COMPLETED':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'PAUSED':
        return <PauseCircle className="h-3 w-3" />;
      case 'CANCELLED':
        return <XCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getCampaignTypeInfo = (type: string) => {
    switch (type) {
      case 'PROMOTION':
        return { icon: Megaphone, bg: 'bg-warning/20', text: 'text-warning' };
      case 'ABANDONED_CART':
        return { icon: ShoppingCart, bg: 'bg-warning/20', text: 'text-warning' };
      case 'WELCOME':
        return { icon: UserPlus, bg: 'bg-success/20', text: 'text-success' };
      case 'WINBACK':
        return { icon: Heart, bg: 'bg-primary/20', text: 'text-primary' };
      case 'PRODUCT_LAUNCH':
        return { icon: Rocket, bg: 'bg-primary/20', text: 'text-primary' };
      case 'NEWSLETTER':
        return { icon: Newspaper, bg: 'bg-primary/20', text: 'text-primary' };
      default:
        return { icon: Megaphone, bg: 'bg-muted', text: 'text-muted-foreground' };
    }
  };

  const getChannelInfo = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return { icon: Mail, color: 'text-primary', bg: 'bg-primary/20' };
      case 'SMS':
        return { icon: MessageSquare, color: 'text-success', bg: 'bg-success-muted' };
      case 'MULTI':
        return { icon: Layers, color: 'text-primary', bg: 'bg-primary/10' };
      default:
        return { icon: Mail, color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  const getCampaignStatusType = (status: string): StatusType => {
    const mapping: Record<string, StatusType> = {
      DRAFT: 'neutral',
      SCHEDULED: 'info',
      SENDING: 'info',
      SENT: 'success',
      COMPLETED: 'success',
      PAUSED: 'warning',
      CANCELLED: 'error',
    };
    return mapping[status] || 'neutral';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateOpenRate = (campaign: Campaign) => {
    if (campaign.delivered === 0) return '0%';
    return ((campaign.opened / campaign.delivered) * 100).toFixed(1) + '%';
  };

  const calculateClickRate = (campaign: Campaign) => {
    if (campaign.opened === 0) return '0%';
    return ((campaign.clicked / campaign.opened) * 100).toFixed(1) + '%';
  };

  const calculateConversionRate = (campaign: Campaign) => {
    if (campaign.clicked === 0) return '0%';
    return ((campaign.converted / campaign.clicked) * 100).toFixed(1) + '%';
  };

  const resetForm = () => {
    setCreateForm({
      name: '',
      description: '',
      type: 'PROMOTION' as CampaignType,
      channel: 'EMAIL' as CampaignChannel,
      subject: '',
      content: '',
      segmentId: undefined,
      htmlContent: '',
    });
    setContentMode('text');
    setEditingCampaign(null);
    setFormMode('create');
  };

  const handleOpenCreateForm = () => {
    resetForm();
    setShowInlineForm(true);
  };

  const handleCloseForm = () => {
    setShowInlineForm(false);
    resetForm();
  };

  const handleCreateCampaign = async () => {
    if (!createForm.name.trim()) {
      toast.error('Validation Error', 'Please enter a campaign name.');
      return;
    }
    if (!createForm.content.trim()) {
      toast.error('Validation Error', 'Please enter campaign content.');
      return;
    }

    try {
      setCreating(true);
      const response = await apiClient.post<ApiResponse<Campaign> | Campaign>('/campaigns', createForm);

      // Handle both wrapped {success, data} and raw backend response (with id)
      const isSuccess = ('success' in response && response.success) || ('id' in response);
      if (isSuccess) {
        toast.success('Campaign Created', 'Campaign created successfully!');
        handleCloseForm();
        fetchCampaigns();
        fetchStats();
      } else {
        throw new Error((response as ApiResponse<Campaign>).error?.message || 'Failed to create campaign');
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
      toast.error('Creation Failed', err instanceof Error ? err.message : 'Failed to create campaign. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    const confirmed = await showConfirm({
      title: 'Send Campaign',
      message: 'Are you sure you want to send this campaign? This action cannot be undone.',
    });

    if (!confirmed) return;

    try {
      setSending(campaignId);
      const response = await apiClient.post<ApiResponse<{ message: string }>>(`/campaigns/${campaignId}/send`, {});

      if (response.success) {
        toast.success('Campaign Sent', 'Campaign is being sent!');
        fetchCampaigns();
        fetchStats();
      } else {
        throw new Error(response.error?.message || 'Failed to send campaign');
      }
    } catch (err) {
      console.error('Failed to send campaign:', err);
      toast.error('Send Failed', err instanceof Error ? err.message : 'Failed to send campaign. Please try again.');
    } finally {
      setSending(null);
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    const confirmed = await showConfirm({
      title: 'Pause Campaign',
      message: 'Are you sure you want to pause this campaign? You can resume it later.',
    });

    if (!confirmed) return;

    try {
      setPausingResuming(campaignId);
      const response = await apiClient.put<ApiResponse<Campaign>>(`/campaigns/${campaignId}`, { status: 'PAUSED' });

      if (response.success || ('id' in response)) {
        toast.success('Campaign Paused', 'Campaign paused successfully!');
        fetchCampaigns();
        fetchStats();
      } else {
        throw new Error((response as ApiResponse<Campaign>).error?.message || 'Failed to pause campaign');
      }
    } catch (err) {
      console.error('Failed to pause campaign:', err);
      toast.error('Pause Failed', err instanceof Error ? err.message : 'Failed to pause campaign. Please try again.');
    } finally {
      setPausingResuming(null);
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    const confirmed = await showConfirm({
      title: 'Resume Campaign',
      message: 'Are you sure you want to resume this campaign?',
    });

    if (!confirmed) return;

    try {
      setPausingResuming(campaignId);
      const response = await apiClient.put<ApiResponse<Campaign>>(`/campaigns/${campaignId}`, { status: 'SENDING' });

      if (response.success || ('id' in response)) {
        toast.success('Campaign Resumed', 'Campaign resumed successfully!');
        fetchCampaigns();
        fetchStats();
      } else {
        throw new Error((response as ApiResponse<Campaign>).error?.message || 'Failed to resume campaign');
      }
    } catch (err) {
      console.error('Failed to resume campaign:', err);
      toast.error('Resume Failed', err instanceof Error ? err.message : 'Failed to resume campaign. Please try again.');
    } finally {
      setPausingResuming(null);
    }
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setCreateForm({
      name: campaign.name,
      description: campaign.description || '',
      type: campaign.type,
      channel: campaign.channel,
      subject: campaign.subject || '',
      content: campaign.content || '',
      segmentId: undefined,
      htmlContent: '',
    });
    setFormMode('edit');
    setShowInlineForm(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCampaign) return;

    if (!createForm.name.trim()) {
      toast.error('Validation Error', 'Please enter a campaign name.');
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.put<ApiResponse<Campaign>>(`/campaigns/${editingCampaign.id}`, {
        name: createForm.name,
        description: createForm.description,
        subject: createForm.subject,
        content: createForm.content,
        type: createForm.type,
        channel: createForm.channel,
      });

      if (response.success || ('id' in response)) {
        toast.success('Campaign Updated', 'Campaign updated successfully!');
        handleCloseForm();
        fetchCampaigns();
      } else {
        throw new Error((response as ApiResponse<Campaign>).error?.message || 'Failed to update campaign');
      }
    } catch (err) {
      console.error('Failed to update campaign:', err);
      toast.error('Update Failed', err instanceof Error ? err.message : 'Failed to update campaign. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Sidebar configuration for DataPageLayout
  const sidebarConfig = React.useMemo(() => {
    const healthWidget: HealthWidgetConfig = {
      label: 'Campaign Health',
      currentValue: stats.activeCampaigns + stats.draftCampaigns,
      totalValue: stats.totalCampaigns || 1,
      status: stats.activeCampaigns > 0 ? 'healthy' : stats.draftCampaigns > 0 ? 'attention' : 'normal',
      segments: [
        { value: stats.activeCampaigns, color: 'success' },
        { value: stats.scheduledCampaigns, color: 'primary' },
        { value: stats.draftCampaigns, color: 'warning' },
      ],
    };

    const sections: SidebarSection[] = [
      {
        title: 'Campaign Status',
        items: [
          {
            id: 'total',
            label: 'Total Campaigns',
            value: stats.totalCampaigns,
            icon: Mail,
            color: 'muted',
            onClick: () => setFilterStatus(''),
            isActive: filterStatus === '',
          },
          {
            id: 'active',
            label: 'Active',
            value: stats.activeCampaigns,
            icon: Send,
            color: 'success',
            onClick: () => setFilterStatus('SENDING'),
            isActive: filterStatus === 'SENDING',
          },
          {
            id: 'scheduled',
            label: 'Scheduled',
            value: stats.scheduledCampaigns,
            icon: Timer,
            color: 'primary',
            onClick: () => setFilterStatus('SCHEDULED'),
            isActive: filterStatus === 'SCHEDULED',
          },
          {
            id: 'draft',
            label: 'Drafts',
            value: stats.draftCampaigns,
            icon: Clock,
            color: 'warning',
            onClick: () => setFilterStatus('DRAFT'),
            isActive: filterStatus === 'DRAFT',
          },
        ],
      },
      {
        title: 'Performance',
        items: [
          {
            id: 'sent',
            label: 'Total Sent',
            value: formatNumber(stats.totalSent),
            icon: Send,
            color: 'success',
          },
          {
            id: 'openRate',
            label: 'Avg Open Rate',
            value: `${stats.avgOpenRate.toFixed(1)}%`,
            icon: TrendingUp,
            color: 'primary',
          },
          {
            id: 'revenue',
            label: 'Total Revenue',
            value: formatCurrency(stats.totalRevenue),
            icon: BarChart3,
            color: 'success',
          },
        ],
      },
    ];

    return { healthWidget, sections };
  }, [stats, filterStatus]);

  // Mobile stats for DataPageLayout
  const mobileStats: SidebarStatItem[] = React.useMemo(() => [
    {
      id: 'total',
      label: 'Total',
      value: stats.totalCampaigns,
      icon: Mail,
      color: 'default',
      onClick: () => setFilterStatus(''),
    },
    {
      id: 'active',
      label: 'Active',
      value: stats.activeCampaigns,
      icon: Send,
      color: 'success',
    },
    {
      id: 'draft',
      label: 'Drafts',
      value: stats.draftCampaigns,
      icon: Clock,
      color: 'warning',
    },
    {
      id: 'openRate',
      label: 'Open Rate',
      value: `${stats.avgOpenRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'primary',
    },
  ], [stats]);

  return (
    <PermissionGate
      permission={Permission.MARKETING_CAMPAIGNS_VIEW}
      fallback="styled"
      fallbackTitle="Marketing Campaigns Access Required"
      fallbackDescription="You don't have the required permissions to view marketing campaigns. Please contact your administrator to request access."
      loading={<PageLoading fullScreen />}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Marketing Campaigns"
          description="Create and manage email and SMS marketing campaigns"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Marketing', href: '/campaigns' },
            { label: 'Campaigns' },
          ]}
          actions={
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => { fetchCampaigns(); fetchStats(); }}
                disabled={loading}
                className="p-2.5 rounded-md bg-muted hover:bg-muted transition-all"
                title="Refresh"
              >
                <RefreshCw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin")} />
              </Button>
              <Button
                onClick={handleOpenCreateForm}
                variant="gradient"
                disabled={showInlineForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          }
        />

        {/* Error Banner */}
        <PageError error={error} onRetry={fetchCampaigns} onDismiss={() => setError(null)} />

        {/* Inline Form */}
        {showInlineForm && (
          <div className="bg-card rounded-lg border border-border shadow-sm animate-in slide-in-from-top duration-300">
            <div className="border-b border-border p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {formMode === 'edit' ? 'Edit Campaign' : 'Create New Campaign'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {formMode === 'edit'
                    ? 'Update the details of your marketing campaign'
                    : 'Create a new marketing campaign to engage your customers'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseForm}
                className="h-8 w-8 p-0 rounded-lg hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Campaign Name *
                  </label>
                  <Input
                    placeholder="Summer Sale Campaign"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Type
                    </label>
                    <Select
                      value={createForm.type}
                      onChange={(value) => setCreateForm({ ...createForm, type: value as CampaignType })}
                      options={campaignTypes.filter((t) => t.value !== '')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Channel
                    </label>
                    <Select
                      value={createForm.channel}
                      onChange={(value) => setCreateForm({ ...createForm, channel: value as CampaignChannel })}
                      options={channels.filter((c) => c.value !== '')}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                  rows={2}
                  placeholder="Describe your campaign..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>

              {formMode === 'create' && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    <Target className="w-4 h-4 inline mr-1" />
                    Target Audience
                  </label>
                  <select
                    className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                    value={createForm.segmentId || ''}
                    onChange={(e) => setCreateForm({ ...createForm, segmentId: e.target.value || undefined })}
                    disabled={loadingSegments}
                  >
                    <option value="">All Customers</option>
                    {segments.map((segment) => (
                      <option key={segment.id} value={segment.id}>
                        {segment.name} ({segment.customerCount.toLocaleString()} customers)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {createForm.channel === 'EMAIL' && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Email Subject
                  </label>
                  <Input
                    placeholder="Don't miss out on our summer sale!"
                    value={createForm.subject}
                    onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-foreground">
                    Message Content *
                  </label>
                  {createForm.channel === 'EMAIL' && formMode === 'create' && (
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setContentMode('text')}
                        className={cn(
                          "px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1",
                          contentMode === 'text'
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <FileText className="w-3 h-3" />
                        Text
                      </button>
                      <button
                        type="button"
                        onClick={() => setContentMode('html')}
                        className={cn(
                          "px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1",
                          contentMode === 'html'
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Code className="w-3 h-3" />
                        HTML
                      </button>
                    </div>
                  )}
                </div>
                {contentMode === 'text' ? (
                  <textarea
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                    rows={4}
                    placeholder="Your message content..."
                    value={createForm.content}
                    onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                  />
                ) : (
                  <div className="space-y-2">
                    <textarea
                      className="w-full px-3 py-2 border border-border rounded-md bg-muted font-mono text-sm focus:outline-none focus:border-primary"
                      rows={6}
                      placeholder="<html><body><h1>Your Email</h1></body></html>"
                      value={createForm.htmlContent}
                      onChange={(e) => setCreateForm({ ...createForm, htmlContent: e.target.value })}
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Code className="w-3 h-3" />
                      <span>Variables: {'{{ customer_name }}'}, {'{{ product_name }}'}, {'{{ unsubscribe_link }}'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={handleCloseForm} disabled={creating || saving}>
                  Cancel
                </Button>
                <Button
                  onClick={formMode === 'edit' ? handleSaveEdit : handleCreateCampaign}
                  disabled={creating || saving}
                  variant="gradient"
                >
                  {(creating || saving) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {formMode === 'edit' ? 'Saving...' : 'Creating...'}
                    </>
                  ) : (
                    formMode === 'edit' ? 'Save Changes' : 'Create Campaign'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        <DataPageLayout sidebar={sidebarConfig} mobileStats={mobileStats}>
        <div className="space-y-6">
        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Search
              </label>
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Type
              </label>
              <Select value={filterType} onChange={setFilterType} options={campaignTypes} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Channel
              </label>
              <Select value={filterChannel} onChange={setFilterChannel} options={channels} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <Select value={filterStatus} onChange={setFilterStatus} options={statuses} />
            </div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          {loading ? (
            <TableSkeleton rows={6} columns={7} />
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {searchQuery || filterType || filterChannel || filterStatus
                  ? 'No campaigns match your filters'
                  : 'No campaigns yet'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery || filterType || filterChannel || filterStatus
                  ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                  : 'Create your first marketing campaign to start engaging with your customers.'}
              </p>
              {!(searchQuery || filterType || filterChannel || filterStatus) && (
                <Button
                  onClick={handleOpenCreateForm}
                  variant="gradient"
                  disabled={showInlineForm}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                      Channel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                      Open Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                      Click Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {campaigns.map((campaign) => {
                    const typeInfo = getCampaignTypeInfo(campaign.type);
                    const channelInfo = getChannelInfo(campaign.channel);
                    const TypeIcon = typeInfo.icon;
                    const ChannelIcon = channelInfo.icon;
                    const openRate = parseFloat(calculateOpenRate(campaign));
                    const clickRate = parseFloat(calculateClickRate(campaign));

                    return (
                    <tr key={campaign.id} className="hover:bg-muted/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                            typeInfo.bg
                          )}>
                            <TypeIcon className={cn("h-5 w-5", typeInfo.text)} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{campaign.name}</p>
                            {campaign.subject && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {campaign.subject}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold",
                          typeInfo.bg, typeInfo.text
                        )}>
                          {campaign.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold",
                          channelInfo.bg, channelInfo.color
                        )}>
                          <ChannelIcon className="h-3 w-3" />
                          {campaign.channel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={getCampaignStatusType(campaign.status)}>
                          {campaign.status}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{formatNumber(campaign.totalRecipients)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="space-y-1">
                          <span className={cn(
                            "font-semibold",
                            openRate > 30 ? "text-success" : openRate > 15 ? "text-warning" : "text-foreground"
                          )}>
                            {calculateOpenRate(campaign)}
                          </span>
                          {campaign.delivered > 0 && (
                            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden ml-auto">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  openRate > 30 ? "bg-success" : openRate > 15 ? "bg-warning" : "bg-border"
                                )}
                                style={{ width: `${Math.min(openRate, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="space-y-1">
                          <span className={cn(
                            "font-semibold",
                            clickRate > 10 ? "text-success" : clickRate > 5 ? "text-warning" : "text-foreground"
                          )}>
                            {calculateClickRate(campaign)}
                          </span>
                          {campaign.opened > 0 && (
                            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden ml-auto">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  clickRate > 10 ? "bg-success" : clickRate > 5 ? "bg-warning" : "bg-border"
                                )}
                                style={{ width: `${Math.min(clickRate * 3, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "font-bold",
                          campaign.revenue > 0 ? "text-success" : "text-muted-foreground"
                        )}>
                          {formatCurrency(campaign.revenue)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/campaigns/${campaign.id}`)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                            title="View details"
                            aria-label="View campaign details"
                          >
                            <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                          </Button>
                          {(campaign.status === 'DRAFT' || campaign.status === 'PAUSED') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCampaign(campaign)}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                              title="Edit campaign"
                              aria-label="Edit campaign"
                            >
                              <Edit2 className="w-4 h-4 text-primary" aria-hidden="true" />
                            </Button>
                          )}
                          {campaign.status === 'DRAFT' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendCampaign(campaign.id)}
                              disabled={sending === campaign.id}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-success-muted transition-colors"
                              title="Send campaign"
                              aria-label="Send campaign"
                            >
                              {sending === campaign.id ? (
                                <Loader2 className="w-4 h-4 text-success animate-spin" />
                              ) : (
                                <Send className="w-4 h-4 text-success" aria-hidden="true" />
                              )}
                            </Button>
                          )}
                          {(campaign.status === 'SENDING' || campaign.status === 'SCHEDULED') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePauseCampaign(campaign.id)}
                              disabled={pausingResuming === campaign.id}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-warning-muted transition-colors"
                              title="Pause campaign"
                              aria-label="Pause campaign"
                            >
                              {pausingResuming === campaign.id ? (
                                <Loader2 className="w-4 h-4 text-warning animate-spin" />
                              ) : (
                                <Pause className="w-4 h-4 text-warning" aria-hidden="true" />
                              )}
                            </Button>
                          )}
                          {campaign.status === 'PAUSED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResumeCampaign(campaign.id)}
                              disabled={pausingResuming === campaign.id}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-success-muted transition-colors"
                              title="Resume campaign"
                              aria-label="Resume campaign"
                            >
                              {pausingResuming === campaign.id ? (
                                <Loader2 className="w-4 h-4 text-success animate-spin" />
                              ) : (
                                <Play className="w-4 h-4 text-success" aria-hidden="true" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
        </DataPageLayout>
      </div>

    </div>
    </PermissionGate>
  );
}
