'use client';

import React from 'react';
import { AlertCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardDescription,
  DashboardCardContent,
  DashboardBadge,
} from './shared';
import { DashboardData } from '@/lib/types/dashboard';
import { AdminUIText } from '@/components/translation/AdminTranslatedText';

interface LowStockAlertWidgetProps {
  data: DashboardData;
}

export function LowStockAlertWidget({ data }: LowStockAlertWidgetProps) {
  const { lowStockProducts } = data;

  return (
    <DashboardCard className="border-border/50 hover:border-warning/40/50 transition-all duration-300 group">
      <DashboardCardHeader className="pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg ring-4 ring-amber-500/20">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <DashboardCardTitle className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                <AdminUIText text="Low Stock Alert" />
              </DashboardCardTitle>
              <DashboardCardDescription className="text-xs text-muted-foreground font-medium"><AdminUIText text="Inventory warnings" /></DashboardCardDescription>
            </div>
          </div>
          <Link href="/products?status=LOW_STOCK">
            <Button variant="outline" className="text-foreground hover:text-warning-foreground hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 text-xs h-8 bg-card border border-border hover:border-warning/40 shadow-sm hover:shadow transition-all">
              <Package className="h-3 w-3 mr-1" />
              <AdminUIText text="Manage" />
            </Button>
          </Link>
        </div>
      </DashboardCardHeader>
      <DashboardCardContent className="space-y-2">
        {lowStockProducts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm"><AdminUIText text="No low stock items found" /></div>
        ) : (
          lowStockProducts.map((product) => (
            <div
              key={product.id}
              className="group flex items-center justify-between p-2.5 rounded-lg bg-warning-muted/50 hover:bg-warning-muted transition-all duration-200 cursor-pointer border border-warning/20 hover:border-warning/40"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-1.5 rounded-md bg-warning-muted">
                  <Package className="h-3 w-3 text-warning" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-xs text-foreground truncate mb-0.5">
                    {product.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    SKU: {product.sku || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <DashboardBadge className="bg-warning-muted text-warning-foreground border-warning/40 text-[10px] px-2 py-0.5 h-5 font-semibold">
                  {product.quantity} left
                </DashboardBadge>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Min: {product.lowStockThreshold || 5}
                </p>
              </div>
            </div>
          ))
        )}
      </DashboardCardContent>
    </DashboardCard>
  );
}
