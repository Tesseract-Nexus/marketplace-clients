'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Clock,
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PaymentMethodResponse } from '@/lib/api/payments';
import { PermissionGate, Permission } from '@/components/permission-gate';

interface PaymentMethodCardProps {
  method: PaymentMethodResponse;
  onConfigure: () => void;
  onToggle: (enabled: boolean) => Promise<void>;
  onTest: () => Promise<void>;
}

const methodTypeIcons: Record<string, React.ElementType> = {
  card: CreditCard,
  wallet: Wallet,
  bnpl: Clock,
  upi: Smartphone,
  netbanking: Building2,
  gateway: CreditCard,
  cod: Wallet,
  bank: Building2,
};

const providerColors: Record<string, string> = {
  Stripe: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  PayPal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Razorpay: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  Afterpay: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  Zip: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Manual: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export function PaymentMethodCard({
  method,
  onConfigure,
  onToggle,
  onTest,
}: PaymentMethodCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const Icon = methodTypeIcons[method.type] || CreditCard;

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true);
    try {
      await onToggle(checked);
    } finally {
      setIsToggling(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await onTest();
    } finally {
      setIsTesting(false);
    }
  };

  // Determine status
  const getStatusBadge = () => {
    if (!method.isConfigured) {
      return (
        <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
          <AlertCircle className="h-3 w-3 mr-1" />
          Not Configured
        </Badge>
      );
    }

    if (method.isEnabled) {
      if (method.isTestMode) {
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertCircle className="h-3 w-3 mr-1" />
            Test Mode
          </Badge>
        );
      }
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Live
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-muted-foreground">
        <XCircle className="h-3 w-3 mr-1" />
        Disabled
      </Badge>
    );
  };

  // Test status indicator
  const getTestStatus = () => {
    if (method.lastTestSuccess === true) {
      return (
        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Connected
        </span>
      );
    }
    if (method.lastTestSuccess === false) {
      return (
        <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </span>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-lg border border-border p-5 shadow-sm hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-lg">{method.name}</h3>
            <p className="text-sm text-muted-foreground">{method.description}</p>
          </div>
        </div>

        {/* Enable Toggle */}
        <PermissionGate permission={Permission.PAYMENTS_METHODS_ENABLE}>
          <div className="flex items-center gap-2">
            {isToggling && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Switch
              checked={method.isEnabled}
              onCheckedChange={handleToggle}
              disabled={isToggling || !method.isConfigured}
            />
          </div>
        </PermissionGate>
      </div>

      {/* Provider & Status Row */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Badge className={providerColors[method.provider] || providerColors.Manual}>
          {method.provider}
        </Badge>
        {getStatusBadge()}
        {getTestStatus()}
      </div>

      {/* Fee Info */}
      {(method.transactionFeePercent > 0 || method.transactionFeeFixed > 0) && (
        <div className="text-sm text-muted-foreground mb-4">
          Fee: {method.transactionFeePercent > 0 && `${method.transactionFeePercent}%`}
          {method.transactionFeePercent > 0 && method.transactionFeeFixed > 0 && ' + '}
          {method.transactionFeeFixed > 0 && `$${method.transactionFeeFixed.toFixed(2)}`}
        </div>
      )}

      {/* Regions - Show tenant's enabled regions if configured, otherwise show supported */}
      <div className="mb-4">
        {method.enabledRegions && method.enabledRegions.length > 0 ? (
          <div>
            <span className="text-xs text-muted-foreground mb-1 block">Enabled for:</span>
            <div className="flex flex-wrap gap-1">
              {method.enabledRegions.slice(0, 5).map((region) => (
                <span
                  key={region}
                  className="text-xs px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded"
                >
                  {region}
                </span>
              ))}
              {method.enabledRegions.length > 5 && (
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">
                  +{method.enabledRegions.length - 5} more
                </span>
              )}
            </div>
          </div>
        ) : (
          <div>
            <span className="text-xs text-muted-foreground mb-1 block">Supports:</span>
            <div className="flex flex-wrap gap-1">
              {method.supportedRegions.slice(0, 5).map((region) => (
                <span
                  key={region}
                  className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded"
                >
                  {region}
                </span>
              ))}
              {method.supportedRegions.length > 5 && (
                <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                  +{method.supportedRegions.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <PermissionGate permission={Permission.PAYMENTS_METHODS_CONFIG}>
          <Button
            variant="outline"
            size="sm"
            onClick={onConfigure}
            className="flex-1"
          >
            <Settings className="h-4 w-4 mr-1" />
            Configure
          </Button>
        </PermissionGate>

        <PermissionGate permission={Permission.PAYMENTS_METHODS_TEST}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting || !method.isConfigured}
            className="flex-1"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-1" />
            )}
            Test
          </Button>
        </PermissionGate>
      </div>
    </div>
  );
}
