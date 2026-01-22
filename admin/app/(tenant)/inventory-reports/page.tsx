'use client';

import React, { useState } from 'react';
import {
  Download,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';

interface InventoryItem {
  productId: string;
  productName: string;
  sku: string;
  stockLevel: number;
  reorderLevel: number;
  value: number;
  lastRestocked?: string;
}

interface InventoryMovement {
  productId: string;
  productName: string;
  sku: string;
  unitsSold: number;
  daysInStock: number;
  turnoverRate: number;
  currentStock: number;
}

interface CategoryInventory {
  categoryId: string;
  categoryName: string;
  productCount: number;
  totalStock: number;
  totalValue: number;
  lowStockCount: number;
}

// Mock Data
const MOCK_REPORT = {
  totalProducts: 1245,
  totalSkus: 3890,
  totalValue: 1234567.89,
  lowStockCount: 45,
  outOfStockCount: 12,
  lowStockProducts: [
    {
      productId: '1',
      productName: 'Premium Wireless Headphones',
      sku: 'PWH-001',
      stockLevel: 8,
      reorderLevel: 20,
      value: 1999.99,
      lastRestocked: '2024-11-15',
    },
    {
      productId: '2',
      productName: 'Smart Watch Pro',
      sku: 'SWP-002',
      stockLevel: 15,
      reorderLevel: 30,
      value: 2999.99,
      lastRestocked: '2024-11-20',
    },
    {
      productId: '3',
      productName: 'Bluetooth Speaker',
      sku: 'BTS-003',
      stockLevel: 5,
      reorderLevel: 15,
      value: 799.99,
      lastRestocked: '2024-11-25',
    },
  ],
  outOfStockProducts: [
    {
      productId: '4',
      productName: 'Gaming Keyboard RGB',
      sku: 'GKR-004',
      stockLevel: 0,
      reorderLevel: 25,
      value: 0,
      lastRestocked: '2024-10-05',
    },
    {
      productId: '5',
      productName: 'USB-C Hub',
      sku: 'UCH-005',
      stockLevel: 0,
      reorderLevel: 50,
      value: 0,
      lastRestocked: '2024-09-20',
    },
  ],
  topMovingProducts: [
    {
      productId: '6',
      productName: 'Wireless Mouse',
      sku: 'WM-006',
      unitsSold: 456,
      daysInStock: 30,
      turnoverRate: 15.2,
      currentStock: 120,
    },
    {
      productId: '7',
      productName: 'Phone Case',
      sku: 'PC-007',
      unitsSold: 389,
      daysInStock: 30,
      turnoverRate: 13.0,
      currentStock: 200,
    },
    {
      productId: '8',
      productName: 'Screen Protector',
      sku: 'SP-008',
      unitsSold: 312,
      daysInStock: 30,
      turnoverRate: 10.4,
      currentStock: 180,
    },
  ],
  slowMovingProducts: [
    {
      productId: '9',
      productName: 'Vintage Camera',
      sku: 'VC-009',
      unitsSold: 5,
      daysInStock: 90,
      turnoverRate: 0.056,
      currentStock: 45,
    },
    {
      productId: '10',
      productName: 'Film Projector',
      sku: 'FP-010',
      unitsSold: 3,
      daysInStock: 90,
      turnoverRate: 0.033,
      currentStock: 30,
    },
  ],
  inventoryByCategory: [
    {
      categoryId: '1',
      categoryName: 'Electronics',
      productCount: 234,
      totalStock: 5678,
      totalValue: 567890.00,
      lowStockCount: 15,
    },
    {
      categoryId: '2',
      categoryName: 'Accessories',
      productCount: 456,
      totalStock: 12340,
      totalValue: 234567.00,
      lowStockCount: 20,
    },
    {
      categoryId: '3',
      categoryName: 'Home & Garden',
      productCount: 189,
      totalStock: 2890,
      totalValue: 189234.00,
      lowStockCount: 8,
    },
  ],
};

export default function InventoryReportsPage() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'movement' | 'categories' | 'turnover'>('alerts');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getStockStatusColor = (stockLevel: number, reorderLevel: number) => {
    if (stockLevel === 0) return 'bg-destructive/10 text-destructive border-destructive/30';
    if (stockLevel <= reorderLevel) return 'bg-warning-muted text-warning border-warning/30';
    return 'bg-success-muted text-success-foreground border-success/30';
  };

  const getStockStatusLabel = (stockLevel: number, reorderLevel: number) => {
    if (stockLevel === 0) return 'Out of Stock';
    if (stockLevel <= reorderLevel) return 'Low Stock';
    return 'In Stock';
  };

  const handleExport = (format: 'csv' | 'json') => {
    // TODO: Implement export functionality
  };

  return (
    <PermissionGate
      permission={Permission.ANALYTICS_VIEW}
      fallback="styled"
      fallbackTitle="Inventory Reports Access Required"
      fallbackDescription="You don't have the required permissions to view inventory reports. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Inventory Reports"
          description="Monitor stock levels, turnover rates, and inventory value"
          breadcrumbs={[
            { label: 'Home', href: '/', icon: Home },
            { label: 'Inventory', icon: Package },
            { label: 'Reports', icon: BarChart3 },
          ]}
          actions={
            <div className="flex gap-3">
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
              <p className="text-sm font-medium text-muted-foreground">Total Products</p>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-primary">
              {formatNumber(MOCK_REPORT.totalProducts)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{formatNumber(MOCK_REPORT.totalSkus)} SKUs</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Inventory Value</p>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
            </div>
            <p className="text-3xl font-bold text-success">
              {formatCurrency(MOCK_REPORT.totalValue)}
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
            </div>
            <p className="text-3xl font-bold text-warning">
              {formatNumber(MOCK_REPORT.lowStockCount)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Need reordering</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
              <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <p className="text-3xl font-bold text-destructive">
              {formatNumber(MOCK_REPORT.outOfStockCount)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Immediate attention</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="border-b border-border">
            <nav className="flex">
              <Button
                onClick={() => setActiveTab('alerts')}
                className={cn(
                  'flex-1 py-4 px-6 text-sm font-semibold border-b-2 transition-colors',
                  activeTab === 'alerts'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                Stock Alerts
              </Button>
              <Button
                onClick={() => setActiveTab('movement')}
                className={cn(
                  'flex-1 py-4 px-6 text-sm font-semibold border-b-2 transition-colors',
                  activeTab === 'movement'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                Product Movement
              </Button>
              <Button
                onClick={() => setActiveTab('categories')}
                className={cn(
                  'flex-1 py-4 px-6 text-sm font-semibold border-b-2 transition-colors',
                  activeTab === 'categories'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                By Category
              </Button>
              <Button
                onClick={() => setActiveTab('turnover')}
                className={cn(
                  'flex-1 py-4 px-6 text-sm font-semibold border-b-2 transition-colors',
                  activeTab === 'turnover'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                Turnover Rate
              </Button>
            </nav>
          </div>

          <div className="p-6">
            {/* Stock Alerts Tab */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                {/* Low Stock Products */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <h3 className="text-lg font-bold text-foreground">Low Stock Products</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                            Product
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Stock Level
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Reorder Level
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {MOCK_REPORT.lowStockProducts.map((product) => (
                          <tr key={product.productId} className="hover:bg-muted">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-foreground">{product.productName}</p>
                              <p className="text-sm text-muted-foreground">{product.sku}</p>
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-foreground">
                              {formatNumber(product.stockLevel)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-foreground">
                              {formatNumber(product.reorderLevel)}
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-foreground">
                              {formatCurrency(product.value)}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={cn(
                                  'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border',
                                  getStockStatusColor(product.stockLevel, product.reorderLevel)
                                )}
                              >
                                {getStockStatusLabel(product.stockLevel, product.reorderLevel)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Out of Stock Products */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <h3 className="text-lg font-bold text-foreground">Out of Stock Products</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                            Product
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Reorder Level
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                            Last Restocked
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {MOCK_REPORT.outOfStockProducts.map((product) => (
                          <tr key={product.productId} className="hover:bg-muted">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-foreground">{product.productName}</p>
                              <p className="text-sm text-muted-foreground">{product.sku}</p>
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-foreground">
                              {formatNumber(product.reorderLevel)}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {product.lastRestocked
                                ? new Date(product.lastRestocked).toLocaleDateString()
                                : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Product Movement Tab */}
            {activeTab === 'movement' && (
              <div className="space-y-6">
                {/* Top Moving Products */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-success" />
                    <h3 className="text-lg font-bold text-foreground">Top Moving Products</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                            Product
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Units Sold
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Days in Stock
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Turnover Rate
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Current Stock
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {MOCK_REPORT.topMovingProducts.map((product) => (
                          <tr key={product.productId} className="hover:bg-muted">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-foreground">{product.productName}</p>
                              <p className="text-sm text-muted-foreground">{product.sku}</p>
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-success">
                              {formatNumber(product.unitsSold)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-foreground">
                              {product.daysInStock}
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-foreground">
                              {product.turnoverRate.toFixed(1)}x
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-foreground">
                              {formatNumber(product.currentStock)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Slow Moving Products */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="h-5 w-5 text-warning" />
                    <h3 className="text-lg font-bold text-foreground">Slow Moving Products</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                            Product
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Units Sold
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Days in Stock
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Turnover Rate
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                            Current Stock
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {MOCK_REPORT.slowMovingProducts.map((product) => (
                          <tr key={product.productId} className="hover:bg-muted">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-foreground">{product.productName}</p>
                              <p className="text-sm text-muted-foreground">{product.sku}</p>
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-warning">
                              {formatNumber(product.unitsSold)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-foreground">
                              {product.daysInStock}
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-foreground">
                              {product.turnoverRate.toFixed(3)}x
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-foreground">
                              {formatNumber(product.currentStock)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* By Category Tab */}
            {activeTab === 'categories' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Category
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                        Products
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                        Total Stock
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                        Total Value
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                        Low Stock Items
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {MOCK_REPORT.inventoryByCategory.map((category) => (
                      <tr key={category.categoryId} className="hover:bg-muted">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground">{category.categoryName}</p>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-foreground">
                          {formatNumber(category.productCount)}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-foreground">
                          {formatNumber(category.totalStock)}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-foreground">
                          {formatCurrency(category.totalValue)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-warning-muted text-warning border border-warning/30">
                            {formatNumber(category.lowStockCount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Turnover Rate Tab */}
            {activeTab === 'turnover' && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">Turnover Rate Analysis</h3>
                <p className="text-muted-foreground">
                  Detailed turnover rate metrics will be displayed here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </PermissionGate>
  );
}
