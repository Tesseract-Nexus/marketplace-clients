'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Plus,
  Edit,
  Eye,
  Calendar,
  FileText,
  Loader2,
  RefreshCw,
  AlertCircle,
  Trash2,
} from 'lucide-react';
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
  TaxExemptionCertificate,
  CertificateType,
  CertificateStatus,
  CreateExemptionCertificateRequest,
} from '@/lib/services/taxService';

const certificateTypeOptions = [
  { value: 'RESALE', label: 'Resale Certificate' },
  { value: 'GOVERNMENT', label: 'Government Entity' },
  { value: 'NON_PROFIT', label: 'Non-Profit Organization' },
  { value: 'DIPLOMATIC', label: 'Diplomatic Mission' },
];

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'REVOKED', label: 'Revoked' },
];

export default function TaxExemptionsPage() {
  const { showConfirm } = useDialog();
  const toast = useToast();
  const [certificates, setCertificates] = useState<TaxExemptionCertificate[]>([]);
  const [jurisdictions, setJurisdictions] = useState<TaxJurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewingCert, setViewingCert] = useState<TaxExemptionCertificate | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    certificateNumber: '',
    certificateType: 'RESALE' as CertificateType,
    jurisdictionId: '',
    appliesToAllJurisdictions: false,
    issuedDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    documentUrl: '',
    status: 'PENDING' as CertificateStatus,
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
      const [certsData, jurisdictionsData] = await Promise.all([
        taxService.exemptions.list(),
        taxService.jurisdictions.list(),
      ]);
      setCertificates(certsData);
      setJurisdictions(jurisdictionsData);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load exemption certificates';
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
      const request: CreateExemptionCertificateRequest = {
        customerId: formData.customerId,
        certificateNumber: formData.certificateNumber,
        certificateType: formData.certificateType,
        jurisdictionId: formData.appliesToAllJurisdictions ? undefined : formData.jurisdictionId || undefined,
        appliesToAllJurisdictions: formData.appliesToAllJurisdictions,
        issuedDate: formData.issuedDate,
        expiryDate: formData.expiryDate || undefined,
        documentUrl: formData.documentUrl || undefined,
        status: formData.status,
      };

      if (editingId) {
        await taxService.exemptions.update(editingId, request);
        toast.success('Success', 'Certificate updated successfully');
      } else {
        await taxService.exemptions.create(request);
        toast.success('Success', 'Certificate created successfully');
      }

      handleCloseModal();
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save certificate';
      toast.error('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cert: TaxExemptionCertificate) => {
    setEditingId(cert.id);
    setFormData({
      customerId: cert.customerId,
      certificateNumber: cert.certificateNumber,
      certificateType: cert.certificateType,
      jurisdictionId: cert.jurisdictionId || '',
      appliesToAllJurisdictions: cert.appliesToAllJurisdictions,
      issuedDate: cert.issuedDate.split('T')[0],
      expiryDate: cert.expiryDate?.split('T')[0] || '',
      documentUrl: cert.documentUrl || '',
      status: cert.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Certificate',
      message: 'Are you sure you want to delete this exemption certificate?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (confirmed) {
      try {
        await taxService.exemptions.delete(id);
        toast.success('Success', 'Certificate deleted successfully');
        fetchData();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete certificate';
        toast.error('Error', message);
      }
    }
  };

  const handleView = (cert: TaxExemptionCertificate) => {
    setViewingCert(cert);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setViewingCert(null);
    setEditingId(null);
    setFormData({
      customerId: '',
      certificateNumber: '',
      certificateType: 'RESALE',
      jurisdictionId: '',
      appliesToAllJurisdictions: false,
      issuedDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      documentUrl: '',
      status: 'PENDING',
    });
  };

  const getStatusColor = (status: CertificateStatus) => {
    const colors = {
      ACTIVE: 'bg-success-muted text-success-muted-foreground border-success/30',
      PENDING: 'bg-warning-muted text-warning border-warning/30',
      EXPIRED: 'bg-error-muted text-error-muted-foreground border-error/30',
      REVOKED: 'bg-muted text-foreground border-border',
    };
    return colors[status];
  };

  const getTypeColor = (type: CertificateType) => {
    const colors = {
      RESALE: 'bg-primary/20 text-primary border-primary/30',
      GOVERNMENT: 'bg-primary/10 text-primary border-primary/30',
      NON_PROFIT: 'bg-success-muted text-success-muted-foreground border-success/30',
      DIPLOMATIC: 'bg-warning-muted text-warning border-warning/30',
    };
    return colors[type];
  };

  const getJurisdictionName = (jurisdictionId?: string) => {
    if (!jurisdictionId) return null;
    return jurisdictions.find((j) => j.id === jurisdictionId)?.name;
  };

  const jurisdictionOptions = jurisdictions.map((j) => ({
    value: j.id,
    label: `${j.name} (${j.type})`,
  }));

  if (loading && certificates.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading exemption certificates...</p>
        </div>
      </div>
    );
  }

  if (error && certificates.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-error" />
          <h2 className="text-xl font-semibold text-foreground">
            Failed to load exemption certificates
          </h2>
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
      fallbackTitle="Tax Exemptions"
      fallbackDescription="You don't have permission to view tax exemptions."
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Tax Exemption Certificates"
          description="Manage customer tax exemption certificates"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Tax Settings', href: '/settings/taxes' },
            { label: 'Exemptions' },
          ]}
          badge={{
            label: `${certificates.length} Certificates`,
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
                className="p-2.5"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={() => {
                  handleCloseModal();
                  setShowModal(true);
                }}
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Certificate
              </Button>
            </div>
          }
        />

        {/* Certificates List */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Certificate Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Jurisdiction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Validity Period
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
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No exemption certificates found. Click &quot;Add Certificate&quot; to create
                      one.
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-muted transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm font-medium text-foreground">
                            {cert.certificateNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-muted-foreground font-mono">{cert.customerId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTypeColor(cert.certificateType)}`}
                        >
                          {cert.certificateType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {cert.appliesToAllJurisdictions ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/30">
                            All Jurisdictions
                          </span>
                        ) : (
                          getJurisdictionName(cert.jurisdictionId) || 'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(cert.issuedDate).toLocaleDateString()}</span>
                          {cert.expiryDate && (
                            <>
                              <span className="mx-1">→</span>
                              <span>{new Date(cert.expiryDate).toLocaleDateString()}</span>
                            </>
                          )}
                          {!cert.expiryDate && <span className="ml-1 text-muted-foreground">No expiry</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(cert.status)}`}
                        >
                          {cert.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(cert)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                            title="View Details"
                            aria-label="View exemption details"
                          >
                            <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cert)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                            title="Edit"
                            aria-label="Edit exemption"
                          >
                            <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cert.id)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-error-muted transition-colors"
                            title="Delete"
                            aria-label="Delete exemption"
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
        {showModal && !viewingCert && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-2xl font-bold text-primary">
                  {editingId ? 'Edit Exemption Certificate' : 'Create Exemption Certificate'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Customer ID <span className="text-error">*</span>
                    </label>
                    <Input
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      placeholder="cust_123456"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Certificate Number <span className="text-error">*</span>
                    </label>
                    <Input
                      value={formData.certificateNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, certificateNumber: e.target.value })
                      }
                      placeholder="RESALE-2024-001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Certificate Type <span className="text-error">*</span>
                  </label>
                  <Select
                    value={formData.certificateType}
                    onChange={(value) =>
                      setFormData({ ...formData, certificateType: value as CertificateType })
                    }
                    options={certificateTypeOptions}
                  />
                </div>

                <div className="border border-border rounded-lg p-4">
                  <Checkbox
                    checked={formData.appliesToAllJurisdictions}
                    onChange={(e) =>
                      setFormData({ ...formData, appliesToAllJurisdictions: e.target.checked })
                    }
                    label="Applies to all jurisdictions"
                    description="This certificate is valid in all tax jurisdictions"
                  />
                </div>

                {!formData.appliesToAllJurisdictions && (
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Jurisdiction
                    </label>
                    <Select
                      value={formData.jurisdictionId}
                      onChange={(value) => setFormData({ ...formData, jurisdictionId: value })}
                      options={[
                        { value: '', label: 'Select a jurisdiction' },
                        ...jurisdictionOptions,
                      ]}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Issued Date <span className="text-error">*</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.issuedDate}
                      onChange={(e) => setFormData({ ...formData, issuedDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Expiry Date (Optional)
                    </label>
                    <Input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Document URL
                  </label>
                  <Input
                    value={formData.documentUrl}
                    onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                    placeholder="https://example.com/certificate.pdf"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL to the certificate document (PDF, image, etc.)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Status <span className="text-error">*</span>
                  </label>
                  <Select
                    value={formData.status}
                    onChange={(value) =>
                      setFormData({ ...formData, status: value as CertificateStatus })
                    }
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
                  disabled={!formData.customerId || !formData.certificateNumber || saving}
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

        {/* View Certificate Modal */}
        {viewingCert && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-2xl font-bold text-primary">
                  Certificate Details
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-semibold text-muted-foreground mb-1">
                      Certificate Number
                    </div>
                    <div className="font-mono text-foreground">{viewingCert.certificateNumber}</div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-muted-foreground mb-1">Type</div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTypeColor(viewingCert.certificateType)}`}
                    >
                      {viewingCert.certificateType.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-muted-foreground mb-1">Customer ID</div>
                    <div className="font-mono text-sm text-foreground">{viewingCert.customerId}</div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-muted-foreground mb-1">Status</div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(viewingCert.status)}`}
                    >
                      {viewingCert.status}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-muted-foreground mb-1">Jurisdiction</div>
                    <div className="text-foreground">
                      {viewingCert.appliesToAllJurisdictions ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/30">
                          All Jurisdictions
                        </span>
                      ) : (
                        getJurisdictionName(viewingCert.jurisdictionId) || 'N/A'
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-muted-foreground mb-1">Issued Date</div>
                    <div className="text-foreground">
                      {new Date(viewingCert.issuedDate).toLocaleDateString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-muted-foreground mb-1">Expiry Date</div>
                    <div className="text-foreground">
                      {viewingCert.expiryDate
                        ? new Date(viewingCert.expiryDate).toLocaleDateString()
                        : 'No expiry'}
                    </div>
                  </div>
                </div>

                {viewingCert.documentUrl && (
                  <div>
                    <div className="text-sm font-semibold text-muted-foreground mb-2">Document</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(viewingCert.documentUrl, '_blank')}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Document
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t border-border px-6 py-4 flex justify-end">
                <Button onClick={handleCloseModal} variant="outline">
                  Close
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
