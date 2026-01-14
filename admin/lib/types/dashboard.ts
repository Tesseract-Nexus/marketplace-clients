export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: number;
  gridSpan: 'full' | 'half';
  enabled: boolean;
}

export type WidgetType =
  | 'stats-grid'
  | 'order-status-chart'
  | 'revenue-trend-chart'
  | 'customer-satisfaction'
  | 'top-products'
  | 'recent-orders'
  | 'low-stock-alert'
  | 'inventory-stock-levels'
  | 'activity-feed'
  | 'quick-actions';

export const DEFAULT_WIDGET_ORDER: DashboardWidget[] = [
  { id: 'stats', type: 'stats-grid', title: 'Stats Overview', position: 0, gridSpan: 'full', enabled: true },
  { id: 'order-status', type: 'order-status-chart', title: 'Order Status', position: 1, gridSpan: 'half', enabled: true },
  { id: 'revenue-trend', type: 'revenue-trend-chart', title: 'Revenue Trend', position: 2, gridSpan: 'half', enabled: true },
  { id: 'satisfaction', type: 'customer-satisfaction', title: 'Customer Satisfaction', position: 3, gridSpan: 'half', enabled: true },
  { id: 'top-products', type: 'top-products', title: 'Top Products', position: 4, gridSpan: 'half', enabled: true },
  { id: 'recent-orders', type: 'recent-orders', title: 'Recent Orders', position: 5, gridSpan: 'half', enabled: true },
  { id: 'low-stock', type: 'low-stock-alert', title: 'Low Stock Alert', position: 6, gridSpan: 'half', enabled: true },
  { id: 'inventory', type: 'inventory-stock-levels', title: 'Inventory Levels', position: 7, gridSpan: 'full', enabled: true },
  { id: 'activity', type: 'activity-feed', title: 'Activity Feed', position: 8, gridSpan: 'full', enabled: true },
  { id: 'quick-actions', type: 'quick-actions', title: 'Quick Actions', position: 9, gridSpan: 'full', enabled: true },
];

// Dashboard data types (moved from page.tsx for reusability)
export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalProducts: number;
  productsChange: number;
  totalCustomers: number;
  customersChange: number;
}

export interface ActivityItem {
  id: string;
  type: 'order' | 'customer' | 'review' | 'product' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  lowStockThreshold: number;
  maxStock?: number;
}

export interface OrderAnalyticsData {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface RevenueTrendItem {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProductItem {
  name: string;
  units: number;
  revenue: number;
}

export interface SatisfactionData {
  avgRating: number;
  totalReviews: number;
  satisfactionRate: number;
}

export interface RecentOrder {
  id: string;
  orderNumber?: string;
  status: string;
  total: string | number;
  createdAt: string;
  customer?: { name?: string };
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  lowStockThreshold?: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  lowStockProducts: LowStockProduct[];
  activityFeed: ActivityItem[];
  inventoryData: InventoryItem[];
  orderAnalytics: OrderAnalyticsData;
  revenueTrend: RevenueTrendItem[];
  topProducts: TopProductItem[];
  satisfaction: SatisfactionData;
}
