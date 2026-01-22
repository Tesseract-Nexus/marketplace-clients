'use client';

import React, { useState, useEffect } from 'react';
import { Users, Save, Star, Loader2 } from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/PageHeader';
import { useDialog } from '@/contexts/DialogContext';
import { StoreSelector } from '@/components/settings/StoreSelector';
import { settingsService } from '@/lib/services/settingsService';
import { storefrontService } from '@/lib/services/storefrontService';
import type { Storefront } from '@/lib/api/types';

const defaultCustomerData = {
  accounts: { enableRegistration: true, requireEmailVerification: true, enableSocialLogin: true, allowGuestCheckout: true, createAccountAfterPurchase: true, enablePasswordReset: true, sessionTimeoutMinutes: 120 },
  profiles: { collectDateOfBirth: true, collectGender: false, collectPhoneNumber: true, enableAddressBook: true, maxSavedAddresses: 5, enableWishlist: true, enableOrderHistory: true, enableReorder: true },
  loyalty: { enabled: true, pointsPerDollar: 1, pointsValue: 0.01, enableTiers: true, enableReferrals: true, referralBonus: 25 },
  communication: { enableNewsletterSignup: true, newsletterOptInDefault: false, enableSmsMarketing: true, enablePushNotifications: true, enableReviewRequests: true, reviewRequestDelayDays: 7 },
};

