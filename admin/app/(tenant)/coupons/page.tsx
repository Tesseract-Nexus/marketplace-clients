'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Select } from '@/components/Select';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { couponService } from '@/lib/services/couponService';
import {
  Coupon,
  CouponStatus,
  DiscountType,
} from '@/lib/api/types';
import {
  Ticket,
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Percent,
  DollarSign,
  Filter,
  RefreshCw,
  X,
  Tag,
  Timer,
  Sparkles,
  Truck,
  Gift,
  CalendarClock,
  Loader2,
  Home,
  FileEdit,
  Pause,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';

export default function CouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CouponStatus>('ALL');
  const [discountTypeFilter, setDiscountTypeFilter] = useState<'ALL' | DiscountType>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await couponService.getCoupons();
      setCoupons(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupons');
      console.error('Error loading coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coupon.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || coupon.status === statusFilter;
    const matchesDiscountType = discountTypeFilter === 'ALL' || coupon.discountType === discountTypeFilter;
    return matchesSearch && matchesStatus && matchesDiscountType;
  });

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDeleteCoupon = (id: string) => {
    const coupon = coupons.find(c => c.id === id);
    setModalConfig({
      isOpen: true,
      title: 'Delete Coupon',
      message: `Are you sure you want to delete "${coupon?.code}"? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await couponService.deleteCoupon(id);
          await loadCoupons();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to delete coupon');
        }
      },
    });
  };

  const handleDuplicateCoupon = async (id: string) => {
    try {
      await couponService.duplicateCoupon(id);
      await loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate coupon');
    }
  };

  const getCouponStatusType = (status: CouponStatus): StatusType => {
    const mapping: Record<CouponStatus, StatusType> = {
      DRAFT: 'neutral',
      ACTIVE: 'success',
      INACTIVE: 'warning',
      EXPIRED: 'error',
      DEPLETED: 'error',
    };
    return mapping[status] || 'neutral';
  };

  const getStatusBadge = (status: CouponStatus) => {
    return (
      <StatusBadge status={getCouponStatusType(status)} showIcon={false}>
        {status}
      </StatusBadge>
    );
  };

  const getDiscountIcon = (type: DiscountType) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Percent className="w-5 h-5" />;
      case 'FIXED_AMOUNT':
        return <DollarSign className="w-5 h-5" />;
      case 'FREE_SHIPPING':
        return <Truck className="w-5 h-5" />;
      case 'BUY_X_GET_Y':
        return <Gift className="w-5 h-5" />;
      default:
        return <Tag className="w-5 h-5" />;
    }
  };

  const getDaysUntilExpiry = (endDate: string | undefined): number | null => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getExpiryInfo = (endDate: string | undefined) => {
    const days = getDaysUntilExpiry(endDate);
    if (days === null) return null;

    if (days < 0) {
      return { text: 'Expired', color: 'text-destructive bg-destructive/10', urgent: true };
    } else if (days === 0) {
      return { text: 'Expires today!', color: 'text-destructive bg-destructive/10', urgent: true };
    } else if (days === 1) {
      return { text: 'Expires tomorrow', color: 'text-warning bg-warning-muted', urgent: true };
    } else if (days <= 7) {
      return { text: `${days} days left`, color: 'text-warning bg-warning-muted', urgent: true };
    } else if (days <= 30) {
      return { text: `${days} days left`, color: 'text-primary bg-primary/10', urgent: false };
    }
    return null;
  };

  const getUsagePercentage = (current: number, limit: number | undefined): number => {
    if (!limit) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-destructive/100';
    if (percentage >= 75) return 'bg-warning';
    if (percentage >= 50) return 'bg-warning';
    return 'bg-success';
  };

  const stats = [
    {
      label: "Total Coupons",
      value: coupons.length,
      icon: Ticket,
      textColor: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      label: "Active",
      value: coupons.filter(c => c.status === 'ACTIVE').length,
      icon: CheckCircle,
      textColor: "text-success",
      bgColor: "bg-success/10"
    },
    {
      label: "Expired",
      value: coupons.filter(c => c.status === 'EXPIRED').length,
      icon: XCircle,
      textColor: "text-destructive",
      bgColor: "bg-destructive/10"
    },
    {
      label: "Total Uses",
      value: coupons.reduce((sum, c) => sum + c.currentUsageCount, 0),
      icon: TrendingUp,
      textColor: "text-primary",
      bgColor: "bg-primary/10"
    }
  ];

  return (
    <PermissionGate
      permission={Permission.MARKETING_COUPONS_VIEW}
      fallback="styled"
      fallbackTitle="Coupons Access Required"
      fallbackDescription="You don't have the required permissions to view coupons. Please contact your administrator to request access."
      loading={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/', icon: Home },
            { label: 'Coupons', icon: Ticket },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">
                Coupons Management
              </h1>
            </div>
            <p className="text-muted-foreground">Create and manage discount coupons</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={loadCoupons}
              disabled={loading}
              variant="outline"
              className="px-4 py-2 rounded-xl bg-white hover:bg-muted transition-all disabled:opacity-50 border-2 border-border text-foreground"
              aria-label="Refresh coupons list"
            >
              <RefreshCw className={cn("w-5 h-5 text-foreground", loading && "animate-spin")} aria-hidden="true" />
            </Button>
            <Button
              onClick={() => router.push('/coupons/new')}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Coupon
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-destructive/10 border-2 border-destructive/30 rounded-xl p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">Error</h3>
              <p className="text-destructive text-sm mt-1">{error}</p>
            </div>
            <Button onClick={() => setError(null)} variant="ghost" className="p-1 rounded-lg hover:bg-destructive/10" aria-label="Dismiss error message">
              <X className="w-4 h-4 text-destructive" aria-hidden="true" />
            </Button>
          </div>
        )}

        {/* Stats */}
        {!loading && coupons.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="rounded-2xl border-border/50 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:border-primary/50/50 transition-all duration-300 group">
                  <CardContent className="p-6 pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <p className={`text-3xl font-bold ${stat.textColor} mt-2`}>
                          {stat.value}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.bgColor} border border-border group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Search and Filters */}
        {!loading && (
          <Card className="rounded-2xl border-border/50 bg-white/80 backdrop-blur-sm shadow-lg transition-all duration-300 relative z-30 overflow-visible">
            <CardContent className="p-6 pt-6 overflow-visible">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by code or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    />
                  </div>
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "px-4 py-3 rounded-xl transition-all flex items-center gap-2",
                      showFilters
                        ? "bg-primary/20 text-primary border-2 border-primary/50"
                        : "bg-muted text-foreground border-2 border-border hover:bg-muted"
                    )}
                  >
                    <Filter className="w-5 h-5" />
                    Filters
                  </Button>
                </div>

                {showFilters && (
                  <div className="flex flex-wrap gap-4 p-5 bg-card rounded-xl border-2 border-border relative z-50 overflow-visible">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-xs font-bold text-foreground mb-2 block">Status</label>
                      <Select
                        value={statusFilter}
                        onChange={(value) => setStatusFilter(value as any)}
                        options={[
                          { value: 'ALL', label: 'All Status' },
                          { value: 'DRAFT', label: 'Draft' },
                          { value: 'ACTIVE', label: 'Active' },
                          { value: 'INACTIVE', label: 'Inactive' },
                          { value: 'EXPIRED', label: 'Expired' },
                          { value: 'DEPLETED', label: 'Depleted' },
                        ]}
                        variant="filter"
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-xs font-bold text-foreground mb-2 block">Discount Type</label>
                      <Select
                        value={discountTypeFilter}
                        onChange={(value) => setDiscountTypeFilter(value as any)}
                        options={[
                          { value: 'ALL', label: 'All Types' },
                          { value: 'PERCENTAGE', label: 'Percentage' },
                          { value: 'FIXED_AMOUNT', label: 'Fixed Amount' },
                          { value: 'FREE_SHIPPING', label: 'Free Shipping' },
                          { value: 'BUY_X_GET_Y', label: 'Buy X Get Y' },
                        ]}
                        variant="filter"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        setStatusFilter('ALL');
                        setDiscountTypeFilter('ALL');
                        setSearchQuery('');
                      }}
                      variant="outline"
                      className="px-5 py-2.5 border-2 border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted hover:border-border transition-all self-end"
                    >
                      Clear All
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Coupons List */}
        {loading ? (
          <Card className="rounded-2xl border-border/50 bg-white/80 backdrop-blur-sm shadow-lg transition-all duration-300">
            <CardContent className="p-12 text-center pt-12">
              <RefreshCw className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
              <p className="text-muted-foreground font-medium">Loading coupons...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10">
            {filteredCoupons.map((coupon) => {
              const expiryInfo = getExpiryInfo(coupon.endDate);
              const usagePercentage = getUsagePercentage(coupon.currentUsageCount, coupon.totalUsageLimit);
              const hasUsageLimit = coupon.totalUsageLimit !== undefined && coupon.totalUsageLimit > 0;
              const isCopied = copiedCode === coupon.code;

              return (
                <Card key={coupon.id} className="rounded-xl border-border/50 bg-white/80 backdrop-blur-sm shadow hover:shadow-lg hover:border-primary/50/50 transition-all duration-300 group relative overflow-hidden">
                  {/* Discount type color accent */}
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-1",
                    coupon.discountType === 'PERCENTAGE' && "bg-primary",
                    coupon.discountType === 'FIXED_AMOUNT' && "bg-success",
                    coupon.discountType === 'FREE_SHIPPING' && "bg-primary",
                    coupon.discountType === 'BUY_X_GET_Y' && "bg-primary"
                  )} />

                  <CardContent className="p-4 pt-4">
                    {/* Header row - code + discount value */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          coupon.discountType === 'PERCENTAGE' && "bg-primary/20 text-primary",
                          coupon.discountType === 'FIXED_AMOUNT' && "bg-success-muted text-success",
                          coupon.discountType === 'FREE_SHIPPING' && "bg-primary/10 text-primary",
                          coupon.discountType === 'BUY_X_GET_Y' && "bg-primary/10 text-primary"
                        )}>
                          {getDiscountIcon(coupon.discountType)}
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="flex items-center gap-1.5 group/copy"
                            title="Click to copy code"
                          >
                            <h3 className="text-base font-bold font-mono text-foreground truncate group-hover/copy:text-primary transition-colors">
                              {coupon.code}
                            </h3>
                            {isCopied ? (
                              <CheckCircle className="w-3.5 h-3.5 text-success shrink-0" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover/copy:opacity-100 transition-opacity shrink-0" />
                            )}
                          </button>
                        </div>
                      </div>
                      <span className={cn(
                        "text-lg font-bold shrink-0",
                        coupon.discountType === 'PERCENTAGE' && "text-primary",
                        coupon.discountType === 'FIXED_AMOUNT' && "text-success",
                        coupon.discountType === 'FREE_SHIPPING' && "text-primary",
                        coupon.discountType === 'BUY_X_GET_Y' && "text-primary"
                      )}>
                        {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` :
                         coupon.discountType === 'FIXED_AMOUNT' ? `$${coupon.discountValue}` :
                         coupon.discountType === 'FREE_SHIPPING' ? 'FREE' : 'BOGO'}
                      </span>
                    </div>

                    {/* Name */}
                    <p className="text-sm text-muted-foreground truncate mb-2">{coupon.name}</p>

                    {/* Status and expiry badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {getStatusBadge(coupon.status)}
                      {expiryInfo && (
                        <span className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold",
                          expiryInfo.color
                        )}>
                          <Timer className="w-2.5 h-2.5" />
                          {expiryInfo.text}
                        </span>
                      )}
                    </div>

                    {/* Usage bar (compact) */}
                    {hasUsageLimit && (
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-semibold text-muted-foreground">Usage</span>
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {coupon.currentUsageCount}/{coupon.totalUsageLimit}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", getUsageColor(usagePercentage))}
                            style={{ width: `${usagePercentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Dates (compact) */}
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        {coupon.startDate ? new Date(coupon.startDate).toLocaleDateString() : 'Now'}
                      </span>
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString() : 'Never'}
                      </span>
                    </div>

                    {/* Action buttons - always visible but subtle */}
                    <div className="flex gap-1.5 pt-2 border-t border-border">
                      <Button
                        onClick={() => router.push(`/coupons/${coupon.id}`)}
                        className="flex-1 h-7 rounded-md bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors text-xs font-medium"
                        variant="ghost"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleCopyCode(coupon.code)}
                        className={cn(
                          "h-7 w-7 p-0 rounded-md transition-colors",
                          copiedCode === coupon.code
                            ? "bg-success-muted text-success"
                            : "bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary"
                        )}
                        variant="ghost"
                        title="Copy coupon code"
                      >
                        {copiedCode === coupon.code ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="h-7 w-7 p-0 rounded-md bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        variant="ghost"
                        title="Delete coupon"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredCoupons.length === 0 && (
              <div className="col-span-full">
                <Card className="rounded-2xl border-border/50 bg-white/80 backdrop-blur-sm shadow-lg transition-all duration-300">
                  <CardContent className="p-12 text-center pt-12">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Ticket className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {searchQuery || statusFilter !== 'ALL' || discountTypeFilter !== 'ALL'
                        ? 'No coupons match your filters'
                        : 'No coupons yet'}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {searchQuery || statusFilter !== 'ALL' || discountTypeFilter !== 'ALL'
                        ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                        : 'Create your first coupon to start offering discounts to your customers.'}
                    </p>
                    {!(searchQuery || statusFilter !== 'ALL' || discountTypeFilter !== 'ALL') && (
                      <Button
                        onClick={() => router.push('/coupons/new')}
                        className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg inline-flex items-center gap-2"
                      >
                        <Sparkles className="w-5 h-5" />
                        Create Your First Coupon
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        <ConfirmModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          variant={modalConfig.variant}
          confirmText="Delete"
          cancelText="Cancel"
        />
      </div>
    </div>
    </PermissionGate>
  );
}
