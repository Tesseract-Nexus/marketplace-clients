'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Info, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/Select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  paymentsService,
  PaymentMethodResponse,
} from '@/lib/api/payments';
import { PaymentMethodCard } from './PaymentMethodCard';
import { ConfigurePaymentModal } from './ConfigurePaymentModal';
import { toast } from 'sonner';

const regionOptions = [
  { value: '', label: 'All Regions' },
  { value: 'AU', label: 'Australia' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'IN', label: 'India' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'SG', label: 'Singapore' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
];

export function PaymentMethodsTab() {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Configure modal state
  const [configureModalOpen, setConfigureModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodResponse | null>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, [selectedRegion]);

  const loadPaymentMethods = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await paymentsService.getPaymentMethods(selectedRegion || undefined);
      setPaymentMethods(response.paymentMethods || []);
    } catch (error: any) {
      console.error('Failed to load payment methods:', error);
      toast.error('Failed to load payment methods');
      setPaymentMethods([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPaymentMethods(false);
  };

  const handleConfigure = (method: PaymentMethodResponse) => {
    setSelectedMethod(method);
    setConfigureModalOpen(true);
  };

  const handleToggle = async (method: PaymentMethodResponse, enabled: boolean) => {
    try {
      await paymentsService.enablePaymentMethod(method.code, enabled);
      toast.success(`${method.name} ${enabled ? 'enabled' : 'disabled'}`);
      loadPaymentMethods(false);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${enabled ? 'enable' : 'disable'} payment method`);
      throw error;
    }
  };

  const handleTest = async (method: PaymentMethodResponse) => {
    try {
      const result = await paymentsService.testPaymentConnection(method.code);
      if (result.success) {
        toast.success(`${method.name}: ${result.message}`);
      } else {
        toast.error(`${method.name}: ${result.message}`);
      }
      loadPaymentMethods(false);
    } catch (error: any) {
      toast.error(error.message || 'Connection test failed');
    }
  };

  const handleModalClose = () => {
    setConfigureModalOpen(false);
    setSelectedMethod(null);
  };

  const handleConfigSaved = () => {
    loadPaymentMethods(false);
  };

  // Group methods by type for better organization
  const groupedMethods = paymentMethods.reduce((acc, method) => {
    const type = method.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(method);
    return acc;
  }, {} as Record<string, PaymentMethodResponse[]>);

  const typeLabels: Record<string, string> = {
    card: 'Credit & Debit Cards',
    wallet: 'Digital Wallets',
    bnpl: 'Buy Now, Pay Later',
    upi: 'UPI Payments',
    netbanking: 'Net Banking',
    gateway: 'Payment Gateways',
    cod: 'Cash on Delivery',
    bank: 'Bank Transfer',
  };

  // Count enabled methods
  const enabledCount = paymentMethods.filter((m) => m.isEnabled).length;
  const configuredCount = paymentMethods.filter((m) => m.isConfigured).length;

  return (
    <div className="space-y-6">
      {/* Header with Region Filter */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Payment Methods</h3>
            <p className="text-sm text-muted-foreground">
              Configure payment methods available to your customers
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-48">
              <Select
                value={selectedRegion}
                onChange={(value) => setSelectedRegion(value)}
                options={regionOptions}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{paymentMethods.length}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{enabledCount}</p>
            <p className="text-xs text-muted-foreground">Enabled</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{configuredCount}</p>
            <p className="text-xs text-muted-foreground">Configured</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Enable payment methods to make them available at checkout. Methods must be configured
          with valid credentials before they can be enabled. Use Test Mode to verify your setup
          before going live.
        </AlertDescription>
      </Alert>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : paymentMethods.length === 0 ? (
        /* Empty State */
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Payment Methods Available
          </h3>
          <p className="text-muted-foreground">
            {selectedRegion
              ? `No payment methods are available for ${regionOptions.find((r) => r.value === selectedRegion)?.label || selectedRegion}.`
              : 'No payment methods are configured.'}
          </p>
        </div>
      ) : (
        /* Payment Methods Grid - Grouped by Type */
        <div className="space-y-8">
          {Object.entries(groupedMethods).map(([type, methods]) => (
            <div key={type}>
              <h4 className="text-md font-semibold text-foreground mb-4">
                {typeLabels[type] || type}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {methods.map((method) => (
                  <PaymentMethodCard
                    key={method.code}
                    method={method}
                    onConfigure={() => handleConfigure(method)}
                    onToggle={(enabled) => handleToggle(method, enabled)}
                    onTest={() => handleTest(method)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Configure Modal */}
      <ConfigurePaymentModal
        isOpen={configureModalOpen}
        onClose={handleModalClose}
        method={selectedMethod}
        onSaved={handleConfigSaved}
      />
    </div>
  );
}
