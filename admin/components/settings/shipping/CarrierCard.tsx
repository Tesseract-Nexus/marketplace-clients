'use client';

import React from 'react';
import { Truck, CheckCircle, Settings2, Plus, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CarrierInfo {
  type: string;
  name: string;
  tagline: string;
  features: string[];
  color: string;
}

export const CARRIERS: CarrierInfo[] = [
  {
    type: 'DELHIVERY',
    name: 'Delhivery',
    tagline: 'Primary carrier for India',
    features: ['Real-time tracking', 'Cash on delivery', 'Express delivery'],
    color: 'red',
  },
  {
    type: 'SHIPROCKET',
    name: 'Shiprocket',
    tagline: '17+ courier partners',
    features: ['Auto-select best courier', 'NDR management', 'Returns handling'],
    color: 'purple',
  },
];

interface CarrierCardProps {
  carrier: CarrierInfo;
  configured: boolean;
  carrierId?: string;
  onConfigure: () => void;
  onTestConnection?: () => void;
  testingConnection?: boolean;
}

export function CarrierCard({
  carrier,
  configured,
  carrierId,
  onConfigure,
  onTestConnection,
  testingConnection,
}: CarrierCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-xl border p-5 transition-all hover:shadow-md",
      configured ? "border-success/30" : "border-border"
    )}>
      {/* Carrier Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-11 h-11 rounded-lg flex items-center justify-center",
            carrier.color === 'red' ? "bg-red-100" : "bg-primary/10"
          )}>
            <Truck className={cn(
              "h-5 w-5",
              carrier.color === 'red' ? "text-red-600" : "text-primary"
            )} />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{carrier.name}</h4>
            <p className="text-xs text-muted-foreground">{carrier.tagline}</p>
          </div>
        </div>

        {configured && (
          <CheckCircle className="h-5 w-5 text-success" />
        )}
      </div>

      {/* Features List */}
      <div className="space-y-1.5 mb-4">
        {carrier.features.map((feature, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-1 h-1 rounded-full bg-primary" />
            {feature}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      {configured ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onConfigure}
          >
            <Settings2 className="h-4 w-4 mr-1.5" />
            Manage
          </Button>
          {onTestConnection && carrierId && (
            <Button
              size="sm"
              variant="outline"
              onClick={onTestConnection}
              disabled={testingConnection}
            >
              {testingConnection ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      ) : (
        <Button
          size="sm"
          className="w-full bg-primary"
          onClick={onConfigure}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Connect Account
        </Button>
      )}
    </div>
  );
}

export default CarrierCard;
