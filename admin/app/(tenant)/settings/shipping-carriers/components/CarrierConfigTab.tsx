'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  MapPin,
  Sparkles,
  Loader2,
  Package,
  Truck,
  Ship,
  Rocket,
  Zap,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useDialog } from '@/contexts/DialogContext';
import { settingsService } from '@/lib/services/settingsService';
import { storefrontService } from '@/lib/services/storefrontService';
import {
  shippingCarriersService,
  ShippingCarrierConfig,
  ShippingCarrierTemplate,
  CarrierType,
  getCarrierDisplayName,
  getCarrierIcon,
  isIndiaCarrier,
  isGlobalCarrier,
} from '@/lib/api/shippingCarriers';

// Country-specific carrier recommendations
const CARRIER_RECOMMENDATIONS: Record<string, { primary: CarrierType; fallback?: CarrierType; description: string }> = {
  IN: {
    primary: 'DELHIVERY',
    fallback: 'SHIPROCKET',
    description: 'Delhivery provides direct carrier integration with competitive rates for pan-India shipping. Shiprocket serves as a multi-courier aggregator fallback.',
  },
  US: {
    primary: 'SHIPPO',
    fallback: 'FEDEX',
    description: 'Shippo provides multi-carrier rates from USPS, UPS, FedEx, and more. FedEx direct integration adds enterprise-grade shipping.',
  },
  GB: {
    primary: 'SHIPPO',
    fallback: 'DHL',
    description: 'Shippo works well in the UK with Royal Mail and international carriers. DHL Express covers global destinations.',
  },
  AU: {
    primary: 'SHIPENGINE',
    fallback: 'DHL',
    description: 'ShipEngine supports Australia Post and international carriers. DHL provides worldwide express delivery.',
  },
  DEFAULT: {
    primary: 'SHIPPO',
    fallback: 'DHL',
    description: 'Shippo with DHL provides excellent global coverage for international shipping.',
  },
};

const carrierTypeOptions: { value: CarrierType; label: string }[] = [
  { value: 'SHIPROCKET', label: 'Shiprocket' },
  { value: 'DELHIVERY', label: 'Delhivery' },
  { value: 'BLUEDART', label: 'BlueDart' },
  { value: 'DTDC', label: 'DTDC' },
  { value: 'SHIPPO', label: 'Shippo' },
  { value: 'SHIPENGINE', label: 'ShipEngine' },
  { value: 'FEDEX', label: 'FedEx' },
  { value: 'UPS', label: 'UPS' },
  { value: 'DHL', label: 'DHL Express' },
];

const getCarrierIconComponent = (carrierType: CarrierType) => {
  const iconName = getCarrierIcon(carrierType);
  switch (iconName) {
    case 'rocket':
      return <Rocket className="h-6 w-6 text-violet-600" />;
    case 'truck':
      return <Truck className="h-6 w-6 text-primary" />;
    case 'ship':
      return <Ship className="h-6 w-6 text-cyan-600" />;
    default:
      return <Package className="h-6 w-6 text-muted-foreground" />;
  }
};

