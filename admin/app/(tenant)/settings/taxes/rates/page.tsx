'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Percent, Plus, Edit, Trash2, Calendar, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { LastUpdatedStatus } from '@/components/LastUpdatedStatus';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/Select';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/PageHeader';
import { useDialog } from '@/contexts/DialogContext';
import { useToast } from '@/contexts/ToastContext';
import {
  taxService,
  TaxJurisdiction,
  TaxRate,
  TaxType,
  CreateTaxRateRequest,
} from '@/lib/services/taxService';

const taxTypeOptions = [
  { value: 'SALES', label: 'Sales Tax (US)' },
  { value: 'VAT', label: 'VAT (EU/UK)' },
  { value: 'GST', label: 'GST (AU/NZ/SG)' },
  { value: 'CGST', label: 'CGST (India Central)' },
  { value: 'SGST', label: 'SGST (India State)' },
  { value: 'IGST', label: 'IGST (India Interstate)' },
  { value: 'UTGST', label: 'UTGST (India UT)' },
  { value: 'CESS', label: 'GST Cess (India Luxury)' },
  { value: 'HST', label: 'HST (Canada Harmonized)' },
  { value: 'PST', label: 'PST (Canada Provincial)' },
  { value: 'QST', label: 'QST (Quebec)' },
  { value: 'CITY', label: 'City Tax' },
  { value: 'COUNTY', label: 'County Tax' },
  { value: 'STATE', label: 'State Tax' },
  { value: 'SPECIAL', label: 'Special Tax' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

interface RateWithJurisdiction extends TaxRate {
  jurisdictionName: string;
}

export default function TaxRatesPage() {
  const { showConfirm } = useDialog();
  const toast = useToast();
  const [rates, setRates] = useState<RateWithJurisdiction[]>([]);
  const [jurisdictions, setJurisdictions] = useState<TaxJurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    jurisdictionId: '',
    name: '',
    rate: '',
    taxType: 'SALES' as TaxType,
    priority: '1',
    appliesToShipping: false,
    appliesToProducts: true,
    isCompound: false,
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    isActive: true,
  });

  // Fetch data
  const fetchData = useCallback(async (isBackground = false) => {
    try {
      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await taxService.jurisdictions.list();
      setJurisdictions(data);

      // Flatten all rates from all jurisdictions
      const allRates: RateWithJurisdiction[] = [];
      data.forEach((jurisdiction) => {
        if (jurisdiction.taxRates) {
          jurisdiction.taxRates.forEach((rate) => {
            allRates.push({
              ...rate,
              jurisdictionName: jurisdiction.name,
            });
          });
        }
      });
      setRates(allRates);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tax rates';
      setError(message);
      if (!isBackground) {
        toast.error('Error', message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch (no polling - data is cached in PostgreSQL)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const request: CreateTaxRateRequest = {
        jurisdictionId: formData.jurisdictionId,
        name: formData.name,
        rate: parseFloat(formData.rate),
        taxType: formData.taxType,
        priority: parseInt(formData.priority),
        isCompound: formData.isCompound,
        appliesToShipping: formData.appliesToShipping,
        appliesToProducts: formData.appliesToProducts,
        effectiveFrom: formData.effectiveFrom,
        effectiveTo: formData.effectiveTo || undefined,
        isActive: formData.isActive,
      };

      if (editingId) {
        await taxService.rates.update(editingId, request);
        toast.success('Success', 'Tax rate updated successfully');
      } else {
        await taxService.rates.create(request);
        toast.success('Success', 'Tax rate created successfully');
      }

      handleCloseModal();
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save tax rate';
      toast.error('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rate: RateWithJurisdiction) => {
    setEditingId(rate.id);
    setFormData({
      jurisdictionId: rate.jurisdictionId,
      name: rate.name,
      rate: rate.rate.toString(),
      taxType: rate.taxType,
      priority: rate.priority.toString(),
      appliesToShipping: rate.appliesToShipping,
      appliesToProducts: rate.appliesToProducts,
      isCompound: rate.isCompound,
      effectiveFrom: rate.effectiveFrom.split('T')[0],
      effectiveTo: rate.effectiveTo?.split('T')[0] || '',
      isActive: rate.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Tax Rate',
      message: 'Are you sure you want to delete this tax rate?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (confirmed) {
      try {
        await taxService.rates.delete(id);
        toast.success('Success', 'Tax rate deleted successfully');
        fetchData();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete tax rate';
        toast.error('Error', message);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      jurisdictionId: '',
      name: '',
      rate: '',
      taxType: 'SALES',
      priority: '1',
      appliesToShipping: false,
      appliesToProducts: true,
      isCompound: false,
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      isActive: true,
    });
  };

  const getTaxTypeColor = (type: TaxType) => {
    const colors: Record<TaxType, string> = {
      SALES: 'bg-primary/20 text-primary border-primary/30',
      VAT: 'bg-primary/10 text-primary border-primary/30',
      GST: 'bg-success-muted text-success-muted-foreground border-success/30',
      CGST: 'bg-success/10 text-success border-success/30',
      SGST: 'bg-success-muted text-success border-success/30',
      IGST: 'bg-accent text-accent-foreground border-accent',
      UTGST: 'bg-info/10 text-info border-info/30',
      CESS: 'bg-warning-muted text-warning-foreground border-warning/30',
      HST: 'bg-error-muted text-error border-error/30',
      PST: 'bg-accent text-accent-foreground border-accent',
      QST: 'bg-primary/10 text-primary border-primary/30',
      CITY: 'bg-warning-muted text-warning border-warning/30',
      COUNTY: 'bg-primary/10 text-primary border-primary/30',
      STATE: 'bg-primary/10 text-primary border-primary/30',
      SPECIAL: 'bg-warning-muted text-warning border-warning/30',
    };
    return colors[type];
  };

  const jurisdictionOptions = jurisdictions.map((j) => ({
    value: j.id,
    label: `${j.name} (${j.type})`,
  }));

  if (loading && rates.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading tax rates...</p>
        </div>
      </div>
    );
  }

  if (error && rates.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-error" />
          <h2 className="text-xl font-semibold text-foreground">Failed to load tax rates</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => fetchData()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.SETTINGS_TAXES_VIEW}
      fallback="styled"
      fallbackTitle="Tax Rates"
      fallbackDescription="You don't have permission to view tax rates."
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Tax Rates"
          description="Configure tax rates for different jurisdictions"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Tax Settings', href: '/settings/taxes' },
            { label: 'Tax Rates' },
          ]}
          badge={{
            label: `${rates.length} Rates`,
            variant: 'default',
          }}
          status={
            <LastUpdatedStatus lastUpdated={lastUpdated} isFetching={refreshing} />
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fetchData()}
                disabled={loading || refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => {
                  handleCloseModal();
                  setShowModal(true);
                }}
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tax Rate
              </Button>
            </div>
          }
        />

        {/* Tax Rates List */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Jurisdiction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Applies To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Effective Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      No tax rates found. Click &quot;Add Tax Rate&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  rates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-muted transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{rate.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{rate.jurisdictionName}</td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-primary">
                          {rate.rate}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTaxTypeColor(rate.taxType)}`}
                        >
                          {rate.taxType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {rate.appliesToProducts && (
                            <span className="text-xs text-muted-foreground">Products</span>
                          )}
                          {rate.appliesToShipping && (
                            <span className="text-xs text-muted-foreground">Shipping</span>
                          )}
                          {rate.isCompound && (
                            <span className="text-xs text-warning font-medium">Compound</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(rate.effectiveFrom).toLocaleDateString()}</span>
                          {rate.effectiveTo && (
                            <>
                              <span className="mx-1">→</span>
                              <span>{new Date(rate.effectiveTo).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            rate.isActive
                              ? 'bg-success-muted text-success-muted-foreground border-success/30'
                              : 'bg-muted text-foreground border-border'
                          }`}
                        >
                          {rate.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(rate)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                            title="Edit"
                            aria-label="Edit tax rate"
                          >
                            <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rate.id)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-error-muted transition-colors"
                            title="Delete"
                            aria-label="Delete tax rate"
                          >
                            <Trash2 className="w-4 h-4 text-error" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-2xl font-bold text-primary">
                  {editingId ? 'Edit Tax Rate' : 'Create Tax Rate'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Jurisdiction <span className="text-error">*</span>
                  </label>
                  <Select
                    value={formData.jurisdictionId}
                    onChange={(value) => setFormData({ ...formData, jurisdictionId: value })}
                    options={[{ value: '', label: 'Select a jurisdiction' }, ...jurisdictionOptions]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Rate Name <span className="text-error">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., CA State Sales Tax"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Tax Rate (%) <span className="text-error">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                      placeholder="7.25"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Type <span className="text-error">*</span>
                    </label>
                    <Select
                      value={formData.taxType}
                      onChange={(value) => setFormData({ ...formData, taxType: value as TaxType })}
                      options={taxTypeOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Priority
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    />
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3">Applies To</h4>
                  <div className="space-y-3">
                    <Checkbox
                      checked={formData.appliesToProducts}
                      onChange={(e) =>
                        setFormData({ ...formData, appliesToProducts: e.target.checked })
                      }
                      label="Products"
                      description="Apply this tax to product prices"
                    />
                    <Checkbox
                      checked={formData.appliesToShipping}
                      onChange={(e) =>
                        setFormData({ ...formData, appliesToShipping: e.target.checked })
                      }
                      label="Shipping"
                      description="Apply this tax to shipping costs"
                    />
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3">Calculation Method</h4>
                  <div className="space-y-3">
                    <Checkbox
                      checked={formData.isCompound}
                      onChange={(e) => setFormData({ ...formData, isCompound: e.target.checked })}
                      label="Compound Tax"
                      description="Calculate on subtotal + other taxes (e.g., Quebec QST is calculated on subtotal + GST)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Effective From <span className="text-error">*</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.effectiveFrom}
                      onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Effective To (Optional)
                    </label>
                    <Input
                      type="date"
                      value={formData.effectiveTo}
                      onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Status</label>
                  <Select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
                    options={statusOptions}
                  />
                </div>
              </div>

              <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
                <Button onClick={handleCloseModal} variant="outline" disabled={saving}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    !formData.jurisdictionId || !formData.name || !formData.rate || saving
                  }
                  className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingId ? (
                    'Update'
                  ) : (
                    'Create'
                  )}
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
