'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Percent,
  Globe,
  Shield,
  Loader2,
  Receipt,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GatewayConfigTab } from './components/GatewayConfigTab';
import { PlatformFeesTab } from './components/PlatformFeesTab';
import { RegionalSettingsTab } from './components/RegionalSettingsTab';
import { PaymentMethodsTab } from './components/PaymentMethodsTab';
import { SecuritySettingsTab } from './components/SecuritySettingsTab';
import { TaxInfoTab } from './components/TaxInfoTab';
import { settingsService } from '@/lib/services/settingsService';
import { paymentsService, PaymentGatewayConfig } from '@/lib/api/payments';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { PaymentStatusWidget } from '@/components/settings/payments';
import { useTenant } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';

type TabId = 'gateways' | 'fees' | 'methods' | 'taxes' | 'regions' | 'security';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'gateways', label: 'Gateways', icon: CreditCard },
  { id: 'fees', label: 'Fees', icon: Percent },
  { id: 'methods', label: 'Methods', icon: CreditCard },
  { id: 'taxes', label: 'Taxes', icon: Receipt },
  { id: 'regions', label: 'Regions', icon: Globe },
  { id: 'security', label: 'Security', icon: Shield },
];

// Country-specific gateway recommendations
const GATEWAY_RECOMMENDATIONS: Record<string, {
  primary: string;
  fallback?: string;
  countryName: string;
}> = {
  IN: { primary: 'RAZORPAY', fallback: 'PAYPAL', countryName: 'India' },
  US: { primary: 'STRIPE', fallback: 'PAYPAL', countryName: 'United States' },
  GB: { primary: 'STRIPE', fallback: 'PAYPAL', countryName: 'United Kingdom' },
  AU: { primary: 'STRIPE', fallback: 'AFTERPAY', countryName: 'Australia' },
  DEFAULT: { primary: 'STRIPE', fallback: 'PAYPAL', countryName: 'Your Region' },
};

export default function PaymentsSettingsPage() {
  const { currentTenant } = useTenant();
  const [activeTab, setActiveTab] = useState<TabId>('gateways');
  const [loading, setLoading] = useState(true);
  const [storeCountry, setStoreCountry] = useState<string | null>(null);
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);

  useEffect(() => {
    if (currentTenant?.id) {
      loadPaymentStatus();
    }
  }, [currentTenant?.id]);

  const loadPaymentStatus = async () => {
    try {
      setLoading(true);
      const gatewaysData = await paymentsService.getGatewayConfigs();
      setGateways(gatewaysData);

      // Use tenant ID (not storefront ID) for tenant-scoped settings
      const tenantId = currentTenant?.id;
      if (tenantId) {
        const settings = await settingsService.getSettingsByContext({
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: tenantId,
        });

        if (settings?.ecommerce?.store?.address?.country) {
          const countryName = settings.ecommerce.store.address.country;
          const countryMap: Record<string, string> = {
            'India': 'IN',
            'United States': 'US',
            'United Kingdom': 'GB',
            'Australia': 'AU',
          };
          setStoreCountry(countryMap[countryName] || 'DEFAULT');
        }
      }
    } catch (error) {
      console.error('Failed to load payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  const recommendation = storeCountry
    ? GATEWAY_RECOMMENDATIONS[storeCountry] || GATEWAY_RECOMMENDATIONS.DEFAULT
    : null;

  const enabledGateways = gateways.filter(g => g.isEnabled);
  const hasPrimaryGateway = recommendation && gateways.some(g => g.gatewayType === recommendation.primary && g.isEnabled);
  const hasFallbackGateway = recommendation?.fallback && gateways.some(g => g.gatewayType === recommendation.fallback && g.isEnabled);
  const hasLiveGateway = gateways.some(g => !g.isTestMode && g.isEnabled);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.SETTINGS_PAYMENTS_VIEW}
      fallback="styled"
      fallbackTitle="Payment Settings"
      fallbackDescription="You don't have permission to view payment settings."
    >
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Payment Settings"
            description="Configure payment gateways, fees, and regional preferences"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Settings', href: '/settings' },
              { label: 'Payments' },
            ]}
          />

          <div className="flex gap-6">
            {/* Sidebar */}
            <div className="w-56 flex-shrink-0 hidden lg:block">
              <div className="sticky top-6 space-y-3">
                <PaymentStatusWidget
                  gatewaysConfigured={enabledGateways.length}
                  hasLiveGateway={hasLiveGateway}
                  hasPrimaryGateway={!!hasPrimaryGateway}
                  hasFallbackGateway={!!hasFallbackGateway}
                />

                {/* Quick Links */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => setActiveTab('gateways')}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Gateways
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => setActiveTab('security')}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Security
                  </Button>
                </div>

                {/* Stats */}
                <div className="bg-card rounded-lg border border-border p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Active</span>
                    <span className="font-medium">{enabledGateways.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Live</span>
                    <span className="font-medium">{gateways.filter(g => !g.isTestMode && g.isEnabled).length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Test</span>
                    <span className="font-medium">{gateways.filter(g => g.isTestMode && g.isEnabled).length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Mobile Status */}
              <div className="lg:hidden mb-4">
                <PaymentStatusWidget
                  gatewaysConfigured={enabledGateways.length}
                  hasLiveGateway={hasLiveGateway}
                  hasPrimaryGateway={!!hasPrimaryGateway}
                  hasFallbackGateway={!!hasFallbackGateway}
                />
              </div>

              {/* Mobile Tab Selector */}
              <div className="md:hidden mb-4">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as TabId)}
                  className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm font-medium focus:outline-none focus:border-primary"
                >
                  {TABS.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Desktop Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
                <TabsList className="hidden md:inline-flex h-auto items-center justify-start rounded-xl bg-card border border-border p-1 shadow-sm mb-6">
                  {TABS.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="gateways" className="mt-0">
                  <GatewayConfigTab />
                </TabsContent>

                <TabsContent value="fees" className="mt-0">
                  <PlatformFeesTab />
                </TabsContent>

                <TabsContent value="methods" className="mt-0">
                  <PaymentMethodsTab />
                </TabsContent>

                <TabsContent value="taxes" className="mt-0">
                  <TaxInfoTab />
                </TabsContent>

                <TabsContent value="regions" className="mt-0">
                  <RegionalSettingsTab />
                </TabsContent>

                <TabsContent value="security" className="mt-0">
                  <SecuritySettingsTab />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
