'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { cn } from '@/lib/utils';
import { useDialog } from '@/contexts/DialogContext';
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
  const { showAlert, showConfirm } = useDialog();

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

  // Modal state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editForm, setEditForm] = useState<Partial<Campaign>>({});
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
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PAUSED':
        return 'bg-warning-muted text-warning border-warning/30';
      case 'CANCELLED':
        return 'bg-destructive/10 text-destructive border-destructive/30';
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
        return { icon: Megaphone, color: 'from-orange-500 to-red-500', bg: 'from-orange-100 to-red-100', text: 'text-warning' };
      case 'ABANDONED_CART':
        return { icon: ShoppingCart, color: 'from-amber-500 to-orange-500', bg: 'from-amber-100 to-orange-100', text: 'text-warning' };
      case 'WELCOME':
        return { icon: UserPlus, color: 'from-green-500 to-emerald-500', bg: 'from-green-100 to-emerald-100', text: 'text-success' };
      case 'WINBACK':
        return { icon: Heart, color: 'from-pink-500 to-rose-500', bg: 'from-pink-100 to-rose-100', text: 'text-primary' };
      case 'PRODUCT_LAUNCH':
        return { icon: Rocket, color: 'from-violet-500 to-purple-500', bg: 'from-violet-100 to-purple-100', text: 'text-primary' };
      case 'NEWSLETTER':
        return { icon: Newspaper, color: 'from-blue-500 to-cyan-500', bg: 'from-blue-100 to-cyan-100', text: 'text-primary' };
      default:
        return { icon: Megaphone, color: 'from-gray-500 to-gray-600', bg: 'from-gray-100 to-gray-200', text: 'text-muted-foreground' };
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

  const handleCreateCampaign = async () => {
    if (!createForm.name.trim()) {
      await showAlert({ title: 'Error', message: 'Please enter a campaign name.' });
      return;
    }
    if (!createForm.content.trim()) {
      await showAlert({ title: 'Error', message: 'Please enter campaign content.' });
      return;
    }

    try {
      setCreating(true);
      const response = await apiClient.post<ApiResponse<Campaign> | Campaign>('/campaigns', createForm);

      // Handle both wrapped {success, data} and raw backend response (with id)
      const isSuccess = ('success' in response && response.success) || ('id' in response);
      if (isSuccess) {
        await showAlert({ title: 'Success', message: 'Campaign created successfully!' });
        setShowCreateModal(false);
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
        fetchCampaigns();
        fetchStats();
      } else {
        throw new Error((response as ApiResponse<Campaign>).error?.message || 'Failed to create campaign');
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
      await showAlert({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to create campaign. Please try again.'
      });
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
        await showAlert({ title: 'Success', message: 'Campaign is being sent!' });
        fetchCampaigns();
        fetchStats();
      } else {
        throw new Error(response.error?.message || 'Failed to send campaign');
      }
    } catch (err) {
      console.error('Failed to send campaign:', err);
      await showAlert({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to send campaign. Please try again.'
      });
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
        await showAlert({ title: 'Success', message: 'Campaign paused successfully!' });
        fetchCampaigns();
        fetchStats();
      } else {
        throw new Error((response as ApiResponse<Campaign>).error?.message || 'Failed to pause campaign');
      }
    } catch (err) {
      console.error('Failed to pause campaign:', err);
      await showAlert({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to pause campaign. Please try again.'
      });
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
        await showAlert({ title: 'Success', message: 'Campaign resumed successfully!' });
        fetchCampaigns();
        fetchStats();
      } else {
        throw new Error((response as ApiResponse<Campaign>).error?.message || 'Failed to resume campaign');
      }
    } catch (err) {
      console.error('Failed to resume campaign:', err);
      await showAlert({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to resume campaign. Please try again.'
      });
    } finally {
      setPausingResuming(null);
    }
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setEditForm({
      name: campaign.name,
      description: campaign.description,
      subject: campaign.subject,
      content: campaign.content,
      type: campaign.type,
      channel: campaign.channel,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCampaign) return;

    try {
      setSaving(true);
      const response = await apiClient.put<ApiResponse<Campaign>>(`/campaigns/${editingCampaign.id}`, editForm);

      if (response.success || ('id' in response)) {
        await showAlert({ title: 'Success', message: 'Campaign updated successfully!' });
        setShowEditModal(false);
        setEditingCampaign(null);
        setEditForm({});
        fetchCampaigns();
      } else {
        throw new Error((response as ApiResponse<Campaign>).error?.message || 'Failed to update campaign');
      }
    } catch (err) {
      console.error('Failed to update campaign:', err);
      await showAlert({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to update campaign. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PermissionGate
      permission={Permission.MARKETING_CAMPAIGNS_VIEW}
      fallback="styled"
      fallbackTitle="Marketing Campaigns Access Required"
      fallbackDescription="You don't have the required permissions to view marketing campaigns. Please contact your administrator to request access."
      loading={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
    >
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Marketing Campaigns"
          description="Create and manage email and SMS marketing campaigns"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Marketing' },
            { label: 'Campaigns' },
          ]}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { fetchCampaigns(); fetchStats(); }}
                disabled={loading}
                className="border-border hover:bg-muted"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="gradient"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          }
        />

        {/* Error Banner */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchCampaigns} className="ml-auto">
              Retry
            </Button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-primary">
              {stats.totalCampaigns}
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Send className="h-6 w-6 text-success" />
              </div>
            </div>
            <p className="text-3xl font-bold text-success">
              {formatNumber(stats.totalSent)}
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Avg Open Rate</p>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-primary">
              {stats.avgOpenRate.toFixed(1)}%
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
            </div>
            <p className="text-3xl font-bold text-warning">
              {formatCurrency(stats.totalRevenue)}
            </p>
          </div>
        </div>

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
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading campaigns...</span>
            </div>
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
                  onClick={() => setShowCreateModal(true)}
                  variant="gradient"
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
                <tbody className="divide-y divide-gray-200">
                  {campaigns.map((campaign) => {
                    const typeInfo = getCampaignTypeInfo(campaign.type);
                    const channelInfo = getChannelInfo(campaign.channel);
                    const TypeIcon = typeInfo.icon;
                    const ChannelIcon = channelInfo.icon;
                    const openRate = parseFloat(calculateOpenRate(campaign));
                    const clickRate = parseFloat(calculateClickRate(campaign));

                    return (
                    <tr key={campaign.id} className="hover:bg-muted/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0",
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
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r",
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
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border',
                            getStatusColor(campaign.status)
                          )}
                        >
                          {getStatusIcon(campaign.status)}
                          {campaign.status}
                        </span>
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
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCampaign(campaign)}
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

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border p-6">
              <h2 className="text-2xl font-bold text-foreground">Create New Campaign</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Create a new marketing campaign to engage your customers
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Campaign Name *
                </label>
                <Input
                  placeholder="Summer Sale Campaign"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="Describe your campaign..."
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Campaign Type
                  </label>
                  <Select
                    value={createForm.type}
                    onChange={(value) => setCreateForm({ ...createForm, type: value as CampaignType })}
                    options={campaignTypes.filter((t) => t.value !== '')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Channel
                  </label>
                  <Select
                    value={createForm.channel}
                    onChange={(value) => setCreateForm({ ...createForm, channel: value as CampaignChannel })}
                    options={channels.filter((c) => c.value !== '')}
                  />
                </div>
              </div>

              {/* Target Audience / Segment Selector */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  Target Audience
                </label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-white"
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
                {segments.length === 0 && !loadingSegments && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No segments available. Campaign will be sent to all customers.
                  </p>
                )}
              </div>

              {createForm.channel === 'EMAIL' && (
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Email Subject
                  </label>
                  <Input
                    placeholder="Don't miss out on our summer sale!"
                    value={createForm.subject}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, subject: e.target.value })
                    }
                  />
                </div>
              )}

              {/* Content Editor with Mode Toggle */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-foreground">
                    Message Content *
                  </label>
                  {createForm.channel === 'EMAIL' && (
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setContentMode('text')}
                        className={cn(
                          "px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1",
                          contentMode === 'text'
                            ? "bg-white text-foreground shadow-sm"
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
                            ? "bg-white text-foreground shadow-sm"
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
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={6}
                    placeholder="Your message content..."
                    value={createForm.content}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, content: e.target.value })
                    }
                  />
                ) : (
                  <div className="space-y-2">
                    <textarea
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm bg-muted"
                      rows={10}
                      placeholder="<html>
<body>
  <h1>Your Email Title</h1>
  <p>Your email content goes here...</p>
  <a href='{{unsubscribe_link}}'>Unsubscribe</a>
</body>
</html>"
                      value={createForm.htmlContent}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, htmlContent: e.target.value })
                      }
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Code className="w-3 h-3" />
                      <span>Available variables: {'{'}{'{'} customer_name {'}'}{'}'}, {'{'}{'{'} product_name {'}'}{'}'}, {'{'}{'{'} unsubscribe_link {'}'}{'}'}.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border p-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCampaign}
                disabled={creating}
                variant="gradient"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Campaign'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedCampaign(null)}
        >
          <div
            className="bg-card rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border p-6">
              <h2 className="text-2xl font-bold text-foreground">{selectedCampaign.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{selectedCampaign.description}</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">Type</label>
                  <p className="text-sm text-foreground">{selectedCampaign.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">
                    Channel
                  </label>
                  <p className="text-sm text-foreground">{selectedCampaign.channel}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">Status</label>
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border',
                      getStatusColor(selectedCampaign.status)
                    )}
                  >
                    {selectedCampaign.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">
                    Recipients
                  </label>
                  <p className="text-sm text-foreground">
                    {formatNumber(selectedCampaign.totalRecipients)}
                  </p>
                </div>
              </div>

              {selectedCampaign.status !== 'DRAFT' && selectedCampaign.delivered > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-foreground">Campaign Analytics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-violet-50 border border-primary/30 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {formatNumber(selectedCampaign.delivered)}
                      </p>
                      <p className="text-xs text-primary mt-1">Delivered</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-success/30 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-success-foreground">
                        {formatNumber(selectedCampaign.opened)}
                      </p>
                      <p className="text-xs text-success mt-1">
                        Opened ({calculateOpenRate(selectedCampaign)})
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-primary/30 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {formatNumber(selectedCampaign.clicked)}
                      </p>
                      <p className="text-xs text-primary mt-1">
                        Clicked ({calculateClickRate(selectedCampaign)})
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-warning/30 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-warning-foreground">
                        {formatNumber(selectedCampaign.converted)}
                      </p>
                      <p className="text-xs text-warning mt-1">
                        Converted ({calculateConversionRate(selectedCampaign)})
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted border border-primary/30 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-foreground">Total Revenue</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(selectedCampaign.revenue)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedCampaign.subject && (
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">Subject</label>
                  <p className="text-sm text-foreground bg-muted p-3 rounded border border-border">
                    {selectedCampaign.subject}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-foreground mb-1">Content</label>
                <div className="bg-muted p-4 rounded border border-border">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {selectedCampaign.content}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border p-6 flex justify-end gap-3">
              {(selectedCampaign.status === 'DRAFT' || selectedCampaign.status === 'PAUSED') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleEditCampaign(selectedCampaign);
                    setSelectedCampaign(null);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Campaign
                </Button>
              )}
              <Button variant="gradient" onClick={() => setSelectedCampaign(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {showEditModal && editingCampaign && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
          onClick={() => {
            setShowEditModal(false);
            setEditingCampaign(null);
          }}
        >
          <div
            className="bg-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border p-6">
              <h2 className="text-2xl font-bold text-foreground">Edit Campaign</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Update the details of your marketing campaign
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Campaign Name *
                </label>
                <Input
                  placeholder="Campaign name"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="Describe your campaign..."
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Campaign Type
                  </label>
                  <Select
                    value={editForm.type || editingCampaign.type}
                    onChange={(value) => setEditForm({ ...editForm, type: value as CampaignType })}
                    options={campaignTypes.filter((t) => t.value !== '')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Channel
                  </label>
                  <Select
                    value={editForm.channel || editingCampaign.channel}
                    onChange={(value) => setEditForm({ ...editForm, channel: value as CampaignChannel })}
                    options={channels.filter((c) => c.value !== '')}
                  />
                </div>
              </div>

              {(editForm.channel === 'EMAIL' || editingCampaign.channel === 'EMAIL') && (
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Email Subject
                  </label>
                  <Input
                    placeholder="Email subject line"
                    value={editForm.subject || ''}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Message Content *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={6}
                  placeholder="Your message content..."
                  value={editForm.content || ''}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t border-border p-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCampaign(null);
                  setEditForm({});
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={saving || !editForm.name}
                variant="gradient"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGate>
  );
}
