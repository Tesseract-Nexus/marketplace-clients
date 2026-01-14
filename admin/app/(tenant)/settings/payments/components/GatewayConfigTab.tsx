'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, CheckCircle, XCircle, AlertCircle, ExternalLink, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/Select';
import { useDialog } from '@/contexts/DialogContext';
import { settingsService } from '@/lib/services/settingsService';
import { storefrontService } from '@/lib/services/storefrontService';
import {
  paymentsService,
  PaymentGatewayConfig,
  PaymentGatewayTemplate,
  GatewayType,
} from '@/lib/api/payments';

// Country-specific gateway recommendations
const GATEWAY_RECOMMENDATIONS: Record<string, { primary: GatewayType; fallback?: GatewayType; description: string }> = {
  IN: {
    primary: 'RAZORPAY',
    fallback: 'PAYPAL',
    description: 'Razorpay is the preferred payment gateway for India, supporting UPI, cards, and wallets. PayPal can be added as a fallback for international customers.',
  },
  US: {
    primary: 'STRIPE',
    fallback: 'PAYPAL',
    description: 'Stripe is the most popular payment gateway in the US with excellent developer tools. PayPal adds trusted checkout for customers who prefer it.',
  },
  GB: {
    primary: 'STRIPE',
    fallback: 'PAYPAL',
    description: 'Stripe works seamlessly in the UK with support for all major cards. PayPal is widely trusted for additional coverage.',
  },
  AU: {
    primary: 'STRIPE',
    fallback: 'AFTERPAY',
    description: 'Stripe is recommended for Australia. Afterpay is popular for buy-now-pay-later options.',
  },
  // Default for other countries
  DEFAULT: {
    primary: 'STRIPE',
    fallback: 'PAYPAL',
    description: 'Stripe with PayPal fallback provides the best global coverage for international transactions.',
  },
};

const gatewayLogos: Record<GatewayType, string> = {
  STRIPE: '/logos/stripe.svg',
  PAYPAL: '/logos/paypal.svg',
  RAZORPAY: '/logos/razorpay.svg',
  PHONEPE: '/logos/phonepe.svg',
  BHARATPAY: '/logos/bharatpay.svg',
  AFTERPAY: '/logos/afterpay.svg',
  ZIP: '/logos/zip.svg',
  LINKT: '/logos/linkt.svg',
};

const gatewayTypeOptions = [
  { value: 'STRIPE', label: 'Stripe' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'RAZORPAY', label: 'Razorpay' },
  { value: 'PHONEPE', label: 'PhonePe' },
  { value: 'BHARATPAY', label: 'BharatPay' },
  { value: 'AFTERPAY', label: 'Afterpay' },
  { value: 'ZIP', label: 'Zip Pay' },
  { value: 'LINKT', label: 'Linkt' },
];

