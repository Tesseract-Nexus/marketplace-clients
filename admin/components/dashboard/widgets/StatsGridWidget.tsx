'use client';

import React, { useMemo } from 'react';
import { ShoppingCart, Package, Users, DollarSign, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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

  // Helper to get change indicator with icon for accessibility
  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return {
        icon: TrendingUp,
        text: `+${change.toFixed(1)}%`,
        className: 'text-success bg-success/10 border-success/20',
        ariaLabel: `Up ${change.toFixed(1)} percent`,
      };
    } else if (change < 0) {
      return {
        icon: TrendingDown,
        text: `${change.toFixed(1)}%`,
        className: 'text-error bg-error/10 border-error/20',
        ariaLabel: `Down ${Math.abs(change).toFixed(1)} percent`,
      };
    }
    return null; // Don't show indicator for zero change
  };

  const statsItems = useMemo(() => [
    {
      title: totalRevenueText,
      value: formatPrice(orderAnalytics?.totalRevenue || stats.totalRevenue),
      change: stats.revenueChange,
      icon: DollarSign,
      description: allTimeRevenueText,
      color: "success"
    },
    {
      title: ordersText,
      value: formatNumber(orderAnalytics?.totalOrders || stats.totalOrders),
      change: stats.ordersChange,
      icon: ShoppingCart,
      description: totalOrdersText,
      color: "blue"
    },
    {
      title: avgOrderValueText,
      value: formatPrice(orderAnalytics?.averageOrderValue || 0),
      change: 0, // No change data for AOV
      icon: Target,
      description: perOrderAverageText,
      color: "cyan"
    },
    {
      title: productsText,
      value: formatNumber(stats.totalProducts),
      change: stats.productsChange,
      icon: Package,
      description: activeProductsText,
      color: "violet"
    },
    {
      title: customersText,
      value: formatNumber(stats.totalCustomers),
      change: stats.customersChange,
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
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {statsItems.map((stat, index) => {
        const Icon = stat.icon;
        const colors = colorMap[stat.color];
        const changeIndicator = getChangeIndicator(stat.change);

        return (
          <DashboardCard
            key={index}
            className={cn(
              "group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
              // Make last item span full width on odd counts for mobile
              index === statsItems.length - 1 && statsItems.length % 2 !== 0 && "col-span-2 sm:col-span-1"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`absolute inset-0 ${colors.bgColor} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
            <div className="absolute -right-8 -top-8 w-24 h-24 sm:w-32 sm:h-32 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

            <DashboardCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-4 relative z-10">
              <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
                <DashboardCardTitle className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  {stat.title}
                </DashboardCardTitle>
                <div className="w-6 sm:w-8 h-0.5 sm:h-1 rounded-full bg-primary group-hover:w-12 sm:group-hover:w-16 transition-all duration-500 shadow-lg" />
              </div>
              <div className={cn(
                "relative p-2 sm:p-3 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-all duration-300 shadow-md",
                colors.bgColor,
                colors.ring,
                "ring-2 sm:ring-4"
              )}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white drop-shadow-lg" aria-hidden="true" />
              </div>
            </DashboardCardHeader>
            <DashboardCardContent className="relative z-10 space-y-2 sm:space-y-3">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground group-hover:scale-105 transition-transform duration-300">
                {stat.value}
              </div>
              <div className="flex items-center justify-between gap-2">
                {changeIndicator ? (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs px-2 py-1 rounded-full border",
                      changeIndicator.className
                    )}
                    aria-label={changeIndicator.ariaLabel}
                  >
                    <changeIndicator.icon className="h-3 w-3" aria-hidden="true" />
                    <span className="font-semibold">{changeIndicator.text}</span>
                  </div>
                ) : (
                  <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.description}</span>
                )}
                {changeIndicator && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium hidden sm:inline truncate">
                    {stat.description}
                  </span>
                )}
              </div>
            </DashboardCardContent>
          </DashboardCard>
        );
      })}
    </div>
  );
}
