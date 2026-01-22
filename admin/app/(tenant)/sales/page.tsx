'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  CreditCard,
  Download,
  BarChart3,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import { useDialog } from '@/contexts/DialogContext';
import { useAdminCurrency } from '@/hooks/useAdminCurrency';

interface TimeSeriesData {
  date: string;
  value: number;
  count?: number;
}

interface ProductSales {
  productId: string;
  productName: string;
  sku: string;
  unitsSold: number;
  revenue: number;
  averagePrice: number;
}

interface CategorySales {
  categoryId: string;
  categoryName: string;
  productCount: number;
  unitsSold: number;
  revenue: number;
  orderCount: number;
}

interface StatusRevenue {
  status: string;
  orderCount: number;
  totalRevenue: number;
  percentage: number;
}

interface PaymentMethodStats {
  method: string;
  orderCount: number;
  totalAmount: number;
  percentage: number;
  successRate: number;
}

interface SalesDashboard {
  dateRange: {
    from: string;
    to: string;
  };
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
  totalItemsSold: number;
  revenueChange: number;
  ordersChange: number;
  aovChange: number;
  revenueByDay: TimeSeriesData[];
  ordersByDay: TimeSeriesData[];
  topProducts: ProductSales[];
  topCategories: CategorySales[];
  revenueByStatus: StatusRevenue[];
  paymentMethods: PaymentMethodStats[];
}

// Mock data
const generateMockDashboard = (days: number): SalesDashboard => {
  const revenueByDay: TimeSeriesData[] = [];
  const ordersByDay: TimeSeriesData[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const revenue = Math.random() * 50000 + 10000;
    const count = Math.floor(Math.random() * 100) + 20;

    revenueByDay.push({
      date: date.toISOString(),
      value: revenue,
      count,
    });

    ordersByDay.push({
      date: date.toISOString(),
      value: count,
    });
  }

  return {
    dateRange: {
      from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
    },
    totalRevenue: 1250000,
    averageOrderValue: 185.50,
    totalOrders: 6742,
    totalItemsSold: 15823,
    revenueChange: 12.5,
    ordersChange: 8.3,
    aovChange: 3.8,
    revenueByDay,
    ordersByDay,
    topProducts: [
      {
        productId: '1',
        productName: 'Premium Wireless Headphones',
        sku: 'WH-1000',
        unitsSold: 456,
        revenue: 137000,
        averagePrice: 300.44,
      },
      {
        productId: '2',
        productName: 'Smart Watch Pro',
        sku: 'SW-PRO-001',
        unitsSold: 342,
        revenue: 102600,
        averagePrice: 300,
      },
      {
        productId: '3',
        productName: 'Bluetooth Speaker XL',
        sku: 'BS-XL-500',
        unitsSold: 521,
        revenue: 78150,
        averagePrice: 150,
      },
      {
        productId: '4',
        productName: 'USB-C Hub Adapter',
        sku: 'UC-HUB-8',
        unitsSold: 892,
        revenue: 44600,
        averagePrice: 50,
      },
      {
        productId: '5',
        productName: 'Laptop Stand',
        sku: 'LS-ALU-001',
        unitsSold: 678,
        revenue: 33900,
        averagePrice: 50,
      },
    ],
    topCategories: [
      {
        categoryId: '1',
        categoryName: 'Electronics',
        productCount: 156,
        unitsSold: 2345,
        revenue: 450000,
        orderCount: 1890,
      },
      {
        categoryId: '2',
        categoryName: 'Accessories',
        productCount: 234,
        unitsSold: 4567,
        revenue: 280000,
        orderCount: 2340,
      },
      {
        categoryId: '3',
        categoryName: 'Clothing',
        productCount: 312,
        unitsSold: 3456,
        revenue: 210000,
        orderCount: 1789,
      },
      {
        categoryId: '4',
        categoryName: 'Home & Living',
        productCount: 189,
        unitsSold: 2890,
        revenue: 175000,
        orderCount: 1456,
      },
      {
        categoryId: '5',
        categoryName: 'Sports & Outdoors',
        productCount: 145,
        unitsSold: 1567,
        revenue: 135000,
        orderCount: 987,
      },
    ],
    revenueByStatus: [
      {
        status: 'COMPLETED',
        orderCount: 5234,
        totalRevenue: 980000,
        percentage: 78.4,
      },
      {
        status: 'PROCESSING',
        orderCount: 892,
        totalRevenue: 165000,
        percentage: 13.2,
      },
      {
        status: 'PENDING',
        orderCount: 456,
        totalRevenue: 85000,
        percentage: 6.8,
      },
      {
        status: 'CANCELLED',
        orderCount: 160,
        totalRevenue: 20000,
        percentage: 1.6,
      },
    ],
    paymentMethods: [
      {
        method: 'Credit Card',
        orderCount: 4234,
        totalAmount: 785000,
        percentage: 62.8,
        successRate: 98.5,
      },
      {
        method: 'PayPal',
        orderCount: 1567,
        totalAmount: 290000,
        percentage: 23.2,
        successRate: 99.2,
      },
      {
        method: 'Debit Card',
        orderCount: 678,
        totalAmount: 125000,
        percentage: 10.0,
        successRate: 97.8,
      },
      {
        method: 'Bank Transfer',
        orderCount: 263,
        totalAmount: 50000,
        percentage: 4.0,
        successRate: 95.4,
      },
    ],
  };
};

