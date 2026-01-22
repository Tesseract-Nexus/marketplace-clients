'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Save,
  Gift,
  Tag,
  Mail,
  MessageSquare,
  Bell,
  ShoppingCart,
  Users,
  Loader2,
  Sparkles,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/PageHeader';
import { StoreSelector } from '@/components/settings/StoreSelector';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { settingsService } from '@/lib/services/settingsService';
import { storefrontService } from '@/lib/services/storefrontService';
import type { Storefront } from '@/lib/api/types';
import type { MarketingSettings } from '@/lib/types/settings';
import { useDialog } from '@/contexts/DialogContext';

const defaultMarketingData: MarketingSettings = {
  features: {
    enablePromoBanners: true,
    enableProductPromotions: true,
    enablePersonalizedOffers: true,
    enableReferralProgram: true,
    enableLoyaltyProgram: true,
    enableEmailCampaigns: true,
    enableSmsCampaigns: false,
    enablePushCampaigns: false,
    enableAbandonedCartRecovery: true,
  },
  referrals: {
    enabled: true,
    referrerBonus: 500,
    refereeBonus: 500,
    requirePurchase: true,
    minimumPurchaseAmount: 25,
    maxReferralsPerCustomer: 50,
  },
  promotions: {
    showOnProductPages: true,
    showOnHomepage: true,
    showOnCheckout: true,
    maxPromotionsPerProduct: 3,
    enableCountdownTimers: true,
  },
  campaigns: {
    defaultSendTimeHour: 10,
    enableHtmlEmails: true,
    enableSegmentTargeting: true,
    requireApproval: false,
  },
};

