'use client';

import React from 'react';
import { WidgetType, DashboardData } from '@/lib/types/dashboard';
import {
  StatsGridWidget,
  OrderStatusChartWidget,
  RevenueTrendChartWidget,
  CustomerSatisfactionWidget,
  TopProductsWidget,
  RecentOrdersWidget,
  LowStockAlertWidget,
  InventoryStockLevelsWidget,
  ActivityFeedWidget,
  QuickActionsWidget,
} from './widgets';

interface WidgetComponentProps {
  data: DashboardData;
}

type WidgetComponent = React.ComponentType<WidgetComponentProps> | React.ComponentType<object>;

export const widgetRegistry: Record<WidgetType, WidgetComponent> = {
  'stats-grid': StatsGridWidget,
  'order-status-chart': OrderStatusChartWidget,
  'revenue-trend-chart': RevenueTrendChartWidget,
  'customer-satisfaction': CustomerSatisfactionWidget,
  'top-products': TopProductsWidget,
  'recent-orders': RecentOrdersWidget,
  'low-stock-alert': LowStockAlertWidget,
  'inventory-stock-levels': InventoryStockLevelsWidget,
  'activity-feed': ActivityFeedWidget,
  'quick-actions': QuickActionsWidget,
};

interface RenderWidgetProps {
  type: WidgetType;
  data: DashboardData;
}

export function RenderWidget({ type, data }: RenderWidgetProps) {
  const WidgetComponent = widgetRegistry[type];

  if (!WidgetComponent) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Unknown widget type: {type}
      </div>
    );
  }

  // QuickActionsWidget doesn't need data prop
  if (type === 'quick-actions') {
    return <QuickActionsWidget />;
  }

  return <WidgetComponent data={data} />;
}
