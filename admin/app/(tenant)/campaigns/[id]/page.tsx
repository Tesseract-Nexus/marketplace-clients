'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Megaphone,
  ShoppingCart,
  UserPlus,
  Heart,
  Rocket,
  Newspaper,
  Users,
  TrendingUp,
  Clock,
  Calendar,
  Shield,
  AlertCircle,
  Send,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { PageHeader } from '@/components/PageHeader';
import { PageLoading } from '@/components/common';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import type { Campaign } from '@/lib/api/types';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { class: string; variant: 'success' | 'default' | 'warning' | 'info' }> = {
      DRAFT: { class: 'bg-muted text-foreground border-border', variant: 'default' },
      SCHEDULED: { class: 'bg-primary/20 text-primary border-primary/30', variant: 'info' },
      SENDING: { class: 'bg-primary/10 text-primary border-primary/30', variant: 'info' },
      SENT: { class: 'bg-success-muted text-success-foreground border-success/30', variant: 'success' },
      COMPLETED: { class: 'bg-success/10 text-success border-success/30', variant: 'success' },
      PAUSED: { class: 'bg-warning-muted text-warning border-warning/30', variant: 'warning' },
      CANCELLED: { class: 'bg-error-muted text-error border-error/30', variant: 'warning' },
    };
    return config[status] || config.DRAFT;
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'PROMOTION': return Megaphone;
      case 'ABANDONED_CART': return ShoppingCart;
      case 'WELCOME': return UserPlus;
      case 'WINBACK': return Heart;
      case 'PRODUCT_LAUNCH': return Rocket;
      case 'NEWSLETTER': return Newspaper;
      default: return Megaphone;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL': return Mail;
      case 'SMS': return MessageSquare;
      default: return Mail;
    }
  };

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return '0%';
    return ((numerator / denominator) * 100).toFixed(1) + '%';
  };

  const fetchCampaign = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<ApiResponse<Campaign> | Campaign>(`/campaigns/${id}`);

      if ('success' in response && response.data) {
        setCampaign(response.data);
      } else if ('id' in response) {
        setCampaign(response as Campaign);
      } else {
        throw new Error((response as ApiResponse<Campaign>).error?.message || 'Failed to fetch campaign');
      }
    } catch (err) {
      console.error('Failed to fetch campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchCampaign();
    }
  }, [id, fetchCampaign]);

  if (loading) {
    return <PageLoading fullScreen />;
  }

  if (error || !campaign) {
    return (
      <PermissionGate
        permission={Permission.MARKETING_CAMPAIGNS_VIEW}
        fallback="styled"
        fallbackTitle="Marketing Campaigns Access Required"
        fallbackDescription="You don't have the required permissions to view campaigns."
        loading={<PageLoading fullScreen />}
      >
        <div className="min-h-screen bg-background">
          <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
              title="Campaign"
              breadcrumbs={[
                { label: 'Home', href: '/' },
                { label: 'Marketing', href: '/campaigns' },
                { label: 'Campaigns', href: '/campaigns' },
                { label: 'Not Found' },
              ]}
            />
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-error-muted flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Campaign Not Found</h3>
              <p className="text-muted-foreground mb-6">
                {error || 'The campaign you are looking for does not exist or has been removed.'}
              </p>
              <Button onClick={() => router.push('/campaigns')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
            </div>
          </div>
        </div>
      </PermissionGate>
    );
  }

  const statusBadge = getStatusBadge(campaign.status);
  const TypeIcon = getCampaignTypeIcon(campaign.type);
  const ChannelIcon = getChannelIcon(campaign.channel);
  const hasSentData = campaign.status !== 'DRAFT' && campaign.delivered > 0;

  return (
    <PermissionGate
      permission={Permission.MARKETING_CAMPAIGNS_VIEW}
      fallback="styled"
      fallbackTitle="Marketing Campaigns Access Required"
      fallbackDescription="You don't have the required permissions to view campaigns."
      loading={<PageLoading fullScreen />}
    >
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title={campaign.name}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Marketing', href: '/campaigns' },
              { label: 'Campaigns', href: '/campaigns' },
              { label: campaign.name },
            ]}
            badge={{
              label: campaign.status,
              variant: statusBadge.variant,
            }}
            actions={
              <Button
                variant="outline"
                onClick={() => router.push('/campaigns')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Campaign Information */}
              <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="p-6 border-b border-border bg-muted">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary" />
                    Campaign Information
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  {campaign.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                      <p className="text-sm text-foreground">{campaign.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Type</p>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-primary" />
                        <p className="text-sm font-bold text-foreground">{campaign.type.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Channel</p>
                      <div className="flex items-center gap-2">
                        <ChannelIcon className="h-4 w-4 text-primary" />
                        <p className="text-sm font-bold text-foreground">{campaign.channel}</p>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Recipients</p>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <p className="text-sm font-bold text-foreground">{formatNumber(campaign.totalRecipients)}</p>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Revenue</p>
                      <p className={cn(
                        "text-sm font-bold",
                        campaign.revenue > 0 ? "text-success" : "text-foreground"
                      )}>
                        {formatCurrency(campaign.revenue)}
                      </p>
                    </div>
                  </div>

                  {campaign.subject && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Email Subject</p>
                      <div className="bg-muted/50 rounded-lg p-3 border border-border">
                        <p className="text-sm font-semibold text-foreground">{campaign.subject}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Analytics */}
              {hasSentData && (
                <div className="bg-card rounded-lg border border-border shadow-sm">
                  <div className="p-6 border-b border-border bg-muted">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Performance Analytics
                    </h3>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-primary/5 border border-primary/30 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-primary">{formatNumber(campaign.delivered)}</p>
                        <p className="text-xs text-primary mt-1 font-medium">Delivered</p>
                      </div>
                      <div className="bg-success/5 border border-success/30 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-success">{formatNumber(campaign.opened)}</p>
                        <p className="text-xs text-success mt-1 font-medium">
                          Opened ({calculateRate(campaign.opened, campaign.delivered)})
                        </p>
                      </div>
                      <div className="bg-primary/5 border border-primary/30 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-primary">{formatNumber(campaign.clicked)}</p>
                        <p className="text-xs text-primary mt-1 font-medium">
                          Clicked ({calculateRate(campaign.clicked, campaign.opened)})
                        </p>
                      </div>
                      <div className="bg-warning/5 border border-warning/30 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-warning">{formatNumber(campaign.converted)}</p>
                        <p className="text-xs text-warning mt-1 font-medium">
                          Converted ({calculateRate(campaign.converted, campaign.clicked)})
                        </p>
                      </div>
                    </div>

                    {/* Revenue highlight */}
                    <div className="bg-muted/50 border border-border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-foreground">Total Revenue</span>
                        <span className={cn(
                          "text-2xl font-bold",
                          campaign.revenue > 0 ? "text-success" : "text-muted-foreground"
                        )}>
                          {formatCurrency(campaign.revenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="p-6 border-b border-border bg-muted">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Content
                  </h3>
                </div>
                <div className="p-6">
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{campaign.content}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Right 1/3 */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="p-6 border-b border-border bg-muted">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Status
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Campaign Status</p>
                    <span className={cn(
                      'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border',
                      statusBadge.class
                    )}>
                      {campaign.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Type</p>
                    <p className="text-sm font-semibold text-foreground">{campaign.type.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Channel</p>
                    <p className="text-sm font-semibold text-foreground">{campaign.channel}</p>
                  </div>
                </div>
              </div>

              {/* Schedule Card */}
              <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="p-6 border-b border-border bg-muted">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Schedule
                  </h3>
                </div>
                <div className="p-6">
                  {campaign.scheduledAt ? (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Scheduled For</p>
                      <p className="text-sm font-semibold text-foreground">{formatDateTime(campaign.scheduledAt)}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Send className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.status === 'SENT' || campaign.status === 'COMPLETED' ? 'Sent immediately' : 'Not scheduled'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Card */}
              <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="p-6 border-b border-border bg-muted">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Activity
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Created</p>
                    <p className="text-sm text-foreground">{formatDateTime(campaign.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Last Updated</p>
                    <p className="text-sm text-foreground">{formatDateTime(campaign.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
