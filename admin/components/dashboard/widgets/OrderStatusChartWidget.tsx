'use client';

import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { SafeChartContainer } from '@/components/ui/safe-chart-container';
import {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardDescription,
  DashboardCardContent,
} from './shared';
import { DashboardData } from '@/lib/types/dashboard';
import { AdminUIText } from '@/components/translation/AdminTranslatedText';
import { useAdminTranslatedText } from '@/hooks/useAdminTranslatedText';

interface OrderStatusChartWidgetProps {
  data: DashboardData;
}

export function OrderStatusChartWidget({ data }: OrderStatusChartWidgetProps) {
  const { orderAnalytics } = data;

  // Translated status names
  const { translatedText: pendingText } = useAdminTranslatedText('Pending');
  const { translatedText: processingText } = useAdminTranslatedText('Processing');
  const { translatedText: shippedText } = useAdminTranslatedText('Shipped');
  const { translatedText: deliveredText } = useAdminTranslatedText('Delivered');
  const { translatedText: cancelledText } = useAdminTranslatedText('Cancelled');

  const orderStatusData = useMemo(() => {
    if (!orderAnalytics) return [];
    return [
      { name: pendingText, value: orderAnalytics.pendingOrders, color: '#f59e0b' },
      { name: processingText, value: orderAnalytics.processingOrders, color: '#3b82f6' },
      { name: shippedText, value: orderAnalytics.shippedOrders, color: '#8b5cf6' },
      { name: deliveredText, value: orderAnalytics.deliveredOrders, color: '#10b981' },
      { name: cancelledText, value: orderAnalytics.cancelledOrders, color: '#ef4444' },
    ].filter(item => item.value > 0);
  }, [orderAnalytics, pendingText, processingText, shippedText, deliveredText, cancelledText]);

  return (
    <DashboardCard className="border-border/50 hover:border-primary/50/50 transition-all duration-300">
      <DashboardCardHeader className="pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary shadow-lg ring-4 ring-primary/20">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <DashboardCardTitle className="text-lg font-bold text-primary">
                <AdminUIText text="Order Status" />
              </DashboardCardTitle>
              <DashboardCardDescription className="text-xs text-muted-foreground font-medium"><AdminUIText text="Distribution by status" /></DashboardCardDescription>
            </div>
          </div>
        </div>
      </DashboardCardHeader>
      <DashboardCardContent className="pt-4">
        {orderStatusData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm"><AdminUIText text="No order data available" /></div>
        ) : (
          <SafeChartContainer height={250} minHeight={200}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const chartData = payload[0].payload;
                    return (
                      <div className="bg-white/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium" style={{ color: chartData.color }}>{chartData.name}</p>
                        <p className="text-sm text-muted-foreground">{chartData.value} orders</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </SafeChartContainer>
        )}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {orderStatusData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </DashboardCardContent>
    </DashboardCard>
  );
}
