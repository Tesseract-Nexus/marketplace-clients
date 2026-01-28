'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Star, Plus, Trash2, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/Select';
import { useDialog } from '@/contexts/DialogContext';
import { useToast } from '@/contexts/ToastContext';
import { useTenant } from '@/contexts/TenantContext';
import { tenantService } from '@/lib/services/tenantService';
import {
  paymentsService,
  GatewayOption,
  PaymentGatewayConfig,
} from '@/lib/api/payments';

const allCountries = [
  { value: 'US', label: 'United States', flag: '🇺🇸' },
  { value: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'AU', label: 'Australia', flag: '🇦🇺' },
  { value: 'NZ', label: 'New Zealand', flag: '🇳🇿' },
  { value: 'CA', label: 'Canada', flag: '🇨🇦' },
  { value: 'IN', label: 'India', flag: '🇮🇳' },
  { value: 'DE', label: 'Germany', flag: '🇩🇪' },
  { value: 'FR', label: 'France', flag: '🇫🇷' },
  { value: 'SG', label: 'Singapore', flag: '🇸🇬' },
  { value: 'HK', label: 'Hong Kong', flag: '🇭🇰' },
  { value: 'JP', label: 'Japan', flag: '🇯🇵' },
  { value: 'IT', label: 'Italy', flag: '🇮🇹' },
  { value: 'ES', label: 'Spain', flag: '🇪🇸' },
  { value: 'NL', label: 'Netherlands', flag: '🇳🇱' },
  { value: 'IE', label: 'Ireland', flag: '🇮🇪' },
];

export function RegionalSettingsTab() {
  const { showConfirm } = useDialog();
  const toast = useToast();
  const { currentTenant } = useTenant();
  const [matrix, setMatrix] = useState<Record<string, GatewayOption[]>>({});
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedGateway, setSelectedGateway] = useState('');
  const [storeCountry, setStoreCountry] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [currentTenant?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [matrixData, gatewaysData] = await Promise.all([
        paymentsService.getCountryGatewayMatrix(),
        paymentsService.getGatewayConfigs(),
      ]);
      setMatrix(matrixData.matrix);
      setGateways(gatewaysData);

      // Fetch store country from tenant details
      if (currentTenant?.id) {
        try {
          const tenantDetails = await tenantService.getTenantDetails(currentTenant.id);
          if (tenantDetails.address?.country) {
            setStoreCountry(tenantDetails.address.country);
            // Auto-populate country in the add modal if no regions exist
            if (Object.keys(matrixData.matrix).length === 0) {
              setSelectedCountry(tenantDetails.address.country);
            }
          }
        } catch (err) {
          console.error('Failed to load tenant details:', err);
        }
      }
    } catch (error) {
      console.error('Failed to load regional settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (configId: string, countryCode: string) => {
    try {
      await paymentsService.setPrimaryGateway(configId, countryCode);
      toast.success('Success', 'Primary gateway updated');
      loadData();
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to set primary gateway');
    }
  };

  const handleAddRegion = async () => {
    if (!selectedCountry || !selectedGateway) return;

    try {
      const gateway = gateways.find((g) => g.id === selectedGateway);
      if (!gateway) return;

      await paymentsService.createGatewayRegion(selectedGateway, {
        countryCode: selectedCountry,
        isPrimary: !matrix[selectedCountry] || matrix[selectedCountry].length === 0,
        priority: 10,
      });
      toast.success('Success', 'Region added successfully');
      setShowAddModal(false);
      setSelectedCountry('');
      setSelectedGateway('');
      loadData();
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to add region');
    }
  };

  const getCountryLabel = (code: string) => {
    const country = allCountries.find((c) => c.value === code);
    return country ? `${country.flag} ${country.label}` : code;
  };

  const getGatewayOptions = () => {
    return gateways
      .filter((g) => g.isEnabled)
      .map((g) => ({
        value: g.id,
        label: g.displayName,
      }));
  };

  const getAvailableCountries = () => {
    return allCountries.map((c) => ({
      value: c.value,
      label: `${c.flag} ${c.label}`,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-primary">Regional Payment Configuration</p>
          <p className="text-sm text-primary mt-1">
            Configure which payment gateways are available in each country. The primary gateway for
            each country will be used by default, with others as fallbacks based on priority.
          </p>
        </div>
      </div>

      {/* Add Region Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            // Pre-populate with store country if available
            if (storeCountry) {
              setSelectedCountry(storeCountry);
            }
            setShowAddModal(true);
          }}
          className="bg-primary text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Region Mapping
        </Button>
      </div>

      {/* Country Gateway Matrix */}
      <div className="bg-card rounded-lg border border-border shadow-sm relative z-10">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Available Gateways
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Primary
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.entries(matrix).length > 0 ? (
                Object.entries(matrix).map(([countryCode, countryGateways]) => (
                  <tr key={countryCode} className="hover:bg-muted">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-foreground">
                        {getCountryLabel(countryCode)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {countryGateways.map((gw) => (
                          <span
                            key={gw.gatewayType}
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              gw.isPrimary
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'bg-muted text-foreground border border-border'
                            }`}
                          >
                            {gw.displayName}
                            {gw.isPrimary && <Star className="h-3 w-3 ml-1 fill-current" />}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select
                        value={countryGateways.find((g) => g.isPrimary)?.gatewayType || ''}
                        onChange={(value) => {
                          const gateway = gateways.find((g) => g.gatewayType === value);
                          if (gateway) {
                            handleSetPrimary(gateway.id, countryCode);
                          }
                        }}
                        options={countryGateways.map((g) => ({
                          value: g.gatewayType,
                          label: g.displayName,
                        }))}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-muted text-success-muted-foreground">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium text-foreground mb-2">No Regional Mappings</p>
                    <p className="text-sm text-muted-foreground">
                      {storeCountry ? (
                        <>
                          Add region mappings to control which gateways are available. Your store is based in{' '}
                          <span className="font-medium text-foreground">
                            {allCountries.find(c => c.value === storeCountry)?.flag}{' '}
                            {allCountries.find(c => c.value === storeCountry)?.label || storeCountry}
                          </span>.
                        </>
                      ) : (
                        'Add region mappings to control which gateways are available in each country.'
                      )}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gateway Availability Summary */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-4">Gateway Regional Availability</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gateways
            .filter((g) => g.isEnabled)
            .map((gateway) => (
              <div
                key={gateway.id}
                className="border border-border rounded-lg p-4"
              >
                <h4 className="font-semibold text-foreground mb-2">{gateway.displayName}</h4>
                <div className="flex flex-wrap gap-1">
                  {gateway.supportedCountries?.map((country) => (
                    <span
                      key={country}
                      className="text-xs px-2 py-0.5 bg-muted text-foreground rounded"
                    >
                      {allCountries.find((c) => c.value === country)?.flag || ''} {country}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Add Region Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-xl font-bold text-foreground">Add Region Mapping</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Country
                </label>
                <Select
                  value={selectedCountry}
                  onChange={(value) => setSelectedCountry(value)}
                  options={getAvailableCountries()}
                  placeholder="Select a country"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Payment Gateway
                </label>
                <Select
                  value={selectedGateway}
                  onChange={(value) => setSelectedGateway(value)}
                  options={getGatewayOptions()}
                  placeholder="Select a gateway"
                />
              </div>
            </div>

            <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
              <Button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedCountry('');
                  setSelectedGateway('');
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddRegion}
                disabled={!selectedCountry || !selectedGateway}
                className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                Add Mapping
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
