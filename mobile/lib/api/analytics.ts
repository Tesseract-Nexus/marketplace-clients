import { apiClient } from './client';

export interface AnalyticsOverview {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  average_order_value: number;
  revenue_growth: number;
  orders_growth: number;
  customers_growth: number;
}

export interface SalesAnalytics {
  daily: { date: string; revenue: number; orders: number }[];
  weekly: { week: string; revenue: number; orders: number }[];
  monthly: { month: string; revenue: number; orders: number }[];
}

export interface CustomerAnalytics {
  new_customers: number;
  returning_customers: number;
  customer_retention_rate: number;
  average_lifetime_value: number;
}

export interface InventoryAnalytics {
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  top_selling_products: { id: string; name: string; quantity_sold: number }[];
}

export const analyticsApi = {
  getOverview: async (tenantId: string): Promise<AnalyticsOverview> => {
    const response = await apiClient.get(`/analytics/overview`, {
      headers: { 'X-Tenant-ID': tenantId },
    });
    return response.data;
  },

  getSales: async (tenantId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<SalesAnalytics> => {
    const response = await apiClient.get(`/analytics/sales`, {
      params: { period },
      headers: { 'X-Tenant-ID': tenantId },
    });
    return response.data;
  },

  getCustomers: async (tenantId: string): Promise<CustomerAnalytics> => {
    const response = await apiClient.get(`/analytics/customers`, {
      headers: { 'X-Tenant-ID': tenantId },
    });
    return response.data;
  },

  getInventory: async (tenantId: string): Promise<InventoryAnalytics> => {
    const response = await apiClient.get(`/analytics/inventory`, {
      headers: { 'X-Tenant-ID': tenantId },
    });
    return response.data;
  },
};
