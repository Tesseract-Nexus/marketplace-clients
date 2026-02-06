'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Ticket,
  Percent,
  DollarSign,
  Truck,
  Gift,
  Tag,
  Clock,
  Calendar,
  Shield,
  AlertCircle,
  Edit2,
  Copy,
  CheckCircle,
  Loader2,
  PlayCircle,
  PauseCircle,
  Files,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge, type StatusType } from '@/components/ui/status-badge';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { PageHeader } from '@/components/PageHeader';
import { PageLoading } from '@/components/common';
import { cn } from '@/lib/utils';
import { useDialog } from '@/contexts/DialogContext';
import { useToast } from '@/contexts/ToastContext';
import { couponService } from '@/lib/services/couponService';
import type { Coupon, DiscountType } from '@/lib/api/types';

export default function CouponDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showConfirm } = useDialog();
  const toast = useToast();
  const id = params.id as string;

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  const getCouponStatusType = (status: string): StatusType => {
    const mapping: Record<string, StatusType> = {
      DRAFT: 'neutral',
      ACTIVE: 'success',
      INACTIVE: 'warning',
      EXPIRED: 'error',
      DEPLETED: 'error',
    };
    return mapping[status] || 'neutral';
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'default' | 'warning' | 'info' => {
    const mapping: Record<string, 'success' | 'default' | 'warning' | 'info'> = {
      DRAFT: 'default',
      ACTIVE: 'success',
      INACTIVE: 'warning',
      EXPIRED: 'warning',
      DEPLETED: 'warning',
    };
    return mapping[status] || 'default';
  };

  const getDiscountIcon = (type: DiscountType) => {
    switch (type) {
      case 'PERCENTAGE': return Percent;
      case 'FIXED_AMOUNT': return DollarSign;
      case 'FREE_SHIPPING': return Truck;
      case 'BUY_X_GET_Y': return Gift;
      default: return Tag;
    }
  };

  const formatDiscountValue = (type: DiscountType, value: number) => {
    switch (type) {
      case 'PERCENTAGE': return `${value}%`;
      case 'FIXED_AMOUNT': return `$${value.toFixed(2)}`;
      case 'FREE_SHIPPING': return 'Free Shipping';
      case 'BUY_X_GET_Y': return 'Buy X Get Y';
      default: return `${value}`;
    }
  };

  const getUsagePercentage = (current: number, limit: number | undefined) => {
    if (!limit) return 0;
    return Math.min(Math.round((current / limit) * 100), 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-error';
    if (percentage >= 75) return 'bg-warning';
    if (percentage >= 50) return 'bg-warning';
    return 'bg-success';
  };

  const normalizeCoupon = (raw: any): Coupon => {
    return {
      ...raw,
      discountType: raw.discountType || raw.type || 'FIXED_AMOUNT',
      applicability: raw.applicability || 'ALL_PRODUCTS',
      status: raw.status || (raw.isActive ? 'ACTIVE' : 'INACTIVE'),
      totalUsageLimit: raw.totalUsageLimit ?? raw.maxUsage,
      perCustomerLimit: raw.perCustomerLimit ?? raw.usagePerCustomer,
      currentUsageCount: raw.currentUsageCount ?? raw.currentUsage ?? 0,
      startDate: raw.startDate || raw.validFrom,
      endDate: raw.endDate || raw.validUntil,
      restrictions: raw.restrictions || {
        minPurchaseAmount: raw.minOrderAmount,
        maxDiscountAmount: raw.maxDiscount,
      },
    };
  };

  const fetchCoupon = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await couponService.getCoupon(id);

      if (response.success && response.data) {
        setCoupon(normalizeCoupon(response.data));
      } else {
        throw new Error('Failed to fetch coupon');
      }
    } catch (err) {
      console.error('Failed to fetch coupon:', err);
      setError(err instanceof Error ? err.message : 'Failed to load coupon');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleCopyCode = () => {
    if (!coupon) return;
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivate = async () => {
    const confirmed = await showConfirm({
      title: 'Activate Coupon',
      message: 'Are you sure you want to activate this coupon?',
    });
    if (!confirmed) return;
    try {
      setActionLoading(true);
      await couponService.updateCouponStatus(id, 'ACTIVE');
      toast.success('Coupon Activated', 'Coupon is now active.');
      fetchCoupon();
    } catch (err) {
      toast.error('Action Failed', err instanceof Error ? err.message : 'Failed to activate coupon.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    const confirmed = await showConfirm({
      title: 'Deactivate Coupon',
      message: 'Are you sure you want to deactivate this coupon? Customers will no longer be able to use it.',
    });
    if (!confirmed) return;
    try {
      setActionLoading(true);
      await couponService.updateCouponStatus(id, 'INACTIVE');
      toast.success('Coupon Deactivated', 'Coupon has been deactivated.');
      fetchCoupon();
    } catch (err) {
      toast.error('Action Failed', err instanceof Error ? err.message : 'Failed to deactivate coupon.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      setActionLoading(true);
      const response = await couponService.duplicateCoupon(id);
      if (response.success && response.data) {
        toast.success('Coupon Duplicated', 'A copy of this coupon has been created.');
        router.push(`/coupons/${response.data.id}`);
      } else {
        throw new Error('Failed to duplicate coupon');
      }
    } catch (err) {
      toast.error('Duplicate Failed', err instanceof Error ? err.message : 'Failed to duplicate coupon.');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCoupon();
    }
  }, [id, fetchCoupon]);

  if (loading) {
    return <PageLoading fullScreen />;
  }

  if (error || !coupon) {
    return (
      <PermissionGate
        permission={Permission.MARKETING_COUPONS_VIEW}
        fallback="styled"
        fallbackTitle="Coupons Access Required"
        fallbackDescription="You don't have the required permissions to view coupons."
        loading={<PageLoading fullScreen />}
      >
        <div className="min-h-screen bg-background">
          <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
              title="Coupon"
              breadcrumbs={[
                { label: 'Home', href: '/' },
                { label: 'Marketing', href: '/campaigns' },
                { label: 'Coupons', href: '/coupons' },
                { label: 'Not Found' },
              ]}
            />
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-error-muted flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Coupon Not Found</h3>
              <p className="text-muted-foreground mb-6">
                {error || 'The coupon you are looking for does not exist or has been removed.'}
              </p>
              <Button onClick={() => router.push('/coupons')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Coupons
              </Button>
            </div>
          </div>
        </div>
      </PermissionGate>
    );
  }

  const DiscountIcon = getDiscountIcon(coupon.discountType);
  const hasUsageLimit = coupon.totalUsageLimit !== undefined && coupon.totalUsageLimit > 0;
  const usagePercentage = getUsagePercentage(coupon.currentUsageCount, coupon.totalUsageLimit);

  return (
    <PermissionGate
      permission={Permission.MARKETING_COUPONS_VIEW}
      fallback="styled"
      fallbackTitle="Coupons Access Required"
      fallbackDescription="You don't have the required permissions to view coupons."
      loading={<PageLoading fullScreen />}
    >
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title={coupon.code}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Marketing', href: '/campaigns' },
              { label: 'Coupons', href: '/coupons' },
              { label: coupon.code },
            ]}
            badge={{
              label: coupon.status,
              variant: getStatusBadgeVariant(coupon.status),
            }}
            actions={
              <div className="flex gap-2">
                {coupon.status === 'DRAFT' && (
                  <Button
                    variant="default"
                    onClick={handleActivate}
                    disabled={actionLoading}
                    className="bg-success hover:bg-success/90 text-success-foreground"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
                    Activate
                  </Button>
                )}
                {coupon.status === 'ACTIVE' && (
                  <Button
                    variant="default"
                    onClick={handleDeactivate}
                    disabled={actionLoading}
                    className="bg-warning hover:bg-warning/90 text-warning-foreground"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PauseCircle className="h-4 w-4 mr-2" />}
                    Deactivate
                  </Button>
                )}
                {coupon.status === 'INACTIVE' && (
                  <Button
                    variant="default"
                    onClick={handleActivate}
                    disabled={actionLoading}
                    className="bg-success hover:bg-success/90 text-success-foreground"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
                    Activate
                  </Button>
                )}
                {(coupon.status === 'EXPIRED' || coupon.status === 'DEPLETED') && (
                  <Button
                    variant="outline"
                    onClick={handleDuplicate}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Files className="h-4 w-4 mr-2" />}
                    Duplicate
                  </Button>
                )}
                {coupon.status !== 'EXPIRED' && coupon.status !== 'DEPLETED' && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/coupons/${coupon.id}/edit`)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => router.push('/coupons')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Coupon Information */}
              <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="p-6 border-b border-border bg-muted">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-primary" />
                    Coupon Information
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  {/* Coupon Code */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Coupon Code</p>
                    <div className="flex items-center gap-3">
                      <code className="text-2xl font-mono font-bold text-foreground tracking-wider">
                        {coupon.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyCode}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-muted"
                        title="Copy code"
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {coupon.name && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Name</p>
                      <p className="text-sm text-foreground">{coupon.name}</p>
                    </div>
                  )}

                  {coupon.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                      <p className="text-sm text-foreground">{coupon.description}</p>
                    </div>
                  )}

                  {/* Discount Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Discount Type</p>
                      <div className="flex items-center gap-2">
                        <DiscountIcon className="h-4 w-4 text-primary" />
                        <p className="text-sm font-bold text-foreground">{coupon.discountType.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Discount Value</p>
                      <p className="text-lg font-bold text-primary">{formatDiscountValue(coupon.discountType, coupon.discountValue)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Applicability</p>
                      <p className="text-sm font-bold text-foreground">{coupon.applicability.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Usage Count</p>
                      <p className="text-lg font-bold text-foreground">{coupon.currentUsageCount}</p>
                    </div>
                  </div>

                  {/* Usage Progress */}
                  {hasUsageLimit && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">Usage Limit</p>
                        <p className="text-sm font-semibold text-foreground">
                          {coupon.currentUsageCount} / {coupon.totalUsageLimit} used
                        </p>
                      </div>
                      <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", getUsageColor(usagePercentage))}
                          style={{ width: `${usagePercentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {coupon.totalUsageLimit! - coupon.currentUsageCount} remaining
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Restrictions */}
              {coupon.restrictions && (
                <div className="bg-card rounded-lg border border-border shadow-sm">
                  <div className="p-6 border-b border-border bg-muted">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Restrictions
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {coupon.restrictions.minPurchaseAmount !== undefined && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Min Purchase Amount</p>
                          <p className="text-sm font-bold text-foreground">${coupon.restrictions.minPurchaseAmount.toFixed(2)}</p>
                        </div>
                      )}
                      {coupon.restrictions.maxDiscountAmount !== undefined && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Max Discount Amount</p>
                          <p className="text-sm font-bold text-foreground">${coupon.restrictions.maxDiscountAmount.toFixed(2)}</p>
                        </div>
                      )}
                      {coupon.restrictions.firstOrderOnly && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-1">First Order Only</p>
                          <p className="text-sm font-bold text-success">Yes</p>
                        </div>
                      )}
                      {coupon.restrictions.onePerCustomer && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-1">One Per Customer</p>
                          <p className="text-sm font-bold text-success">Yes</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                    <p className="text-sm font-medium text-muted-foreground mb-2">Coupon Status</p>
                    <StatusBadge status={getCouponStatusType(coupon.status)} size="lg">
                      {coupon.status}
                    </StatusBadge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Discount</p>
                    <p className="text-sm font-semibold text-primary">{formatDiscountValue(coupon.discountType, coupon.discountValue)}</p>
                  </div>
                  {coupon.perCustomerLimit && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Per Customer Limit</p>
                      <p className="text-sm font-semibold text-foreground">{coupon.perCustomerLimit} uses</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Validity Card */}
              <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="p-6 border-b border-border bg-muted">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Validity Period
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Start Date</p>
                    <p className="text-sm font-semibold text-foreground">
                      {coupon.startDate ? formatDate(coupon.startDate) : 'Immediately'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">End Date</p>
                    {coupon.endDate ? (
                      <div>
                        <p className="text-sm font-semibold text-foreground">{formatDate(coupon.endDate)}</p>
                        {(() => {
                          const days = Math.ceil((new Date(coupon.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          if (days < 0) {
                            return <p className="text-xs text-error mt-1 font-medium">Expired</p>;
                          } else if (days <= 30) {
                            return <p className="text-xs text-warning mt-1 font-medium">{days} days remaining</p>;
                          }
                          return <p className="text-xs text-muted-foreground mt-1">{days} days remaining</p>;
                        })()}
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-foreground">Never expires</p>
                    )}
                  </div>
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
                    <p className="text-sm text-foreground">{formatDateTime(coupon.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Last Updated</p>
                    <p className="text-sm text-foreground">{formatDateTime(coupon.updatedAt)}</p>
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
