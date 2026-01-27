'use client';

import React, { useMemo } from 'react';
import { BarChart3, Package, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';
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
    <DashboardCard className="border-border/50 hover:border-primary/20 transition-all duration-300">
      <DashboardCardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <DashboardCardTitle className="text-lg font-bold text-foreground">
                <AdminUIText text="Inventory Stock Levels" />
              </DashboardCardTitle>
              <DashboardCardDescription className="text-xs text-muted-foreground">
                <AdminUIText text="Current stock vs threshold by product" />
              </DashboardCardDescription>
            </div>
          </div>
          <Link href="/inventory">
            <Button
              variant="outline"
              size="sm"
              className="text-foreground hover:text-primary hover:bg-primary/5 text-xs h-8 border-border/50 hover:border-primary/50 shadow-sm transition-all"
            >
              <Package className="h-3.5 w-3.5 mr-1.5" />
              <AdminUIText text="View All" />
            </Button>
          </Link>
        </div>
      </DashboardCardHeader>

      <DashboardCardContent className="pt-5">
        {inventoryData.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              <AdminUIText text="No Inventory Data" />
            </h3>
            <p className="text-xs text-muted-foreground max-w-[250px]">
              <AdminUIText text="Stock levels will appear here once you add products to your inventory." />
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Summary Cards - Primary Focus */}
            <div className="grid grid-cols-3 gap-3">
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-primary" />
                  <p className="text-xs font-medium text-muted-foreground">
                    <AdminUIText text="Total Units" />
                  </p>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {inventorySummary.totalUnits.toLocaleString()}
                </p>
              </div>

              <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-success/10 to-success/5 p-4 border border-success/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <p className="text-xs font-medium text-muted-foreground">
                    <AdminUIText text="Healthy" />
                  </p>
                </div>
                <p className="text-2xl font-bold text-success">
                  {inventorySummary.healthyCount}
                </p>
              </div>

              <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-warning/10 to-warning/5 p-4 border border-warning/20">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <p className="text-xs font-medium text-muted-foreground">
                    <AdminUIText text="Low Stock" />
                  </p>
                </div>
                <p className="text-2xl font-bold text-warning">
                  {inventorySummary.lowStockCount}
                </p>
              </div>
            </div>

            {/* Compact Item Cards - Grid Layout */}
            <div className="grid grid-cols-2 gap-3">
              {inventoryData.slice(0, 6).map((item) => {
                const stockPercentage = Math.min((item.quantity / item.lowStockThreshold) * 100, 200);
                const isLowStock = item.quantity <= item.lowStockThreshold;
                const isCritical = item.quantity < item.lowStockThreshold * 0.5;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative rounded-lg p-3.5 border transition-all duration-200 hover:shadow-md",
                      isLowStock
                        ? isCritical
                          ? "bg-destructive/5 border-destructive/30 hover:border-destructive/50"
                          : "bg-warning/5 border-warning/30 hover:border-warning/50"
                        : "bg-card border-border/50 hover:border-primary/30"
                    )}
                  >
                    {/* Status Indicator */}
                    <div className="absolute top-2 right-2">
                      {isLowStock ? (
                        <div className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
                          isCritical
                            ? "bg-destructive/20 text-destructive"
                            : "bg-warning/20 text-warning"
                        )}>
                          <TrendingDown className="h-2.5 w-2.5" />
                          {isCritical ? 'Critical' : 'Low'}
                        </div>
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-success/60" />
                      )}
                    </div>

                    {/* Product Name */}
                    <div className="mb-3 pr-12">
                      <h4 className="text-sm font-semibold text-foreground truncate" title={item.name}>
                        {item.name}
                      </h4>
                    </div>

                    {/* Stock Level Display */}
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">
                          <AdminUIText text="Current" />
                        </p>
                        <p className={cn(
                          "text-2xl font-bold leading-none",
                          isLowStock ? (isCritical ? "text-destructive" : "text-warning") : "text-primary"
                        )}>
                          {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          <AdminUIText text="Threshold" />
                        </p>
                        <p className="text-lg font-semibold text-muted-foreground leading-none">
                          {item.lowStockThreshold}
                        </p>
                      </div>
                    </div>

                    {/* Mini Progress Indicator */}
                    <div className="relative h-1.5 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                          isLowStock
                            ? isCritical
                              ? "bg-gradient-to-r from-destructive to-destructive/80"
                              : "bg-gradient-to-r from-warning to-warning/80"
                            : "bg-gradient-to-r from-primary to-primary/80"
                        )}
                        style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                      />
                    </div>

                    {/* Stock Ratio */}
                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>
                        {stockPercentage > 100 ? '100+' : Math.round(stockPercentage)}% <AdminUIText text="of threshold" />
                      </span>
                      <span className={cn(
                        "font-medium",
                        item.quantity > item.lowStockThreshold ? "text-success" : "text-warning"
                      )}>
                        {item.quantity > item.lowStockThreshold
                          ? `+${item.quantity - item.lowStockThreshold}`
                          : `${item.quantity - item.lowStockThreshold}`
                        }
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show More Link */}
            {inventoryData.length > 6 && (
              <Link href="/inventory" className="block">
                <Button
                  variant="ghost"
                  className="w-full text-xs text-muted-foreground hover:text-primary hover:bg-primary/5"
                >
                  <AdminUIText text={`View ${inventoryData.length - 6} more items`} />
                </Button>
              </Link>
            )}
          </div>
        )}
      </DashboardCardContent>
    </DashboardCard>
  );
}