export function GatewayConfigTab() {
  const { showConfirm, showSuccess, showError } = useDialog();
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [templates, setTemplates] = useState<PaymentGatewayTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGatewayConfig | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<PaymentGatewayTemplate | null>(null);
  const [formData, setFormData] = useState<Partial<PaymentGatewayConfig>>({
    gatewayType: 'STRIPE',
    displayName: '',
    isEnabled: true,
    isTestMode: true,
    apiKeyPublic: '',
    apiKeySecret: '',
    webhookSecret: '',
    priority: 10,
  });
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  // Store location state
  const [storeCountry, setStoreCountry] = useState<string | null>(null);
  const [storeCountryName, setStoreCountryName] = useState<string>('');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [settingUpRecommended, setSettingUpRecommended] = useState(false);

  useEffect(() => {
    loadData();
    loadStoreLocation();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gatewaysData, templatesData] = await Promise.all([
        paymentsService.getGatewayConfigs(),
        paymentsService.getGatewayTemplates(),
      ]);
      setGateways(gatewaysData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreLocation = async () => {
    try {
      setLoadingLocation(true);
      // Get first storefront to fetch its settings
      const storefronts = await storefrontService.getStorefronts();
      if (storefronts.data && storefronts.data.length > 0) {
        const storefrontId = storefronts.data[0].id;
        const settings = await settingsService.getSettingsByContext({
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: storefrontId,
        });

        if (settings?.ecommerce?.store?.address?.country) {
          // Try to get country code from settings
          const countryName = settings.ecommerce.store.address.country;
          setStoreCountryName(countryName);

          // Map common country names to codes
          const countryMap: Record<string, string> = {
            'India': 'IN',
            'United States': 'US',
            'United Kingdom': 'GB',
            'Australia': 'AU',
            'Canada': 'CA',
            'Germany': 'DE',
            'France': 'FR',
            'Singapore': 'SG',
            'New Zealand': 'NZ',
          };
          setStoreCountry(countryMap[countryName] || 'DEFAULT');
        }
      }
    } catch (error) {
      console.error('Failed to load store location:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  // Get recommendation for current store country
  const getRecommendation = () => {
    if (!storeCountry) return null;
    return GATEWAY_RECOMMENDATIONS[storeCountry] || GATEWAY_RECOMMENDATIONS.DEFAULT;
  };

  // Check if recommended gateways are already configured
  const hasRecommendedGateway = (gatewayType: GatewayType) => {
    return gateways.some(g => g.gatewayType === gatewayType && g.isEnabled);
  };

  // Setup recommended gateways (opens wizard with the recommended template)
  const handleSetupRecommended = (gatewayType: GatewayType) => {
    const template = templates.find(t => t.gatewayType === gatewayType);
    if (template) {
      handleSelectTemplate(template);
      setShowAddWizard(true);
    } else {
      showError('Error', `Template for ${gatewayType} not found`);
    }
  };

  const handleSave = async () => {
    try {
      if (editingGateway) {
        await paymentsService.updateGatewayConfig(editingGateway.id, formData);
        showSuccess('Success', 'Gateway updated successfully');
      } else if (selectedTemplate) {
        await paymentsService.createGatewayFromTemplate(selectedTemplate.gatewayType, {
          credentials,
          isTestMode: formData.isTestMode || true,
        });
        showSuccess('Success', 'Gateway created successfully');
      } else {
        await paymentsService.createGatewayConfig(formData);
        showSuccess('Success', 'Gateway created successfully');
      }
      setShowModal(false);
      setShowAddWizard(false);
      resetForm();
      loadData();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save gateway');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Payment Gateway',
      message: 'Are you sure you want to delete this gateway? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (confirmed) {
      try {
        await paymentsService.deleteGatewayConfig(id);
        showSuccess('Success', 'Gateway deleted successfully');
        loadData();
      } catch (error: any) {
        showError('Error', error.message || 'Failed to delete gateway');
      }
    }
  };

  const handleEdit = (gateway: PaymentGatewayConfig) => {
    setEditingGateway(gateway);
    setFormData(gateway);
    setShowModal(true);
  };

  const handleSelectTemplate = (template: PaymentGatewayTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      gatewayType: template.gatewayType,
      displayName: template.displayName,
      isEnabled: true,
      isTestMode: true,
      priority: 10,
    });
    setCredentials({});
  };

  const resetForm = () => {
    setEditingGateway(null);
    setSelectedTemplate(null);
    setFormData({
      gatewayType: 'STRIPE',
      displayName: '',
      isEnabled: true,
      isTestMode: true,
      apiKeyPublic: '',
      apiKeySecret: '',
      webhookSecret: '',
      priority: 10,
    });
    setCredentials({});
  };

  const toggleSecret = (id: string) => {
    setShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const recommendation = getRecommendation();

  return (
    <div className="space-y-6">
      {/* Location-Based Recommendation Banner */}
      {!loadingLocation && storeCountry && recommendation && (
        <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-pink-50 border border-violet-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-foreground">
                  Recommended for {storeCountryName || storeCountry}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Based on your store location
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{recommendation.description}</p>

              <div className="flex flex-wrap gap-3">
                {/* Primary Gateway */}
                <div className="flex items-center gap-3 bg-card rounded-lg border border-border px-4 py-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <img
                      src={gatewayLogos[recommendation.primary]}
                      alt={recommendation.primary}
                      className="h-5 w-5"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {gatewayTypeOptions.find(g => g.value === recommendation.primary)?.label}
                    </p>
                    <p className="text-xs text-muted-foreground">Primary Gateway</p>
                  </div>
                  {hasRecommendedGateway(recommendation.primary) ? (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Configured
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSetupRecommended(recommendation.primary)}
                      className="ml-2 bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      Set Up
                    </Button>
                  )}
                </div>

                {/* Fallback Gateway */}
                {recommendation.fallback && (
                  <div className="flex items-center gap-3 bg-card rounded-lg border border-border px-4 py-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <img
                        src={gatewayLogos[recommendation.fallback]}
                        alt={recommendation.fallback}
                        className="h-5 w-5"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {gatewayTypeOptions.find(g => g.value === recommendation.fallback)?.label}
                      </p>
                      <p className="text-xs text-muted-foreground">Fallback Gateway</p>
                    </div>
                    {hasRecommendedGateway(recommendation.fallback) ? (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Configured
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetupRecommended(recommendation.fallback!)}
                        className="ml-2"
                      >
                        Set Up
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading location indicator */}
      {loadingLocation && (
        <div className="bg-muted border border-border rounded-lg p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Detecting store location for payment recommendations...</p>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowAddWizard(true)}
          className="bg-primary text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Gateway
        </Button>
      </div>

      {/* Stripe Connect Setup Guide */}
      {gateways.some((g) => g.gatewayType === 'STRIPE') && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Stripe Connect Setup Required</p>
              <p className="text-sm text-primary mt-1">
                To collect 5% platform fees automatically, you need to set up Stripe Connect.{' '}
                <a
                  href="https://dashboard.stripe.com/connect/accounts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-blue-800 inline-flex items-center gap-1"
                >
                  Open Stripe Dashboard <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

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
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-violet-100 rounded-lg flex items-center justify-center">
                    <img
                      src={gatewayLogos[gateway.gatewayType] || '/logos/generic-payment.svg'}
                      alt={gateway.gatewayType}
                      className="h-6 w-6"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{gateway.displayName}</h3>
                    <p className="text-sm text-muted-foreground">{gateway.gatewayType}</p>
                  </div>
                  <div className="flex gap-2">
                    {gateway.isEnabled ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
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
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                        Test Mode
                      </span>
                    )}
                    {gateway.supportsPlatformSplit && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                        Platform Fees
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Public Key</p>
                    <p className="text-sm font-mono text-foreground truncate">{gateway.apiKeyPublic}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Secret Key</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono text-foreground">
                        {showSecrets[gateway.id] ? gateway.apiKeySecret : '••••••••'}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSecret(gateway.id)}
                        className="p-1 h-auto"
                      >
                        {showSecrets[gateway.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Priority</p>
                    <p className="text-sm font-semibold text-foreground">{gateway.priority}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Countries</p>
                    <p className="text-sm text-foreground">
                      {gateway.supportedCountries?.slice(0, 3).join(', ')}
                      {gateway.supportedCountries?.length > 3 && ` +${gateway.supportedCountries.length - 3}`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {gateway.supportedPaymentMethods?.map((method) => (
                    <span
                      key={method}
                      className="text-xs px-2 py-1 rounded bg-muted text-foreground border border-border"
                    >
                      {method}
                    </span>
                  ))}
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
                  className="hover:bg-red-50 hover:text-red-600"
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

      {/* Add Gateway Wizard */}
      {showAddWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                {selectedTemplate ? `Configure ${selectedTemplate.displayName}` : 'Choose a Payment Gateway'}
              </h2>
            </div>

            <div className="p-6">
              {!selectedTemplate ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/10 transition-colors text-left"
                    >
                      <div className="w-12 h-12 bg-muted rounded-lg mb-3 flex items-center justify-center">
                        <img
                          src={template.logoUrl || gatewayLogos[template.gatewayType]}
                          alt={template.displayName}
                          className="h-6 w-6"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <h3 className="font-semibold text-foreground">{template.displayName}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.supportedCountries?.slice(0, 3).join(', ')}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedTemplate.setupInstructions && (
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-sm text-blue-800">
                      {selectedTemplate.setupInstructions}
                    </div>
                  )}

                  {selectedTemplate.requiredCredentials?.map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        {field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        <span className="text-red-500"> *</span>
                      </label>
                      <Input
                        type={field.includes('secret') || field.includes('key') ? 'password' : 'text'}
                        value={credentials[field] || ''}
                        onChange={(e) => setCredentials({ ...credentials, [field]: e.target.value })}
                        placeholder={`Enter ${field}`}
                      />
                    </div>
                  ))}

                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={formData.isTestMode}
                      onChange={(e) => setFormData({ ...formData, isTestMode: e.target.checked })}
                      label="Test Mode (use sandbox/test credentials)"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border px-6 py-4 flex justify-between">
              <Button
                onClick={() => {
                  if (selectedTemplate) {
                    setSelectedTemplate(null);
                  } else {
                    setShowAddWizard(false);
                    resetForm();
                  }
                }}
                variant="outline"
              >
                {selectedTemplate ? 'Back' : 'Cancel'}
              </Button>
              {selectedTemplate && (
                <Button
                  onClick={handleSave}
                  disabled={
                    !selectedTemplate.requiredCredentials?.every((field) => credentials[field])
                  }
                  className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  Add Gateway
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingGateway && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                Edit Payment Gateway
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Gateway Type
                  </label>
                  <div className="px-4 py-3 border-2 border-border rounded-xl bg-muted text-foreground font-medium">
                    {gatewayTypeOptions.find(o => o.value === formData.gatewayType)?.label || formData.gatewayType}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Display Name
                  </label>
                  <Input
                    value={formData.displayName || ''}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="e.g., Stripe Payment Gateway"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Public Key
                  </label>
                  <Input
                    value={formData.apiKeyPublic || ''}
                    onChange={(e) => setFormData({ ...formData, apiKeyPublic: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Secret Key
                  </label>
                  <Input
                    type="password"
                    value={formData.apiKeySecret || ''}
                    onChange={(e) => setFormData({ ...formData, apiKeySecret: e.target.value })}
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
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Priority (lower = higher priority)
                </label>
                <Input
                  type="number"
                  value={formData.priority || 10}
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
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                Update Gateway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
