'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ChartNoAxesCombined,
  Loader2,
} from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { SafeChartContainer } from '@/components/ui/safe-chart-container';
import { useTenantCurrency } from '@/hooks/useTenantCurrency';
import { useAnalyticsOverview, useInvalidateAnalytics } from '@/hooks/useAnalyticsQueries';
import { formatCurrency, formatChartAxisCurrency } from '@/lib/utils/currency';

const dateRangeOptions = [
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
];

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

interface AnalyticsData {
  sales: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    revenueChange: number;
    ordersChange: number;
    aovChange: number;
    revenueByDay: Array<{ date: string; value: number }>;
    topProducts: Array<{ productName: string; revenue: number; unitsSold: number }>;
    topCategories: Array<{ categoryName: string; revenue: number }>;
  } | null;
  inventory: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalValue: number;
  } | null;
  customers: {
    totalCustomers: number;
    newCustomers: number;
    customerRetentionRate: number;
    averageLifetimeValue: number;
  } | null;
  financial: {
    grossRevenue: number;
    netRevenue: number;
    refunds: number;
    grossProfitMargin: number;
  } | null;
}

export default function AnalyticsOverviewPage() {
  const [dateRange, setDateRange] = useState('last30days');
  const { currency } = useTenantCurrency();

  // Use React Query for cached data fetching
  const { data, isLoading, error, refetch, isFetching } = useAnalyticsOverview(dateRange);
  const { invalidateOverview } = useInvalidateAnalytics();

  // Refresh handler that invalidates cache and refetches
  const handleRefresh = () => {
    invalidateOverview();
    refetch();
  };

  // Use centralized formatCurrency from lib/utils/currency with tenant's currency
  const formatAmount = (amount: number) => formatCurrency(amount, currency);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatPercent = (num: number) => {
    const value = num || 0;
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(1)}%`;
  };

  // Prepare chart data
  const revenueChartData = data?.sales?.revenueByDay?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: item.value,
  })) || [];

  const categoryChartData = data?.sales?.topCategories?.slice(0, 5) || [];

  // Custom tooltip component for better styling
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-sm font-semibold text-foreground">
            {formatAmount(payload[0].value || 0)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Empty state component for charts
  const ChartEmptyState = ({ message = "No data available" }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
      <ChartNoAxesCombined className="h-12 w-12 mb-3 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.ANALYTICS_READ}
      fallback="styled"
      fallbackTitle="Analytics Access Required"
      fallbackDescription="You don't have the required permissions to view analytics. Please contact your administrator to request access."
      loading={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
        <PageHeader
          title="Analytics Overview"
          description="Get a comprehensive view of your store's performance"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Analytics', href: '/analytics' },
            { label: 'Overview' },
          ]}
          actions={
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-border rounded-xl p-1.5 shadow-sm">
              <Select
                value={dateRange}
                onChange={setDateRange}
                options={dateRangeOptions}
                variant="filter"
                className="min-w-[140px] border-0 shadow-none hover:bg-muted rounded-lg"
              />
              <div className="w-px h-6 bg-muted" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          }
        />

        {error && (
          <div className="bg-warning-muted border border-warning/30 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <p className="text-warning">{error instanceof Error ? error.message : 'Failed to load analytics data'}</p>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {/* Revenue Card */}
          <div className="group bg-card rounded-xl border border-border/60 p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-xl hover:border-success/30 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Revenue</p>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-success">
              {formatAmount(data?.sales?.totalRevenue || 0)}
            </p>
            <div className="flex items-center gap-1 sm:gap-2 mt-2 flex-wrap">
              {(data?.sales?.revenueChange || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-error flex-shrink-0" />
              )}
              <span className={`text-xs sm:text-sm font-medium ${(data?.sales?.revenueChange || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                {formatPercent(data?.sales?.revenueChange || 0)}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">vs previous period</span>
            </div>
          </div>

          {/* Orders Card */}
          <div className="group bg-card rounded-xl border border-border/60 p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-xl hover:border-primary/50/50 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Orders</p>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
              {formatNumber(data?.sales?.totalOrders || 0)}
            </p>
            <div className="flex items-center gap-1 sm:gap-2 mt-2 flex-wrap">
              {(data?.sales?.ordersChange || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-error flex-shrink-0" />
              )}
              <span className={`text-xs sm:text-sm font-medium ${(data?.sales?.ordersChange || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                {formatPercent(data?.sales?.ordersChange || 0)}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">vs previous period</span>
            </div>
          </div>

          {/* Customers Card */}
          <div className="group bg-card rounded-xl border border-border/60 p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-xl hover:border-primary/30/50 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Customers</p>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
              {formatNumber(data?.customers?.totalCustomers || 0)}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
              {formatNumber(data?.customers?.newCustomers || 0)} new this period
            </p>
          </div>

          {/* Products Card */}
          <div className="group bg-card rounded-xl border border-border/60 p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-xl hover:border-warning/40/50 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Products</p>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-warning">
              {formatNumber(data?.inventory?.totalProducts || 0)}
            </p>
            {(data?.inventory?.lowStockCount || 0) > 0 && (
              <p className="text-[10px] sm:text-xs text-warning mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{data?.inventory?.lowStockCount} low stock</span>
              </p>
            )}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Revenue Trend Chart */}
          <div className="bg-card rounded-xl border border-border/60 p-4 sm:p-6 shadow-sm hover:shadow-xl hover:border-primary/30/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Revenue Trend</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Daily revenue over the selected period</p>
              </div>
              <Link href="/analytics/sales" className="flex-shrink-0 ml-2">
                <Button variant="ghost" size="sm" className="text-primary text-xs sm:text-sm px-2 sm:px-3">
                  <span className="hidden sm:inline">View Details</span>
                  <span className="sm:hidden">Details</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </Button>
              </Link>
            </div>
            {revenueChartData.length === 0 ? (
              <ChartEmptyState message="No revenue data for this period" />
            ) : (
              <SafeChartContainer height={288} minHeight={200}>
                <AreaChart
                  data={revenueChartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    stroke="#e5e7eb"
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={30}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    stroke="#e5e7eb"
                    tickLine={false}
                    axisLine={false}
                    width={50}
                    tickFormatter={(value) => formatChartAxisCurrency(value, currency)}
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#colorRevenue)"
                    dot={{
                      r: revenueChartData.length <= 7 ? 5 : 3,
                      fill: '#6366f1',
                      strokeWidth: 2,
                      stroke: '#fff'
                    }}
                    activeDot={{
                      r: 7,
                      fill: '#6366f1',
                      strokeWidth: 3,
                      stroke: '#fff'
                    }}
                    animationDuration={800}
                  />
                </AreaChart>
              </SafeChartContainer>
            )}
          </div>

          {/* Category Performance */}
          <div className="bg-card rounded-xl border border-border/60 p-4 sm:p-6 shadow-sm hover:shadow-xl hover:border-primary/30/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Top Categories</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Revenue by product category</p>
              </div>
              <Link href="/analytics/sales" className="flex-shrink-0 ml-2">
                <Button variant="ghost" size="sm" className="text-primary text-xs sm:text-sm px-2 sm:px-3">
                  <span className="hidden sm:inline">View All</span>
                  <span className="sm:hidden">All</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </Button>
              </Link>
            </div>
            {categoryChartData.length === 0 ? (
              <ChartEmptyState message="No category data available" />
            ) : (
              <SafeChartContainer height={288} minHeight={200}>
                <BarChart
                  data={categoryChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    stroke="#e5e7eb"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatChartAxisCurrency(value, currency)}
                  />
                  <YAxis
                    dataKey="categoryName"
                    type="category"
                    tick={{ fontSize: 11, fill: '#374151' }}
                    stroke="#e5e7eb"
                    tickLine={false}
                    axisLine={false}
                    width={80}
                    tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value}
                  />
                  <Tooltip
                    formatter={(value) => [formatAmount(value as number || 0), 'Revenue']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ fontWeight: 600, color: '#111827' }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#6366f1"
                    radius={[0, 6, 6, 0]}
                    animationDuration={800}
                    background={{ fill: '#f3f4f6' }}
                  />
                </BarChart>
              </SafeChartContainer>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <Link href="/analytics/sales" className="group">
            <div className="bg-card rounded-xl border border-border p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">Sales Analytics</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Revenue, orders, and performance</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/analytics/customers" className="group">
            <div className="bg-card rounded-xl border border-border p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">Customer Analytics</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Behavior and segmentation</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/analytics/inventory" className="group sm:col-span-2 lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md hover:border-warning/30 transition-all">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-warning/10 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-warning" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-warning transition-colors">Inventory Analytics</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Stock levels and movement</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Top Products Table */}
        {data?.sales?.topProducts && data.sales.topProducts.length > 0 && (
          <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden hover:shadow-xl hover:border-primary/30/50 transition-all duration-300">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Top Selling Products</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Best performers this period</p>
              </div>
              <Link href="/analytics/sales" className="flex-shrink-0 ml-2">
                <Button variant="ghost" size="sm" className="text-primary text-xs sm:text-sm px-2 sm:px-3">
                  <span className="hidden sm:inline">View All</span>
                  <span className="sm:hidden">All</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-100">
              {data.sales.topProducts.slice(0, 5).map((product, index) => (
                <div key={index} className="p-4 hover:bg-muted transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                    <span className="font-semibold text-primary">{formatAmount(product.revenue)}</span>
                  </div>
                  <p className="font-medium text-foreground text-sm truncate mb-1">{product.productName}</p>
                  <p className="text-xs text-muted-foreground">{formatNumber(product.unitsSold)} units sold</p>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider">Product</th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider">Units Sold</th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.sales.topProducts.slice(0, 5).map((product, index) => (
                    <tr key={index} className="hover:bg-muted transition-colors">
                      <td className="px-4 lg:px-6 py-4">
                        <p className="font-medium text-foreground text-sm lg:text-base truncate max-w-[200px] lg:max-w-none">{product.productName}</p>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right text-sm text-foreground whitespace-nowrap">
                        {formatNumber(product.unitsSold)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right font-semibold text-foreground whitespace-nowrap">
                        {formatAmount(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
    </PermissionGate>
  );
}
