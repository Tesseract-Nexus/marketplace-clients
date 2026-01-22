'use client';

import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  XCircle,
  Boxes,
  BarChart3,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { SafeChartContainer } from '@/components/ui/safe-chart-container';
import { useTenantCurrency } from '@/hooks/useTenantCurrency';
import { useInventoryAnalytics, useInvalidateAnalytics } from '@/hooks/useAnalyticsQueries';
import {
  formatCurrency as formatCurrencyUtil,
  formatChartAxisCurrency,
} from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

interface InventoryData {
  totalProducts: number;
  totalSkus: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockProducts: Array<{
    productId: string;
    productName: string;
    sku: string;
    stockLevel: number;
    reorderLevel: number;
    value: number;
    lastRestocked?: string;
  }>;
  outOfStockProducts: Array<{
    productId: string;
    productName: string;
    sku: string;
    stockLevel: number;
    reorderLevel: number;
    value: number;
    lastRestocked?: string;
  }>;
  topMovingProducts: Array<{
    productId: string;
    productName: string;
    sku: string;
    unitsSold: number;
    daysInStock: number;
    turnoverRate: number;
    currentStock: number;
  }>;
  slowMovingProducts: Array<{
    productId: string;
    productName: string;
    sku: string;
    unitsSold: number;
    daysInStock: number;
    turnoverRate: number;
    currentStock: number;
  }>;
  inventoryByCategory: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    totalStock: number;
    totalValue: number;
    lowStockCount: number;
  }>;
  inventoryTurnover: Array<{
    period: string;
    turnoverRate: number;
    daysToSell: number;
  }>;
}

