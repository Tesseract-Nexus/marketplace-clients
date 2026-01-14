'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Lock, Shield, Eye, EyeOff, Smartphone, Loader2, CheckCircle, Globe, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenant } from '@/context/TenantContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuthStore } from '@/store/auth';
import { getPreferences, updatePreferences, NotificationPreferences } from '@/lib/api/notifications';
import {
  getLanguages,
  getUserLanguagePreference,
  updateUserLanguagePreference,
  Language,
  UserLanguagePreference,
} from '@/lib/api/translations';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { useTranslation } from '@/context/TranslationContext';
import { clearTranslationCache } from '@/hooks/useTranslatedText';

export default function SettingsPage() {
  const { tenant, settings } = useTenant();
  const { accessToken, isAuthenticated } = useAuthStore();
  const {
    preferredLanguage: contextPreferredLanguage,
    autoDetectSource: contextAutoDetect,
    setPreferredLanguage: setContextLanguage,
    setAutoDetectSource: setContextAutoDetect,
  } = useTranslation();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    orderUpdates: true,
    promotions: false,
    newsletter: true,
  });

  // Language preferences state
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languagePreference, setLanguagePreference] = useState<UserLanguagePreference>({
    preferredLanguage: 'en',
    sourceLanguage: 'en',
    autoDetectSource: true,
    rtlEnabled: false,
  });
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const [languageSaveSuccess, setLanguageSaveSuccess] = useState(false);

  // Sync local state with TranslationContext (source of truth)
  useEffect(() => {
    setLanguagePreference((prev) => ({
      ...prev,
      preferredLanguage: contextPreferredLanguage,
      autoDetectSource: contextAutoDetect,
    }));
  }, [contextPreferredLanguage, contextAutoDetect]);

  // Load preferences from backend on mount
  useEffect(() => {
    async function loadPreferences() {
      if (!isAuthenticated || !accessToken || !tenant?.id) {
        setIsLoadingPrefs(false);
        return;
      }

      try {
        const prefs = await getPreferences(
          tenant.id,
          tenant.storefrontId || tenant.id,
          accessToken
        );
        setNotifications({
          email: prefs.emailEnabled,
          orderUpdates: prefs.ordersEnabled,
          promotions: prefs.marketingEnabled,
          newsletter: prefs.marketingEnabled, // Newsletter is part of marketing
        });
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      } finally {
        setIsLoadingPrefs(false);
      }
    }

    loadPreferences();
  }, [isAuthenticated, accessToken, tenant?.id, tenant?.storefrontId]);

  // Load language preferences from backend on mount
  useEffect(() => {
    async function loadLanguagePreferences() {
      if (!tenant?.id) {
        setIsLoadingLanguages(false);
        return;
      }

      try {
        // Load available languages
        const availableLanguages = await getLanguages(
          tenant.id,
          tenant.storefrontId || tenant.id
        );
        setLanguages(availableLanguages);

        // Load user preference if authenticated
        if (isAuthenticated && accessToken) {
          const userPref = await getUserLanguagePreference(
            tenant.id,
            tenant.storefrontId || tenant.id,
            accessToken
          );
          setLanguagePreference(userPref);
        }
      } catch (error) {
        console.error('Failed to load language preferences:', error);
      } finally {
        setIsLoadingLanguages(false);
      }
    }

    loadLanguagePreferences();
  }, [isAuthenticated, accessToken, tenant?.id, tenant?.storefrontId]);

  // Save language preference to backend
  const saveLanguagePreference = useCallback(
    async (newPreference: Partial<UserLanguagePreference>) => {
      if (!isAuthenticated || !accessToken || !tenant?.id) return;

      setIsSavingLanguage(true);
      setLanguageSaveSuccess(false);

      try {
        const updatedPref = await updateUserLanguagePreference(
          tenant.id,
          tenant.storefrontId || tenant.id,
          accessToken,
          newPreference
        );
        setLanguagePreference(updatedPref);
        setLanguageSaveSuccess(true);
        setTimeout(() => setLanguageSaveSuccess(false), 2000);
      } catch (error) {
        console.error('Failed to save language preference:', error);
      } finally {
        setIsSavingLanguage(false);
      }
    },
    [isAuthenticated, accessToken, tenant?.id, tenant?.storefrontId]
  );

  // Handler for language preference changes
  const handleLanguageChange = async (language: string) => {
    const newPreference = { ...languagePreference, preferredLanguage: language };
    setLanguagePreference(newPreference);

    // Clear the translation cache before changing language
    clearTranslationCache();

    // Update the TranslationContext so translations happen immediately
    await setContextLanguage(language);

    // Also save to backend (for authenticated users)
    saveLanguagePreference({ preferredLanguage: language });
  };

  const handleAutoDetectChange = async (enabled: boolean) => {
    const newPreference = { ...languagePreference, autoDetectSource: enabled };
    setLanguagePreference(newPreference);

    // Update the TranslationContext
    await setContextAutoDetect(enabled);

    // Also save to backend
    saveLanguagePreference({ autoDetectSource: enabled });
  };

  // Save notification preferences to backend
  const savePreferences = useCallback(async (newNotifications: typeof notifications) => {
    if (!isAuthenticated || !accessToken || !tenant?.id) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const prefs: Partial<NotificationPreferences> = {
        emailEnabled: newNotifications.email,
        ordersEnabled: newNotifications.orderUpdates,
        marketingEnabled: newNotifications.promotions || newNotifications.newsletter,
      };

      await updatePreferences(
        tenant.id,
        tenant.storefrontId || tenant.id,
        accessToken,
        prefs
      );
      setSaveSuccess(true);
      // Clear success message after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, accessToken, tenant?.id, tenant?.storefrontId]);

  // Handler for toggle changes
  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    const newNotifications = { ...notifications, [key]: value };
    setNotifications(newNotifications);
    savePreferences(newNotifications);
  };

  // Push notifications
  const {
    isSupported: isPushSupported,
    isEnabled: isPushEnabled,
    isLoading: isPushLoading,
    permission: pushPermission,
    enableNotifications,
    disableNotifications,
  } = usePushNotifications();

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      await enableNotifications();
    } else {
      await disableNotifications();
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${settings.primaryColor}15` }}
          >
            <Bell className="h-5 w-5 text-tenant-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold"><TranslatedUIText text="Notifications" /></h2>
            <p className="text-sm text-muted-foreground"><TranslatedUIText text="Manage your notification preferences" /></p>
          </div>
          {/* Save status indicator */}
          <div className="flex items-center gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {saveSuccess && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <TranslatedUIText text="Saved" />
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {isLoadingPrefs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
          {/* Push Notifications */}
          {isPushSupported && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium"><TranslatedUIText text="Push Notifications" /></p>
                    <p className="text-sm text-muted-foreground">
                      <TranslatedUIText text="Get instant updates on your device" />
                      {pushPermission === 'denied' && (
                        <span className="text-red-500 block">
                          <TranslatedUIText text="Blocked - please enable in browser settings" />
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isPushLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Switch
                    checked={isPushEnabled}
                    onCheckedChange={handlePushToggle}
                    disabled={isPushLoading || pushPermission === 'denied'}
                  />
                </div>
              </div>
              <Separator />
            </>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium"><TranslatedUIText text="Email Notifications" /></p>
              <p className="text-sm text-muted-foreground"><TranslatedUIText text="Receive notifications via email" /></p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) => handleNotificationChange('email', checked)}
              disabled={isSaving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium"><TranslatedUIText text="Order Updates" /></p>
              <p className="text-sm text-muted-foreground"><TranslatedUIText text="Get notified about your order status" /></p>
            </div>
            <Switch
              checked={notifications.orderUpdates}
              onCheckedChange={(checked) => handleNotificationChange('orderUpdates', checked)}
              disabled={isSaving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium"><TranslatedUIText text="Promotional Emails" /></p>
              <p className="text-sm text-muted-foreground"><TranslatedUIText text="Receive deals, discounts, and special offers" /></p>
            </div>
            <Switch
              checked={notifications.promotions}
              onCheckedChange={(checked) => handleNotificationChange('promotions', checked)}
              disabled={isSaving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium"><TranslatedUIText text="Newsletter" /></p>
              <p className="text-sm text-muted-foreground"><TranslatedUIText text="Weekly updates about new products" /></p>
            </div>
            <Switch
              checked={notifications.newsletter}
              onCheckedChange={(checked) => handleNotificationChange('newsletter', checked)}
              disabled={isSaving}
            />
          </div>
            </>
          )}
        </div>
      </div>

      {/* Language Preferences */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${settings.primaryColor}15` }}
          >
            <Globe className="h-5 w-5 text-tenant-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold"><TranslatedUIText text="Language Preferences" /></h2>
            <p className="text-sm text-muted-foreground">
              <TranslatedUIText text="Choose your preferred language for content display" />
            </p>
          </div>
          {/* Save status indicator */}
          <div className="flex items-center gap-2">
            {isSavingLanguage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {languageSaveSuccess && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <TranslatedUIText text="Saved" />
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {isLoadingLanguages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Preferred Language */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Languages className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium"><TranslatedUIText text="Preferred Language" /></p>
                    <p className="text-sm text-muted-foreground">
                      <TranslatedUIText text="Content will be translated to this language" />
                    </p>
                  </div>
                </div>
                <Select
                  value={languagePreference.preferredLanguage}
                  onValueChange={handleLanguageChange}
                  disabled={isSavingLanguage || !isAuthenticated}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.length > 0 ? (
                      languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <span className="flex items-center gap-2">
                            <span>{lang.nativeName}</span>
                            <span className="text-muted-foreground">({lang.name})</span>
                          </span>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="en">English</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Auto-detect Source Language */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium"><TranslatedUIText text="Auto-detect Source Language" /></p>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedUIText text="Automatically detect the language of content" />
                  </p>
                </div>
                <Switch
                  checked={languagePreference.autoDetectSource}
                  onCheckedChange={handleAutoDetectChange}
                  disabled={isSavingLanguage || !isAuthenticated}
                />
              </div>

              {!isAuthenticated && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground text-center py-2">
                    <TranslatedUIText text="Please sign in to save your language preferences" />
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Password & Security */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${settings.primaryColor}15` }}
          >
            <Lock className="h-5 w-5 text-tenant-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold"><TranslatedUIText text="Password & Security" /></h2>
            <p className="text-sm text-muted-foreground"><TranslatedUIText text="Manage your account security" /></p>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="currentPassword"><TranslatedUIText text="Current Password" /></Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword"><TranslatedUIText text="New Password" /></Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword"><TranslatedUIText text="Confirm New Password" /></Label>
            <Input id="confirmPassword" type="password" placeholder="Confirm new password" />
          </div>

          <Button className="btn-tenant-primary"><TranslatedUIText text="Update Password" /></Button>
        </div>

        <Separator className="my-6" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium"><TranslatedUIText text="Two-Factor Authentication" /></p>
              <p className="text-sm text-muted-foreground"><TranslatedUIText text="Add an extra layer of security" /></p>
            </div>
          </div>
          <Button variant="outline"><TranslatedUIText text="Enable 2FA" /></Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card rounded-xl border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-4"><TranslatedUIText text="Danger Zone" /></h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-medium"><TranslatedUIText text="Delete Account" /></p>
            <p className="text-sm text-muted-foreground">
              <TranslatedUIText text="Permanently delete your account and all associated data" />
            </p>
          </div>
          <Button variant="destructive"><TranslatedUIText text="Delete Account" /></Button>
        </div>
      </div>
    </div>
  );
}
