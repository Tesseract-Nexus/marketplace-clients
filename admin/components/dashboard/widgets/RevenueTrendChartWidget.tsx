'use client';

import React, { useMemo, useCallback } from 'react';
import { TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { SafeChartContainer } from '@/components/ui/safe-chart-container';
import {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardDescription,
  DashboardCardContent,
} from './shared';
import { DashboardData } from '@/lib/types/dashboard';
import { useAdminCurrency } from '@/hooks/useAdminCurrency';
import { formatCompactCurrency } from '@/lib/api/currency';
import { AdminUIText } from '@/components/translation/AdminTranslatedText';

interface RevenueTrendChartWidgetProps {
  data: DashboardData;
}

export function RevenueTrendChartWidget({ data }: RevenueTrendChartWidgetProps) {
  const { revenueTrend } = data;
  const { formatPrice, convertPrice, adminCurrency } = useAdminCurrency();

  const revenueTrendSummary = useMemo(() => ({
    total: revenueTrend.reduce((sum, day) => sum + day.revenue, 0),
    orders: revenueTrend.reduce((sum, day) => sum + day.orders, 0),
  }), [revenueTrend]);

  // Convert chart data to admin currency
  const convertedRevenueTrend = useMemo(() =>
    revenueTrend.map(day => ({
      ...day,
      revenue: convertPrice(day.revenue),
    })),
  [revenueTrend, convertPrice]);

  // Custom axis formatter for converted values
  const formatAxisValue = useCallback((value: number) =>
    formatCompactCurrency(value, adminCurrency),
  [adminCurrency]);

  // Custom tooltip for converted values
  const ChartTooltip = useCallback(({ active, payload, label }: {
    active?: boolean;
    payload?: readonly { value?: number | string; name?: string }[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
          {payload.map((item, index) => (
            <p key={index} className="text-sm text-muted-foreground">
              {item.name === 'revenue' ? 'Revenue: ' : 'Orders: '}
              <span className="font-semibold text-emerald-600">
                {item.name === 'revenue' && typeof item.value === 'number'
                  ? formatPrice(item.value, adminCurrency) // Already converted, just format
                  : item.value
                }
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  }, [formatPrice, adminCurrency]);

  return (
    <DashboardCard className="border-border/50 hover:border-emerald-300/50 transition-all duration-300">
      <DashboardCardHeader className="pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg ring-4 ring-emerald-500/20">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <DashboardCardTitle className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                <AdminUIText text="Revenue Trend" />
              </DashboardCardTitle>
              <DashboardCardDescription className="text-xs text-muted-foreground font-medium"><AdminUIText text="Last 7 days performance" /></DashboardCardDescription>
            </div>
          </div>
        </div>
      </DashboardCardHeader>
      <DashboardCardContent className="pt-4">
        {revenueTrend.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm"><AdminUIText text="No revenue data available" /></div>
        ) : (
          <SafeChartContainer height={250} minHeight={200}>
            <AreaChart data={convertedRevenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
                tickFormatter={formatAxisValue}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                name="revenue"
              />
            </AreaChart>
          </SafeChartContainer>
        )}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-600">
              {formatPrice(revenueTrendSummary.total)}
            </p>
            <p className="text-xs text-muted-foreground"><AdminUIText text="7-Day Total" /></p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-primary">
              {revenueTrendSummary.orders}
            </p>
            <p className="text-xs text-muted-foreground"><AdminUIText text="Orders" /></p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-violet-600">
              {formatPrice(revenueTrendSummary.total / Math.max(revenueTrendSummary.orders, 1))}
            </p>
            <p className="text-xs text-muted-foreground"><AdminUIText text="Avg/Order" /></p>
          </div>
        </div>
      </DashboardCardContent>
    </DashboardCard>
  );
}
