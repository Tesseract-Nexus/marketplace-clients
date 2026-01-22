'use client';

import React from 'react';
import { Award, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardDescription,
  DashboardCardContent,
} from './shared';
import { DashboardData } from '@/lib/types/dashboard';
import { useAdminCurrency } from '@/hooks/useAdminCurrency';
import { AdminUIText } from '@/components/translation/AdminTranslatedText';

interface TopProductsWidgetProps {
  data: DashboardData;
}

export function TopProductsWidget({ data }: TopProductsWidgetProps) {
  const { topProducts } = data;
  const { formatPrice } = useAdminCurrency();

  return (
    <DashboardCard className="border-border/50 hover:border-primary/30/50 transition-all duration-300">
      <DashboardCardHeader className="pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg ring-4 ring-violet-500/20">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <DashboardCardTitle className="text-lg font-bold text-primary">
                <AdminUIText text="Top Selling Products" />
              </DashboardCardTitle>
              <DashboardCardDescription className="text-xs text-muted-foreground font-medium"><AdminUIText text="Best performers by revenue" /></DashboardCardDescription>
            </div>
          </div>
          <Link href="/products">
            <Button variant="outline" className="text-foreground hover:text-primary hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 text-xs h-8 bg-card border border-border hover:border-primary/30 shadow-sm hover:shadow transition-all">
              <Package className="h-3 w-3 mr-1" />
              <AdminUIText text="View All" />
            </Button>
          </Link>
        </div>
      </DashboardCardHeader>
      <DashboardCardContent className="pt-4">
        {topProducts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm"><AdminUIText text="No sales data available" /></div>
        ) : (
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-primary/10/50 transition-all duration-200 border border-border hover:border-primary/30"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                    index === 0 ? "bg-warning-muted text-warning-foreground" :
                    index === 1 ? "bg-muted text-foreground" :
                    index === 2 ? "bg-warning-muted text-warning" :
                    "bg-muted text-muted-foreground"
                  )}>
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground truncate max-w-[150px]">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.units} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-primary">{formatPrice(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardCardContent>
    </DashboardCard>
  );
}
