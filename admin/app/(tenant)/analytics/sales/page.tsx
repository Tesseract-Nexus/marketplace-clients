'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Package,
  Download,
  RefreshCw,
  AlertTriangle,
  ChartNoAxesCombined,
  Loader2,
} from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { SafeChartContainer } from '@/components/ui/safe-chart-container';
import { useTenantCurrency } from '@/hooks/useTenantCurrency';
import { useSalesAnalytics, useInvalidateAnalytics } from '@/hooks/useAnalyticsQueries';
import {
  formatCurrency as formatCurrencyUtil,
  formatChartAxisCurrency,
} from '@/lib/utils/currency';

const dateRangeOptions = [
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
];

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

interface SalesData {
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
  totalItemsSold: number;
  revenueChange: number;
  ordersChange: number;
  aovChange: number;
  revenueByDay: Array<{ date: string; value: number; count?: number }>;
  ordersByDay: Array<{ date: string; value: number; count?: number }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    sku: string;
    unitsSold: number;
    revenue: number;
    averagePrice: number;
  }>;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    unitsSold: number;
    revenue: number;
    orderCount: number;
  }>;
  revenueByStatus: Array<{
    status: string;
    orderCount: number;
    totalRevenue: number;
    percentage: number;
  }>;
  paymentMethods: Array<{
    method: string;
    orderCount: number;
    totalAmount: number;
    percentage: number;
    successRate: number;
  }>;
}

