'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CreditCard,
  User,
  Mail,
  MessageSquare,
  Clock,
  Calendar,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { PageHeader } from '@/components/PageHeader';
import { PageLoading } from '@/components/common';
import { cn } from '@/lib/utils';
import { useTenantCurrency } from '@/hooks/useTenantCurrency';
import { apiClient } from '@/lib/api/client';
import type { GiftCard } from '@/lib/api/types';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

export default function GiftCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currency } = useTenantCurrency();
  const id = params.id as string;

  const [giftCard, setGiftCard] = useState<GiftCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }, [currency]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
      ACTIVE: { class: 'bg-success-muted text-success-foreground border-success/30', variant: 'success' },
      REDEEMED: { class: 'bg-primary/20 text-primary border-primary/30', variant: 'info' },
      EXPIRED: { class: 'bg-error-muted text-error border-error/30', variant: 'warning' },
      CANCELLED: { class: 'bg-muted text-foreground border-border', variant: 'default' },
    };
    return config[status] || config.ACTIVE;
  };

  const getBalancePercentage = (current: number, initial: number) => {
    if (initial === 0) return 0;
    return Math.round((current / initial) * 100);
  };

  const getBalanceColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-success';
    if (percentage >= 50) return 'bg-warning';
    if (percentage >= 25) return 'bg-warning';
    return 'bg-error';
  };

  const fetchGiftCard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<ApiResponse<GiftCard>>(`/gift-cards/${id}`);

      if (response.success && response.data) {
        setGiftCard(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch gift card');
      }
    } catch (err) {
      console.error('Failed to fetch gift card:', err);
      setError(err instanceof Error ? err.message : 'Failed to load gift card');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchGiftCard();
    }
  }, [id, fetchGiftCard]);

  if (loading) {
    return <PageLoading fullScreen />;
  }

  if (error || !giftCard) {
    return (
      <PermissionGate
        permission={Permission.GIFT_CARDS_READ}
        fallback="styled"
        fallbackTitle="Gift Cards Access Required"
        fallbackDescription="You don't have the required permissions to view gift cards."
        loading={<PageLoading fullScreen />}
      >
        <div className="min-h-screen bg-background">
          <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
              title="Gift Card"
              breadcrumbs={[
                { label: 'Home', href: '/' },
                { label: 'Marketing', href: '/campaigns' },
                { label: 'Gift Cards', href: '/gift-cards' },
                { label: 'Not Found' },
              ]}
            />
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-error-muted flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Gift Card Not Found</h3>
              <p className="text-muted-foreground mb-6">
                {error || 'The gift card you are looking for does not exist or has been removed.'}
              </p>
              <Button onClick={() => router.push('/gift-cards')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Gift Cards
              </Button>
            </div>
          </div>
        </div>
      </PermissionGate>
    );
  }

  const balancePercentage = getBalancePercentage(giftCard.currentBalance, giftCard.initialBalance);
  const statusBadge = getStatusBadge(giftCard.status);

  return (
    <PermissionGate
      permission={Permission.GIFT_CARDS_READ}
      fallback="styled"
      fallbackTitle="Gift Cards Access Required"
      fallbackDescription="You don't have the required permissions to view gift cards."
      loading={<PageLoading fullScreen />}
    >
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title={giftCard.code}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Marketing', href: '/campaigns' },
              { label: 'Gift Cards', href: '/gift-cards' },
              { label: giftCard.code },
            ]}
            badge={{
              label: giftCard.status,
              variant: statusBadge.variant,
            }}
            actions={
              <Button
                variant="outline"
                onClick={() => router.push('/gift-cards')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Gift Cards
              </Button>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card Information */}
              <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="p-6 border-b border-border bg-muted">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Card Information
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  {/* Gift Card Code */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Gift Card Code</p>
                    <div className="flex items-center gap-3">
                      <code className="text-2xl font-mono font-bold text-foreground tracking-wider">
                        {giftCard.code}
                      </code>
                    </div>
                  </div>

                  {/* Balance Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Initial Balance</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(giftCard.initialBalance)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Current Balance</p>
                      <p className={cn(
                        "text-lg font-bold",
                        balancePercentage >= 50 ? "text-success" : balancePercentage >= 25 ? "text-warning" : "text-error"
                      )}>
                        {formatCurrency(giftCard.currentBalance)}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Currency</p>
                      <p className="text-lg font-bold text-foreground">{giftCard.currencyCode}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Usage Count</p>
                      <p className="text-lg font-bold text-foreground">{giftCard.usageCount}</p>
                    </div>
                  </div>

                  {/* Balance Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">Balance Usage</p>
                      <p className="text-sm font-semibold text-foreground">{balancePercentage}% remaining</p>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", getBalanceColor(balancePercentage))}
                        style={{ width: `${balancePercentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(giftCard.initialBalance - giftCard.currentBalance)} used
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(giftCard.initialBalance)} total
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipient & Sender */}
              <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="p-6 border-b border-border bg-muted">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Recipient & Sender
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recipient */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Recipient</h4>
                      {giftCard.recipientName || giftCard.recipientEmail ? (
                        <div className="space-y-2">
                          {giftCard.recipientName && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">{giftCard.recipientName}</span>
                            </div>
                          )}
                          {giftCard.recipientEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">{giftCard.recipientEmail}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No recipient specified</p>
                      )}
                    </div>

                    {/* Sender */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Sender</h4>
                      {giftCard.senderName ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{giftCard.senderName}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No sender specified</p>
                      )}
                    </div>
                  </div>

                  {/* Personal Message */}
                  {giftCard.message && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        Personal Message
                      </h4>
                      <div className="bg-muted/50 rounded-lg p-4 border border-border">
                        <p className="text-sm text-foreground italic">&ldquo;{giftCard.message}&rdquo;</p>
                      </div>
                    </div>
                  )}
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
                    <p className="text-sm font-medium text-muted-foreground mb-2">Card Status</p>
                    <span className={cn(
                      'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border',
                      statusBadge.class
                    )}>
                      {giftCard.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Currency</p>
                    <p className="text-sm font-semibold text-foreground">{giftCard.currencyCode}</p>
                  </div>
                </div>
              </div>

              {/* Expiration Card */}
              <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="p-6 border-b border-border bg-muted">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Expiration
                  </h3>
                </div>
                <div className="p-6">
                  {giftCard.expiresAt ? (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Expires On</p>
                      <p className="text-sm font-semibold text-foreground">{formatDate(giftCard.expiresAt)}</p>
                      {(() => {
                        const days = Math.ceil((new Date(giftCard.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        if (days < 0) {
                          return <p className="text-xs text-error mt-1 font-medium">Expired</p>;
                        } else if (days <= 30) {
                          return <p className="text-xs text-warning mt-1 font-medium">{days} days remaining</p>;
                        }
                        return <p className="text-xs text-muted-foreground mt-1">{days} days remaining</p>;
                      })()}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-success-muted flex items-center justify-center">
                        <Shield className="h-4 w-4 text-success" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Never expires</p>
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
                    <p className="text-sm text-foreground">{formatDateTime(giftCard.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Last Updated</p>
                    <p className="text-sm text-foreground">{formatDateTime(giftCard.updatedAt)}</p>
                  </div>
                  {giftCard.lastUsedAt && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Last Used</p>
                      <p className="text-sm text-foreground">{formatDateTime(giftCard.lastUsedAt)}</p>
                    </div>
                  )}
                  {giftCard.purchaseDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Purchase Date</p>
                      <p className="text-sm text-foreground">{formatDateTime(giftCard.purchaseDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
