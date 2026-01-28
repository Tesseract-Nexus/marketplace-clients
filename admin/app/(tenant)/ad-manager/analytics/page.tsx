'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Loader2,
  AlertCircle,
  BarChart3,
  Eye,
  MousePointer,
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/permission-gate';
import { Permissions } from '@/hooks/usePermission';
import { adManagerService } from '@/lib/services/adManagerService';
import type { AdAnalyticsSummary } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const DATE_RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '14d', label: 'Last 14 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
];

interface TimeSeriesData {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

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

function StatCard({
  title,
  value,
  icon: Icon,
  change,
  color,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  change?: number;
  color: string;
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
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {change >= 0 ? (
              <ArrowUp className="h-3 w-3 text-success" />
            ) : (
              <ArrowDown className="h-3 w-3 text-error" />
            )}
            <span
              className={cn('text-xs font-medium', change >= 0 ? 'text-success' : 'text-error')}
            >
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">vs prev. period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PerformanceChart({
  data,
  loading,
}: {
  data: TimeSeriesData[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Over Time</CardTitle>
        <CardDescription>Impressions, clicks, and conversions trend</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => [formatNumber(value as number), '']}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="impressions"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#impressionsGradient)"
                name="Impressions"
              />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#clicksGradient)"
                name="Clicks"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueChart({
  data,
  loading,
}: {
  data: TimeSeriesData[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spend vs Revenue</CardTitle>
        <CardDescription>Compare your ad spend with generated revenue</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => [formatCurrency(value as number), '']}
              />
              <Legend />
              <Bar dataKey="spend" fill="#f59e0b" name="Spend" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [summary, setSummary] = useState<AdAnalyticsSummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const days = parseInt(dateRange.replace('d', ''));
      const dateTo = new Date().toISOString().split('T')[0];
      const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const response = await adManagerService.getAnalytics({
        dateFrom,
        dateTo,
        groupBy: 'DAY',
      });

      if (response.success) {
        setSummary(response.data.summary);
        setTimeSeries(response.data.timeSeries || []);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const calculatedRoas = useMemo(() => {
    if (!summary || summary.spend === 0) return 0;
    return summary.revenue / summary.spend;
  }, [summary]);

  return (
    <PermissionGate permission={Permissions.ADS_ANALYTICS_VIEW} fallback="styled">
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Analytics"
            description="Track your advertising performance and ROI"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Ad Manager', href: '/ad-manager' },
              { label: 'Analytics', href: '/analytics' },
            ]}
            actions={
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="w-full sm:w-48">
                  <Select
                    value={dateRange}
                    onChange={setDateRange}
                    options={DATE_RANGE_OPTIONS}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={fetchAnalytics} disabled={loading} className="p-2.5 rounded-md bg-muted hover:bg-muted transition-all" title="Refresh">
                    <RefreshCw className={cn('w-5 h-5 text-muted-foreground', loading && 'animate-spin')} />
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            }
          />

          {/* Error Banner */}
          {error && (
            <div className="bg-error-muted border border-error/30 rounded-lg p-4 flex items-center gap-3 mb-6">
              <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
              <p className="text-error">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchAnalytics} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
            <StatCard
              title="Total Impressions"
              value={formatNumber(summary?.impressions || 0)}
              icon={Eye}
              change={12.5}
              color="#3b82f6"
              loading={loading}
            />
            <StatCard
              title="Total Clicks"
              value={formatNumber(summary?.clicks || 0)}
              icon={MousePointer}
              change={8.2}
              color="#10b981"
              loading={loading}
            />
            <StatCard
              title="Click-Through Rate"
              value={`${(summary?.ctr || 0).toFixed(2)}%`}
              icon={TrendingUp}
              change={-2.1}
              color="#8b5cf6"
              loading={loading}
            />
            <StatCard
              title="Conversions"
              value={formatNumber(summary?.conversions || 0)}
              icon={BarChart3}
              change={15.3}
              color="#f59e0b"
              loading={loading}
            />
            <StatCard
              title="Total Spend"
              value={formatCurrency(summary?.spend || 0)}
              icon={DollarSign}
              change={5.7}
              color="#ef4444"
              loading={loading}
            />
            <StatCard
              title="ROAS"
              value={`${calculatedRoas.toFixed(2)}x`}
              icon={TrendingUp}
              change={10.2}
              color="#10b981"
              loading={loading}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <PerformanceChart data={timeSeries} loading={loading} />
            <RevenueChart data={timeSeries} loading={loading} />
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Cost Per Click (CPC)</span>
                  <span className="font-semibold">{formatCurrency(summary?.cpc || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Cost Per 1000 (CPM)</span>
                  <span className="font-semibold">{formatCurrency(summary?.cpm || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Cost Per Conversion</span>
                  <span className="font-semibold">
                    {summary?.conversions
                      ? formatCurrency((summary?.spend || 0) / summary.conversions)
                      : '-'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Conversion Rate (CVR)</span>
                  <span className="font-semibold">{(summary?.cvr || 0).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-semibold text-success">
                    {formatCurrency(summary?.revenue || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Avg. Revenue per Conversion</span>
                  <span className="font-semibold">
                    {summary?.conversions
                      ? formatCurrency((summary?.revenue || 0) / summary.conversions)
                      : '-'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Efficiency Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Return on Ad Spend</span>
                  <span
                    className={cn(
                      'font-semibold',
                      calculatedRoas >= 3 ? 'text-success' : calculatedRoas >= 1 ? 'text-warning' : 'text-error'
                    )}
                  >
                    {calculatedRoas.toFixed(2)}x
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Profit</span>
                  <span
                    className={cn(
                      'font-semibold',
                      (summary?.revenue || 0) - (summary?.spend || 0) >= 0
                        ? 'text-success'
                        : 'text-error'
                    )}
                  >
                    {formatCurrency((summary?.revenue || 0) - (summary?.spend || 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Profit Margin</span>
                  <span className="font-semibold">
                    {summary?.revenue
                      ? `${(((summary.revenue - (summary?.spend || 0)) / summary.revenue) * 100).toFixed(1)}%`
                      : '-'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
