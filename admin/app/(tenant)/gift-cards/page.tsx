'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Gift,
  Plus,
  Eye,
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  RefreshCw,
  Loader2,
  AlertCircle,
  Timer,
  Sparkles,
  User,
  Mail,
  MessageSquare,
  Clock,
  X,
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
import { useTenantCurrency } from '@/hooks/useTenantCurrency';
import { apiClient } from '@/lib/api/client';
import type { GiftCard, GiftCardStats, CreateGiftCardRequest } from '@/lib/api/types';

// API Response wrapper type
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

// Gift card list response can have different formats
interface GiftCardListResponse {
  giftCards?: GiftCard[];
  data?: GiftCard[];
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'REDEEMED', label: 'Redeemed' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const DEFAULT_STATS: GiftCardStats = {
  totalCards: 0,
  activeCards: 0,
  redeemedCards: 0,
  expiredCards: 0,
  totalValue: 0,
  redeemedValue: 0,
  remainingValue: 0,
  averageBalance: 0,
  redemptionRate: 0,
};

export default function GiftCardsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert, showConfirm } = useDialog();
  const toast = useToast();
  const { currency } = useTenantCurrency();

  // Data state
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [stats, setStats] = useState<GiftCardStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Inline form state
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [createForm, setCreateForm] = useState({
    initialBalance: '',
    recipientEmail: '',
    recipientName: '',
    senderName: '',
    message: '',
    expiresInDays: '365',
  });

  // Fetch gift cards
  const fetchGiftCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (searchQuery) params.append('search', searchQuery);

      const queryString = params.toString();
      const url = queryString ? `/gift-cards?${queryString}` : '/gift-cards';

      const response = await apiClient.get<ApiResponse<GiftCard[] | GiftCardListResponse>>(url);

      if (response.success && response.data) {
        const data = response.data;
        const cardData = Array.isArray(data)
          ? data
          : ((data as GiftCardListResponse).giftCards || (data as GiftCardListResponse).data || []);
        setGiftCards(cardData);
      } else {
        setGiftCards([]);
      }
    } catch (err) {
      console.error('Failed to fetch gift cards:', err);
      setError('Failed to load gift cards. Please try again.');
      setGiftCards([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get<ApiResponse<GiftCardStats>>('/gift-cards/stats');
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch gift card stats:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchGiftCards();
    fetchStats();
  }, [fetchGiftCards, fetchStats]);

  // Refetch on filter changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchGiftCards();
    }, 300);
    return () => clearTimeout(debounce);
  }, [filterStatus, searchQuery, fetchGiftCards]);

  // Deep-link: redirect to detail page when ?id= is present
  useEffect(() => {
    const giftCardId = searchParams.get('id');
    if (giftCardId) {
      router.replace(`/gift-cards/${giftCardId}`);
    }
  }, [searchParams, router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getGiftCardStatusType = (status: string): StatusType => {
    const mapping: Record<string, StatusType> = {
      ACTIVE: 'success',
      REDEEMED: 'info',
      EXPIRED: 'error',
      CANCELLED: 'neutral',
    };
    return mapping[status] || 'neutral';
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

  const getDaysUntilExpiry = (expiresAt: string | undefined) => {
    if (!expiresAt) return null;
    const end = new Date(expiresAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getExpiryBadge = (expiresAt: string | undefined) => {
    const days = getDaysUntilExpiry(expiresAt);
    if (days === null) return null;

    if (days < 0) {
      return { text: 'Expired', color: 'text-error bg-error-muted', urgent: true };
    } else if (days === 0) {
      return { text: 'Expires today', color: 'text-error bg-error-muted', urgent: true };
    } else if (days <= 7) {
      return { text: `${days} days left`, color: 'text-warning bg-warning-muted', urgent: true };
    } else if (days <= 30) {
      return { text: `${days} days left`, color: 'text-warning bg-warning-muted', urgent: false };
    }
    return null;
  };

  const resetForm = () => {
    setCreateForm({
      initialBalance: '',
      recipientEmail: '',
      recipientName: '',
      senderName: '',
      message: '',
      expiresInDays: '365',
    });
  };

  const handleOpenCreateForm = () => {
    resetForm();
    setShowInlineForm(true);
  };

  const handleCloseForm = () => {
    setShowInlineForm(false);
    resetForm();
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createForm.initialBalance || parseFloat(createForm.initialBalance) <= 0) {
      toast.error('Validation Error', 'Please enter a valid amount.');
      return;
    }

    try {
      setCreating(true);

      const payload: CreateGiftCardRequest = {
        initialBalance: parseFloat(createForm.initialBalance),
        currencyCode: currency,
        recipientEmail: createForm.recipientEmail || undefined,
        recipientName: createForm.recipientName || undefined,
        senderName: createForm.senderName || undefined,
        message: createForm.message || undefined,
        expiresInDays: createForm.expiresInDays ? parseInt(createForm.expiresInDays) : undefined,
      };

      const response = await apiClient.post<ApiResponse<GiftCard>>('/gift-cards', payload);

      if (response.success) {
        toast.success('Gift Card Created', 'Gift card created successfully!');
        handleCloseForm();
        fetchGiftCards();
        fetchStats();
      } else {
        throw new Error(response.error?.message || 'Failed to create gift card');
      }
    } catch (err) {
      console.error('Failed to create gift card:', err);
      toast.error('Creation Failed', err instanceof Error ? err.message : 'Failed to create gift card. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Sidebar configuration for DataPageLayout
  const sidebarConfig = React.useMemo(() => {
    const healthWidget: HealthWidgetConfig = {
      label: 'Gift Card Health',
      currentValue: stats.activeCards,
      totalValue: stats.totalCards || 1,
      status: stats.activeCards > 0 ? 'healthy' : stats.expiredCards > 0 ? 'attention' : 'normal',
      segments: [
        { value: stats.activeCards, color: 'success' },
        { value: stats.redeemedCards, color: 'primary' },
        { value: stats.expiredCards, color: 'error' },
      ],
    };

    const sections: SidebarSection[] = [
      {
        title: 'Card Status',
        items: [
          {
            id: 'total',
            label: 'Total Cards',
            value: stats.totalCards,
            icon: Gift,
            color: 'muted',
            onClick: () => setFilterStatus(''),
            isActive: filterStatus === '',
          },
          {
            id: 'active',
            label: 'Active',
            value: stats.activeCards,
            icon: CreditCard,
            color: 'success',
            onClick: () => setFilterStatus('ACTIVE'),
            isActive: filterStatus === 'ACTIVE',
          },
          {
            id: 'redeemed',
            label: 'Redeemed',
            value: stats.redeemedCards,
            icon: TrendingUp,
            color: 'primary',
            onClick: () => setFilterStatus('REDEEMED'),
            isActive: filterStatus === 'REDEEMED',
          },
          {
            id: 'expired',
            label: 'Expired',
            value: stats.expiredCards,
            icon: Clock,
            color: 'error',
            onClick: () => setFilterStatus('EXPIRED'),
            isActive: filterStatus === 'EXPIRED',
          },
        ],
      },
      {
        title: 'Value',
        items: [
          {
            id: 'totalValue',
            label: 'Total Value',
            value: formatCurrency(stats.totalValue),
            icon: DollarSign,
            color: 'primary',
          },
          {
            id: 'remaining',
            label: 'Remaining',
            value: formatCurrency(stats.remainingValue),
            icon: DollarSign,
            color: 'success',
          },
          {
            id: 'redeemed',
            label: 'Redeemed',
            value: formatCurrency(stats.redeemedValue),
            icon: TrendingUp,
            color: 'warning',
          },
        ],
      },
    ];

    return { healthWidget, sections };
  }, [stats, filterStatus, formatCurrency]);

  // Mobile stats for DataPageLayout
  const mobileStats: SidebarStatItem[] = React.useMemo(() => [
    {
      id: 'total',
      label: 'Total',
      value: stats.totalCards,
      icon: Gift,
      color: 'default',
      onClick: () => setFilterStatus(''),
    },
    {
      id: 'active',
      label: 'Active',
      value: stats.activeCards,
      icon: CreditCard,
      color: 'success',
    },
    {
      id: 'redeemed',
      label: 'Redeemed',
      value: stats.redeemedCards,
      icon: TrendingUp,
      color: 'primary',
    },
    {
      id: 'value',
      label: 'Remaining',
      value: formatCurrency(stats.remainingValue),
      icon: DollarSign,
      color: 'success',
    },
  ], [stats, formatCurrency]);

  return (
    <PermissionGate
      permission={Permission.GIFT_CARDS_READ}
      fallback="styled"
      fallbackTitle="Gift Cards Access Required"
      fallbackDescription="You don't have the required permissions to manage gift cards. Please contact your administrator to request access."
      loading={<PageLoading fullScreen />}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Gift Cards"
          description="Create and manage gift cards for your store"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Marketing', href: '/campaigns' },
            { label: 'Gift Cards' },
          ]}
          actions={
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => { fetchGiftCards(); fetchStats(); }} disabled={loading} className="p-2.5 rounded-md bg-muted hover:bg-muted transition-all" title="Refresh">
                <RefreshCw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin")} />
              </Button>
              <Button
                onClick={handleOpenCreateForm}
                className="bg-primary text-primary-foreground"
                disabled={showInlineForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Gift Card
              </Button>
            </div>
          }
        />

        {/* Error Banner */}
        <PageError error={error} onRetry={fetchGiftCards} onDismiss={() => setError(null)} />

        {/* Inline Form */}
        {showInlineForm && (
          <div className="bg-card rounded-lg border border-border shadow-sm animate-in slide-in-from-top duration-300">
            <div className="border-b border-border p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Create Gift Card</h2>
                <p className="text-sm text-muted-foreground">Create a new gift card with a unique code</p>
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

            <form onSubmit={handleCreateCard} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Amount *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={createForm.initialBalance}
                    onChange={(e) => setCreateForm({ ...createForm, initialBalance: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Expires In (Days)
                  </label>
                  <Input
                    type="number"
                    value={createForm.expiresInDays}
                    onChange={(e) => setCreateForm({ ...createForm, expiresInDays: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Recipient Name
                  </label>
                  <Input
                    value={createForm.recipientName}
                    onChange={(e) => setCreateForm({ ...createForm, recipientName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Recipient Email
                  </label>
                  <Input
                    type="email"
                    value={createForm.recipientEmail}
                    onChange={(e) => setCreateForm({ ...createForm, recipientEmail: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Sender Name
                </label>
                <Input
                  value={createForm.senderName}
                  onChange={(e) => setCreateForm({ ...createForm, senderName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Message</label>
                <textarea
                  className="w-full min-h-[80px] px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                  value={createForm.message}
                  onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                  placeholder="Optional gift message..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseForm}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-primary text-primary-foreground"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Gift Card'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        <DataPageLayout sidebar={sidebarConfig} mobileStats={mobileStats}>
        <div className="space-y-6">
        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Search</label>
              <Input
                placeholder="Search by code, recipient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <Select value={filterStatus} onChange={setFilterStatus} options={statusOptions} />
            </div>
          </div>
        </div>

        {/* Gift Cards Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted">
            <h3 className="text-lg font-bold text-foreground">Gift Cards</h3>
            <p className="text-sm text-muted-foreground">Manage all gift cards</p>
          </div>

          {loading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : giftCards.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Gift className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {searchQuery || filterStatus
                  ? 'No gift cards match your filters'
                  : 'No gift cards yet'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery || filterStatus
                  ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                  : 'Create gift cards to give your customers the perfect gift option. Great for holidays and special occasions!'}
              </p>
              {!(searchQuery || filterStatus) && (
                <Button
                  onClick={handleOpenCreateForm}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={showInlineForm}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Your First Gift Card
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                      Initial Balance
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                      Current Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {giftCards.map((card) => {
                    const balancePercentage = getBalancePercentage(card.currentBalance, card.initialBalance);
                    const expiryBadge = getExpiryBadge(card.expiresAt);

                    return (
                    <tr key={card.id} className="hover:bg-muted/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Mini gift card visual */}
                          <div className="w-14 h-9 rounded-md bg-primary shadow-sm flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/10" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 30%, 0 60%)' }} />
                            <Gift className="h-4 w-4 text-primary-foreground/80" />
                          </div>
                          <div>
                            <code className="font-mono text-sm font-bold text-foreground">{card.code}</code>
                            {expiryBadge && (
                              <div className={cn(
                                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ml-2",
                                expiryBadge.color
                              )}>
                                <Timer className="h-2.5 w-2.5" />
                                {expiryBadge.text}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(card.recipientName || card.recipientEmail) ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              {card.recipientName && (
                                <p className="font-semibold text-foreground text-sm">{card.recipientName}</p>
                              )}
                              {card.recipientEmail && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {card.recipientEmail}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No recipient</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-muted-foreground text-sm">
                        {formatCurrency(card.initialBalance)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-right">
                          <span className={cn(
                            "font-bold text-lg",
                            balancePercentage >= 50 ? "text-success" : balancePercentage >= 25 ? "text-warning" : "text-error"
                          )}>
                            {formatCurrency(card.currentBalance)}
                          </span>
                          <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden ml-auto mt-1">
                            <div
                              className={cn("h-full rounded-full transition-all", getBalanceColor(balancePercentage))}
                              style={{ width: `${balancePercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={getGiftCardStatusType(card.status)}>
                          {card.status}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4">
                        {card.expiresAt ? (
                          <div className="flex items-center gap-1.5 text-sm text-foreground">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(card.expiresAt)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Never expires</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
                          card.usageCount > 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {card.usageCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/gift-cards/${card.id}`)}
                          className="h-8 px-3 hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
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
