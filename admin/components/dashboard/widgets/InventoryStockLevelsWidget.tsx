'use client';

import React, { useMemo } from 'react';
import { BarChart3, Package } from 'lucide-react';
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
import { AdminUIText } from '@/components/translation/AdminTranslatedText';

interface InventoryStockLevelsWidgetProps {
  data: DashboardData;
}

export function InventoryStockLevelsWidget({ data }: InventoryStockLevelsWidgetProps) {
  const { inventoryData } = data;

  const inventorySummary = useMemo(() => ({
    totalUnits: inventoryData.reduce((sum, item) => sum + item.quantity, 0),
    healthyCount: inventoryData.filter(item => item.quantity > item.lowStockThreshold).length,
    lowStockCount: inventoryData.filter(item => item.quantity <= item.lowStockThreshold).length,
  }), [inventoryData]);

  return (
    <DashboardCard className="border-border/50 hover:border-violet-300/50 transition-all duration-300">
      <DashboardCardHeader className="pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg ring-4 ring-violet-500/20">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <DashboardCardTitle className="text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                <AdminUIText text="Inventory Stock Levels" />
              </DashboardCardTitle>
              <DashboardCardDescription className="text-xs text-muted-foreground font-medium"><AdminUIText text="Current stock vs threshold by product" /></DashboardCardDescription>
            </div>
          </div>
          <Link href="/inventory">
            <Button variant="outline" className="text-foreground hover:text-violet-700 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 text-xs h-8 bg-card border border-border hover:border-violet-300 shadow-sm hover:shadow transition-all">
              <Package className="h-3 w-3 mr-1" />
              <AdminUIText text="View All" />
            </Button>
          </Link>
        </div>
      </DashboardCardHeader>
      <DashboardCardContent className="pt-6">
        {inventoryData.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm"><AdminUIText text="No inventory data available" /></div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-6 text-xs mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-violet-500 to-purple-500" />
                <span className="text-muted-foreground"><AdminUIText text="Current Stock" /></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-amber-400" />
                <span className="text-muted-foreground"><AdminUIText text="Low Stock Threshold" /></span>
              </div>
            </div>

            <div className="space-y-3">
              {inventoryData.map((item) => {
                const maxValue = Math.max(item.quantity, item.lowStockThreshold, 100);
                const stockPercent = (item.quantity / maxValue) * 100;
                const thresholdPercent = (item.lowStockThreshold / maxValue) * 100;
                const isLowStock = item.quantity <= item.lowStockThreshold;

                return (
                  <div key={item.id} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs font-medium text-foreground truncate max-w-[150px]" title={item.name}>
                          {item.name}
                        </span>
                        {isLowStock && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">
                            Low
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={cn(
                          "font-semibold",
                          isLowStock ? "text-amber-600" : "text-violet-600"
                        )}>
                          {item.quantity}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-muted-foreground">{item.lowStockThreshold} min</span>
                      </div>
                    </div>
                    <div className="relative h-6 bg-muted rounded-lg overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                        style={{ left: `${thresholdPercent}%` }}
                      />
                      <div
                        className={cn(
                          "absolute top-0.5 bottom-0.5 left-0.5 rounded-md transition-all duration-500 group-hover:opacity-90",
                          isLowStock
                            ? "bg-gradient-to-r from-amber-400 to-orange-400"
                            : "bg-gradient-to-r from-violet-500 to-purple-500"
                        )}
                        style={{ width: `calc(${stockPercent}% - 4px)` }}
                      />
                      {stockPercent > 15 && (
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white drop-shadow">
                          {item.quantity} units
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-600">
                  {inventorySummary.totalUnits}
                </p>
                <p className="text-xs text-muted-foreground"><AdminUIText text="Total Units" /></p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {inventorySummary.healthyCount}
                </p>
                <p className="text-xs text-muted-foreground"><AdminUIText text="Healthy Stock" /></p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {inventorySummary.lowStockCount}
                </p>
                <p className="text-xs text-muted-foreground"><AdminUIText text="Low Stock" /></p>
              </div>
            </div>
          </div>
        )}
      </DashboardCardContent>
    </DashboardCard>
  );
}