const dateRangeOptions = [
  { value: 'today', label: 'Today', days: 1 },
  { value: 'yesterday', label: 'Yesterday', days: 1 },
  { value: 'last7days', label: 'Last 7 Days', days: 7 },
  { value: 'last30days', label: 'Last 30 Days', days: 30 },
  { value: 'thisMonth', label: 'This Month', days: 30 },
  { value: 'lastMonth', label: 'Last Month', days: 30 },
  { value: 'thisYear', label: 'This Year', days: 365 },
];

export default function SalesDashboardPage() {
  const { showAlert } = useDialog();
  const { formatPrice, isConverted, adminCurrency, adminCurrencyInfo } = useAdminCurrency();
  const [dashboard, setDashboard] = useState<SalesDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last30days');

  useEffect(() => {
    loadDashboard();
  }, [dateRange]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      const selectedRange = dateRangeOptions.find((opt) => opt.value === dateRange);
      setDashboard(generateMockDashboard(selectedRange?.days || 30));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use admin currency formatting - automatically converts to admin's preferred currency
  const formatCurrency = (amount: number) => {
    return formatPrice(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const renderChangeIndicator = (change: number) => {
    if (change === 0) return null;
    const isPositive = change > 0;
    return (
      <div
        className={cn(
          'flex items-center gap-1 text-sm font-semibold',
          isPositive ? 'text-success' : 'text-destructive'
        )}
      >
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span>{formatPercentage(change)}</span>
      </div>
    );
  };

  const handleExport = async (format: 'csv' | 'json') => {
    await showAlert({ title: 'Success', message: `Exporting sales report as ${format.toUpperCase()}...` });
  };

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="bg-card rounded-lg border border-border p-12 text-center text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.ANALYTICS_VIEW}
      fallback="styled"
      fallbackTitle="Sales Access Required"
      fallbackDescription="You don't have the required permissions to view sales. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Sales Dashboard"
          description={
            isConverted
              ? `View comprehensive sales analytics (showing in ${adminCurrencyInfo?.name || adminCurrency})`
              : "View comprehensive sales analytics and performance metrics"
          }
          breadcrumbs={[
            { label: 'Home', href: '/', icon: Home },
            { label: 'Sales Dashboard', icon: BarChart3 },
          ]}
          actions={
            <div className="flex gap-3">
              <Select
                value={dateRange}
                onChange={setDateRange}
                options={dateRangeOptions.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />
              <Button variant="outline" onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport('json')}>
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {formatCurrency(dashboard.totalRevenue)}
            </p>
            <div className="mt-2">{renderChangeIndicator(dashboard.revenueChange)}</div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-violet-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              {formatNumber(dashboard.totalOrders)}
            </p>
            <div className="mt-2">{renderChangeIndicator(dashboard.ordersChange)}</div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Average Order Value</p>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {formatCurrency(dashboard.averageOrderValue)}
            </p>
            <div className="mt-2">{renderChangeIndicator(dashboard.aovChange)}</div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Items Sold</p>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-warning" />
              </div>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {formatNumber(dashboard.totalItemsSold)}
            </p>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-violet-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Revenue Trend</h3>
              <p className="text-sm text-muted-foreground">Daily revenue over the selected period</p>
            </div>
          </div>
          <div className="h-64 flex items-end gap-1">
            {dashboard.revenueByDay.map((data, index) => {
              const maxRevenue = Math.max(...dashboard.revenueByDay.map((d) => d.value));
              const height = (data.value / maxRevenue) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-blue-600 to-violet-600 rounded-t hover:opacity-80 transition-opacity cursor-pointer relative group"
                  style={{ height: `${height}%`, minHeight: '4px' }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-foreground text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {new Date(data.date).toLocaleDateString()}
                    <br />
                    {formatCurrency(data.value)}
                    <br />
                    {data.count} orders
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products and Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-gray-50 to-blue-50/30">
              <h3 className="text-lg font-bold text-foreground">Top Products</h3>
              <p className="text-sm text-muted-foreground">Best performing products by revenue</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                      Units
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboard.topProducts.map((product) => (
                    <tr key={product.productId} className="hover:bg-muted transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{product.productName}</p>
                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-foreground">
                        {formatNumber(product.unitsSold)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-foreground">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-gray-50 to-blue-50/30">
              <h3 className="text-lg font-bold text-foreground">Top Categories</h3>
              <p className="text-sm text-muted-foreground">Best performing categories by revenue</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                      Category
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
                  {dashboard.topCategories.map((category) => (
                    <tr key={category.categoryId} className="hover:bg-muted transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{category.categoryName}</p>
                        <p className="text-sm text-muted-foreground">{category.productCount} products</p>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-foreground">
                        {formatNumber(category.orderCount)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-foreground">
                        {formatCurrency(category.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Revenue by Status and Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Status */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-2">Revenue by Order Status</h3>
            <p className="text-sm text-muted-foreground mb-6">Breakdown of revenue by order status</p>
            <div className="space-y-4">
              {dashboard.revenueByStatus.map((status) => (
                <div
                  key={status.status}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                      {status.status}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(status.orderCount)} orders
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(status.totalRevenue)}</p>
                    <p className="text-sm text-muted-foreground">{status.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-2">Payment Methods</h3>
            <p className="text-sm text-muted-foreground mb-6">Breakdown by payment method</p>
            <div className="space-y-4">
              {dashboard.paymentMethods.map((payment) => (
                <div
                  key={payment.method}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-success-muted text-success-foreground border border-success/30">
                      {payment.method}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(payment.orderCount)} orders
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(payment.totalAmount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.percentage.toFixed(1)}% • {payment.successRate.toFixed(1)}% success
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </PermissionGate>
  );
}
