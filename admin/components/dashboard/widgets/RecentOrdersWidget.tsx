'use client';

import React from 'react';
import { ShoppingCart, Eye, CheckCircle, Activity, Clock, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardDescription,
  DashboardCardContent,
  DashboardBadge,
  getRelativeTime,
} from './shared';
import { DashboardData } from '@/lib/types/dashboard';
import { useAdminCurrency } from '@/hooks/useAdminCurrency';
import { AdminUIText } from '@/components/translation/AdminTranslatedText';

interface RecentOrdersWidgetProps {
  data: DashboardData;
}

export function RecentOrdersWidget({ data }: RecentOrdersWidgetProps) {
  const { recentOrders } = data;
  const { formatPrice } = useAdminCurrency();

  const getStatusIcon = (status: string) => {
    const normalizedStatus = (status || '').toLowerCase();
    switch (normalizedStatus) {
      case 'delivered':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'processing':
        return <Activity className="h-4 w-4 text-primary animate-pulse" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'shipped':
        return <Package className="h-4 w-4 text-primary" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = (status || '').toLowerCase();
    switch (normalizedStatus) {
      case 'delivered':
      case 'completed':
        return 'bg-success/10 text-success border-success/30';
      case 'processing':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'pending':
        return 'bg-warning-muted text-warning-foreground border-warning/30';
      case 'shipped':
        return 'bg-primary/10 text-primary border-primary/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusDisplayName = (status: string) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <DashboardCard className="border-border/50 hover:border-primary/50/50 transition-all duration-300 group">
      <DashboardCardHeader className="pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-primary shadow-lg ring-4 ring-primary/20">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <DashboardCardTitle className="text-lg font-bold text-primary">
                <AdminUIText text="Recent Orders" />
              </DashboardCardTitle>
              <DashboardCardDescription className="text-xs text-muted-foreground font-medium"><AdminUIText text="Latest transactions" /></DashboardCardDescription>
            </div>
          </div>
          <Link href="/orders">
            <Button variant="outline" className="text-foreground hover:text-primary hover:hover:bg-primary/5 text-xs h-8 bg-card border border-border hover:border-primary/50 shadow-sm hover:shadow transition-all">
              <Eye className="h-3 w-3 mr-1" />
              <AdminUIText text="View All" />
            </Button>
          </Link>
        </div>
      </DashboardCardHeader>
      <DashboardCardContent className="space-y-2">
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm"><AdminUIText text="No recent orders found" /></div>
        ) : (
          recentOrders.map((order) => (
            <div
              key={order.id}
              className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-primary/10/50 transition-all duration-200 cursor-pointer border border-transparent hover:border-primary/30"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getStatusIcon(order.status)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-xs text-foreground truncate">
                      {order.customer?.name || `Order #${order.orderNumber || order.id.slice(0,8)}`}
                    </p>
                    <DashboardBadge className={`text-[10px] px-1.5 py-0 h-4 ${getStatusColor(order.status)}`}>
                      {getStatusDisplayName(order.status)}
                    </DashboardBadge>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                  {formatPrice(typeof order.total === 'number' ? order.total : parseFloat(String(order.total)) || 0)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {getRelativeTime(order.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </DashboardCardContent>
    </DashboardCard>
  );
}
