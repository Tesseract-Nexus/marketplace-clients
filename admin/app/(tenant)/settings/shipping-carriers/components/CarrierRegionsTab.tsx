'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Globe,
  Star,
  Loader2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/Select';
import { useDialog } from '@/contexts/DialogContext';
import {
  shippingCarriersService,
  ShippingCarrierConfig,
  ShippingCarrierRegion,
  getCarrierDisplayName,
  getRegionLabel,
} from '@/lib/api/shippingCarriers';

const COMMON_COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
];

export function CarrierRegionsTab() {
  const { showConfirm, showSuccess, showError } = useDialog();
  const [carriers, setCarriers] = useState<ShippingCarrierConfig[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<ShippingCarrierConfig | null>(null);
  const [regions, setRegions] = useState<ShippingCarrierRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState<ShippingCarrierRegion | null>(null);
  const [formData, setFormData] = useState<Partial<ShippingCarrierRegion>>({
    countryCode: '',
    isPrimary: false,
    priority: 10,
    enabled: true,
    handlingFee: 0,
    handlingFeePercent: 0,
  });

  useEffect(() => {
    loadCarriers();
  }, []);

  useEffect(() => {
    if (selectedCarrier) {
      loadRegions(selectedCarrier.id);
    } else {
      setRegions([]);
    }
  }, [selectedCarrier]);

  const loadCarriers = async () => {
    try {
      setLoading(true);
      const carriersData = await shippingCarriersService.getCarrierConfigs();
      setCarriers(carriersData);
      if (carriersData.length > 0) {
        setSelectedCarrier(carriersData[0]);
      }
    } catch (error) {
      console.error('Failed to load carriers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRegions = async (carrierId: string) => {
    try {
      setLoadingRegions(true);
      const regionsData = await shippingCarriersService.getCarrierRegions(carrierId);
      setRegions(regionsData);
    } catch (error) {
      console.error('Failed to load regions:', error);
      setRegions([]);
    } finally {
      setLoadingRegions(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCarrier) return;

    try {
      if (editingRegion) {
        await shippingCarriersService.updateCarrierRegion(editingRegion.id, formData);
        showSuccess('Success', 'Region updated successfully');
      } else {
        await shippingCarriersService.createCarrierRegion(selectedCarrier.id, formData as any);
        showSuccess('Success', 'Region created successfully');
      }
      setShowModal(false);
      resetForm();
      loadRegions(selectedCarrier.id);
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save region');
    }
  };

  const handleDelete = async (regionId: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Region',
      message: 'Are you sure you want to delete this region mapping? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (confirmed && selectedCarrier) {
      try {
        await shippingCarriersService.deleteCarrierRegion(regionId);
        showSuccess('Success', 'Region deleted successfully');
        loadRegions(selectedCarrier.id);
      } catch (error: any) {
        showError('Error', error.message || 'Failed to delete region');
      }
    }
  };

  const handleSetPrimary = async (regionId: string, countryCode: string) => {
    if (!selectedCarrier) return;

    try {
      await shippingCarriersService.setPrimaryCarrier(selectedCarrier.id, countryCode);
      showSuccess('Success', `${selectedCarrier.displayName} is now the primary carrier for ${getRegionLabel(countryCode)}`);
      loadRegions(selectedCarrier.id);
    } catch (error: any) {
      showError('Error', error.message || 'Failed to set primary carrier');
    }
  };

  const handleEdit = (region: ShippingCarrierRegion) => {
    setEditingRegion(region);
    setFormData({
      countryCode: region.countryCode,
      isPrimary: region.isPrimary,
      priority: region.priority,
      enabled: region.enabled,
      supportedServices: region.supportedServices,
      defaultService: region.defaultService,
      handlingFee: region.handlingFee,
      handlingFeePercent: region.handlingFeePercent,
      freeShippingMinimum: region.freeShippingMinimum,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingRegion(null);
    setFormData({
      countryCode: '',
      isPrimary: false,
      priority: 10,
      enabled: true,
      handlingFee: 0,
      handlingFeePercent: 0,
    });
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
      {/* Carrier Selector */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-4">Select Carrier</h3>

        {carriers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No carriers configured. Add a carrier first to manage regions.</p>
          </div>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {carriers.map((carrier) => (
              <button
                key={carrier.id}
                onClick={() => setSelectedCarrier(carrier)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedCarrier?.id === carrier.id
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-border hover:border-border text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{carrier.displayName}</span>
                  {carrier.isEnabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-300" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {getCarrierDisplayName(carrier.carrierType)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Regions Section */}
      {selectedCarrier && (
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Region Mappings for {selectedCarrier.displayName}
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure which countries this carrier serves and their specific settings
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-primary text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Region
            </Button>
          </div>

          {loadingRegions ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 text-violet-600 animate-spin" />
            </div>
          ) : regions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No regions configured for this carrier.</p>
              <p className="text-sm mt-2">Add regions to specify where this carrier can ship.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {regions.map((region) => (
                <div
                  key={region.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    region.isPrimary
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-border bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getFlagEmoji(region.countryCode)}</span>
                      <div>
                        <p className="font-semibold text-foreground">
                          {getRegionLabel(region.countryCode)}
                        </p>
                        <p className="text-xs text-muted-foreground">{region.countryCode}</p>
                      </div>
                    </div>

                    {region.isPrimary && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        <Star className="h-3 w-3 mr-1" />
                        Primary
                      </span>
                    )}

                    {region.enabled ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        <XCircle className="h-3 w-3 mr-1" />
                        Disabled
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Priority:</span> {region.priority}
                    </div>
                    {region.handlingFee > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Handling:</span> ${region.handlingFee}
                      </div>
                    )}
                    {region.freeShippingMinimum && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Free Above:</span> ${region.freeShippingMinimum}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {!region.isPrimary && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetPrimary(region.id, region.countryCode)}
                          className="hover:bg-yellow-50 hover:text-yellow-600"
                          title="Set as Primary"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(region)}
                        className="hover:bg-primary/10 hover:text-primary"
                        title="Edit Region"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(region.id)}
                        className="hover:bg-red-50 hover:text-red-600"
                        title="Delete Region"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Region Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-xl font-bold text-foreground">
                {editingRegion ? 'Edit Region' : 'Add Region'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                {editingRegion ? (
                  <div className="px-4 py-3 border-2 border-border rounded-xl bg-muted text-foreground font-medium">
                    {getFlagEmoji(formData.countryCode || '')} {getRegionLabel(formData.countryCode || '')}
                  </div>
                ) : (
                  <Select
                    value={formData.countryCode || ''}
                    onChange={(value) => setFormData({ ...formData, countryCode: value })}
                    options={COMMON_COUNTRIES.map((c) => ({
                      value: c.code,
                      label: `${getFlagEmoji(c.code)} ${c.name}`,
                    }))}
                    placeholder="Select country"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Priority
                  </label>
                  <Input
                    type="number"
                    value={formData.priority || 10}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Lower = higher priority</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Handling Fee ($)
                  </label>
                  <Input
                    type="number"
                    value={formData.handlingFee || 0}
                    onChange={(e) => setFormData({ ...formData, handlingFee: parseFloat(e.target.value) })}
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Handling Fee (%)
                  </label>
                  <Input
                    type="number"
                    value={formData.handlingFeePercent || 0}
                    onChange={(e) => setFormData({ ...formData, handlingFeePercent: parseFloat(e.target.value) })}
                    min={0}
                    max={100}
                    step={0.1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Free Shipping Above ($)
                  </label>
                  <Input
                    type="number"
                    value={formData.freeShippingMinimum || ''}
                    onChange={(e) => setFormData({ ...formData, freeShippingMinimum: e.target.value ? parseFloat(e.target.value) : undefined })}
                    min={0}
                    step={0.01}
                    placeholder="No minimum"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Default Service
                </label>
                <Input
                  value={formData.defaultService || ''}
                  onChange={(e) => setFormData({ ...formData, defaultService: e.target.value })}
                  placeholder="e.g., express, standard"
                />
              </div>

              <div className="space-y-2">
                <Checkbox
                  checked={formData.enabled !== false}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  label="Enable this region"
                />
                <Checkbox
                  checked={formData.isPrimary || false}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  label="Set as primary carrier for this country"
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
                disabled={!formData.countryCode}
                className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {editingRegion ? 'Update' : 'Add'} Region
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get flag emoji from country code
function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
