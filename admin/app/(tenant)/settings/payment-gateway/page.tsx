'use client';

import React, { useState } from 'react';
import { CreditCard, Plus, Edit, Trash2, Eye, EyeOff, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { useDialog } from '@/contexts/DialogContext';

interface PaymentGateway {
  id: string;
  gatewayType: string;
  displayName: string;
  isEnabled: boolean;
  isTestMode: boolean;
  apiKeyPublic: string;
  apiKeySecret: string;
  webhookSecret?: string;
  description?: string;
  supportsPayments: boolean;
  supportsRefunds: boolean;
  supportsSubscriptions: boolean;
  minimumAmount: number;
  maximumAmount: number;
  priority: number;
}

const mockGateways: PaymentGateway[] = [
  {
    id: '1',
    gatewayType: 'STRIPE',
    displayName: 'Stripe Payment Gateway',
    isEnabled: true,
    isTestMode: true,
    apiKeyPublic: 'pk_test_xxxxx',
    apiKeySecret: 'sk_test_xxxxx',
    webhookSecret: 'whsec_xxxxx',
    description: 'Primary payment gateway for cards and wallets',
    supportsPayments: true,
    supportsRefunds: true,
    supportsSubscriptions: true,
    minimumAmount: 1,
    maximumAmount: 1000000,
    priority: 1,
  },
  {
    id: '2',
    gatewayType: 'RAZORPAY',
    displayName: 'Razorpay',
    isEnabled: false,
    isTestMode: true,
    apiKeyPublic: 'rzp_test_xxxxx',
    apiKeySecret: 'xxxxx',
    description: 'Backup gateway for Indian payments',
    supportsPayments: true,
    supportsRefunds: true,
    supportsSubscriptions: false,
    minimumAmount: 1,
    maximumAmount: 500000,
    priority: 2,
  },
];

const gatewayTypeOptions = [
  { value: 'STRIPE', label: 'Stripe' },
  { value: 'RAZORPAY', label: 'Razorpay' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'SQUARE', label: 'Square' },
];

export default function PaymentGatewayPage() {
  const { showSuccess, showError, showWarning, showInfo, showConfirm } = useDialog();
  const [gateways, setGateways] = useState<PaymentGateway[]>(mockGateways);
  const [showModal, setShowModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Partial<PaymentGateway>>({
    gatewayType: 'STRIPE',
    displayName: '',
    isEnabled: true,
    isTestMode: true,
    apiKeyPublic: '',
    apiKeySecret: '',
    webhookSecret: '',
    description: '',
    supportsPayments: true,
    supportsRefunds: true,
    supportsSubscriptions: false,
    minimumAmount: 1,
    maximumAmount: 1000000,
    priority: 0,
  });

  const handleSave = () => {
    if (editingGateway) {
      setGateways(gateways.map(g => g.id === editingGateway.id ? { ...editingGateway, ...formData } : g));
    } else {
      setGateways([...gateways, { id: String(Date.now()), ...formData } as PaymentGateway]);
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Payment Gateway',
      message: 'Are you sure you want to delete this gateway?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (confirmed) {
      setGateways(gateways.filter(g => g.id !== id));
    }
  };

  const handleEdit = (gateway: PaymentGateway) => {
    setEditingGateway(gateway);
    setFormData(gateway);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingGateway(null);
    setFormData({
      gatewayType: 'STRIPE',
      displayName: '',
      isEnabled: true,
      isTestMode: true,
      apiKeyPublic: '',
      apiKeySecret: '',
      webhookSecret: '',
      description: '',
      supportsPayments: true,
      supportsRefunds: true,
      supportsSubscriptions: false,
      minimumAmount: 1,
      maximumAmount: 1000000,
      priority: 0,
    });
  };

  const toggleSecret = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <PermissionGate
      permission={Permission.SETTINGS_UPDATE}
      fallback="styled"
      fallbackTitle="Payment Gateway Settings Access Required"
      fallbackDescription="You don't have the required permissions to view payment gateway settings. Please contact your administrator to request access."
      loading={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Payment Gateway Settings"
          description="Configure and manage payment gateway integrations"
          breadcrumbs={[
            { label: '🏠 Home', href: '/' },
            { label: '⚙️ Settings', href: '/settings' },
            { label: '💳 Payment Gateway' },
          ]}
          actions={
            <Button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-primary text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Gateway
            </Button>
          }
        />

        {/* Warning Banner */}
        <div className="bg-warning-muted border border-warning/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-warning">Test Mode Enabled</p>
            <p className="text-sm text-warning-foreground mt-1">
              Currently displaying mock data. Connect to payment service microservice for live configuration.
            </p>
          </div>
        </div>

        {/* Gateways List */}
        <div className="space-y-4">
          {gateways.map((gateway) => (
            <div
              key={gateway.id}
              className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{gateway.displayName}</h3>
                      <p className="text-sm text-muted-foreground">{gateway.gatewayType}</p>
                    </div>
                    <div className="flex gap-2">
                      {gateway.isEnabled ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-success-muted text-success-muted-foreground border border-success/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
                          <XCircle className="h-3 w-3 mr-1" />
                          Disabled
                        </span>
                      )}
                      {gateway.isTestMode && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-warning-muted text-warning-foreground border border-warning/30">
                          Test Mode
                        </span>
                      )}
                    </div>
                  </div>

                  {gateway.description && (
                    <p className="text-foreground mb-4">{gateway.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Public Key</p>
                      <p className="text-sm font-mono text-foreground">{gateway.apiKeyPublic}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Secret Key</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono text-foreground">
                          {showSecrets[gateway.id] ? gateway.apiKeySecret : '••••••••'}
                        </p>
                        <Button
                          onClick={() => toggleSecret(gateway.id)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          {showSecrets[gateway.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Min Amount</p>
                      <p className="text-sm font-semibold text-foreground">₹{gateway.minimumAmount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Max Amount</p>
                      <p className="text-sm font-semibold text-foreground">₹{gateway.maximumAmount}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {gateway.supportsPayments && (
                      <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30">
                        Payments
                      </span>
                    )}
                    {gateway.supportsRefunds && (
                      <span className="text-xs px-2 py-1 rounded bg-success-muted text-success-muted-foreground border border-success/30">
                        Refunds
                      </span>
                    )}
                    {gateway.supportsSubscriptions && (
                      <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30">
                        Subscriptions
                      </span>
                    )}
                    <span className="text-xs px-2 py-1 rounded bg-muted text-foreground border border-border">
                      Priority: {gateway.priority}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(gateway)}
                    className="hover:bg-primary/10 hover:text-primary"
                    title="Edit Gateway"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(gateway.id)}
                    className="hover:bg-error-muted hover:text-error"
                    title="Delete Gateway"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {gateways.length === 0 && (
            <div className="bg-card rounded-lg border border-border p-12 text-center text-muted-foreground">
              No payment gateways configured. Click "Add Gateway" to get started.
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-2xl font-bold text-primary">
                  {editingGateway ? 'Edit Payment Gateway' : 'Add Payment Gateway'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Gateway Type <span className="text-error">*</span>
                    </label>
                    <Select
                      value={formData.gatewayType || 'STRIPE'}
                      onChange={(value) => setFormData({ ...formData, gatewayType: value as any })}
                      options={gatewayTypeOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Display Name <span className="text-error">*</span>
                    </label>
                    <Input
                      value={formData.displayName || ''}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="e.g., Stripe Payment Gateway"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Description
                  </label>
                  <Input
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Public/API Key <span className="text-error">*</span>
                    </label>
                    <Input
                      value={formData.apiKeyPublic || ''}
                      onChange={(e) => setFormData({ ...formData, apiKeyPublic: e.target.value })}
                      placeholder="pk_test_xxxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Secret Key <span className="text-error">*</span>
                    </label>
                    <Input
                      type="password"
                      value={formData.apiKeySecret || ''}
                      onChange={(e) => setFormData({ ...formData, apiKeySecret: e.target.value })}
                      placeholder="sk_test_xxxxx"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Webhook Secret
                  </label>
                  <Input
                    type="password"
                    value={formData.webhookSecret || ''}
                    onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                    placeholder="whsec_xxxxx"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Minimum Amount
                    </label>
                    <Input
                      type="number"
                      value={formData.minimumAmount || 1}
                      onChange={(e) => setFormData({ ...formData, minimumAmount: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Maximum Amount
                    </label>
                    <Input
                      type="number"
                      value={formData.maximumAmount || 1000000}
                      onChange={(e) => setFormData({ ...formData, maximumAmount: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Priority (lower = higher priority)
                  </label>
                  <Input
                    type="number"
                    value={formData.priority || 0}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Checkbox
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                    label="Enable Gateway"
                  />

                  <Checkbox
                    checked={formData.isTestMode}
                    onChange={(e) => setFormData({ ...formData, isTestMode: e.target.checked })}
                    label="Test Mode"
                  />

                  <Checkbox
                    checked={formData.supportsPayments}
                    onChange={(e) => setFormData({ ...formData, supportsPayments: e.target.checked })}
                    label="Supports Payments"
                  />

                  <Checkbox
                    checked={formData.supportsRefunds}
                    onChange={(e) => setFormData({ ...formData, supportsRefunds: e.target.checked })}
                    label="Supports Refunds"
                  />

                  <Checkbox
                    checked={formData.supportsSubscriptions}
                    onChange={(e) => setFormData({ ...formData, supportsSubscriptions: e.target.checked })}
                    label="Supports Subscriptions"
                  />
                </div>
              </div>

              <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
                <Button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!formData.displayName || !formData.apiKeyPublic || !formData.apiKeySecret}
                  className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {editingGateway ? 'Update Gateway' : 'Add Gateway'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </PermissionGate>
  );
}