export default function InventoryAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'low-stock' | 'out-of-stock' | 'fast-moving' | 'slow-moving'>('low-stock');
  const { currency } = useTenantCurrency();

  // Use React Query for cached data fetching
  const { data, isLoading, error, refetch, isFetching } = useInventoryAnalytics();
  const { invalidateInventory } = useInvalidateAnalytics();

  // Refresh handler that invalidates cache and refetches
  const handleRefresh = () => {
    invalidateInventory();
    refetch();
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, currency);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  // Prepare chart data
  const categoryChartData = data?.inventoryByCategory?.map(cat => ({
    name: cat.categoryName,
    value: cat.totalValue,
    stock: cat.totalStock,
    products: cat.productCount,
  })) || [];

  const stockHealthData = [
    { name: 'Healthy Stock', value: (data?.totalProducts || 0) - (data?.lowStockCount || 0) - (data?.outOfStockCount || 0), color: '#10b981' },
    { name: 'Low Stock', value: data?.lowStockCount || 0, color: '#f59e0b' },
    { name: 'Out of Stock', value: data?.outOfStockCount || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const getStockLevelBadge = (stock: number, reorder: number) => {
    if (stock === 0) return { className: 'bg-destructive/10 text-destructive border-destructive/30', label: 'Out of Stock' };
    if (stock <= reorder) return { className: 'bg-warning-muted text-warning-foreground border-warning/30', label: 'Low Stock' };
    return { className: 'bg-success-muted text-success-foreground border-success/30', label: 'In Stock' };
  };

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
      fallbackTitle="Inventory Analytics Access Required"
      fallbackDescription="You don't have the required permissions to view inventory analytics. Please contact your administrator to request access."
      loading={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Inventory Analytics"
          description="Monitor stock levels, movement, and inventory health"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Analytics', href: '/analytics' },
            { label: 'Inventory' },
          ]}
          actions={
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-border rounded-xl p-1.5 shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
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
            <p className="text-warning">{error instanceof Error ? error.message : 'Failed to load inventory analytics'}</p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="group bg-card rounded-xl border border-border/60 p-6 shadow-sm hover:shadow-xl hover:border-primary/50/50 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Total Products</p>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Package className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatNumber(data?.totalProducts || 0)}
            </p>
          </div>

          <div className="group bg-card rounded-xl border border-border/60 p-6 shadow-sm hover:shadow-xl hover:border-primary/30/50 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Total SKUs</p>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Boxes className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatNumber(data?.totalSkus || 0)}
            </p>
          </div>

          <div className="group bg-card rounded-xl border border-border/60 p-6 shadow-sm hover:shadow-xl hover:border-success/30 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Total Value</p>
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-5 w-5 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(data?.totalValue || 0)}
            </p>
          </div>

          <div className="group bg-card rounded-xl border border-warning/30 p-6 shadow-sm hover:shadow-xl hover:border-warning/50 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-warning-foreground">Low Stock</p>
              <div className="w-10 h-10 bg-warning-muted rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
            </div>
            <p className="text-2xl font-bold text-warning-foreground">
              {formatNumber(data?.lowStockCount || 0)}
            </p>
            <p className="text-xs text-warning mt-1">Needs reorder</p>
          </div>

          <div className="group bg-card rounded-xl border border-destructive/30/60 p-6 shadow-sm bg-destructive/5 hover:shadow-xl hover:border-destructive/30/50 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-destructive">Out of Stock</p>
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <p className="text-2xl font-bold text-destructive">
              {formatNumber(data?.outOfStockCount || 0)}
            </p>
            <p className="text-xs text-destructive mt-1">Urgent attention needed</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Health Pie Chart */}
          <div className="group bg-card rounded-xl border border-border/60 p-6 shadow-sm hover:shadow-xl hover:border-primary/30/50 transition-all duration-300">
            <h3 className="text-lg font-semibold text-foreground mb-6">Stock Health Distribution</h3>
            <SafeChartContainer height={288} minHeight={200}>
              <PieChart>
                <Pie
                  data={stockHealthData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {stockHealthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatNumber(value as number || 0), 'Products']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Legend />
              </PieChart>
            </SafeChartContainer>
          </div>

          {/* Inventory by Category */}
          <div className="group bg-card rounded-xl border border-border/60 p-6 shadow-sm hover:shadow-xl hover:border-primary/30/50 transition-all duration-300">
            <h3 className="text-lg font-semibold text-foreground mb-6">Inventory Value by Category</h3>
            <SafeChartContainer height={288} minHeight={200}>
              <BarChart data={categoryChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(value) => formatChartAxisCurrency(value, currency)} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#9ca3af" width={100} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number || 0), 'Value']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </SafeChartContainer>
          </div>
        </div>

        {/* Inventory Tables with Tabs */}
        <div className="bg-card rounded-xl border border-border/60 shadow-sm hover:shadow-xl hover:border-primary/30/50 transition-all duration-300">
          <div className="border-b border-border overflow-x-auto">
            <nav className="flex min-w-max">
              {[
                { id: 'low-stock', label: 'Low Stock', icon: AlertTriangle, color: 'amber' },
                { id: 'out-of-stock', label: 'Out of Stock', icon: XCircle, color: 'red' },
                { id: 'fast-moving', label: 'Fast Moving', icon: ArrowUpRight, color: 'green' },
                { id: 'slow-moving', label: 'Slow Moving', icon: ArrowDownRight, color: 'gray' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    'flex items-center gap-2 py-4 px-6 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <tab.icon className={cn('h-4 w-4', activeTab === tab.id ? `text-${tab.color}-600` : '')} />
                  {tab.label}
                  {tab.id === 'low-stock' && data?.lowStockCount ? (
                    <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-warning-muted text-warning-foreground rounded-full">
                      {data.lowStockCount}
                    </span>
                  ) : null}
                  {tab.id === 'out-of-stock' && data?.outOfStockCount ? (
                    <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive rounded-full">
                      {data.outOfStockCount}
                    </span>
                  ) : null}
                </button>
              ))}
            </nav>
          </div>

          <div className="overflow-x-auto">
            {(activeTab === 'low-stock' || activeTab === 'out-of-stock') && (
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">SKU</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">Stock Level</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">Reorder Level</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(activeTab === 'low-stock' ? data?.lowStockProducts : data?.outOfStockProducts)?.map((product) => {
                    const badge = getStockLevelBadge(product.stockLevel, product.reorderLevel);
                    return (
                      <tr key={product.productId} className="hover:bg-muted">
                        <td className="px-6 py-4 font-medium text-foreground">{product.productName}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{product.sku}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn('font-semibold', product.stockLevel === 0 ? 'text-destructive' : 'text-warning')}>
                            {formatNumber(product.stockLevel)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-muted-foreground">{formatNumber(product.reorderLevel)}</td>
                        <td className="px-6 py-4 text-right text-sm text-foreground">{formatCurrency(product.value)}</td>
                        <td className="px-6 py-4">
                          <span className={cn('inline-flex px-2 py-1 text-xs font-medium rounded-full border', badge.className)}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {(activeTab === 'fast-moving' || activeTab === 'slow-moving') && (
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">SKU</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">Units Sold</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">Current Stock</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">Days in Stock</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">Turnover Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(activeTab === 'fast-moving' ? data?.topMovingProducts : data?.slowMovingProducts)?.map((product) => (
                    <tr key={product.productId} className="hover:bg-muted">
                      <td className="px-6 py-4 font-medium text-foreground">{product.productName}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{product.sku}</td>
                      <td className="px-6 py-4 text-right text-sm text-foreground">{formatNumber(product.unitsSold)}</td>
                      <td className="px-6 py-4 text-right text-sm text-foreground">{formatNumber(product.currentStock)}</td>
                      <td className="px-6 py-4 text-right text-sm text-muted-foreground">{product.daysInStock}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                          product.turnoverRate >= 2 ? 'bg-success-muted text-success-foreground' :
                          product.turnoverRate >= 1 ? 'bg-warning-muted text-warning' :
                          'bg-destructive/10 text-destructive'
                        )}>
                          {product.turnoverRate.toFixed(2)}x
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Category Details */}
        <div className="bg-card rounded-xl border border-border/60 shadow-sm hover:shadow-xl hover:border-primary/30/50 transition-all duration-300">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Inventory by Category</h3>
            <p className="text-sm text-muted-foreground">Stock distribution across product categories</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">Products</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">Total Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">Total Value</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">Low Stock Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.inventoryByCategory?.map((category) => (
                  <tr key={category.categoryId} className="hover:bg-muted">
                    <td className="px-6 py-4 font-medium text-foreground">{category.categoryName}</td>
                    <td className="px-6 py-4 text-right text-sm text-foreground">{formatNumber(category.productCount)}</td>
                    <td className="px-6 py-4 text-right text-sm text-foreground">{formatNumber(category.totalStock)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-foreground">{formatCurrency(category.totalValue)}</td>
                    <td className="px-6 py-4 text-right">
                      {category.lowStockCount > 0 ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-warning-muted text-warning-foreground rounded-full">
                          {category.lowStockCount}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </PermissionGate>
  );
}
