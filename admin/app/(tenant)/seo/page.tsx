'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  FileText,
  Image,
  Tag,
  Link2,
  Type,
} from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { PageLoading } from '@/components/common';
import { PageHeader } from '@/components/PageHeader';
import { StatsCard } from '@/components/data-listing/StatsCard';
import { QuickFilters } from '@/components/data-listing/QuickFilters';
import { LastUpdatedStatus } from '@/components/LastUpdatedStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SafeChartContainer } from '@/components/ui/safe-chart-container';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import Link from 'next/link';
import { useSEOAnalytics } from '@/hooks/useSEOAnalytics';
import {
  getSEOScoreColor,
  getSEOScoreLabel,
  type ProductSEOScore,
} from '@/lib/utils/seo-scoring';

type FilterId = 'all' | 'good' | 'fair' | 'poor';

const SCORE_COLORS: Record<string, string> = {
  Good: '#22c55e',
  Fair: '#f59e0b',
  Poor: '#ef4444',
};

export default function SEOAnalyzerPage() {
  const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useSEOAnalytics();
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');

  // Filter products based on active filter
  const filteredProducts = useMemo(() => {
    if (!data) return [];
    const products = data.productScores;
    switch (activeFilter) {
      case 'good':
        return products.filter((p) => p.score >= 80);
      case 'fair':
        return products.filter((p) => p.score >= 50 && p.score < 80);
      case 'poor':
        return products.filter((p) => p.score < 50);
      default:
        return products;
    }
  }, [data, activeFilter]);

  // Sort worst first
  const sortedProducts = useMemo(
    () => [...filteredProducts].sort((a, b) => a.score - b.score),
    [filteredProducts]
  );

  // Chart data
  const distributionData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Good', value: data.optimizedCount, color: SCORE_COLORS.Good },
      { name: 'Fair', value: data.needsWorkCount, color: SCORE_COLORS.Fair },
      { name: 'Poor', value: data.poorCount, color: SCORE_COLORS.Poor },
    ];
  }, [data]);

  const fieldCompletionData = useMemo(() => {
    if (!data) return [];
    const r = data.fieldCompletionRates;
    return [
      { name: 'Title', value: r.title },
      { name: 'Description', value: r.description },
      { name: 'Keywords', value: r.keywords },
      { name: 'Images', value: r.images },
      { name: 'OG Image', value: r.ogImage },
      { name: 'Slug', value: r.slug },
    ];
  }, [data]);

  const filters = useMemo(() => {
    if (!data) return [];
    return [
      { id: 'all' as const, label: 'All', count: data.totalProducts, color: 'default' as const },
      { id: 'poor' as const, label: 'Poor', icon: AlertCircle, count: data.poorCount, color: 'error' as const },
      { id: 'fair' as const, label: 'Fair', icon: AlertTriangle, count: data.needsWorkCount, color: 'warning' as const },
      { id: 'good' as const, label: 'Good', icon: CheckCircle, count: data.optimizedCount, color: 'success' as const },
    ];
  }, [data]);

  if (isLoading) {
    return <PageLoading message="Analyzing SEO data..." fullScreen />;
  }

  const scoreColor = data ? getSEOScoreColor(data.overallScore) : 'muted';
  const categoriesOptimized = data
    ? data.categoryScores.filter((c) => c.score >= 75).length
    : 0;

  return (
    <PermissionGate
      permission={Permission.PRODUCTS_READ}
      fallback="styled"
      fallbackTitle="SEO Analyzer"
      fallbackDescription="You don't have permission to view SEO analytics."
      loading={<PageLoading fullScreen />}
    >
      <div className="space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
        <PageHeader
          title="SEO Analyzer"
          description="Analyze and optimize your catalog SEO performance"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Catalog', href: '/products' },
            { label: 'SEO Analyzer' },
          ]}
          status={
            <LastUpdatedStatus
              lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : null}
              isFetching={isFetching}
            />
          }
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          }
        />

        {/* Stats Cards */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              label="Overall SEO Score"
              value={`${data.overallScore}%`}
              icon={Search}
              color={scoreColor}
            />
            <StatsCard
              label="Products Optimized"
              value={`${data.optimizedCount} / ${data.totalProducts}`}
              icon={CheckCircle}
              color="success"
            />
            <StatsCard
              label="Products Needing Work"
              value={data.needsWorkCount + data.poorCount}
              icon={AlertTriangle}
              color="warning"
            />
            <StatsCard
              label="Categories Optimized"
              value={`${categoriesOptimized} / ${data.totalCategories}`}
              icon={Tag}
              color="info"
            />
          </div>
        )}

        {/* Charts Row */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Score Distribution */}
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                SEO Score Distribution
              </h3>
              <SafeChartContainer height={280} minHeight={200}>
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number | undefined) => [`${value ?? 0} products`, 'Count']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {distributionData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </SafeChartContainer>
            </div>

            {/* Field Completion Rates */}
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Field Completion Rates
              </h3>
              <SafeChartContainer height={280} minHeight={200}>
                <BarChart data={fieldCompletionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number | undefined) => [`${value ?? 0}%`, 'Completion']}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </SafeChartContainer>
            </div>
          </div>
        )}

        {/* Products Table */}
        {data && (
          <div className="bg-card rounded-lg border border-border">
            <div className="p-4 sm:p-6 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Product SEO Scores
                </h3>
                <QuickFilters
                  filters={filters}
                  activeFilters={[activeFilter]}
                  onFilterToggle={(id) => setActiveFilter(id as FilterId)}
                  showClearAll={false}
                  size="sm"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Product
                    </th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground">
                      Score
                    </th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground hidden sm:table-cell">
                      <span title="Title"><Type className="w-3.5 h-3.5 mx-auto" /></span>
                    </th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground hidden sm:table-cell">
                      <span title="Description"><FileText className="w-3.5 h-3.5 mx-auto" /></span>
                    </th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground hidden md:table-cell">
                      <span title="Keywords"><Tag className="w-3.5 h-3.5 mx-auto" /></span>
                    </th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground hidden md:table-cell">
                      <span title="Images"><Image className="w-3.5 h-3.5 mx-auto" /></span>
                    </th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground hidden lg:table-cell">
                      <span title="Slug"><Link2 className="w-3.5 h-3.5 mx-auto" /></span>
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-muted-foreground"
                      >
                        No products found
                      </td>
                    </tr>
                  )}
                  {sortedProducts.map((product) => (
                    <ProductRow key={product.id} product={product} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}

function ProductRow({ product }: { product: ProductSEOScore }) {
  const color = getSEOScoreColor(product.score);
  const label = getSEOScoreLabel(product.score);

  const badgeVariant =
    color === 'success' ? 'success' : color === 'warning' ? 'warning' : 'error';

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="py-3 px-4">
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate max-w-[200px] sm:max-w-[300px]">
            {product.name}
          </p>
          {product.issues.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px] sm:max-w-[300px]">
              {product.issues[0]}
              {product.issues.length > 1 && ` (+${product.issues.length - 1} more)`}
            </p>
          )}
        </div>
      </td>
      <td className="py-3 px-3 text-center">
        <Badge variant={badgeVariant} className="text-xs">
          {product.score} {label}
        </Badge>
      </td>
      <td className="py-3 px-3 text-center hidden sm:table-cell">
        <StatusDot ok={product.hasTitle} />
      </td>
      <td className="py-3 px-3 text-center hidden sm:table-cell">
        <StatusDot ok={product.hasDescription} />
      </td>
      <td className="py-3 px-3 text-center hidden md:table-cell">
        <StatusDot ok={product.hasKeywords} />
      </td>
      <td className="py-3 px-3 text-center hidden md:table-cell">
        <StatusDot ok={product.hasImage} />
      </td>
      <td className="py-3 px-3 text-center hidden lg:table-cell">
        <StatusDot ok={product.hasSlug} />
      </td>
      <td className="py-3 px-4 text-right">
        <Link
          href={`/products/${product.id}/edit?step=6`}
          prefetch={false}
          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Edit SEO
          <ExternalLink className="w-3 h-3" />
        </Link>
      </td>
    </tr>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${
        ok ? 'bg-success' : 'bg-error/40'
      }`}
      title={ok ? 'Set' : 'Missing'}
    />
  );
}
