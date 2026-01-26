'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  CreditCard,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  paymentsService,
  PaymentMethodResponse,
  PaymentCredentials,
  PaymentConfigSettings,
  UpdatePaymentConfigRequest,
} from '@/lib/api/payments';
import { toast } from 'sonner';

interface ConfigurePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  method: PaymentMethodResponse | null;
  onSaved: () => void;
}

interface CredentialField {
  key: keyof PaymentCredentials;
  label: string;
  placeholder: string;
  isSecret: boolean;
  helperText?: string;
}

// Define credential fields per provider
const providerCredentials: Record<string, CredentialField[]> = {
  Stripe: [
    { key: 'stripePublishableKey', label: 'Publishable Key', placeholder: 'pk_test_...', isSecret: false, helperText: 'Starts with pk_test_ or pk_live_' },
    { key: 'stripeSecretKey', label: 'Secret Key', placeholder: 'sk_test_...', isSecret: true, helperText: 'Starts with sk_test_ or sk_live_' },
    { key: 'stripeWebhookSecret', label: 'Webhook Secret', placeholder: 'whsec_...', isSecret: true, helperText: 'Optional: For receiving payment events' },
  ],
  PayPal: [
    { key: 'paypalClientId', label: 'Client ID', placeholder: 'Your PayPal Client ID', isSecret: false },
    { key: 'paypalClientSecret', label: 'Client Secret', placeholder: 'Your PayPal Client Secret', isSecret: true },
  ],
  Razorpay: [
    { key: 'razorpayKeyId', label: 'Key ID', placeholder: 'rzp_test_...', isSecret: false, helperText: 'Starts with rzp_test_ or rzp_live_' },
    { key: 'razorpayKeySecret', label: 'Key Secret', placeholder: 'Your Razorpay Key Secret', isSecret: true },
    { key: 'razorpayWebhookSecret', label: 'Webhook Secret', placeholder: 'Your Webhook Secret', isSecret: true, helperText: 'Optional: For receiving payment events' },
  ],
  Afterpay: [
    { key: 'afterpayMerchantId', label: 'Merchant ID', placeholder: 'Your Afterpay Merchant ID', isSecret: false },
    { key: 'afterpaySecretKey', label: 'Secret Key', placeholder: 'Your Afterpay Secret Key', isSecret: true },
  ],
  Zip: [
    { key: 'zipMerchantId', label: 'Merchant ID', placeholder: 'Your Zip Merchant ID', isSecret: false },
    { key: 'zipApiKey', label: 'API Key', placeholder: 'Your Zip API Key', isSecret: true },
  ],
  Manual: [], // No credentials needed for COD, Bank Transfer
};

// Help links for each provider
const providerHelpLinks: Record<string, string> = {
  Stripe: 'https://dashboard.stripe.com/apikeys',
  PayPal: 'https://developer.paypal.com/developer/applications',
  Razorpay: 'https://dashboard.razorpay.com/app/keys',
  Afterpay: 'https://portal.afterpay.com',
  Zip: 'https://merchant.zip.co',
};

// Region options with country info
const allRegions = [
  { code: 'AU', name: 'Australia', flag: '\ud83c\udde6\ud83c\uddfa' },
  { code: 'NZ', name: 'New Zealand', flag: '\ud83c\uddf3\ud83c\uddff' },
  { code: 'US', name: 'United States', flag: '\ud83c\uddfa\ud83c\uddf8' },
  { code: 'GB', name: 'United Kingdom', flag: '\ud83c\uddec\ud83c\udde7' },
  { code: 'CA', name: 'Canada', flag: '\ud83c\udde8\ud83c\udde6' },
  { code: 'IN', name: 'India', flag: '\ud83c\uddee\ud83c\uddf3' },
  { code: 'DE', name: 'Germany', flag: '\ud83c\udde9\ud83c\uddea' },
  { code: 'FR', name: 'France', flag: '\ud83c\uddeb\ud83c\uddf7' },
  { code: 'SG', name: 'Singapore', flag: '\ud83c\uddf8\ud83c\uddec' },
  { code: 'HK', name: 'Hong Kong', flag: '\ud83c\udded\ud83c\uddf0' },
];