export default function MarketingSettingsPage() {
  const { showSuccess, showError } = useDialog();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);
  const [marketingData, setMarketingData] = useState<MarketingSettings>(defaultMarketingData);
  const [savedData, setSavedData] = useState<MarketingSettings>(defaultMarketingData);
  const [existingSettings, setExistingSettings] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  // Load storefronts on mount
  useEffect(() => {
    loadStorefronts();
  }, []);

  // Load settings when storefront changes
  useEffect(() => {
    if (selectedStorefront) {
      loadSettings(selectedStorefront.id);
    }
  }, [selectedStorefront?.id]);

  const loadStorefronts = async () => {
    try {
      setLoadingStorefronts(true);
      const result = await storefrontService.getStorefronts();
      const sfList = result.data || [];
      setStorefronts(sfList);

      if (sfList.length > 0) {
        setSelectedStorefront(sfList[0]);
      }
    } catch (error) {
      console.error('Failed to load storefronts:', error);
    } finally {
      setLoadingStorefronts(false);
    }
  };

  const loadSettings = async (storefrontId: string) => {
    try {
      setLoading(true);
      const settings = await settingsService.getSettingsByContext({
        applicationId: 'admin-portal',
        scope: 'application',
        tenantId: storefrontId,
      });

      // Store the full settings object to preserve other sections when saving
      if (settings) {
        setExistingSettings(settings);
      } else {
        setExistingSettings({});
      }

      if (settings?.marketing) {
        // Deep merge with defaults to ensure all nested properties exist
        const mergedData: MarketingSettings = {
          features: {
            ...defaultMarketingData.features,
            ...(settings.marketing.features || {}),
          },
          referrals: {
            ...defaultMarketingData.referrals,
            ...(settings.marketing.referrals || {}),
          },
          promotions: {
            ...defaultMarketingData.promotions,
            ...(settings.marketing.promotions || {}),
          },
          campaigns: {
            ...defaultMarketingData.campaigns,
            ...(settings.marketing.campaigns || {}),
          },
        };
        setMarketingData(mergedData);
        setSavedData(mergedData);
        setSettingsId(settings.id);
      } else {
        setMarketingData(defaultMarketingData);
        setSavedData(defaultMarketingData);
        setSettingsId(settings?.id || null);
      }
    } catch (error) {
      console.error('Failed to load marketing settings:', error);
      setMarketingData(defaultMarketingData);
      setSavedData(defaultMarketingData);
      setExistingSettings({});
      setSettingsId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedStorefront) {
      showError('Error', 'Please select a storefront first');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        context: {
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: selectedStorefront.id,
        },
        marketing: marketingData,
      };

      if (settingsId) {
        await settingsService.updateSettings(settingsId, payload as any, selectedStorefront.id);
      } else {
        const newSettings = await settingsService.createSettings(payload as any, selectedStorefront.id);
        setSettingsId(newSettings.id);
      }

      setSavedData(marketingData);
      showSuccess('Success', 'Marketing settings saved successfully!');
    } catch (error) {
      console.error('Failed to save marketing settings:', error);
      showError('Error', 'Failed to save marketing settings');
    } finally {
      setSaving(false);
    }
  };

  const handleStorefrontSelect = (storefront: Storefront) => {
    setSelectedStorefront(storefront);
  };

  const handleStorefrontCreated = (storefront: Storefront) => {
    setStorefronts((prev) => [...prev, storefront]);
    setSelectedStorefront(storefront);
  };

  const hasChanges = JSON.stringify(marketingData) !== JSON.stringify(savedData);

  const updateField = (path: string[], value: any) => {
    setMarketingData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  if (loadingStorefronts && !storefronts.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading storefronts...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.MARKETING_UPDATE}
      fallback="styled"
      fallbackTitle="Marketing Settings Access Required"
      fallbackDescription="You don't have the required permissions to manage marketing settings. Please contact your administrator to request access."
      loading={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
    >
    <div className="min-h-screen bg-muted p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Marketing Features"
          description="Enable or disable marketing features for your storefront"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Marketing' },
          ]}
          actions={
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving || !selectedStorefront}
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          }
        />

        <StoreSelector
          storefronts={storefronts}
          selectedStorefront={selectedStorefront}
          onSelect={handleStorefrontSelect}
          onStorefrontCreated={handleStorefrontCreated}
          loading={loadingStorefronts}
          showQuickActions={false}
          showUrlInfo={false}
        />

        {selectedStorefront ? (
          loading ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Feature Toggles */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Marketing Features</h3>
                    <p className="text-sm text-muted-foreground">Enable or disable storefront marketing features</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Checkbox
                    checked={marketingData.features.enablePromoBanners}
                    onChange={(e) => updateField(['features', 'enablePromoBanners'], e.target.checked)}
                    label="Promo Banners"
                    description="Show promotional banners on the storefront"
                  />
                  <Checkbox
                    checked={marketingData.features.enableProductPromotions}
                    onChange={(e) => updateField(['features', 'enableProductPromotions'], e.target.checked)}
                    label="Product Promotions"
                    description="Display promotions on product pages"
                  />
                  <Checkbox
                    checked={marketingData.features.enablePersonalizedOffers}
                    onChange={(e) => updateField(['features', 'enablePersonalizedOffers'], e.target.checked)}
                    label="Personalized Offers"
                    description="Show personalized offers based on customer behavior"
                  />
                  <Checkbox
                    checked={marketingData.features.enableReferralProgram}
                    onChange={(e) => updateField(['features', 'enableReferralProgram'], e.target.checked)}
                    label="Referral Program"
                    description="Enable customer referral program"
                  />
                  <Checkbox
                    checked={marketingData.features.enableLoyaltyProgram}
                    onChange={(e) => updateField(['features', 'enableLoyaltyProgram'], e.target.checked)}
                    label="Loyalty Program"
                    description="Enable points and rewards program"
                  />
                  <Checkbox
                    checked={marketingData.features.enableAbandonedCartRecovery}
                    onChange={(e) => updateField(['features', 'enableAbandonedCartRecovery'], e.target.checked)}
                    label="Abandoned Cart Recovery"
                    description="Send reminders for abandoned carts"
                  />
                </div>
              </div>

              {/* Campaign Channels */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Megaphone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Campaign Channels</h3>
                    <p className="text-sm text-muted-foreground">Enable communication channels for campaigns</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted">
                    <Mail className="h-5 w-5 text-primary" />
                    <Checkbox
                      checked={marketingData.features.enableEmailCampaigns}
                      onChange={(e) => updateField(['features', 'enableEmailCampaigns'], e.target.checked)}
                      label="Email Campaigns"
                      description="Send marketing emails"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted">
                    <MessageSquare className="h-5 w-5 text-success" />
                    <Checkbox
                      checked={marketingData.features.enableSmsCampaigns}
                      onChange={(e) => updateField(['features', 'enableSmsCampaigns'], e.target.checked)}
                      label="SMS Campaigns"
                      description="Send marketing SMS"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted">
                    <Bell className="h-5 w-5 text-primary" />
                    <Checkbox
                      checked={marketingData.features.enablePushCampaigns}
                      onChange={(e) => updateField(['features', 'enablePushCampaigns'], e.target.checked)}
                      label="Push Notifications"
                      description="Send push notifications"
                    />
                  </div>
                </div>
              </div>

              {/* Referral Program Settings */}
              {marketingData.features.enableReferralProgram && (
                <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Referral Program</h3>
                      <p className="text-sm text-muted-foreground">Configure referral rewards and limits</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Referrer Bonus (Points)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={marketingData.referrals.referrerBonus}
                        onChange={(e) => updateField(['referrals', 'referrerBonus'], parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Points given to the person who refers</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Referee Bonus (Points)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={marketingData.referrals.refereeBonus}
                        onChange={(e) => updateField(['referrals', 'refereeBonus'], parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Points given to the new customer</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Minimum Purchase Amount ($)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="5"
                        value={marketingData.referrals.minimumPurchaseAmount}
                        onChange={(e) => updateField(['referrals', 'minimumPurchaseAmount'], parseFloat(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Minimum purchase to earn referral bonus</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Max Referrals Per Customer
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={marketingData.referrals.maxReferralsPerCustomer}
                        onChange={(e) => updateField(['referrals', 'maxReferralsPerCustomer'], parseInt(e.target.value))}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Checkbox
                        checked={marketingData.referrals.requirePurchase}
                        onChange={(e) => updateField(['referrals', 'requirePurchase'], e.target.checked)}
                        label="Require Purchase for Bonus"
                        description="Referee must make a purchase before bonus is awarded"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Promotion Display Settings */}
              {marketingData.features.enableProductPromotions && (
                <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                      <Tag className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Promotion Display</h3>
                      <p className="text-sm text-muted-foreground">Configure where promotions appear</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Checkbox
                        checked={marketingData.promotions.showOnProductPages}
                        onChange={(e) => updateField(['promotions', 'showOnProductPages'], e.target.checked)}
                        label="Product Pages"
                        description="Show promotions on product detail pages"
                      />
                      <Checkbox
                        checked={marketingData.promotions.showOnHomepage}
                        onChange={(e) => updateField(['promotions', 'showOnHomepage'], e.target.checked)}
                        label="Homepage"
                        description="Show promotions on the homepage"
                      />
                      <Checkbox
                        checked={marketingData.promotions.showOnCheckout}
                        onChange={(e) => updateField(['promotions', 'showOnCheckout'], e.target.checked)}
                        label="Checkout"
                        description="Show promotions during checkout"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Max Promotions Per Product
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={marketingData.promotions.maxPromotionsPerProduct}
                          onChange={(e) => updateField(['promotions', 'maxPromotionsPerProduct'], parseInt(e.target.value))}
                        />
                      </div>
                      <div className="flex items-end">
                        <Checkbox
                          checked={marketingData.promotions.enableCountdownTimers}
                          onChange={(e) => updateField(['promotions', 'enableCountdownTimers'], e.target.checked)}
                          label="Countdown Timers"
                          description="Show countdown for expiring promotions"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Settings */}
              {(marketingData.features.enableEmailCampaigns ||
                marketingData.features.enableSmsCampaigns ||
                marketingData.features.enablePushCampaigns) && (
                <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Campaign Settings</h3>
                      <p className="text-sm text-muted-foreground">Configure campaign defaults</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Default Send Time (Hour, 24h format)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={marketingData.campaigns.defaultSendTimeHour}
                        onChange={(e) => updateField(['campaigns', 'defaultSendTimeHour'], parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Default hour for scheduled campaigns</p>
                    </div>

                    <div className="space-y-3">
                      <Checkbox
                        checked={marketingData.campaigns.enableHtmlEmails}
                        onChange={(e) => updateField(['campaigns', 'enableHtmlEmails'], e.target.checked)}
                        label="HTML Emails"
                        description="Allow rich HTML email templates"
                      />
                      <Checkbox
                        checked={marketingData.campaigns.enableSegmentTargeting}
                        onChange={(e) => updateField(['campaigns', 'enableSegmentTargeting'], e.target.checked)}
                        label="Segment Targeting"
                        description="Target campaigns by customer segments"
                      />
                      <Checkbox
                        checked={marketingData.campaigns.requireApproval}
                        onChange={(e) => updateField(['campaigns', 'requireApproval'], e.target.checked)}
                        label="Require Approval"
                        description="Campaigns require approval before sending"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Megaphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Create Your First Storefront
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by creating a storefront to configure marketing settings.
            </p>
          </div>
        )}
      </div>
    </div>
    </PermissionGate>
  );
}
