'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Globe, Plus, Edit, Trash2, MapPin, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { LastUpdatedStatus } from '@/components/LastUpdatedStatus';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { useDialog } from '@/contexts/DialogContext';
import { taxService, TaxJurisdiction, JurisdictionType, CreateJurisdictionRequest } from '@/lib/services/taxService';

const jurisdictionTypeOptions = [
  { value: 'COUNTRY', label: 'Country' },
  { value: 'STATE', label: 'State/Province' },
  { value: 'COUNTY', label: 'County' },
  { value: 'CITY', label: 'City' },
  { value: 'ZIP', label: 'ZIP/Postal Code' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function TaxJurisdictionsPage() {
  const { showSuccess, showError, showConfirm } = useDialog();
  const [jurisdictions, setJurisdictions] = useState<TaxJurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'STATE' as JurisdictionType,
    code: '',
    stateCode: '',
    parentId: '',
    isActive: true,
  });

  // Fetch jurisdictions
  const fetchJurisdictions = useCallback(async (isBackground = false) => {
    try {
      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await taxService.jurisdictions.list();
      setJurisdictions(data);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load jurisdictions';
      setError(message);
      if (!isBackground) {
        showError('Error', message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showError]);

  // Initial fetch (no polling - data is cached in PostgreSQL)
  useEffect(() => {
    fetchJurisdictions();
  }, [fetchJurisdictions]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const request: CreateJurisdictionRequest = {
        name: formData.name,
        type: formData.type,
        code: formData.code,
        stateCode: formData.stateCode || undefined,
        parentId: formData.parentId || undefined,
        isActive: formData.isActive,
      };

      if (editingId) {
        await taxService.jurisdictions.update(editingId, request);
        showSuccess('Success', 'Jurisdiction updated successfully');
      } else {
        await taxService.jurisdictions.create(request);
        showSuccess('Success', 'Jurisdiction created successfully');
      }

      handleCloseModal();
      fetchJurisdictions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save jurisdiction';
      showError('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (jurisdiction: TaxJurisdiction) => {
    setEditingId(jurisdiction.id);
    setFormData({
      name: jurisdiction.name,
      type: jurisdiction.type,
      code: jurisdiction.code,
      stateCode: jurisdiction.stateCode || '',
      parentId: jurisdiction.parentId || '',
      isActive: jurisdiction.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Jurisdiction',
      message: 'Are you sure you want to delete this jurisdiction? This will also remove all associated tax rates.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (confirmed) {
      try {
        await taxService.jurisdictions.delete(id);
        showSuccess('Success', 'Jurisdiction deleted successfully');
        fetchJurisdictions();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete jurisdiction';
        showError('Error', message);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', type: 'STATE', code: '', stateCode: '', parentId: '', isActive: true });
  };

  const getParentName = (parentId?: string) => {
    if (!parentId) return null;
    return jurisdictions.find(j => j.id === parentId)?.name;
  };

  const getTypeColor = (type: JurisdictionType) => {
    const colors = {
      COUNTRY: 'bg-primary/10 text-primary border-primary/30',
      STATE: 'bg-primary/20 text-primary border-primary/30',
      COUNTY: 'bg-success-muted text-success-muted-foreground border-success/30',
      CITY: 'bg-warning-muted text-warning border-warning/30',
      ZIP: 'bg-primary/10 text-primary border-primary/30',
    };
    return colors[type];
  };

  const getTaxRatesCount = (jurisdiction: TaxJurisdiction) => {
    return jurisdiction.taxRates?.length || 0;
  };

  if (loading && jurisdictions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading jurisdictions...</p>
        </div>
      </div>
    );
  }

  if (error && jurisdictions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-error" />
          <h2 className="text-xl font-semibold text-foreground">Failed to load jurisdictions</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => fetchJurisdictions()} className="mt-4">
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
      fallbackTitle="Tax Jurisdictions"
      fallbackDescription="You don't have permission to view tax jurisdictions."
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Tax Jurisdictions"
          description="Manage tax jurisdictions for different regions"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Tax Settings', href: '/settings/taxes' },
            { label: 'Jurisdictions' },
          ]}
          badge={{
            label: `${jurisdictions.length} Jurisdictions`,
            variant: 'default'
          }}
          status={
            <LastUpdatedStatus lastUpdated={lastUpdated} isFetching={refreshing} />
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fetchJurisdictions()}
                disabled={loading || refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => { handleCloseModal(); setShowModal(true); }}
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Jurisdiction
              </Button>
            </div>
          }
        />

        {/* Jurisdictions List */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    State Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Parent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Tax Rates
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jurisdictions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      No jurisdictions found. Click &quot;Add Jurisdiction&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  jurisdictions.map((jurisdiction) => (
                    <tr key={jurisdiction.id} className="hover:bg-muted transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{jurisdiction.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTypeColor(jurisdiction.type)}`}>
                          {jurisdiction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground font-mono">
                        {jurisdiction.code}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {jurisdiction.stateCode || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {getParentName(jurisdiction.parentId) || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          jurisdiction.isActive
                            ? 'bg-success-muted text-success-muted-foreground border-success/30'
                            : 'bg-muted text-foreground border-border'
                        }`}>
                          {jurisdiction.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {getTaxRatesCount(jurisdiction)} rate(s)
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(jurisdiction)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                            title="Edit"
                            aria-label="Edit jurisdiction"
                          >
                            <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(jurisdiction.id)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-error-muted transition-colors"
                            title="Delete"
                            aria-label="Delete jurisdiction"
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
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-2xl font-bold text-primary">
                  {editingId ? 'Edit Jurisdiction' : 'Create Jurisdiction'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Name <span className="text-error">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., California"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Type <span className="text-error">*</span>
                    </label>
                    <Select
                      value={formData.type}
                      onChange={(value) => setFormData({ ...formData, type: value as JurisdictionType })}
                      options={jurisdictionTypeOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Code <span className="text-error">*</span>
                    </label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., CA"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      State Code
                      <span className="text-muted-foreground text-xs ml-2">(for tax calculation)</span>
                    </label>
                    <Input
                      value={formData.stateCode}
                      onChange={(e) => setFormData({ ...formData, stateCode: e.target.value.toUpperCase() })}
                      placeholder="e.g., 27 (India) or CA (US)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">India GST state codes: 27 (MH), 29 (KA), etc.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Parent Jurisdiction
                    </label>
                    <Select
                      value={formData.parentId}
                      onChange={(value) => setFormData({ ...formData, parentId: value })}
                      options={[
                        { value: '', label: 'None' },
                        ...jurisdictions
                          .filter(j => j.id !== editingId)
                          .map(j => ({ value: j.id, label: `${j.name} (${j.type})` }))
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Status
                  </label>
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
                  disabled={!formData.name || !formData.code || saving}
                  className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingId ? 'Update' : 'Create'
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
