'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Percent,
  Globe,
  Shield,
  CheckCircle,
  AlertCircle,
  XCircle,
  MapPin,
  Sparkles,
  Loader2,
  ArrowRight,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GatewayConfigTab } from './components/GatewayConfigTab';
import { PlatformFeesTab } from './components/PlatformFeesTab';
import { RegionalSettingsTab } from './components/RegionalSettingsTab';
import { PaymentMethodsTab } from './components/PaymentMethodsTab';
import { SecuritySettingsTab } from './components/SecuritySettingsTab';
import { settingsService } from '@/lib/services/settingsService';
import { storefrontService } from '@/lib/services/storefrontService';
import { paymentsService, PaymentGatewayConfig } from '@/lib/api/payments';
import { PermissionGate, Permission } from '@/components/permission-gate';

// Country-specific gateway recommendations
const GATEWAY_RECOMMENDATIONS: Record<string, {
  primary: string;
  fallback?: string;
  countryName: string;
  flag: string;
  primaryName: string;
  fallbackName?: string;
}> = {
  IN: {
    primary: 'RAZORPAY',
    fallback: 'PAYPAL',
    countryName: 'India',
    flag: '🇮🇳',
    primaryName: 'Razorpay',
    fallbackName: 'PayPal',
  },
  US: {
    primary: 'STRIPE',
    fallback: 'PAYPAL',
    countryName: 'United States',
    flag: '🇺🇸',
    primaryName: 'Stripe',
    fallbackName: 'PayPal',
  },
  GB: {
    primary: 'STRIPE',
    fallback: 'PAYPAL',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    primaryName: 'Stripe',
    fallbackName: 'PayPal',
  },
  AU: {
    primary: 'STRIPE',
    fallback: 'AFTERPAY',
    countryName: 'Australia',
    flag: '🇦🇺',
    primaryName: 'Stripe',
    fallbackName: 'Afterpay',
  },
  DEFAULT: {
    primary: 'STRIPE',
    fallback: 'PAYPAL',
    countryName: 'Your Region',
    flag: '🌍',
    primaryName: 'Stripe',
    fallbackName: 'PayPal',
  },
};

