'use client';

import React, { useState } from 'react';
import { Shield, Lock, AlertTriangle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/Select';
import { useDialog } from '@/contexts/DialogContext';

const threeDSecureOptions = [
  { value: 'always', label: 'Always Require 3D Secure' },
  { value: 'when_required', label: 'When Required by Card Issuer' },
  { value: 'never', label: 'Never (Not Recommended)' },
];

const fraudDetectionOptions = [
  { value: 'aggressive', label: 'Aggressive - Block Suspicious Transactions' },
  { value: 'moderate', label: 'Moderate - Flag for Review' },
  { value: 'minimal', label: 'Minimal - Basic Checks Only' },
  { value: 'off', label: 'Off (Not Recommended)' },
];

export function SecuritySettingsTab() {
  const { showSuccess, showError } = useDialog();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    threeDSecure: 'when_required',
    fraudDetection: 'moderate',
    requireCVV: true,
    requirePostalCode: true,
    blockVPNOrders: false,
    blockHighRiskCountries: false,
    highRiskCountries: [''],
    maxTransactionAmount: 10000,
    dailyTransactionLimit: 50000,
    requireAddressVerification: true,
    webhookEndpointSecret: '',
    enableIdempotency: true,
    idempotencyKeyExpiry: 24,
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: Save settings to backend
      await new Promise((resolve) => setTimeout(resolve, 500));
      showSuccess('Success', 'Security settings saved successfully');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-success-muted border border-success/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <span className="font-semibold text-success-muted-foreground">PCI Compliant</span>
          </div>
          <p className="text-sm text-success">
            Card data is handled by certified payment gateways
          </p>
        </div>

        <div className="bg-success-muted border border-success/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-5 w-5 text-success" />
            <span className="font-semibold text-success-muted-foreground">TLS Encryption</span>
          </div>
          <p className="text-sm text-success">All API calls use TLS 1.2+</p>
        </div>

        <div className="bg-success-muted border border-success/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-success" />
            <span className="font-semibold text-success-muted-foreground">Webhook Verification</span>
          </div>
          <p className="text-sm text-success">All webhooks are signature verified</p>
        </div>
      </div>

      {/* 3D Secure Settings */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">3D Secure Authentication</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              3D Secure Policy
            </label>
            <Select
              value={settings.threeDSecure}
              onChange={(value) => setSettings({ ...settings, threeDSecure: value })}
              options={threeDSecureOptions}
            />
            <p className="text-xs text-muted-foreground mt-1">
              3D Secure adds an extra authentication step for card payments, reducing fraud and
              chargebacks.
            </p>
          </div>

          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-primary">
                Enabling 3D Secure shifts liability for fraud-related chargebacks to the card
                issuer, protecting your business.{' '}
                <a
                  href="https://stripe.com/docs/payments/3d-secure"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary inline-flex items-center gap-1"
                >
                  Learn more <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fraud Detection */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <h3 className="text-lg font-bold text-foreground">Fraud Detection</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Fraud Detection Level
            </label>
            <Select
              value={settings.fraudDetection}
              onChange={(value) => setSettings({ ...settings, fraudDetection: value })}
              options={fraudDetectionOptions}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium text-foreground">Require CVV</p>
                <p className="text-sm text-muted-foreground">Always require CVV for card payments</p>
              </div>
              <Checkbox
                checked={settings.requireCVV}
                onChange={(e) => setSettings({ ...settings, requireCVV: e.target.checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium text-foreground">Require Postal Code</p>
                <p className="text-sm text-muted-foreground">Require billing postal code</p>
              </div>
              <Checkbox
                checked={settings.requirePostalCode}
                onChange={(e) => setSettings({ ...settings, requirePostalCode: e.target.checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium text-foreground">Address Verification (AVS)</p>
                <p className="text-sm text-muted-foreground">Verify billing address matches card</p>
              </div>
              <Checkbox
                checked={settings.requireAddressVerification}
                onChange={(e) =>
                  setSettings({ ...settings, requireAddressVerification: e.target.checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium text-foreground">Block VPN Orders</p>
                <p className="text-sm text-muted-foreground">Block orders from known VPN IPs</p>
              </div>
              <Checkbox
                checked={settings.blockVPNOrders}
                onChange={(e) => setSettings({ ...settings, blockVPNOrders: e.target.checked })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Limits */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Transaction Limits</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Maximum Transaction Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                value={settings.maxTransactionAmount}
                onChange={(e) =>
                  setSettings({ ...settings, maxTransactionAmount: parseInt(e.target.value) })
                }
                className="pl-8"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Maximum amount allowed per single transaction
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Daily Transaction Limit
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                value={settings.dailyTransactionLimit}
                onChange={(e) =>
                  setSettings({ ...settings, dailyTransactionLimit: parseInt(e.target.value) })
                }
                className="pl-8"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Maximum total transactions per day per customer
            </p>
          </div>
        </div>
      </div>

      {/* Idempotency Settings */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Idempotency Protection</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground">Enable Idempotency</p>
              <p className="text-sm text-muted-foreground">Prevent duplicate charges from retries</p>
            </div>
            <Checkbox
              checked={settings.enableIdempotency}
              onChange={(e) => setSettings({ ...settings, enableIdempotency: e.target.checked })}
            />
          </div>

          {settings.enableIdempotency && (
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Idempotency Key Expiry (hours)
              </label>
              <Input
                type="number"
                value={settings.idempotencyKeyExpiry}
                onChange={(e) =>
                  setSettings({ ...settings, idempotencyKeyExpiry: parseInt(e.target.value) })
                }
                min={1}
                max={168}
              />
              <p className="text-xs text-muted-foreground mt-1">
                How long to remember idempotency keys (1-168 hours)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Webhook Security */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Webhook Security</h3>
        </div>

        <div className="bg-warning-muted border border-warning/30 rounded-lg p-4 mb-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-warning">Webhook Signature Verification</p>
            <p className="text-sm text-warning-foreground mt-1">
              All webhook events are verified using signatures from each payment gateway. Make sure
              you've configured the webhook secret for each gateway in the Payment Gateways tab.
            </p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">Webhook Endpoints:</p>
          <ul className="space-y-1 font-mono text-xs bg-muted p-3 rounded">
            <li>Stripe: /webhooks/stripe</li>
            <li>Razorpay: /webhooks/razorpay</li>
            <li>PayPal: /webhooks/paypal</li>
            <li>PhonePe: /webhooks/phonepe</li>
            <li>Afterpay: /webhooks/afterpay</li>
            <li>Zip: /webhooks/zip</li>
            <li>Linkt: /webhooks/linkt</li>
          </ul>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Security Settings'}
        </Button>
      </div>
    </div>
  );
}
