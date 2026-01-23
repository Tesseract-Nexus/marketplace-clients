'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PaymentStatusWidgetProps {
  gatewaysConfigured: number;
  hasLiveGateway: boolean;
  hasPrimaryGateway: boolean;
  hasFallbackGateway: boolean;
}

export function PaymentStatusWidget({
  gatewaysConfigured,
  hasLiveGateway,
  hasPrimaryGateway,
  hasFallbackGateway,
}: PaymentStatusWidgetProps) {
  const steps = [
    { done: gatewaysConfigured > 0, label: 'Gateway' },
    { done: hasPrimaryGateway, label: 'Primary' },
    { done: hasFallbackGateway, label: 'Fallback' },
    { done: hasLiveGateway, label: 'Live' },
  ];
  const completedCount = steps.filter(s => s.done).length;
  const isReady = gatewaysConfigured > 0;

  return (
    <div className={cn(
      "rounded-lg border p-3",
      isReady ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn(
          "text-xs font-medium",
          isReady ? "text-success" : "text-warning"
        )}>
          {isReady ? 'Ready' : 'Setup Required'}
        </span>
        <span className="text-xs text-muted-foreground">{completedCount}/4</span>
      </div>

      {/* Compact step indicators */}
      <div className="flex gap-1">
        {steps.map((step, i) => (
          <div key={i} className="flex-1 group relative">
            <div className={cn(
              "h-1 rounded-full transition-colors",
              step.done
                ? isReady ? "bg-success" : "bg-warning"
                : "bg-muted"
            )} />
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PaymentStatusWidget;
