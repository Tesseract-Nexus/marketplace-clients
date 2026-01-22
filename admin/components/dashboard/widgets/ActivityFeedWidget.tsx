'use client';

import React from 'react';
import { Activity, ShoppingCart, UserPlus, MessageCircle, Package, CreditCard, Star } from 'lucide-react';
import {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardDescription,
  DashboardCardContent,
  getRelativeTime,
} from './shared';
import { DashboardData } from '@/lib/types/dashboard';
import { useAdminCurrency } from '@/hooks/useAdminCurrency';
import { AdminUIText } from '@/components/translation/AdminTranslatedText';

interface ActivityFeedWidgetProps {
  data: DashboardData;
}

export function ActivityFeedWidget({ data }: ActivityFeedWidgetProps) {
  const { activityFeed } = data;
  const { formatPrice } = useAdminCurrency();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="h-4 w-4 text-primary" />;
      case 'customer': return <UserPlus className="h-4 w-4 text-emerald-600" />;
      case 'review': return <MessageCircle className="h-4 w-4 text-warning" />;
      case 'product': return <Package className="h-4 w-4 text-violet-600" />;
      case 'payment': return <CreditCard className="h-4 w-4 text-emerald-600" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'order': return 'border-primary/30 bg-primary/10/50';
      case 'customer': return 'border-emerald-200 bg-emerald-50/50';
      case 'review': return 'border-warning/30 bg-warning-muted/50';
      case 'product': return 'border-violet-200 bg-violet-50/50';
      case 'payment': return 'border-emerald-200 bg-emerald-50/50';
      default: return 'border-border bg-muted/50';
    }
  };

  return (
    <DashboardCard className="border-border bg-white/80 backdrop-blur hover:border-primary/30 transition-all duration-300">
      <DashboardCardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DashboardCardTitle className="text-xl"><AdminUIText text="Recent Activity" /></DashboardCardTitle>
              <DashboardCardDescription><AdminUIText text="Latest business events" /></DashboardCardDescription>
            </div>
          </div>
        </div>
      </DashboardCardHeader>
      <DashboardCardContent className="space-y-2 max-h-80 overflow-y-auto">
        {activityFeed.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm"><AdminUIText text="No recent activity" /></div>
        ) : (
          activityFeed.map((activity) => (
            <div
              key={activity.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${getActivityColor(activity.type)}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-xs text-foreground">
                    {activity.title}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {getRelativeTime(activity.timestamp)}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mb-1">
                  {activity.description}
                </p>
                {activity.metadata && (
                  <div className="flex items-center gap-2 text-[10px]">
                    {typeof activity.metadata.amount === 'number' && (
                      <span className="font-semibold text-emerald-600">
                        {formatPrice(activity.metadata.amount)}
                      </span>
                    )}
                    {typeof activity.metadata.rating === 'number' && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-warning fill-current" />
                        <span className="text-warning">{activity.metadata.rating}/5</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </DashboardCardContent>
    </DashboardCard>
  );
}
