'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Lock, Shield, Eye, EyeOff, Loader2, CheckCircle, Globe, Languages, AlertTriangle, Smartphone, KeyRound, X, Check, Copy, Fingerprint, Pencil, Trash2, Plus, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTenant } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import { getPreferences, updatePreferences, NotificationPreferences } from '@/lib/api/notifications';
import { deactivateAccount, getTotpStatus, initiateTotpSetup, confirmTotpSetup, disableTotp, regenerateBackupCodes, isPasskeySupported, getPasskeys, registerPasskey, renamePasskey, deletePasskey, PasskeyInfo } from '@/lib/api/auth';
import { QRCodeSVG } from 'qrcode.react';
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
  const router = useRouter();
  const { tenant, settings } = useTenant();
  const { accessToken, isAuthenticated, logout: clearAuth } = useAuthStore();
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

  // Account deactivation state
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('not_using');
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  // TOTP MFA state
  type MFAFlow = 'idle' | 'enable-scan' | 'enable-verify' | 'enable-backup' | 'disable' | 'regenerate';
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);
  const [isLoadingTotp, setIsLoadingTotp] = useState(true);
  const [mfaFlow, setMfaFlow] = useState<MFAFlow>('idle');
  const [mfaError, setMfaError] = useState('');
  const [isMfaProcessing, setIsMfaProcessing] = useState(false);
  const [setupSession, setSetupSession] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showManualKey, setShowManualKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [totpCode, setTotpCode] = useState(['', '', '', '', '', '']);
  const totpCodeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Passkey state
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(true);
  const [isPasskeySupported_, setIsPasskeySupported_] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [passkeyError, setPasskeyError] = useState('');
  const [passkeySuccess, setPasskeySuccess] = useState('');
  const [showPasskeyNameDialog, setShowPasskeyNameDialog] = useState(false);
  const [passkeyName, setPasskeyName] = useState('');
  const [editingPasskey, setEditingPasskey] = useState<string | null>(null);
  const [editingPasskeyName, setEditingPasskeyName] = useState('');
  const [deletingPasskeyId, setDeletingPasskeyId] = useState<string | null>(null);

  // Check passkey support + load passkeys
  useEffect(() => {
    setIsPasskeySupported_(isPasskeySupported());
  }, []);

  useEffect(() => {
    async function loadPasskeys() {
      if (!isAuthenticated) {
        setIsLoadingPasskeys(false);
        return;
      }
      try {
        const result = await getPasskeys();
        if (result.success) {
          setPasskeys(result.passkeys);
        }
      } catch {
        // Silently handle
      }
      setIsLoadingPasskeys(false);
    }
    loadPasskeys();
  }, [isAuthenticated]);

  const handleAddPasskey = async () => {
    if (!passkeyName.trim()) return;
    setShowPasskeyNameDialog(false);
    setPasskeyError('');
    setPasskeySuccess('');
    setIsRegisteringPasskey(true);

    const result = await registerPasskey(passkeyName.trim());

    if (result.success) {
      setPasskeySuccess('Passkey registered successfully.');
      setTimeout(() => setPasskeySuccess(''), 3000);
      setPasskeyName('');
      // Refresh list
      const listResult = await getPasskeys();
      if (listResult.success) setPasskeys(listResult.passkeys);
    } else if (result.error !== 'CANCELLED') {
      setPasskeyError(result.message || 'Failed to register passkey.');
    }
    setIsRegisteringPasskey(false);
  };

  const handleRenamePasskey = async (credentialId: string) => {
    if (!editingPasskeyName.trim()) return;
    setPasskeyError('');

    const result = await renamePasskey(credentialId, editingPasskeyName.trim());
    if (result.success) {
      setPasskeys((prev) =>
        prev.map((p) =>
          p.credential_id === credentialId ? { ...p, name: editingPasskeyName.trim() } : p
        )
      );
      setEditingPasskey(null);
      setEditingPasskeyName('');
    } else {
      setPasskeyError(result.message || 'Failed to rename passkey.');
    }
  };

  const handleDeletePasskey = async (credentialId: string) => {
    setPasskeyError('');
    setDeletingPasskeyId(credentialId);

    const result = await deletePasskey(credentialId);
    if (result.success) {
      setPasskeys((prev) => prev.filter((p) => p.credential_id !== credentialId));
    } else {
      setPasskeyError(result.message || 'Failed to delete passkey.');
    }
    setDeletingPasskeyId(null);
  };

  // Load TOTP status
  useEffect(() => {
    async function loadTotpStatus() {
      if (!isAuthenticated) {
        setIsLoadingTotp(false);
        return;
      }
      try {
        const result = await getTotpStatus();
        if (result.success) {
          setTotpEnabled(result.totp_enabled);
          setBackupCodesRemaining(result.backup_codes_remaining);
        }
      } catch {
        // Silently handle
      }
      setIsLoadingTotp(false);
    }
    loadTotpStatus();
  }, [isAuthenticated]);

  const resetTotpCode = () => {
    setTotpCode(['', '', '', '', '', '']);
    setTimeout(() => totpCodeRefs.current[0]?.focus(), 50);
  };

  const handleTotpCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...totpCode];
    newCode[index] = value;
    setTotpCode(newCode);
    if (value && index < 5) {
      totpCodeRefs.current[index + 1]?.focus();
    }
  };

  const handleTotpCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !totpCode[index] && index > 0) {
      totpCodeRefs.current[index - 1]?.focus();
    }
  };

  const getTotpCodeString = () => totpCode.join('');

  const handleStartTotpEnable = async () => {
    setMfaError('');
    setIsMfaProcessing(true);
    try {
      const result = await initiateTotpSetup();
      if (result.success && result.setup_session) {
        setSetupSession(result.setup_session);
        setTotpUri(result.totp_uri || '');
        setManualKey(result.manual_entry_key || '');
        setBackupCodes(result.backup_codes || []);
        setMfaFlow('enable-scan');
      } else {
        setMfaError(result.message || 'Failed to start TOTP setup.');
      }
    } catch {
      setMfaError('Failed to start TOTP setup.');
    }
    setIsMfaProcessing(false);
  };

  const handleVerifyTotpSetup = async () => {
    const codeStr = getTotpCodeString();
    if (codeStr.length !== 6) return;
    setMfaError('');
    setIsMfaProcessing(true);
    try {
      const result = await confirmTotpSetup(setupSession, codeStr);
      if (result.success) {
        setMfaFlow('enable-backup');
      } else {
        setMfaError(result.message || 'Invalid code.');
        resetTotpCode();
      }
    } catch {
      setMfaError('Verification failed.');
      resetTotpCode();
    }
    setIsMfaProcessing(false);
  };

  const handleBackupCodesAcknowledged = () => {
    setTotpEnabled(true);
    setBackupCodesRemaining(backupCodes.length);
    setMfaFlow('idle');
    setSetupSession('');
    setTotpUri('');
    setManualKey('');
    setBackupCodes([]);
    resetTotpCode();
  };

  const handleDisableTotp = async () => {
    const codeStr = getTotpCodeString();
    if (codeStr.length !== 6) return;
    setMfaError('');
    setIsMfaProcessing(true);
    try {
      const result = await disableTotp(codeStr);
      if (result.success) {
        setTotpEnabled(false);
        setBackupCodesRemaining(0);
        setMfaFlow('idle');
        resetTotpCode();
      } else {
        setMfaError(result.message || 'Invalid code.');
        resetTotpCode();
      }
    } catch {
      setMfaError('Failed to disable TOTP.');
      resetTotpCode();
    }
    setIsMfaProcessing(false);
  };

  const handleRegenerateBackupCodes = async () => {
    const codeStr = getTotpCodeString();
    if (codeStr.length !== 6) return;
    setMfaError('');
    setIsMfaProcessing(true);
    try {
      const result = await regenerateBackupCodes(codeStr);
      if (result.success && result.backup_codes) {
        setBackupCodes(result.backup_codes);
        setBackupCodesRemaining(result.backup_codes.length);
        setMfaFlow('enable-backup');
      } else {
        setMfaError(result.message || 'Invalid code.');
        resetTotpCode();
      }
    } catch {
      setMfaError('Failed to regenerate backup codes.');
      resetTotpCode();
    }
    setIsMfaProcessing(false);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n')).then(() => {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    });
  };

  const handleCancelMfa = () => {
    setMfaFlow('idle');
    setMfaError('');
    resetTotpCode();
    setSetupSession('');
    setTotpUri('');
    setManualKey('');
    setBackupCodes([]);
    setShowManualKey(false);
  };

  const renderTotpCodeInput = () => (
    <div className="flex justify-center gap-2">
      {totpCode.map((digit, index) => (
        <input
          key={index}
          ref={el => { totpCodeRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleTotpCodeChange(index, e.target.value)}
          onKeyDown={e => handleTotpCodeKeyDown(index, e)}
          className="w-11 h-11 text-center text-lg font-bold rounded-lg border border-border bg-background text-foreground focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/20 transition-all"
          disabled={isMfaProcessing}
        />
      ))}
    </div>
  );

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

  // Handle account deactivation
  const handleDeactivateAccount = async () => {
    setIsDeactivating(true);
    setDeactivateError(null);

    try {
      const result = await deactivateAccount(deactivateReason);

      if (result.success) {
        // Clear local auth state first
        clearAuth();
        // Use window.location for a full page navigation to ensure clean state
        // This is important because the session cookie has been cleared by the server
        window.location.href = '/goodbye';
        return; // Don't set isDeactivating to false since we're navigating away
      } else {
        setDeactivateError(result.message || 'Failed to deactivate account. Please try again.');
      }
    } catch (error) {
      console.error('Deactivation error:', error);
      setDeactivateError('An unexpected error occurred. Please try again.');
    } finally {
      setIsDeactivating(false);
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
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${settings.primaryColor}15` }}
          >
            <Smartphone className="h-5 w-5 text-tenant-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold"><TranslatedUIText text="Two-Factor Authentication" /></h2>
            <p className="text-sm text-muted-foreground"><TranslatedUIText text="Secure your account with an authenticator app" /></p>
          </div>
        </div>

        {mfaError && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 mb-4">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{mfaError}</span>
          </div>
        )}

        {isLoadingTotp ? (
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground"><TranslatedUIText text="Loading security settings..." /></span>
          </div>
        ) : (
          <>
            {/* Idle State */}
            {mfaFlow === 'idle' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        <TranslatedUIText text="Authenticator App" />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {totpEnabled
                          ? <TranslatedUIText text={`Enabled - ${backupCodesRemaining} backup code${backupCodesRemaining !== 1 ? 's' : ''} remaining`} />
                          : <TranslatedUIText text="Not configured" />}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    totpEnabled
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted-foreground/10 text-muted-foreground'
                  }`}>
                    {totpEnabled ? <TranslatedUIText text="Active" /> : <TranslatedUIText text="Inactive" />}
                  </span>
                </div>

                {!totpEnabled ? (
                  <Button
                    onClick={handleStartTotpEnable}
                    disabled={isMfaProcessing || !isAuthenticated}
                    className="w-full btn-tenant-primary"
                  >
                    {isMfaProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Smartphone className="h-4 w-4 mr-2" />
                    )}
                    <TranslatedUIText text="Enable Authenticator App" />
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => { setMfaFlow('regenerate'); resetTotpCode(); }}
                      className="flex-1"
                    >
                      <KeyRound className="h-4 w-4 mr-2" />
                      <TranslatedUIText text="Regenerate Backup Codes" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setMfaFlow('disable'); resetTotpCode(); }}
                      className="flex-1 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      <TranslatedUIText text="Disable" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Enable Flow: Step 1 — Scan QR */}
            {mfaFlow === 'enable-scan' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    <TranslatedUIText text="Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)" />
                  </p>
                  {totpUri && (
                    <div className="bg-white rounded-xl p-4 inline-block border mb-4">
                      <QRCodeSVG value={totpUri} size={180} level="M" />
                    </div>
                  )}
                  <div>
                    <button
                      onClick={() => setShowManualKey(!showManualKey)}
                      className="text-xs text-tenant-primary hover:underline"
                    >
                      {showManualKey ? <TranslatedUIText text="Hide manual key" /> : <TranslatedUIText text="Can't scan? Enter key manually" />}
                    </button>
                    {showManualKey && manualKey && (
                      <div className="mt-2 bg-muted rounded-lg p-3">
                        <code className="text-xs font-mono font-semibold break-all">
                          {manualKey}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleCancelMfa} className="flex-1">
                    <TranslatedUIText text="Cancel" />
                  </Button>
                  <Button
                    onClick={() => { setMfaFlow('enable-verify'); resetTotpCode(); }}
                    className="flex-1 btn-tenant-primary"
                  >
                    <TranslatedUIText text="Next: Verify Code" />
                  </Button>
                </div>
              </div>
            )}

            {/* Enable Flow: Step 2 — Verify Code */}
            {mfaFlow === 'enable-verify' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  <TranslatedUIText text="Enter the 6-digit code from your authenticator app to confirm setup." />
                </p>
                {renderTotpCodeInput()}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setMfaFlow('enable-scan')} className="flex-1">
                    <TranslatedUIText text="Back" />
                  </Button>
                  <Button
                    onClick={handleVerifyTotpSetup}
                    disabled={isMfaProcessing || getTotpCodeString().length !== 6}
                    className="flex-1 btn-tenant-primary"
                  >
                    {isMfaProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    <TranslatedUIText text="Verify & Enable" />
                  </Button>
                </div>
              </div>
            )}

            {/* Enable Flow: Step 3 — Backup Codes */}
            {mfaFlow === 'enable-backup' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  <TranslatedUIText text="Save these backup codes in a safe place. Each code can only be used once." />
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((bcode, i) => (
                    <div
                      key={i}
                      className="font-mono text-sm font-semibold bg-muted rounded-lg py-2 px-3 text-center"
                    >
                      {bcode}
                    </div>
                  ))}
                </div>
                <Button variant="outline" onClick={handleCopyBackupCodes} className="w-full">
                  {copiedCodes ? (
                    <><Check className="h-4 w-4 mr-2" /> <TranslatedUIText text="Copied!" /></>
                  ) : (
                    <><Copy className="h-4 w-4 mr-2" /> <TranslatedUIText text="Copy All Codes" /></>
                  )}
                </Button>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
                    <TranslatedUIText text="You won't be able to see these codes again after closing this dialog." />
                  </p>
                </div>
                <Button onClick={handleBackupCodesAcknowledged} className="w-full btn-tenant-primary">
                  <TranslatedUIText text="I've Saved These Codes — Done" />
                </Button>
              </div>
            )}

            {/* Disable Flow */}
            {mfaFlow === 'disable' && (
              <div className="space-y-4">
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    <TranslatedUIText text="Enter your current authenticator code to disable two-factor authentication." />
                  </p>
                </div>
                {renderTotpCodeInput()}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleCancelMfa} className="flex-1">
                    <TranslatedUIText text="Cancel" />
                  </Button>
                  <Button
                    onClick={handleDisableTotp}
                    disabled={isMfaProcessing || getTotpCodeString().length !== 6}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isMfaProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    <TranslatedUIText text="Disable" />
                  </Button>
                </div>
              </div>
            )}

            {/* Regenerate Flow */}
            {mfaFlow === 'regenerate' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  <TranslatedUIText text="Enter your current authenticator code to generate new backup codes. This will invalidate all previous backup codes." />
                </p>
                {renderTotpCodeInput()}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleCancelMfa} className="flex-1">
                    <TranslatedUIText text="Cancel" />
                  </Button>
                  <Button
                    onClick={handleRegenerateBackupCodes}
                    disabled={isMfaProcessing || getTotpCodeString().length !== 6}
                    className="flex-1 btn-tenant-primary"
                  >
                    {isMfaProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    <TranslatedUIText text="Regenerate" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Passkeys */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${settings.primaryColor}15` }}
          >
            <Fingerprint className="h-5 w-5 text-tenant-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold"><TranslatedUIText text="Passkeys" /></h2>
            <p className="text-sm text-muted-foreground"><TranslatedUIText text="Sign in with fingerprint, face, or security key" /></p>
          </div>
        </div>

        {passkeyError && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 mb-4">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{passkeyError}</span>
          </div>
        )}

        {passkeySuccess && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 mb-4">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>{passkeySuccess}</span>
          </div>
        )}

        {!isPasskeySupported_ ? (
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <CloudOff className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              <TranslatedUIText text="Your browser does not support passkeys. Try using a modern browser like Chrome, Safari, or Edge." />
            </p>
          </div>
        ) : isLoadingPasskeys ? (
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground"><TranslatedUIText text="Loading passkeys..." /></span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* List of registered passkeys */}
            {passkeys.length > 0 && (
              <div className="space-y-2">
                {passkeys.map((pk) => (
                  <div
                    key={pk.credential_id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Fingerprint className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        {editingPasskey === pk.credential_id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingPasskeyName}
                              onChange={(e) => setEditingPasskeyName(e.target.value)}
                              className="h-7 text-sm w-40"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenamePasskey(pk.credential_id);
                                if (e.key === 'Escape') { setEditingPasskey(null); setEditingPasskeyName(''); }
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleRenamePasskey(pk.credential_id)}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => { setEditingPasskey(null); setEditingPasskeyName(''); }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium truncate">{pk.name}</p>
                            <p className="text-xs text-muted-foreground">
                              <TranslatedUIText text="Added" />{' '}
                              {new Date(pk.created_at).toLocaleDateString()}
                              {pk.last_used_at && (
                                <>
                                  {' '}&middot;{' '}
                                  <TranslatedUIText text="Last used" />{' '}
                                  {new Date(pk.last_used_at).toLocaleDateString()}
                                </>
                              )}
                              {pk.backed_up && (
                                <>
                                  {' '}&middot;{' '}
                                  <span className="text-green-600"><TranslatedUIText text="Synced" /></span>
                                </>
                              )}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    {editingPasskey !== pk.credential_id && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingPasskey(pk.credential_id);
                            setEditingPasskeyName(pk.name);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeletePasskey(pk.credential_id)}
                          disabled={deletingPasskeyId === pk.credential_id}
                        >
                          {deletingPasskeyId === pk.credential_id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add passkey button */}
            <Button
              onClick={() => {
                setPasskeyName('');
                setPasskeyError('');
                setShowPasskeyNameDialog(true);
              }}
              disabled={isRegisteringPasskey || !isAuthenticated}
              className="w-full btn-tenant-primary"
            >
              {isRegisteringPasskey ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              <TranslatedUIText text="Add a passkey" />
            </Button>
          </div>
        )}
      </div>

      {/* Passkey Name Dialog */}
      <Dialog open={showPasskeyNameDialog} onOpenChange={setShowPasskeyNameDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle><TranslatedUIText text="Name your passkey" /></DialogTitle>
            <DialogDescription>
              <TranslatedUIText text="Give this passkey a name so you can identify it later." />
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={passkeyName}
              onChange={(e) => setPasskeyName(e.target.value)}
              placeholder="e.g., My iPhone, Work Laptop"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && passkeyName.trim()) handleAddPasskey();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasskeyNameDialog(false)}>
              <TranslatedUIText text="Cancel" />
            </Button>
            <Button
              className="btn-tenant-primary"
              onClick={handleAddPasskey}
              disabled={!passkeyName.trim()}
            >
              <TranslatedUIText text="Continue" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Danger Zone */}
      <div className="bg-card rounded-xl border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-4"><TranslatedUIText text="Danger Zone" /></h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-medium"><TranslatedUIText text="Deactivate Account" /></p>
            <p className="text-sm text-muted-foreground">
              <TranslatedUIText text="Deactivate your account. Your data will be retained for 90 days before permanent deletion." />
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowDeactivateDialog(true)}
            disabled={!isAuthenticated}
          >
            <TranslatedUIText text="Deactivate Account" />
          </Button>
        </div>
      </div>

      {/* Deactivation Confirmation Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <TranslatedUIText text="Deactivate Account" />
            </DialogTitle>
            <DialogDescription>
              <TranslatedUIText text="Are you sure you want to deactivate your account? This action will:" />
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li><TranslatedUIText text="Log you out immediately" /></li>
              <li><TranslatedUIText text="Prevent you from logging in until you reactivate" /></li>
              <li><TranslatedUIText text="Keep your data for 90 days (then permanently deleted)" /></li>
              <li><TranslatedUIText text="Allow you to reactivate within 90 days by logging in" /></li>
            </ul>

            <Separator />

            <div className="space-y-3">
              <Label><TranslatedUIText text="Why are you leaving? (optional)" /></Label>
              <RadioGroup value={deactivateReason} onValueChange={setDeactivateReason}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not_using" id="not_using" />
                  <Label htmlFor="not_using" className="font-normal cursor-pointer">
                    <TranslatedUIText text="I'm not using this account anymore" />
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="privacy_concerns" id="privacy_concerns" />
                  <Label htmlFor="privacy_concerns" className="font-normal cursor-pointer">
                    <TranslatedUIText text="Privacy concerns" />
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="switching_service" id="switching_service" />
                  <Label htmlFor="switching_service" className="font-normal cursor-pointer">
                    <TranslatedUIText text="Switching to another service" />
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="font-normal cursor-pointer">
                    <TranslatedUIText text="Other reason" />
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {deactivateError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                {deactivateError}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeactivateDialog(false);
                setDeactivateError(null);
              }}
              disabled={isDeactivating}
            >
              <TranslatedUIText text="Cancel" />
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivateAccount}
              disabled={isDeactivating}
            >
              {isDeactivating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <TranslatedUIText text="Deactivating..." />
                </>
              ) : (
                <TranslatedUIText text="Yes, Deactivate My Account" />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
