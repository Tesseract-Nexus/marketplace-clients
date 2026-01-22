'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  DollarSign,
  TrendingUp,
  Download,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import { useTenantCurrency } from '@/hooks/useTenantCurrency';
import { useCustomerAnalytics, useInvalidateAnalytics } from '@/hooks/useAnalyticsQueries';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
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

const dateRangeOptions = [
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
];

interface CustomerAnalyticsData {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageLifetimeValue: number;
  averageOrdersPerCustomer: number;
  customerRetentionRate: number;
  customersByValue: Array<{
    segmentName: string;
    customerCount: number;
    totalRevenue: number;
    averageValue: number;
    percentage: number;
  }>;
  customersByOrders: Array<{
    segmentName: string;
    customerCount: number;
    totalRevenue: number;
    averageValue: number;
    percentage: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    firstOrderDate: string;
    lastOrderDate: string;
    daysSinceLastOrder: number;
  }>;
  customerGrowth: Array<{
    date: string;
    value: number;
    count?: number;
  }>;
  geographicDistribution: Array<{
    country: string;
    state?: string;
    city?: string;
    customerCount: number;
    orderCount: number;
    revenue: number;
  }>;
  customerCohorts: Array<{
    cohortMonth: string;
    customerCount: number;
    retentionRates: number[];
  }>;
}