export default function SalesAnalyticsPage() {
  const [dateRange, setDateRange] = useState('last30days');
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'payments'>('products');
  const { currency } = useTenantCurrency();

  // Use React Query for cached data fetching
  const { data, isLoading, error, refetch, isFetching } = useSalesAnalytics(dateRange);
  const { invalidateSales } = useInvalidateAnalytics();

  // Refresh handler that invalidates cache and refetches
  const handleRefresh = () => {
    invalidateSales();
    refetch();
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, currency);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatPercent = (num: number) => {
    const value = num || 0;
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(1)}%`;
  };

  // Prepare chart data
  const revenueChartData = data?.revenueByDay?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: item.value,
    orders: item.count || 0,
  })) || [];

  const statusChartData = data?.revenueByStatus?.map(item => ({
    name: item.status.replace('_', ' ').charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' '),
    value: item.totalRevenue,
    orders: item.orderCount,
  })) || [];

  const paymentChartData = data?.paymentMethods?.map(item => ({
    name: item.method.charAt(0).toUpperCase() + item.method.slice(1),
    value: item.totalAmount,
    orders: item.orderCount,
    successRate: item.successRate,
  })) || [];

  // Custom tooltip component for better styling
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-sm font-semibold" style={{ color: item.color }}>
              {item.name}: {item.name === 'Revenue' ? formatCurrency(item.value || 0) : item.value}
            </p>
          ))}
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
      fallbackTitle="Sales Analytics Access Required"
      fallbackDescription="You don't have the required permissions to view sales analytics. Please contact your administrator to request access."
      loading={<PageLoading fullScreen />}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
        <PageHeader
          title="Sales Analytics"
          description="Detailed analysis of your sales performance and trends"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Analytics', href: '/analytics' },
            { label: 'Sales' },
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
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
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
            <p className="text-warning">{error instanceof Error ? error.message : 'Failed to load sales analytics'}</p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="group bg-card rounded-xl border border-border/60 p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-xl hover:border-success/30 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Revenue</p>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-success">
              {formatCurrency(data?.totalRevenue || 0)}
            </p>
            <div className="flex items-center gap-1 sm:gap-2 mt-2">
              {(data?.revenueChange || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-error flex-shrink-0" />
              )}
              <span className={`text-xs sm:text-sm font-medium ${(data?.revenueChange || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                {formatPercent(data?.revenueChange || 0)}
              </span>
            </div>
          </div>

          <div className="group bg-card rounded-xl border border-border/60 p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-xl hover:border-primary/50/50 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Orders</p>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
              {formatNumber(data?.totalOrders || 0)}
            </p>
            <div className="flex items-center gap-1 sm:gap-2 mt-2">
              {(data?.ordersChange || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-error flex-shrink-0" />
              )}
              <span className={`text-xs sm:text-sm font-medium ${(data?.ordersChange || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                {formatPercent(data?.ordersChange || 0)}
              </span>
            </div>
          </div>

          <div className="group bg-card rounded-xl border border-border/60 p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-xl hover:border-primary/30/50 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Avg Order Value</p>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
              {formatCurrency(data?.averageOrderValue || 0)}
            </p>
            <div className="flex items-center gap-1 sm:gap-2 mt-2">
              {(data?.aovChange || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-error flex-shrink-0" />
              )}
              <span className={`text-xs sm:text-sm font-medium ${(data?.aovChange || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                {formatPercent(data?.aovChange || 0)}
              </span>
            </div>
          </div>

          <div className="group bg-card rounded-xl border border-border/60 p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-xl hover:border-warning/40/50 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Items Sold</p>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-warning">
              {formatNumber(data?.totalItemsSold || 0)}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 hidden sm:block">
              Total units sold this period
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Revenue & Orders Trend */}
          <div className="group bg-card rounded-xl border border-border/60 p-4 sm:p-6 shadow-sm hover:shadow-xl hover:border-primary/30/50 transition-all duration-300">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Revenue & Orders Trend</h3>
            {revenueChartData.length === 0 ? (
              <ChartEmptyState message="No trend data for this period" />
            ) : (
              <SafeChartContainer height={320} minHeight={200}>
                <LineChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    stroke="#e5e7eb"
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    stroke="#e5e7eb"
                    tickLine={false}
                    axisLine={false}
                    width={50}
                    tickFormatter={(value) => formatChartAxisCurrency(value, currency)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    stroke="#e5e7eb"
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: revenueChartData.length <= 7 ? 4 : 0, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                    name="Revenue"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: revenueChartData.length <= 7 ? 4 : 0, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    name="Orders"
                  />
                </LineChart>
              </SafeChartContainer>
            )}
          </div>

          {/* Order Status Distribution */}
          <div className="group bg-card rounded-xl border border-border/60 p-4 sm:p-6 shadow-sm hover:shadow-xl hover:border-primary/30/50 transition-all duration-300">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Revenue by Order Status</h3>
            {statusChartData.length === 0 ? (
              <ChartEmptyState message="No order status data available" />
            ) : (
              <SafeChartContainer height={320} minHeight={200}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                    animationDuration={800}
                  >
                    {statusChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(value as number || 0), 'Revenue']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </SafeChartContainer>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="group bg-card rounded-xl border border-border/60 p-4 sm:p-6 shadow-sm hover:shadow-xl hover:border-primary/30/50 transition-all duration-300">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Payment Methods</h3>
          {paymentChartData.length === 0 ? (
            <ChartEmptyState message="No payment data available" />
          ) : (
            <SafeChartContainer height={256} minHeight={200}>
              <BarChart data={paymentChartData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: '#374151' }}
                  stroke="#e5e7eb"
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'value' ? formatCurrency(value as number || 0) : `${value || 0}%`,
                    name === 'value' ? 'Amount' : 'Success Rate'
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#6366f1"
                  radius={[0, 6, 6, 0]}
                  name="Amount"
                  animationDuration={800}
                  background={{ fill: '#f3f4f6' }}
                />
              </BarChart>
            </SafeChartContainer>
          )}
        </div>

        {/* Data Tables with Tabs */}
        <div className="bg-card rounded-xl border border-border/60 shadow-sm hover:shadow-xl hover:border-primary/30/50 transition-all duration-300 overflow-hidden">
          <div className="border-b border-border">
            <nav className="flex overflow-x-auto">
              {['products', 'categories', 'payments'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`flex-1 min-w-[100px] py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'products' ? 'Products' : tab === 'categories' ? 'Categories' : 'Payments'}
                </button>
              ))}
            </nav>
          </div>

          {/* Mobile Card View for Products */}
          {activeTab === 'products' && (
            <>
              <div className="sm:hidden divide-y divide-gray-100">
                {data?.topProducts?.slice(0, 10).map((product, index) => (
                  <div key={product.productId} className="p-4 hover:bg-muted transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                      <span className="font-semibold text-primary">{formatCurrency(product.revenue)}</span>
                    </div>
                    <p className="font-medium text-foreground text-sm truncate mb-1">{product.productName}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="font-mono">{product.sku}</span>
                      <span>{formatNumber(product.unitsSold)} units</span>
                    </div>
                  </div>
                ))}
                {(!data?.topProducts || data.topProducts.length === 0) && (
                  <div className="p-8 text-center text-muted-foreground text-sm">No products data available</div>
                )}
              </div>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider">Product</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider hidden md:table-cell">SKU</th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider">Units</th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider hidden lg:table-cell">Avg Price</th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data?.topProducts?.slice(0, 10).map((product) => (
                      <tr key={product.productId} className="hover:bg-muted">
                        <td className="px-4 lg:px-6 py-4 font-medium text-foreground text-sm truncate max-w-[200px]">{product.productName}</td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-muted-foreground font-mono hidden md:table-cell">{product.sku}</td>
                        <td className="px-4 lg:px-6 py-4 text-right text-sm text-foreground whitespace-nowrap">{formatNumber(product.unitsSold)}</td>
                        <td className="px-4 lg:px-6 py-4 text-right text-sm text-foreground whitespace-nowrap hidden lg:table-cell">{formatCurrency(product.averagePrice)}</td>
                        <td className="px-4 lg:px-6 py-4 text-right font-semibold text-foreground whitespace-nowrap">{formatCurrency(product.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!data?.topProducts || data.topProducts.length === 0) && (
                  <div className="p-8 text-center text-muted-foreground text-sm">No products data available</div>
                )}
              </div>
            </>
          )}

          {/* Mobile Card View for Categories */}
          {activeTab === 'categories' && (
            <>
              <div className="sm:hidden divide-y divide-gray-100">
                {data?.topCategories?.map((category, index) => (
                  <div key={category.categoryId} className="p-4 hover:bg-muted transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                      <span className="font-semibold text-primary">{formatCurrency(category.revenue)}</span>
                    </div>
                    <p className="font-medium text-foreground text-sm truncate mb-1">{category.categoryName}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatNumber(category.productCount)} products</span>
                      <span>{formatNumber(category.unitsSold)} units</span>
                    </div>
                  </div>
                ))}
                {(!data?.topCategories || data.topCategories.length === 0) && (
                  <div className="p-8 text-center text-muted-foreground text-sm">No category data available</div>
                )}
              </div>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider">Category</th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider hidden md:table-cell">Products</th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider">Units</th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider hidden lg:table-cell">Orders</th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data?.topCategories?.map((category) => (
                      <tr key={category.categoryId} className="hover:bg-muted">
                        <td className="px-4 lg:px-6 py-4 font-medium text-foreground text-sm">{category.categoryName}</td>
                        <td className="px-4 lg:px-6 py-4 text-right text-sm text-foreground hidden md:table-cell">{formatNumber(category.productCount)}</td>
                        <td className="px-4 lg:px-6 py-4 text-right text-sm text-foreground">{formatNumber(category.unitsSold)}</td>
                        <td className="px-4 lg:px-6 py-4 text-right text-sm text-foreground hidden lg:table-cell">{formatNumber(category.orderCount)}</td>
                        <td className="px-4 lg:px-6 py-4 text-right font-semibold text-foreground whitespace-nowrap">{formatCurrency(category.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!data?.topCategories || data.topCategories.length === 0) && (
                  <div className="p-8 text-center text-muted-foreground text-sm">No category data available</div>
                )}
              </div>
            </>
          )}

          {/* Mobile Card View for Payments */}
          {activeTab === 'payments' && (
            <>
              <div className="sm:hidden divide-y divide-gray-100">
                {data?.paymentMethods?.map((method, index) => (
                  <div key={method.method} className="p-4 hover:bg-muted transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground text-sm capitalize">{method.method}</span>
                      <span className="font-semibold text-primary">{formatCurrency(method.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{formatNumber(method.orderCount)} orders</span>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        method.successRate >= 95 ? 'bg-success-muted text-success-foreground' :
                        method.successRate >= 90 ? 'bg-warning-muted text-warning' :
                        'bg-error-muted text-error'
                      }`}>
                        {method.successRate.toFixed(1)}% success
                      </span>
                    </div>
                  </div>
                ))}
                {(!data?.paymentMethods || data.paymentMethods.length === 0) && (
                  <div className="p-8 text-center text-muted-foreground text-sm">No payment data available</div>
                )}
              </div>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider">Method</th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider">Orders</th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider">Success</th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider hidden md:table-cell">Share</th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data?.paymentMethods?.map((method) => (
                      <tr key={method.method} className="hover:bg-muted">
                        <td className="px-4 lg:px-6 py-4 font-medium text-foreground capitalize text-sm">{method.method}</td>
                        <td className="px-4 lg:px-6 py-4 text-right text-sm text-foreground">{formatNumber(method.orderCount)}</td>
                        <td className="px-4 lg:px-6 py-4 text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            method.successRate >= 95 ? 'bg-success-muted text-success-foreground' :
                            method.successRate >= 90 ? 'bg-warning-muted text-warning' :
                            'bg-error-muted text-error'
                          }`}>
                            {method.successRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-right text-sm text-foreground hidden md:table-cell">{method.percentage.toFixed(1)}%</td>
                        <td className="px-4 lg:px-6 py-4 text-right font-semibold text-foreground whitespace-nowrap">{formatCurrency(method.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!data?.paymentMethods || data.paymentMethods.length === 0) && (
                  <div className="p-8 text-center text-muted-foreground text-sm">No payment data available</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </PermissionGate>
  );
}
