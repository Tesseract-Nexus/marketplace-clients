'use client';

import React from 'react';
import { Truck, CheckCircle, Building, Key, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShippingStatusWidgetProps {
  shippingEnabled: boolean;
  warehouseConfigured: boolean;
  carrierConfigured: boolean;
  trackingEnabled: boolean;
}

function StatusItem({ label, completed }: { label: string; completed: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {completed ? (
        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
      ) : (
        <div className="h-4 w-4 rounded-full border-2 border-muted flex-shrink-0" />
      )}
      <span className={cn(
        "text-sm",
        completed ? "text-foreground" : "text-muted-foreground"
      )}>
        {label}
      </span>
    </div>
  );
}

export function ShippingStatusWidget({
  shippingEnabled,
  warehouseConfigured,
  carrierConfigured,
  trackingEnabled,
}: ShippingStatusWidgetProps) {
  const completedCount = [shippingEnabled, warehouseConfigured, carrierConfigured, trackingEnabled].filter(Boolean).length;
  const isReady = completedCount >= 3; // At least 3 of 4 configured

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          isReady ? "bg-success/10" : "bg-warning/10"
        )}>
          <Truck className={cn(
            "h-5 w-5",
            isReady ? "text-success" : "text-warning"
          )} />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Shipping Status</h3>
          <p className="text-xs text-muted-foreground">
            {isReady ? 'Ready to ship' : 'Setup needed'}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Setup Progress</span>
          <span className="font-semibold text-foreground">{completedCount}/4</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500",
              isReady ? "bg-success" : "bg-warning"
            )}
            style={{ width: `${(completedCount / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Status Checklist */}
      <div className="space-y-2">
        <StatusItem label="Methods enabled" completed={shippingEnabled} />
        <StatusItem label="Warehouse address" completed={warehouseConfigured} />
        <StatusItem label="Carrier configured" completed={carrierConfigured} />
        <StatusItem label="Tracking enabled" completed={trackingEnabled} />
      </div>
    </div>
  );
}

export default ShippingStatusWidget;