const tabs = [
  { id: 'gateways', label: 'Payment Gateways', icon: CreditCard },
  { id: 'fees', label: 'Platform Fees', icon: Percent },
  { id: 'methods', label: 'Payment Methods', icon: CreditCard },
  { id: 'regions', label: 'Regional Settings', icon: Globe },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function PaymentsSettingsPage() {
  const [activeTab, setActiveTab] = useState('gateways');
  const [loading, setLoading] = useState(true);
  const [storeCountry, setStoreCountry] = useState<string | null>(null);
  const [storeCountryName, setStoreCountryName] = useState<string>('');
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [showQuickSetup, setShowQuickSetup] = useState(false);

  useEffect(() => {
    loadPaymentStatus();
  }, []);

  const loadPaymentStatus = async () => {
    try {
      setLoading(true);

      // Load gateways and store location in parallel
      const [gatewaysData, storefronts] = await Promise.all([
        paymentsService.getGatewayConfigs(),
        storefrontService.getStorefronts(),
      ]);

      setGateways(gatewaysData);

      // Get store country
      if (storefronts.data && storefronts.data.length > 0) {
        const storefrontId = storefronts.data[0].id;
        const settings = await settingsService.getSettingsByContext({
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: storefrontId,
        });

        if (settings?.ecommerce?.store?.address?.country) {
          const countryName = settings.ecommerce.store.address.country;
          setStoreCountryName(countryName);

          const countryMap: Record<string, string> = {
            'India': 'IN',
            'United States': 'US',
            'United Kingdom': 'GB',
            'Australia': 'AU',
            'Canada': 'CA',
            'Germany': 'DE',
            'France': 'FR',
            'Singapore': 'SG',
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
  const isPaymentReady = enabledGateways.length > 0;
  const hasTestModeOnly = enabledGateways.length > 0 && enabledGateways.every(g => g.isTestMode);

  const getSetupProgress = () => {
    let progress = 0;
    if (enabledGateways.length > 0) progress += 50;
    if (hasPrimaryGateway) progress += 25;
    if (hasFallbackGateway) progress += 25;
    return progress;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
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
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Payment Settings"
          description="Configure payment gateways, fees, and regional payment preferences"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Payments' },
          ]}
        />

        {/* Payment Status Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Status Card */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    isPaymentReady
                      ? 'bg-success'
                      : 'bg-warning'
                  }`}>
                    {isPaymentReady ? (
                      <CheckCircle className="h-7 w-7 text-white" />
                    ) : (
                      <AlertCircle className="h-7 w-7 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {isPaymentReady ? 'Payments Ready' : 'Setup Required'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {isPaymentReady
                        ? `${enabledGateways.length} gateway${enabledGateways.length > 1 ? 's' : ''} configured`
                        : 'Configure a payment gateway to accept payments'
                      }
                    </p>
                  </div>
                </div>

                {hasTestModeOnly && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-warning-muted text-warning-foreground border border-warning/30">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Test Mode
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Setup Progress</span>
                  <span className="font-semibold text-foreground">{getSetupProgress()}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${getSetupProgress()}%` }}
                  />
                </div>
              </div>

              {/* Gateway Status Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted border border-border">
                  <p className="text-2xl font-bold text-foreground">{enabledGateways.length}</p>
                  <p className="text-xs text-muted-foreground">Active Gateways</p>
                </div>
                <div className="p-4 rounded-lg bg-muted border border-border">
                  <p className="text-2xl font-bold text-foreground">
                    {gateways.filter(g => !g.isTestMode && g.isEnabled).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Live Mode</p>
                </div>
                <div className="p-4 rounded-lg bg-muted border border-border">
                  <p className="text-2xl font-bold text-foreground">
                    {gateways.filter(g => g.isTestMode && g.isEnabled).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Test Mode</p>
                </div>
                <div className="p-4 rounded-lg bg-muted border border-border">
                  <div className="flex items-center gap-1">
                    {hasPrimaryGateway ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                    {hasFallbackGateway ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Primary + Fallback</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Setup Card */}
          {recommendation && (
            <div className="bg-primary rounded-xl shadow-lg overflow-hidden text-primary-foreground">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5" />
                  <span className="text-sm font-medium opacity-90">
                    {recommendation.flag} {storeCountryName || recommendation.countryName}
                  </span>
                </div>

                <h3 className="text-lg font-bold mb-2">Recommended Setup</h3>
                <p className="text-sm opacity-80 mb-6">
                  {storeCountry === 'IN'
                    ? 'Accept UPI, cards, and wallets with Razorpay'
                    : 'Accept cards globally with Stripe'
                  }
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-card rounded flex items-center justify-center">
                        <img
                          src={`/logos/${recommendation.primary.toLowerCase()}.svg`}
                          alt={recommendation.primaryName}
                          className="h-4 w-4"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                      <span className="font-medium">{recommendation.primaryName}</span>
                    </div>
                    {hasPrimaryGateway ? (
                      <CheckCircle className="h-5 w-5 text-success/60" />
                    ) : (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded">Primary</span>
                    )}
                  </div>

                  {recommendation.fallback && (
                    <div className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-card rounded flex items-center justify-center">
                          <img
                            src={`/logos/${recommendation.fallback.toLowerCase()}.svg`}
                            alt={recommendation.fallbackName}
                            className="h-4 w-4"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                        <span className="font-medium">{recommendation.fallbackName}</span>
                      </div>
                      {hasFallbackGateway ? (
                        <CheckCircle className="h-5 w-5 text-success/60" />
                      ) : (
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">Fallback</span>
                      )}
                    </div>
                  )}
                </div>

                {(!hasPrimaryGateway || !hasFallbackGateway) && (
                  <Button
                    onClick={() => setActiveTab('gateways')}
                    className="w-full bg-white text-primary hover:bg-muted"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Quick Setup
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}

                {hasPrimaryGateway && hasFallbackGateway && (
                  <div className="flex items-center justify-center gap-2 text-sm opacity-80">
                    <CheckCircle className="h-4 w-4" />
                    Setup Complete
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="inline-flex h-12 items-center justify-start rounded-xl bg-card border border-border p-1 shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="gateways" className="focus-visible:outline-none">
              <GatewayConfigTab />
            </TabsContent>

            <TabsContent value="fees" className="focus-visible:outline-none">
              <PlatformFeesTab />
            </TabsContent>

            <TabsContent value="methods" className="focus-visible:outline-none">
              <PaymentMethodsTab />
            </TabsContent>

            <TabsContent value="regions" className="focus-visible:outline-none">
              <RegionalSettingsTab />
            </TabsContent>

            <TabsContent value="security" className="focus-visible:outline-none">
              <SecuritySettingsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
    </PermissionGate>
  );
}