export default function CustomerSettingsPage() {
  const { showSuccess, showError } = useDialog();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState(defaultCustomerData);
  const [savedData, setSavedData] = useState(defaultCustomerData);
  const [existingEcommerce, setExistingEcommerce] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
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

      // Store the full ecommerce object to preserve other sections when saving
      if (settings?.ecommerce) {
        setExistingEcommerce(settings.ecommerce);
      } else {
        setExistingEcommerce({});
      }

      if (settings?.ecommerce?.customers) {
        setCustomerData(settings.ecommerce.customers);
        setSavedData(settings.ecommerce.customers);
        setSettingsId(settings.id);
      } else {
        setCustomerData(defaultCustomerData);
        setSavedData(defaultCustomerData);
        setSettingsId(settings?.id || null);
      }
    } catch (error) {
      console.error('Failed to load customer settings:', error);
      setCustomerData(defaultCustomerData);
      setSavedData(defaultCustomerData);
      setExistingEcommerce({});
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
      // Merge current section with existing ecommerce data to preserve other sections
      const mergedEcommerce = {
        ...existingEcommerce,
        customers: customerData,
      };

      const payload = {
        context: {
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: selectedStorefront.id,
        },
        ecommerce: mergedEcommerce,
      };

      if (settingsId) {
        await settingsService.updateSettings(settingsId, payload as any, selectedStorefront.id);
      } else {
        const newSettings = await settingsService.createSettings(payload as any, selectedStorefront.id);
        setSettingsId(newSettings.id);
      }

      // Update existing ecommerce with the merged data
      setExistingEcommerce(mergedEcommerce);
      setSavedData(customerData);
      showSuccess('Success', 'Customer settings saved successfully!');
    } catch (error) {
      console.error('Failed to save customer settings:', error);
      showError('Error', 'Failed to save customer settings');
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

  const hasChanges = JSON.stringify(customerData) !== JSON.stringify(savedData);
  const updateField = (path: string[], value: any) => {
    setCustomerData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) current = current[path[i]];
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  // Loading state
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
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Customer Management"
          description="Configure customer accounts, loyalty, and communication"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Ecommerce' },
            { label: 'Customers', href: '/customers' },
          ]}
          actions={
            <Button onClick={handleSave} disabled={!hasChanges || saving || !selectedStorefront} className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
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
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Account Settings</h3>
                  <p className="text-sm text-muted-foreground">Customer registration and authentication</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Session Timeout (minutes)</label>
                  <Input type="number" min="15" max="1440" value={customerData.accounts.sessionTimeoutMinutes} onChange={(e) => updateField(['accounts', 'sessionTimeoutMinutes'], parseInt(e.target.value))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Checkbox checked={customerData.accounts.enableRegistration} onChange={(e) => updateField(['accounts', 'enableRegistration'], e.target.checked)} label="Enable Registration" description="Allow new customer signups" />
                  <Checkbox checked={customerData.accounts.requireEmailVerification} onChange={(e) => updateField(['accounts', 'requireEmailVerification'], e.target.checked)} label="Email Verification" description="Verify email addresses" />
                  <Checkbox checked={customerData.accounts.enableSocialLogin} onChange={(e) => updateField(['accounts', 'enableSocialLogin'], e.target.checked)} label="Social Login" description="Google, Facebook, Apple" />
                  <Checkbox checked={customerData.accounts.allowGuestCheckout} onChange={(e) => updateField(['accounts', 'allowGuestCheckout'], e.target.checked)} label="Guest Checkout" description="Checkout without account" />
                  <Checkbox checked={customerData.accounts.createAccountAfterPurchase} onChange={(e) => updateField(['accounts', 'createAccountAfterPurchase'], e.target.checked)} label="Create Account After Purchase" description="Offer account creation post-checkout" />
                  <Checkbox checked={customerData.accounts.enablePasswordReset} onChange={(e) => updateField(['accounts', 'enablePasswordReset'], e.target.checked)} label="Password Reset" description="Self-service password reset" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Customer Profiles</h3>
                  <p className="text-sm text-muted-foreground">Profile fields and features</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Max Saved Addresses</label>
                  <Input type="number" min="1" max="20" value={customerData.profiles.maxSavedAddresses} onChange={(e) => updateField(['profiles', 'maxSavedAddresses'], parseInt(e.target.value))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Checkbox checked={customerData.profiles.collectDateOfBirth} onChange={(e) => updateField(['profiles', 'collectDateOfBirth'], e.target.checked)} label="Collect Date of Birth" description="Birthday for campaigns" />
                  <Checkbox checked={customerData.profiles.collectGender} onChange={(e) => updateField(['profiles', 'collectGender'], e.target.checked)} label="Collect Gender" description="For personalization" />
                  <Checkbox checked={customerData.profiles.collectPhoneNumber} onChange={(e) => updateField(['profiles', 'collectPhoneNumber'], e.target.checked)} label="Collect Phone Number" description="For SMS and support" />
                  <Checkbox checked={customerData.profiles.enableAddressBook} onChange={(e) => updateField(['profiles', 'enableAddressBook'], e.target.checked)} label="Address Book" description="Save multiple addresses" />
                  <Checkbox checked={customerData.profiles.enableWishlist} onChange={(e) => updateField(['profiles', 'enableWishlist'], e.target.checked)} label="Wishlist" description="Save for later" />
                  <Checkbox checked={customerData.profiles.enableOrderHistory} onChange={(e) => updateField(['profiles', 'enableOrderHistory'], e.target.checked)} label="Order History" description="View past orders" />
                  <Checkbox checked={customerData.profiles.enableReorder} onChange={(e) => updateField(['profiles', 'enableReorder'], e.target.checked)} label="Reorder" description="One-click reorder" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Loyalty Program</h3>
                  <p className="text-sm text-muted-foreground">Rewards and referral configuration</p>
                </div>
              </div>
              <div className="space-y-4">
                <Checkbox checked={customerData.loyalty.enabled} onChange={(e) => updateField(['loyalty', 'enabled'], e.target.checked)} label="Enable Loyalty Program" description="Reward repeat customers" />
                {customerData.loyalty.enabled && (
                  <div className="ml-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Points Per Dollar Spent</label>
                        <Input type="number" min="0" step="0.1" value={customerData.loyalty.pointsPerDollar} onChange={(e) => updateField(['loyalty', 'pointsPerDollar'], parseFloat(e.target.value))} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Point Value ($)</label>
                        <Input type="number" min="0" step="0.001" value={customerData.loyalty.pointsValue} onChange={(e) => updateField(['loyalty', 'pointsValue'], parseFloat(e.target.value))} />
                        <p className="text-xs text-muted-foreground mt-1">Dollar value per point</p>
                      </div>
                    </div>
                    <Checkbox checked={customerData.loyalty.enableTiers} onChange={(e) => updateField(['loyalty', 'enableTiers'], e.target.checked)} label="Enable Loyalty Tiers" description="Bronze, Silver, Gold, Platinum" />
                    <div>
                      <Checkbox checked={customerData.loyalty.enableReferrals} onChange={(e) => updateField(['loyalty', 'enableReferrals'], e.target.checked)} label="Enable Referrals" description="Refer a friend program" />
                      {customerData.loyalty.enableReferrals && (
                        <div className="ml-6 mt-2">
                          <label className="block text-sm font-semibold text-foreground mb-2">Referral Bonus ($)</label>
                          <Input type="number" min="0" step="5" value={customerData.loyalty.referralBonus} onChange={(e) => updateField(['loyalty', 'referralBonus'], parseFloat(e.target.value))} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Communication Preferences</h3>
                  <p className="text-sm text-muted-foreground">Marketing and notification settings</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Checkbox checked={customerData.communication.enableNewsletterSignup} onChange={(e) => updateField(['communication', 'enableNewsletterSignup'], e.target.checked)} label="Newsletter Signup" description="Email marketing list" />
                  <Checkbox checked={customerData.communication.newsletterOptInDefault} onChange={(e) => updateField(['communication', 'newsletterOptInDefault'], e.target.checked)} label="Opt-In by Default" description="Pre-check newsletter box" />
                  <Checkbox checked={customerData.communication.enableSmsMarketing} onChange={(e) => updateField(['communication', 'enableSmsMarketing'], e.target.checked)} label="SMS Marketing" description="Text message campaigns" />
                  <Checkbox checked={customerData.communication.enablePushNotifications} onChange={(e) => updateField(['communication', 'enablePushNotifications'], e.target.checked)} label="Push Notifications" description="Browser/app notifications" />
                </div>
                <div>
                  <Checkbox checked={customerData.communication.enableReviewRequests} onChange={(e) => updateField(['communication', 'enableReviewRequests'], e.target.checked)} label="Review Requests" description="Ask for product reviews" />
                  {customerData.communication.enableReviewRequests && (
                    <div className="ml-6 mt-2">
                      <label className="block text-sm font-semibold text-foreground mb-2">Review Request Delay (days)</label>
                      <Input type="number" min="1" max="60" value={customerData.communication.reviewRequestDelayDays} onChange={(e) => updateField(['communication', 'reviewRequestDelayDays'], parseInt(e.target.value))} />
                      <p className="text-xs text-muted-foreground mt-1">Wait after delivery before asking</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          )
        ) : (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Create Your First Storefront
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by creating a storefront to configure customer settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