export function CarrierConfigTab() {
  const { showConfirm, showSuccess, showError } = useDialog();
  const [carriers, setCarriers] = useState<ShippingCarrierConfig[]>([]);
  const [templates, setTemplates] = useState<ShippingCarrierTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<ShippingCarrierConfig | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<ShippingCarrierTemplate | null>(null);
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ShippingCarrierConfig>>({
    carrierType: 'SHIPROCKET',
    displayName: '',
    isEnabled: true,
    isTestMode: true,
    priority: 10,
  });
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  // Store location state
  const [storeCountry, setStoreCountry] = useState<string | null>(null);
  const [storeCountryName, setStoreCountryName] = useState<string>('');
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    loadData();
    loadStoreLocation();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [carriersData, templatesData] = await Promise.all([
        shippingCarriersService.getCarrierConfigs(),
        shippingCarriersService.getCarrierTemplates(),
      ]);
      setCarriers(carriersData || []);
      setTemplates(templatesData || []);
    } catch (error) {
      console.error('Failed to load carrier data:', error);
      // Reset to empty arrays on error to prevent null reference errors
      setCarriers([]);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreLocation = async () => {
    try {
      setLoadingLocation(true);
      const storefronts = await storefrontService.getStorefronts();
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

  const getRecommendation = () => {
    if (!storeCountry) return null;
    return CARRIER_RECOMMENDATIONS[storeCountry] || CARRIER_RECOMMENDATIONS.DEFAULT;
  };

  const hasRecommendedCarrier = (carrierType: CarrierType) => {
    return carriers.some(c => c.carrierType === carrierType && c.isEnabled);
  };

  const handleSetupRecommended = (carrierType: CarrierType) => {
    if (loading || templates.length === 0) {
      showError('Loading', 'Please wait while carrier templates are loading...');
      return;
    }
    const template = templates.find(t => t.carrierType === carrierType);
    if (template) {
      handleSelectTemplate(template);
      setShowAddWizard(true);
    } else {
      showError('Error', `Template for ${carrierType} not found. Please try refreshing the page.`);
    }
  };

  const handleSave = async () => {
    try {
      let newCarrierId: string | null = null;

      if (editingCarrier) {
        // Include credentials in update if any were provided
        const hasNewCredentials = Object.values(credentials).some(v => v && v.trim() !== '');
        const updateData = hasNewCredentials
          ? { ...formData, credentials }
          : formData;
        await shippingCarriersService.updateCarrierConfig(editingCarrier.id, updateData);
        showSuccess('Success', `Carrier updated successfully${hasNewCredentials ? ' with new credentials' : ''}`);
      } else if (selectedTemplate) {
        const newCarrier = await shippingCarriersService.createCarrierFromTemplate(selectedTemplate.carrierType, {
          credentials,
          isTestMode: formData.isTestMode,
          displayName: formData.displayName,
        });
        newCarrierId = newCarrier.id;

        // Auto-create region for store country if available
        if (storeCountry && newCarrierId) {
          try {
            await shippingCarriersService.createCarrierRegion(newCarrierId, {
              countryCode: storeCountry,
              isPrimary: true,
              priority: 1,
              enabled: true,
            });
          } catch (regionError) {
            console.warn('Failed to auto-create region:', regionError);
          }
        }

        showSuccess('Success', `${selectedTemplate.displayName} added${storeCountry ? ` and configured for ${storeCountryName || storeCountry}` : ''}`);
      } else {
        await shippingCarriersService.createCarrierConfig({
          ...formData,
          credentials,
        } as any);
        showSuccess('Success', 'Carrier created successfully');
      }
      setShowModal(false);
      setShowAddWizard(false);
      resetForm();
      loadData();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save carrier');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Shipping Carrier',
      message: 'Are you sure you want to delete this carrier? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (confirmed) {
      try {
        await shippingCarriersService.deleteCarrierConfig(id);
        showSuccess('Success', 'Carrier deleted successfully');
        loadData();
      } catch (error: any) {
        showError('Error', error.message || 'Failed to delete carrier');
      }
    }
  };

  const handleEdit = (carrier: ShippingCarrierConfig) => {
    setEditingCarrier(carrier);
    setFormData(carrier);
    setShowModal(true);
  };

  const handleTestConnection = async (carrier: ShippingCarrierConfig) => {
    setTestingConnectionId(carrier.id);
    try {
      const result = await shippingCarriersService.testConnection(carrier.id);
      if (result.valid) {
        showSuccess('Connection Successful', result.message || `Successfully connected to ${carrier.displayName}`);
      } else {
        showError('Connection Failed', result.message || `Failed to connect to ${carrier.displayName}`);
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to test connection');
    } finally {
      setTestingConnectionId(null);
    }
  };

  const handleSelectTemplate = (template: ShippingCarrierTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      carrierType: template.carrierType,
      displayName: template.displayName,
      isEnabled: true,
      isTestMode: true,
      priority: template.priority || 10,
    });
    setCredentials({});
  };

  const resetForm = () => {
    setEditingCarrier(null);
    setSelectedTemplate(null);
    setFormData({
      carrierType: 'SHIPROCKET',
      displayName: '',
      isEnabled: true,
      isTestMode: true,
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
                {/* Primary Carrier */}
                <div className="flex items-center gap-3 bg-card rounded-lg border border-border px-4 py-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    {getCarrierIconComponent(recommendation.primary)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {getCarrierDisplayName(recommendation.primary)}
                    </p>
                    <p className="text-xs text-muted-foreground">Primary Carrier</p>
                  </div>
                  {hasRecommendedCarrier(recommendation.primary) ? (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-muted text-success-muted-foreground">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Configured
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSetupRecommended(recommendation.primary)}
                      className="ml-2 bg-violet-600 hover:bg-violet-700 text-white"
                      disabled={loading || templates.length === 0}
                    >
                      {loading ? 'Loading...' : 'Set Up'}
                    </Button>
                  )}
                </div>

                {/* Fallback Carrier */}
                {recommendation.fallback && (
                  <div className="flex items-center gap-3 bg-card rounded-lg border border-border px-4 py-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      {getCarrierIconComponent(recommendation.fallback)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {getCarrierDisplayName(recommendation.fallback)}
                      </p>
                      <p className="text-xs text-muted-foreground">Fallback Carrier</p>
                    </div>
                    {hasRecommendedCarrier(recommendation.fallback) ? (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-muted text-success-muted-foreground">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Configured
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetupRecommended(recommendation.fallback!)}
                        className="ml-2"
                        disabled={loading || templates.length === 0}
                      >
                        {loading ? 'Loading...' : 'Set Up'}
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
          <p className="text-sm text-muted-foreground">Detecting store location for shipping recommendations...</p>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowAddWizard(true)}
          className="bg-primary text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Carrier
        </Button>
      </div>

      {/* Carriers List */}
      <div className="space-y-4">
        {carriers.map((carrier) => (
          <div
            key={carrier.id}
            className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-violet-100 rounded-lg flex items-center justify-center">
                    {getCarrierIconComponent(carrier.carrierType)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{carrier.displayName}</h3>
                    <p className="text-sm text-muted-foreground">{getCarrierDisplayName(carrier.carrierType)}</p>
                  </div>
                  <div className="flex gap-2">
                    {carrier.isEnabled ? (
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
                    {carrier.isTestMode && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                        Test Mode
                      </span>
                    )}
                    {carrier.hasCredentials && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                        Credentials Set
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Priority</p>
                    <p className="text-sm font-semibold text-foreground">{carrier.priority}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Countries</p>
                    <p className="text-sm text-foreground">
                      {carrier.supportedCountries?.slice(0, 3).join(', ')}
                      {carrier.supportedCountries?.length > 3 && ` +${carrier.supportedCountries.length - 3}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rates</p>
                    <p className="text-sm text-foreground">
                      {carrier.supportsRates ? (
                        <CheckCircle className="h-4 w-4 text-success inline" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300 inline" />
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tracking</p>
                    <p className="text-sm text-foreground">
                      {carrier.supportsTracking ? (
                        <CheckCircle className="h-4 w-4 text-success inline" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300 inline" />
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Labels</p>
                    <p className="text-sm text-foreground">
                      {carrier.supportsLabels ? (
                        <CheckCircle className="h-4 w-4 text-success inline" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300 inline" />
                      )}
                    </p>
                  </div>
                </div>

                {carrier.supportedServices && carrier.supportedServices.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {carrier.supportedServices.slice(0, 5).map((service) => (
                      <span
                        key={service}
                        className="text-xs px-2 py-1 rounded bg-muted text-foreground border border-border"
                      >
                        {service}
                      </span>
                    ))}
                    {carrier.supportedServices.length > 5 && (
                      <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                        +{carrier.supportedServices.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTestConnection(carrier)}
                  disabled={testingConnectionId === carrier.id}
                  className="hover:bg-green-50 hover:text-green-600"
                  title="Test Connection"
                >
                  {testingConnectionId === carrier.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(carrier)}
                  className="hover:bg-primary/10 hover:text-primary"
                  title="Edit Carrier"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(carrier.id)}
                  className="hover:bg-red-50 hover:text-red-600"
                  title="Delete Carrier"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {carriers.length === 0 && (
          <div className="bg-card rounded-lg border border-border p-12 text-center text-muted-foreground">
            No shipping carriers configured. Click "Add Carrier" to get started.
          </div>
        )}
      </div>

      {/* Add Carrier Wizard */}
      {showAddWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                {selectedTemplate ? `Configure ${selectedTemplate.displayName}` : 'Choose a Shipping Carrier'}
              </h2>
            </div>

            <div className="p-6">
              {!selectedTemplate ? (
                <div className="space-y-6">
                  {/* India Carriers - Only Delhivery and Shiprocket */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span>Available Carriers for India</span>
                      <span className="text-xs font-normal text-muted-foreground">- Pan-India shipping</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 max-w-lg">
                      {templates
                        .filter(t => t.carrierType === 'DELHIVERY' || t.carrierType === 'SHIPROCKET')
                        .sort((a, b) => a.carrierType === 'DELHIVERY' ? -1 : 1)
                        .map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template)}
                          className={`p-4 border-2 rounded-lg hover:border-primary hover:bg-primary/10 transition-colors text-left ${
                            template.carrierType === 'DELHIVERY' ? 'border-red-200 bg-red-50/30' : 'border-purple-200 bg-purple-50/30'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-lg mb-3 flex items-center justify-center ${
                            template.carrierType === 'DELHIVERY' ? 'bg-red-100' : 'bg-purple-100'
                          }`}>
                            {getCarrierIconComponent(template.carrierType)}
                          </div>
                          <h3 className="font-semibold text-foreground">{template.displayName}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.carrierType === 'DELHIVERY' ? 'Primary - Direct carrier' : 'Fallback - 17+ couriers'}
                          </p>
                          {template.carrierType === 'DELHIVERY' && (
                            <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-success-muted text-success-muted-foreground rounded-full">
                              Recommended
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Other carriers (BlueDart, DTDC, etc.) are available through Shiprocket aggregation.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedTemplate.setupInstructions && (
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-sm text-blue-800 whitespace-pre-line">
                      {selectedTemplate.setupInstructions}
                    </div>
                  )}

                  {selectedTemplate.documentationUrl && (
                    <a
                      href={selectedTemplate.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:text-blue-800"
                    >
                      View Documentation <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Display Name
                    </label>
                    <Input
                      value={formData.displayName || ''}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder={`e.g., My ${selectedTemplate.displayName}`}
                    />
                  </div>

                  {selectedTemplate.requiredCredentials?.map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        {field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        <span className="text-red-500"> *</span>
                      </label>
                      <Input
                        type={field.includes('secret') || field.includes('password') || field.includes('key') ? 'password' : 'text'}
                        value={credentials[field] || ''}
                        onChange={(e) => setCredentials({ ...credentials, [field]: e.target.value })}
                        placeholder={`Enter ${field.replace(/_/g, ' ')}`}
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
                  Add Carrier
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingCarrier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                Edit Shipping Carrier
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Carrier Type
                  </label>
                  <div className="px-4 py-3 border-2 border-border rounded-xl bg-muted text-foreground font-medium">
                    {getCarrierDisplayName(formData.carrierType as CarrierType)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Display Name
                  </label>
                  <Input
                    value={formData.displayName || ''}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="e.g., My Shiprocket"
                  />
                </div>
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

              {/* Credential fields based on carrier type */}
              <div className="border-t border-border pt-4 mt-4">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  API Credentials
                </h4>
                <p className="text-xs text-muted-foreground mb-3">Leave blank to keep existing credentials</p>

                {formData.carrierType === 'DELHIVERY' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">API Token</label>
                      <Input
                        type="password"
                        value={credentials.api_token || ''}
                        onChange={(e) => setCredentials({ ...credentials, api_token: e.target.value })}
                        placeholder="Enter new API token"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Pickup Location Code</label>
                      <Input
                        value={credentials.pickup_location || ''}
                        onChange={(e) => setCredentials({ ...credentials, pickup_location: e.target.value })}
                        placeholder="e.g., Primary"
                      />
                    </div>
                  </div>
                )}

                {formData.carrierType === 'SHIPROCKET' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                      <Input
                        type="email"
                        value={credentials.email || ''}
                        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                        placeholder="Enter Shiprocket email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                      <Input
                        type="password"
                        value={credentials.password || ''}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>
                )}

                {formData.carrierType === 'SHIPPO' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">API Token</label>
                    <Input
                      type="password"
                      value={credentials.api_token || ''}
                      onChange={(e) => setCredentials({ ...credentials, api_token: e.target.value })}
                      placeholder="Enter Shippo API token"
                    />
                  </div>
                )}

                {(formData.carrierType === 'FEDEX' || formData.carrierType === 'UPS' || formData.carrierType === 'DHL') && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">API Key</label>
                      <Input
                        type="password"
                        value={credentials.api_key || ''}
                        onChange={(e) => setCredentials({ ...credentials, api_key: e.target.value })}
                        placeholder="Enter API key"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">API Secret</label>
                      <Input
                        type="password"
                        value={credentials.api_secret || ''}
                        onChange={(e) => setCredentials({ ...credentials, api_secret: e.target.value })}
                        placeholder="Enter API secret"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Account Number</label>
                      <Input
                        value={credentials.account_number || ''}
                        onChange={(e) => setCredentials({ ...credentials, account_number: e.target.value })}
                        placeholder="Enter account number"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Checkbox
                  checked={formData.isEnabled}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  label="Enable Carrier"
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
                Update Carrier
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
