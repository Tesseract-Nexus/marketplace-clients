'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Globe,
  Settings,
  CheckCircle,
  AlertCircle,
  XCircle,
  MapPin,
  Loader2,
  ArrowRight,
  Zap,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CarrierConfigTab } from './components/CarrierConfigTab';
import { CarrierRegionsTab } from './components/CarrierRegionsTab';
import { ShippingSettingsTab } from './components/ShippingSettingsTab';
import { settingsService } from '@/lib/services/settingsService';
import { storefrontService } from '@/lib/services/storefrontService';
import {
  shippingCarriersService,
  ShippingCarrierConfig,
  CarrierType,
  getCarrierDisplayName,
  isIndiaCarrier,
  isGlobalCarrier,
} from '@/lib/api/shippingCarriers';
import { PermissionGate, Permission } from '@/components/permission-gate';

// Country-specific carrier recommendations
const CARRIER_RECOMMENDATIONS: Record<string, {
  primary: CarrierType;
  fallback?: CarrierType;
  countryName: string;
  flag: string;
  primaryName: string;
  fallbackName?: string;
}> = {
  IN: {
    primary: 'SHIPROCKET',
    fallback: 'DELHIVERY',
    countryName: 'India',
    flag: '\u{1F1EE}\u{1F1F3}',
    primaryName: 'Shiprocket',
    fallbackName: 'Delhivery',
  },
  US: {
    primary: 'SHIPPO',
    fallback: 'FEDEX',
    countryName: 'United States',
    flag: '\u{1F1FA}\u{1F1F8}',
    primaryName: 'Shippo',
    fallbackName: 'FedEx',
  },
  GB: {
    primary: 'SHIPPO',
    fallback: 'DHL',
    countryName: 'United Kingdom',
    flag: '\u{1F1EC}\u{1F1E7}',
    primaryName: 'Shippo',
    fallbackName: 'DHL',
  },
  AU: {
    primary: 'SHIPENGINE',
    fallback: 'DHL',
    countryName: 'Australia',
    flag: '\u{1F1E6}\u{1F1FA}',
    primaryName: 'ShipEngine',
    fallbackName: 'DHL',
  },
  DEFAULT: {
    primary: 'SHIPPO',
    fallback: 'DHL',
    countryName: 'Your Region',
    flag: '\u{1F310}',
    primaryName: 'Shippo',
    fallbackName: 'DHL',
  },
};

