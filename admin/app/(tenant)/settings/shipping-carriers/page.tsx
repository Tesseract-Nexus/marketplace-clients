'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Globe,
  Settings,
  Loader2,
  Zap,
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
} from '@/lib/api/shippingCarriers';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { cn } from '@/lib/utils';

type TabId = 'carriers' | 'regions' | 'settings';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'carriers', label: 'Carriers', icon: Truck },
  { id: 'regions', label: 'Regions', icon: Globe },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// Country-specific carrier recommendations
const CARRIER_RECOMMENDATIONS: Record<string, {
  primary: CarrierType;
  fallback?: CarrierType;
  countryName: string;
}> = {
  IN: { primary: 'SHIPROCKET', fallback: 'DELHIVERY', countryName: 'India' },
  US: { primary: 'SHIPPO', fallback: 'FEDEX', countryName: 'United States' },
  GB: { primary: 'SHIPPO', fallback: 'DHL', countryName: 'United Kingdom' },
  AU: { primary: 'SHIPENGINE', fallback: 'DHL', countryName: 'Australia' },
  DEFAULT: { primary: 'SHIPPO', fallback: 'DHL', countryName: 'Your Region' },
};

// Shipping Status Widget (inline, matching Payment pattern)
function ShippingStatusWidget({
  carriersConfigured,
  hasLiveCarrier,
  hasPrimaryCarrier,
  hasFallbackCarrier,
}: {
  carriersConfigured: number;
  hasLiveCarrier: boolean;
  hasPrimaryCarrier: boolean;
  hasFallbackCarrier: boolean;
}) {
  const steps = [
    { done: carriersConfigured > 0, label: 'Carrier' },
    { done: hasPrimaryCarrier, label: 'Primary' },
    { done: hasFallbackCarrier, label: 'Fallback' },
    { done: hasLiveCarrier, label: 'Live' },
  ];
  const completedCount = steps.filter(s => s.done).length;
  const isReady = carriersConfigured > 0;

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

export default function ShippingCarriersSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('carriers');
  const [loading, setLoading] = useState(true);
  const [storeCountry, setStoreCountry] = useState<string | null>(null);
  const [carriers, setCarriers] = useState<ShippingCarrierConfig[]>([]);

  useEffect(() => {
    loadShippingStatus();
  }, []);

  const loadShippingStatus = async () => {
    try {
      setLoading(true);
      const [carriersData, storefronts] = await Promise.all([
        shippingCarriersService.getCarrierConfigs(),
        storefrontService.getStorefronts(),
      ]);

      setCarriers(carriersData);

      if (storefronts.data && storefronts.data.length > 0) {
        const storefrontId = storefronts.data[0].id;
        const settings = await settingsService.getSettingsByContext({
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: storefrontId,
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
  const hasLiveCarrier = carriers.some(c => !c.isTestMode && c.isEnabled);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
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
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Shipping Carriers"
            description="Configure shipping carriers and regional preferences"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Settings', href: '/settings' },
              { label: 'Shipping Carriers' },
            ]}
          />

          <div className="flex gap-6">
            {/* Sidebar */}
            <div className="w-56 flex-shrink-0 hidden lg:block">
              <div className="sticky top-6 space-y-3">
                <ShippingStatusWidget
                  carriersConfigured={enabledCarriers.length}
                  hasLiveCarrier={hasLiveCarrier}
                  hasPrimaryCarrier={!!hasPrimaryCarrier}
                  hasFallbackCarrier={!!hasFallbackCarrier}
                />

                {/* Quick Links */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => setActiveTab('carriers')}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Carriers
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => setActiveTab('regions')}
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    Regions
                  </Button>
                </div>

                {/* Stats */}
                <div className="bg-card rounded-lg border border-border p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Active</span>
                    <span className="font-medium">{enabledCarriers.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Live</span>
                    <span className="font-medium">{carriers.filter(c => !c.isTestMode && c.isEnabled).length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Test</span>
                    <span className="font-medium">{carriers.filter(c => c.isTestMode && c.isEnabled).length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Mobile Status */}
              <div className="lg:hidden mb-4">
                <ShippingStatusWidget
                  carriersConfigured={enabledCarriers.length}
                  hasLiveCarrier={hasLiveCarrier}
                  hasPrimaryCarrier={!!hasPrimaryCarrier}
                  hasFallbackCarrier={!!hasFallbackCarrier}
                />
              </div>

              {/* Mobile Tab Selector */}
              <div className="md:hidden mb-4">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as TabId)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-sm font-medium"
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

                <TabsContent value="carriers" className="mt-0">
                  <CarrierConfigTab />
                </TabsContent>

                <TabsContent value="regions" className="mt-0">
                  <CarrierRegionsTab />
                </TabsContent>

                <TabsContent value="settings" className="mt-0">
                  <ShippingSettingsTab />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
