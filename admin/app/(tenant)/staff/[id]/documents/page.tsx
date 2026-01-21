'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  Loader2,
  RefreshCw,
  Eye,
  Download,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { ConfirmModal } from '@/components/ConfirmModal';
import { DocumentCard, DocumentCardGrid } from '@/components/staff/DocumentCard';
import { DocumentUploader } from '@/components/staff/DocumentUploader';
import { staffDocumentService } from '@/lib/api/staffDocuments';
import { staffService } from '@/lib/api/staff';
import { Staff } from '@/lib/api/types';
import {
  StaffDocument,
  CreateStaffDocumentRequest,
  DocumentVerificationStatus,
  DOCUMENT_CATEGORIES,
  VERIFICATION_STATUS_STYLES,
} from '@/lib/api/staffDocumentTypes';

type ViewMode = 'list' | 'upload' | 'verify';

export default function StaffDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params?.id as string;

  const [staff, setStaff] = useState<Staff | null>(null);
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDocument, setSelectedDocument] = useState<StaffDocument | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Verification modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'verified' | 'rejected' | 'requires_update'>('verified');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (staffId) {
      loadData();
    }
  }, [staffId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load staff info and documents in parallel
      const [staffResponse, docsResponse] = await Promise.all([
        staffService.getStaffMember(staffId),
        staffDocumentService.list(staffId),
      ]);

      setStaff(staffResponse.data);
      setDocuments(docsResponse.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' ||
      DOCUMENT_CATEGORIES.find((c) => c.id === categoryFilter)?.types.includes(doc.documentType);
    const matchesStatus =
      statusFilter === 'all' || doc.verificationStatus === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleUpload = async (data: CreateStaffDocumentRequest, file: File) => {
    try {
      // In production, upload file to storage first
      await staffDocumentService.create(staffId, data);
      await loadData();
      setViewMode('list');
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = (document: StaffDocument) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Document',
      message: `Are you sure you want to delete "${document.documentName}"? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await staffDocumentService.delete(staffId, document.id);
          await loadData();
          setModalConfig({ ...modalConfig, isOpen: false });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to delete document');
        }
      },
    });
  };

  const handleVerifyClick = (document: StaffDocument) => {
    setSelectedDocument(document);
    setVerifyStatus('verified');
    setVerifyNotes('');
    setRejectionReason('');
    setVerifyModalOpen(true);
  };

  const handleVerifySubmit = async () => {
    if (!selectedDocument) return;

    try {
      setVerifying(true);
      await staffDocumentService.verify(staffId, selectedDocument.id, {
        status: verifyStatus,
        notes: verifyNotes || undefined,
        rejectionReason: verifyStatus === 'rejected' ? rejectionReason : undefined,
      });
      await loadData();
      setVerifyModalOpen(false);
      setSelectedDocument(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify document');
    } finally {
      setVerifying(false);
    }
  };

  const handleView = (document: StaffDocument) => {
    // In production, open document in a modal or new tab
    if (document.fileUrl) {
      window.open(document.fileUrl, '_blank');
    }
  };

  const handleDownload = (document: StaffDocument) => {
    // In production, trigger download
    if (document.fileUrl) {
      const link = window.document.createElement('a');
      link.href = document.fileUrl;
      link.download = document.documentName;
      link.click();
    }
  };

  // Stats
  const stats = {
    total: documents.length,
    verified: documents.filter((d) => d.verificationStatus === 'verified').length,
    pending: documents.filter((d) => d.verificationStatus === 'pending' || d.verificationStatus === 'under_review').length,
    expired: documents.filter((d) => d.verificationStatus === 'expired').length,
    rejected: documents.filter((d) => d.verificationStatus === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.STAFF_VIEW}
      fallback="styled"
      fallbackTitle="Staff Documents Access Required"
      fallbackDescription="You don't have the required permissions to view staff documents. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title={viewMode === 'upload' ? 'Upload Document' : 'Staff Documents'}
          description={staff ? `${staff.firstName} ${staff.lastName}` : 'Manage verification documents'}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Team' },
            { label: 'Staff', href: '/staff' },
            { label: staff ? `${staff.firstName} ${staff.lastName}` : 'Staff', href: `/staff` },
            { label: 'Documents' },
          ]}
          actions={
            viewMode === 'list' ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={loadData}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-muted hover:bg-muted border-2 border-border"
                  title="Refresh"
                >
                  <RefreshCw className={cn('w-5 h-5 text-muted-foreground', loading && 'animate-spin')} />
                </Button>
                <Button
                  onClick={() => setViewMode('upload')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Upload Document
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-xl hover:bg-muted"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to List
              </Button>
            )
          }
        />

        {error && (
          <div className="p-4 bg-error-muted border-2 border-error/30 rounded-xl text-error flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {viewMode === 'upload' ? (
          <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
            <DocumentUploader
              staffId={staffId}
              onUpload={handleUpload}
              onCancel={() => setViewMode('list')}
            />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success-muted rounded-lg">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">{stats.verified}</p>
                    <p className="text-sm text-muted-foreground">Verified</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{stats.expired}</p>
                    <p className="text-sm text-muted-foreground">Expired</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-error-muted rounded-lg">
                    <XCircle className="w-5 h-5 text-error" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-error">{stats.rejected}</p>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <Select
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...DOCUMENT_CATEGORIES.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  className="w-full sm:w-48"
                />
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'under_review', label: 'Under Review' },
                    { value: 'verified', label: 'Verified' },
                    { value: 'rejected', label: 'Rejected' },
                    { value: 'expired', label: 'Expired' },
                  ]}
                  className="w-full sm:w-48"
                />
              </div>
            </div>

            {/* Documents Grid */}
            <DocumentCardGrid
              documents={filteredDocuments}
              onView={handleView}
              onDownload={handleDownload}
              onDelete={handleDelete}
              onVerify={handleVerifyClick}
            />
          </>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          variant={modalConfig.variant}
        />

        {/* Verification Modal */}
        {verifyModalOpen && selectedDocument && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">Verify Document</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVerifyModalOpen(false)}
                    className="p-2"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-muted-foreground mt-1">{selectedDocument.documentName}</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Verification Decision
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['verified', 'rejected', 'requires_update'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setVerifyStatus(status)}
                        className={cn(
                          'px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all',
                          verifyStatus === status
                            ? status === 'verified'
                              ? 'border-success/50 bg-success-muted text-success-muted-foreground'
                              : status === 'rejected'
                              ? 'border-error/50 bg-error-muted text-error-muted-foreground'
                              : 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-border hover:border-border'
                        )}
                      >
                        {status === 'verified' && <CheckCircle className="w-4 h-4 mx-auto mb-1" />}
                        {status === 'rejected' && <XCircle className="w-4 h-4 mx-auto mb-1" />}
                        {status === 'requires_update' && <RefreshCw className="w-4 h-4 mx-auto mb-1" />}
                        {VERIFICATION_STATUS_STYLES[status].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={verifyNotes}
                    onChange={(e) => setVerifyNotes(e.target.value)}
                    placeholder="Add verification notes..."
                    rows={2}
                    className="w-full px-4 py-2.5 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                  />
                </div>

                {verifyStatus === 'rejected' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Rejection Reason <span className="text-error">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this document is being rejected..."
                      rows={2}
                      className="w-full px-4 py-2.5 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border flex items-center justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setVerifyModalOpen(false)}
                  disabled={verifying}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVerifySubmit}
                  disabled={verifying || (verifyStatus === 'rejected' && !rejectionReason)}
                  className={cn(
                    'px-6 py-2.5 rounded-xl text-white transition-all shadow-lg',
                    verifyStatus === 'verified'
                      ? 'bg-success hover:bg-success/90'
                      : verifyStatus === 'rejected'
                      ? 'bg-error hover:bg-error/90'
                      : 'bg-purple-600 hover:bg-purple-700'
                  )}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Confirm
                    </>
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