const tabs = [
  { id: 'carriers', label: 'Shipping Carriers', icon: Truck },
  { id: 'regions', label: 'Regional Settings', icon: Globe },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function ShippingCarriersSettingsPage() {
  const [activeTab, setActiveTab] = useState('carriers');
  const [loading, setLoading] = useState(true);
  const [storeCountry, setStoreCountry] = useState<string | null>(null);
  const [storeCountryName, setStoreCountryName] = useState<string>('');
  const [carriers, setCarriers] = useState<ShippingCarrierConfig[]>([]);

  useEffect(() => {
    loadShippingStatus();
  }, []);

  const loadShippingStatus = async () => {
    try {
      setLoading(true);

      // Load carriers and store location in parallel
      const [carriersData, storefronts] = await Promise.all([
        shippingCarriersService.getCarrierConfigs(),
        storefrontService.getStorefronts(),
      ]);

      setCarriers(carriersData);

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
      console.error('Failed to load shipping status:', error);
    } finally {
      setLoading(false);
    }
  };

  const recommendation = storeCountry
    ? CARRIER_RECOMMENDATIONS[storeCountry] || CARRIER_RECOMMENDATIONS.DEFAULT
    : null;

  const enabledCarriers = carriers.filter(c => c.isEnabled);
  const hasPrimaryCarrier = recommendation && carriers.some(c => c.carrierType === recommendation.primary && c.isEnabled);
  const hasFallbackCarrier = recommendation?.fallback && carriers.some(c => c.carrierType === recommendation.fallback && c.isEnabled);
  const isShippingReady = enabledCarriers.length > 0;
  const hasTestModeOnly = enabledCarriers.length > 0 && enabledCarriers.every(c => c.isTestMode);

  const getSetupProgress = () => {
    let progress = 0;
    if (enabledCarriers.length > 0) progress += 50;
    if (hasPrimaryCarrier) progress += 25;
    if (hasFallbackCarrier) progress += 25;
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
      permission={Permission.SETTINGS_SHIPPING_VIEW}
      fallback="styled"
      fallbackTitle="Shipping Carriers"
      fallbackDescription="You don't have permission to view shipping settings."
    >
      <div className="min-h-screen bg-background p-8">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
          title="Shipping Carriers"
          description="Configure shipping carriers, regional settings, and shipping preferences"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Shipping Carriers' },
          ]}
        />

        {/* Shipping Status Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Status Card */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    isShippingReady
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                      : 'bg-gradient-to-br from-amber-500 to-orange-600'
                  }`}>
                    {isShippingReady ? (
                      <CheckCircle className="h-7 w-7 text-white" />
                    ) : (
                      <AlertCircle className="h-7 w-7 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {isShippingReady ? 'Shipping Ready' : 'Setup Required'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {isShippingReady
                        ? `${enabledCarriers.length} carrier${enabledCarriers.length > 1 ? 's' : ''} configured`
                        : 'Configure a shipping carrier to enable shipping'
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
                    className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${getSetupProgress()}%` }}
                  />
                </div>
              </div>

              {/* Carrier Status Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted border border-border">
                  <p className="text-2xl font-bold text-foreground">{enabledCarriers.length}</p>
                  <p className="text-xs text-muted-foreground">Active Carriers</p>
                </div>
                <div className="p-4 rounded-lg bg-muted border border-border">
                  <p className="text-2xl font-bold text-foreground">
                    {carriers.filter(c => !c.isTestMode && c.isEnabled).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Live Mode</p>
                </div>
                <div className="p-4 rounded-lg bg-muted border border-border">
                  <p className="text-2xl font-bold text-foreground">
                    {carriers.filter(c => c.isTestMode && c.isEnabled).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Test Mode</p>
                </div>
                <div className="p-4 rounded-lg bg-muted border border-border">
                  <div className="flex items-center gap-1">
                    {hasPrimaryCarrier ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                    {hasFallbackCarrier ? (
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
            <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-xl shadow-lg overflow-hidden text-white">
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
                    ? 'Ship across India with Shiprocket - COD, prepaid, and tracking included'
                    : 'Ship globally with competitive rates and tracking'
                  }
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-card rounded flex items-center justify-center">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{recommendation.primaryName}</span>
                    </div>
                    {hasPrimaryCarrier ? (
                      <CheckCircle className="h-5 w-5 text-success/60" />
                    ) : (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded">Primary</span>
                    )}
                  </div>

                  {recommendation.fallback && (
                    <div className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-card rounded flex items-center justify-center">
                          <Truck className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{recommendation.fallbackName}</span>
                      </div>
                      {hasFallbackCarrier ? (
                        <CheckCircle className="h-5 w-5 text-success/60" />
                      ) : (
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">Fallback</span>
                      )}
                    </div>
                  )}
                </div>

                {(!hasPrimaryCarrier || !hasFallbackCarrier) && (
                  <Button
                    onClick={() => setActiveTab('carriers')}
                    className="w-full bg-white text-primary hover:bg-muted"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Quick Setup
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}

                {hasPrimaryCarrier && hasFallbackCarrier && (
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
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:via-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="carriers" className="focus-visible:outline-none">
              <CarrierConfigTab />
            </TabsContent>

            <TabsContent value="regions" className="focus-visible:outline-none">
              <CarrierRegionsTab />
            </TabsContent>

            <TabsContent value="settings" className="focus-visible:outline-none">
              <ShippingSettingsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
    </PermissionGate>
  );
}