export function ConfigurePaymentModal({
  isOpen,
  onClose,
  method,
  onSaved,
}: ConfigurePaymentModalProps) {
  const [credentials, setCredentials] = useState<Partial<PaymentCredentials>>({});
  const [settings, setSettings] = useState<Partial<PaymentConfigSettings>>({});
  const [isTestMode, setIsTestMode] = useState(true);
  const [enabledRegions, setEnabledRegions] = useState<string[]>([]);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Reset state when modal opens with new method
  useEffect(() => {
    if (method) {
      setIsTestMode(method.isTestMode);
      setCredentials({});
      setSettings({});
      setShowSecrets({});
      setTestResult(null);
      // Initialize enabled regions from existing config or default to method's supported regions
      setEnabledRegions(method.enabledRegions || []);
    }
  }, [method]);

  // Get available regions for this method (intersection with supported regions)
  const availableRegions = method
    ? allRegions.filter(
        (region) =>
          method.supportedRegions.includes(region.code) ||
          method.supportedRegions.includes('GLOBAL')
      )
    : [];

  const handleRegionToggle = (regionCode: string) => {
    setEnabledRegions((prev) =>
      prev.includes(regionCode)
        ? prev.filter((r) => r !== regionCode)
        : [...prev, regionCode]
    );
  };

  const handleSelectAllRegions = () => {
    if (enabledRegions.length === availableRegions.length) {
      setEnabledRegions([]);
    } else {
      setEnabledRegions(availableRegions.map((r) => r.code));
    }
  };

  if (!method) return null;

  const credentialFields = providerCredentials[method.provider] || [];
  const helpLink = providerHelpLinks[method.provider];
  const isManualMethod = method.provider === 'Manual';

  const handleCredentialChange = (key: keyof PaymentCredentials, value: string) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
    setTestResult(null);
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // First save the credentials, then test
      const updateReq: UpdatePaymentConfigRequest = {
        isTestMode,
        credentials: credentials as PaymentCredentials,
      };
      await paymentsService.updatePaymentConfig(method.code, updateReq);

      // Now test the connection
      const result = await paymentsService.testPaymentConnection(method.code);
      setTestResult({ success: result.success, message: result.message });

      if (result.success) {
        toast.success('Connection test successful');
      } else {
        toast.error(`Connection test failed: ${result.message}`);
      }
    } catch (error: any) {
      const message = error.message || 'Failed to test connection';
      setTestResult({ success: false, message });
      toast.error(message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateReq: UpdatePaymentConfigRequest = {
        isTestMode,
        enabledRegions,
        settings: settings as PaymentConfigSettings,
      };

      // Only include credentials if any were entered
      const hasCredentials = Object.values(credentials).some((v) => v && v.length > 0);
      if (hasCredentials) {
        updateReq.credentials = credentials as PaymentCredentials;
      }

      await paymentsService.updatePaymentConfig(method.code, updateReq);

      toast.success('Payment method configured successfully');
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Configure {method.name}
          </DialogTitle>
          <DialogDescription>
            Set up {method.provider} credentials to accept payments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Test/Live Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-foreground">Environment Mode</p>
              <p className="text-sm text-muted-foreground">
                {isTestMode ? 'Using test/sandbox credentials' : 'Using live production credentials'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isTestMode ? 'text-amber-600' : 'text-muted-foreground'}`}>
                Test
              </span>
              <Switch
                checked={!isTestMode}
                onCheckedChange={(checked) => setIsTestMode(!checked)}
              />
              <span className={`text-sm ${!isTestMode ? 'text-green-600' : 'text-muted-foreground'}`}>
                Live
              </span>
            </div>
          </div>

          {/* Help Link */}
          {helpLink && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Get your API credentials from {method.provider}</span>
                <a
                  href={helpLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  Open Dashboard
                  <ExternalLink className="h-3 w-3" />
                </a>
              </AlertDescription>
            </Alert>
          )}

          {/* Credential Fields */}
          {!isManualMethod && credentialFields.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">API Credentials</h4>

              {credentialFields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {field.label}
                  </label>
                  <div className="relative">
                    <Input
                      type={field.isSecret && !showSecrets[field.key] ? 'password' : 'text'}
                      placeholder={field.placeholder}
                      value={credentials[field.key] || ''}
                      onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                      className="pr-10"
                    />
                    {field.isSecret && (
                      <button
                        type="button"
                        onClick={() => toggleShowSecret(field.key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSecrets[field.key] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                  {field.helperText && (
                    <p className="text-xs text-muted-foreground">{field.helperText}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Manual Method Info */}
          {isManualMethod && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This is a manual payment method. No API credentials are required.
                {method.code === 'cod' && ' Customers will pay with cash when their order is delivered.'}
                {method.code === 'bank_transfer' && ' You\'ll need to provide bank details separately and manually verify payments.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Region Configuration */}
          {availableRegions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Enabled Regions</h4>
                  <p className="text-sm text-muted-foreground">
                    Select which regions can use this payment method
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSelectAllRegions}
                  className="text-sm text-primary hover:underline"
                >
                  {enabledRegions.length === availableRegions.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {availableRegions.map((region) => (
                  <button
                    key={region.code}
                    type="button"
                    onClick={() => handleRegionToggle(region.code)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${
                      enabledRegions.includes(region.code)
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <span className="text-lg">{region.flag}</span>
                    <span className="text-sm font-medium">{region.name}</span>
                    {enabledRegions.includes(region.code) && (
                      <CheckCircle2 className="h-4 w-4 ml-auto text-primary" />
                    )}
                  </button>
                ))}
              </div>

              {enabledRegions.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No regions selected. If no regions are selected, the payment method will use its
                    default supported regions.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Additional Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Display Settings</h4>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Custom Display Name (Optional)
              </label>
              <Input
                placeholder={method.name}
                value={settings.displayName || ''}
                onChange={(e) => setSettings((prev) => ({ ...prev, displayName: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Override the default name shown to customers
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Checkout Message (Optional)
              </label>
              <Input
                placeholder="e.g., 'Secure payment via Stripe'"
                value={settings.checkoutMessage || ''}
                onChange={(e) => setSettings((prev) => ({ ...prev, checkoutMessage: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Shown below the payment option at checkout
              </p>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>

          {!isManualMethod && (
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={isTesting || isSaving}
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
          )}

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
