'use client';

import React, { useMemo } from 'react';
import { ShoppingCart, Package, Users, DollarSign, Target } from 'lucide-react';
import {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardContent,
  formatNumber,
} from './shared';
import { DashboardData } from '@/lib/types/dashboard';
import { useAdminCurrency } from '@/hooks/useAdminCurrency';
import { useAdminTranslatedText } from '@/hooks/useAdminTranslatedText';

interface StatsGridWidgetProps {
  data: DashboardData;
}

export function StatsGridWidget({ data }: StatsGridWidgetProps) {
  const { stats, orderAnalytics } = data;
  const { formatPrice } = useAdminCurrency();

  // Translated labels
  const { translatedText: totalRevenueText } = useAdminTranslatedText('Total Revenue');
  const { translatedText: ordersText } = useAdminTranslatedText('Orders');
  const { translatedText: avgOrderValueText } = useAdminTranslatedText('Avg Order Value');
  const { translatedText: productsText } = useAdminTranslatedText('Products');
  const { translatedText: customersText } = useAdminTranslatedText('Customers');
  const { translatedText: allTimeRevenueText } = useAdminTranslatedText('All-time revenue');
  const { translatedText: totalOrdersText } = useAdminTranslatedText('Total orders');
  const { translatedText: perOrderAverageText } = useAdminTranslatedText('Per order average');
  const { translatedText: activeProductsText } = useAdminTranslatedText('Active products');
  const { translatedText: registeredUsersText } = useAdminTranslatedText('Registered users');

  const statsItems = useMemo(() => [
    {
      title: totalRevenueText,
      value: formatPrice(orderAnalytics?.totalRevenue || stats.totalRevenue),
      change: "+0%",
      icon: DollarSign,
      description: allTimeRevenueText,
      color: "success"
    },
    {
      title: ordersText,
      value: formatNumber(orderAnalytics?.totalOrders || stats.totalOrders),
      change: "+0%",
      icon: ShoppingCart,
      description: totalOrdersText,
      color: "blue"
    },
    {
      title: avgOrderValueText,
      value: formatPrice(orderAnalytics?.averageOrderValue || 0),
      change: "+0%",
      icon: Target,
      description: perOrderAverageText,
      color: "cyan"
    },
    {
      title: productsText,
      value: formatNumber(stats.totalProducts),
      change: "+0%",
      icon: Package,
      description: activeProductsText,
      color: "violet"
    },
    {
      title: customersText,
      value: formatNumber(stats.totalCustomers),
      change: "+0%",
      icon: Users,
      description: registeredUsersText,
      color: "amber"
    }
  ], [orderAnalytics, stats, formatPrice, totalRevenueText, ordersText, avgOrderValueText, productsText, customersText, allTimeRevenueText, totalOrdersText, perOrderAverageText, activeProductsText, registeredUsersText]);

  const colorMap: Record<string, { bgColor: string; light: string; ring: string; text: string }> = {
    success: { bgColor: 'bg-success', light: 'bg-success/10', ring: 'ring-success/20', text: 'text-success' },
    blue: { bgColor: 'bg-primary', light: 'bg-primary/10', ring: 'ring-primary/20', text: 'text-primary' },
    cyan: { bgColor: 'bg-accent', light: 'bg-accent', ring: 'ring-accent/20', text: 'text-accent-foreground' },
    violet: { bgColor: 'bg-primary', light: 'bg-primary/10', ring: 'ring-primary/20', text: 'text-primary' },
    amber: { bgColor: 'bg-warning', light: 'bg-warning-muted', ring: 'ring-warning/20', text: 'text-warning' },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statsItems.map((stat, index) => {
        const Icon = stat.icon;
        const colors = colorMap[stat.color];

        return (
          <DashboardCard
            key={index}
            className="group relative overflow-hidden border-border/50 hover:border-primary/50/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`absolute inset-0 ${colors.bgColor} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

            <DashboardCardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div className="space-y-2">
                <DashboardCardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </DashboardCardTitle>
                <div className={`w-8 h-1 rounded-full bg-primary group-hover:w-16 transition-all duration-500 shadow-lg`} />
              </div>
              <div className={`relative p-3 rounded-2xl ${colors.bgColor} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg ${colors.ring} ring-4`}>
                <Icon className="h-6 w-6 text-white drop-shadow-lg" />
                <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
              </div>
            </DashboardCardHeader>
            <DashboardCardContent className="relative z-10 space-y-4">
              <div className={`text-3xl font-bold text-primary mb-3 group-hover:scale-105 transition-transform duration-300`}>
                {stat.value}
              </div>
              <div className="flex items-center justify-between">
                <div className={`flex items-center text-sm px-3 py-1.5 rounded-full bg-muted border border-border shadow-sm`}>
                  <span className="font-bold text-muted-foreground">
                    {stat.change}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-semibold">{stat.description}</span>
              </div>
            </DashboardCardContent>
          </DashboardCard>
        );
      })}
    </div>
  );
}