export default function CustomerAnalyticsPage() {
  const [dateRange, setDateRange] = useState('last30days');
  const [activeTab, setActiveTab] = useState<'top-customers' | 'segmentation' | 'geography' | 'growth'>('top-customers');
  const { currency } = useTenantCurrency();

  // Use React Query for cached data fetching
  const { data, isLoading, error, refetch, isFetching } = useCustomerAnalytics(dateRange);
  const { invalidateCustomers } = useInvalidateAnalytics();

  // Refresh handler that invalidates cache and refetches
  const handleRefresh = () => {
    invalidateCustomers();
    refetch();
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, currency);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const getRecencyBadgeClass = (days: number) => {
    if (days <= 30) return 'bg-success-muted text-success-foreground border-success/30';
    if (days <= 90) return 'bg-warning-muted text-warning border-warning/30';
    return 'bg-destructive/10 text-destructive border-destructive/30';
  };

  const getRecencyLabel = (days: number) => {
    if (days <= 30) return 'Active';
    if (days <= 90) return 'Recent';
    return 'Inactive';
  };

  // Prepare chart data
  const growthChartData = data?.customerGrowth?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    customers: item.value,
  })) || [];

  const segmentChartData = data?.customersByValue?.map(segment => ({
    name: segment.segmentName,
    customers: segment.customerCount,
    revenue: segment.totalRevenue,
  })) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
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
      fallbackTitle="Customer Analytics Access Required"
      fallbackDescription="You don't have the required permissions to view customer analytics. Please contact your administrator to request access."
      loading={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
    >
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Customer Analytics"
          description="Analyze customer behavior, lifetime value, and retention metrics"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Analytics', href: '/analytics' },
            { label: 'Customers' },
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
            <p className="text-warning">{error instanceof Error ? error.message : 'Failed to load customer analytics'}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-card rounded-xl border border-border/60 p-6 shadow-sm hover:shadow-xl hover:border-primary/50/50 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-primary">
              {formatNumber(data?.totalCustomers || 0)}
            </p>
          </div>

          <div className="group bg-card rounded-xl border border-border/60 p-6 shadow-sm hover:shadow-xl hover:border-emerald-300/50 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">New Customers</p>
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <UserPlus className="h-6 w-6 text-success" />
              </div>
            </div>
            <p className="text-3xl font-bold text-success">
              {formatNumber(data?.newCustomers || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {formatNumber(data?.returningCustomers || 0)} returning
            </p>
          </div>

          <div className="group bg-card rounded-xl border border-border/60 p-6 shadow-sm hover:shadow-xl hover:border-primary/30/50 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Avg Lifetime Value</p>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(data?.averageLifetimeValue || 0)}
            </p>
          </div>

          <div className="group bg-card rounded-xl border border-border/60 p-6 shadow-sm hover:shadow-xl hover:border-warning/40/50 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Retention Rate</p>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
            </div>
            <p className="text-3xl font-bold text-warning">
              {(data?.customerRetentionRate || 0).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {(data?.averageOrdersPerCustomer || 0).toFixed(1)} orders per customer
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Growth Chart */}
          <div className="group bg-card rounded-xl border border-border/60 p-6 shadow-sm hover:shadow-xl hover:border-primary/30/50 transition-all duration-300">
            <h3 className="text-lg font-semibold text-foreground mb-6">Customer Growth</h3>
            <SafeChartContainer height={256} minHeight={200}>
              <AreaChart data={growthChartData}>
                <defs>
                  <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  formatter={(value) => [formatNumber(value as number || 0), 'Customers']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Area
                  type="monotone"
                  dataKey="customers"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#colorCustomers)"
                />
              </AreaChart>
            </SafeChartContainer>
          </div>

          {/* Customer Segments */}
          <div className="group bg-card rounded-xl border border-border/60 p-6 shadow-sm hover:shadow-xl hover:border-primary/30/50 transition-all duration-300">
            <h3 className="text-lg font-semibold text-foreground mb-6">Customer Segments</h3>
            <SafeChartContainer height={256} minHeight={200}>
              <BarChart data={segmentChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="#9ca3af" width={100} />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'customers' ? formatNumber(value as number || 0) : formatCurrency(value as number || 0),
                    name === 'customers' ? 'Customers' : 'Revenue'
                  ]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="customers" fill="#6366f1" radius={[0, 4, 4, 0]} name="customers" />
              </BarChart>
            </SafeChartContainer>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-xl border border-border/60 shadow-sm hover:shadow-xl hover:border-primary/30/50 transition-all duration-300">
          <div className="border-b border-border">
            <nav className="flex overflow-x-auto">
              {[
                { id: 'top-customers', label: 'Top Customers' },
                { id: 'segmentation', label: 'Segmentation' },
                { id: 'geography', label: 'Geography' },
                { id: 'growth', label: 'Cohort Analysis' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    'flex-1 py-4 px-6 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Top Customers Tab */}
            {activeTab === 'top-customers' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                        Total Spent
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                        Avg Order
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                        Last Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data?.topCustomers?.map((customer) => (
                      <tr key={customer.customerId} className="hover:bg-muted transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground">{customer.customerName}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-foreground">
                          {formatNumber(customer.totalOrders)}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-foreground">
                          {formatCurrency(customer.totalSpent)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-foreground">
                          {formatCurrency(customer.averageOrderValue)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-foreground">
                          {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                              getRecencyBadgeClass(customer.daysSinceLastOrder)
                            )}
                          >
                            {getRecencyLabel(customer.daysSinceLastOrder)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Segmentation Tab */}
            {activeTab === 'segmentation' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground mb-4">Customers by Value</h3>
                {data?.customersByValue?.map((segment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                          {segment.segmentName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(segment.customerCount)} customers
                        </span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-violet-600 h-full"
                          style={{ width: `${segment.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <p className="font-semibold text-foreground">
                        {formatCurrency(segment.totalRevenue)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(segment.averageValue)} avg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Geography Tab */}
            {activeTab === 'geography' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Location
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                        Customers
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data?.geographicDistribution?.map((location, index) => (
                      <tr key={index} className="hover:bg-muted transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-semibold text-foreground">{location.country}</p>
                              {location.state && (
                                <p className="text-sm text-muted-foreground">{location.state}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-foreground">
                          {formatNumber(location.customerCount)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-foreground">
                          {formatNumber(location.orderCount)}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-foreground">
                          {formatCurrency(location.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Cohort Analysis Tab */}
            {activeTab === 'growth' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground mb-4">Customer Cohort Analysis</h3>
                {data?.customerCohorts && data.customerCohorts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                            Cohort
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Customers
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Month 1
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Month 2
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Month 3
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.customerCohorts.map((cohort, index) => (
                          <tr key={index} className="hover:bg-muted transition-colors">
                            <td className="px-6 py-4 font-semibold text-foreground">{cohort.cohortMonth}</td>
                            <td className="px-6 py-4 text-right text-sm text-foreground">{formatNumber(cohort.customerCount)}</td>
                            {cohort.retentionRates?.slice(0, 3).map((rate, i) => (
                              <td key={i} className="px-6 py-4 text-right">
                                <span className={cn(
                                  'inline-flex px-2 py-1 text-xs font-medium rounded',
                                  rate >= 50 ? 'bg-success-muted text-success-foreground' :
                                  rate >= 25 ? 'bg-warning-muted text-warning' :
                                  'bg-destructive/10 text-destructive'
                                )}>
                                  {rate.toFixed(1)}%
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No cohort data available for this period</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </PermissionGate>
  );
}
