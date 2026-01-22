'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Loader2,
  RefreshCw,
  User,
  Calendar,
  Filter,
  X,
  Eye,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { staffDocumentService } from '@/lib/api/staffDocuments';
import {
  StaffDocument,
  DocumentVerificationStatus,
  DOCUMENT_TYPE_INFO,
  VERIFICATION_STATUS_STYLES,
} from '@/lib/api/staffDocumentTypes';

type Tab = 'pending' | 'expiring' | 'all';

export default function DocumentVerificationPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');

  // Verification modal
  const [selectedDocument, setSelectedDocument] = useState<StaffDocument | null>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'verified' | 'rejected' | 'requires_update'>('verified');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [activeTab, currentPage, itemsPerPage]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (activeTab === 'pending') {
        response = await staffDocumentService.getPendingDocuments({
          page: currentPage,
          limit: itemsPerPage,
        });
      } else if (activeTab === 'expiring') {
        response = await staffDocumentService.getExpiringDocuments({
          page: currentPage,
          limit: itemsPerPage,
          days: 30,
        });
      } else {
        // For 'all', we'd need a different endpoint or combine results
        response = await staffDocumentService.getPendingDocuments({
          page: currentPage,
          limit: itemsPerPage,
        });
      }

      setDocuments(response.data || []);
      setTotalItems(response.pagination?.total || response.data?.length || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.staff?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.staff?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      documentTypeFilter === 'all' || doc.documentType === documentTypeFilter;
    return matchesSearch && matchesType;
  });

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
      await staffDocumentService.verify(selectedDocument.staffId, selectedDocument.id, {
        status: verifyStatus,
        notes: verifyNotes || undefined,
        rejectionReason: verifyStatus === 'rejected' ? rejectionReason : undefined,
      });
      await loadDocuments();
      setVerifyModalOpen(false);
      setSelectedDocument(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify document');
    } finally {
      setVerifying(false);
    }
  };

  const handleViewStaffDocuments = (staffId: string) => {
    router.push(`/staff/${staffId}/documents`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const days = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const documentTypeOptions = [
    { value: 'all', label: 'All Types' },
    ...Object.values(DOCUMENT_TYPE_INFO).map((info) => ({
      value: info.type,
      label: info.displayName,
    })),
  ];

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'pending',
      label: 'Pending Review',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: 'expiring',
      label: 'Expiring Soon',
      icon: <AlertTriangle className="w-4 h-4" />,
    },
  ];

  const totalPages = Math.ceil(totalItems / itemsPerPage);

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
          title="Document Verification"
          description="Review and verify staff verification documents"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Team' },
            { label: 'Staff', href: '/staff' },
            { label: 'Document Verification' },
          ]}
          actions={
            <Button
              variant="ghost"
              onClick={loadDocuments}
              disabled={loading}
              className="p-2.5 rounded-xl bg-muted hover:bg-muted border-2 border-border"
              title="Refresh"
            >
              <RefreshCw className={cn('w-5 h-5 text-muted-foreground', loading && 'animate-spin')} />
            </Button>
          }
        />

        {error && (
          <div className="p-4 bg-error-muted border-2 border-error/30 rounded-xl text-error flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
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

        {/* Tabs */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary bg-primary/10/50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-border bg-muted">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, document, or staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white"
                />
              </div>
              <Select
                value={documentTypeFilter}
                onChange={setDocumentTypeFilter}
                options={documentTypeOptions}
                className="w-full sm:w-56"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                <p className="mt-4 text-muted-foreground">Loading documents...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No documents found</p>
                <p className="text-muted-foreground mt-2">
                  {activeTab === 'pending'
                    ? 'All documents have been reviewed'
                    : 'No documents expiring soon'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="text-left p-4 font-semibold text-foreground">Document</th>
                      <th className="text-left p-4 font-semibold text-foreground">Staff Member</th>
                      <th className="text-left p-4 font-semibold text-foreground">Status</th>
                      <th className="text-left p-4 font-semibold text-foreground">
                        {activeTab === 'expiring' ? 'Expires' : 'Uploaded'}
                      </th>
                      <th className="text-right p-4 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc) => {
                      const typeInfo = DOCUMENT_TYPE_INFO[doc.documentType];
                      const statusStyle = VERIFICATION_STATUS_STYLES[doc.verificationStatus];
                      const daysUntilExpiry = getDaysUntilExpiry(doc.expiryDate);

                      return (
                        <tr
                          key={doc.id}
                          className="border-b border-border hover:bg-primary/10/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={cn('p-2 rounded-lg', statusStyle?.bgColor || 'bg-muted')}>
                                <FileText className={cn('w-5 h-5', statusStyle?.color || 'text-muted-foreground')} />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{doc.documentName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {typeInfo?.displayName || doc.documentType}
                                </p>
                                {doc.documentNumber && (
                                  <p className="text-xs text-muted-foreground">#{doc.documentNumber}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {doc.staff ? (
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-muted rounded-full">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {doc.staff.firstName} {doc.staff.lastName}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{doc.staff.email}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                                statusStyle?.bgColor,
                                statusStyle?.color,
                                statusStyle?.borderColor
                              )}
                            >
                              {statusStyle?.label || doc.verificationStatus}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {activeTab === 'expiring' ? (
                                <span
                                  className={cn(
                                    daysUntilExpiry !== null && daysUntilExpiry <= 7
                                      ? 'text-error font-medium'
                                      : daysUntilExpiry !== null && daysUntilExpiry <= 30
                                      ? 'text-warning'
                                      : 'text-muted-foreground'
                                  )}
                                >
                                  {formatDate(doc.expiryDate)}
                                  {daysUntilExpiry !== null && (
                                    <span className="ml-1">
                                      ({daysUntilExpiry <= 0 ? 'Expired' : `${daysUntilExpiry}d`})
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">{formatDate(doc.createdAt)}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewStaffDocuments(doc.staffId)}
                                className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                                title="View All Documents"
                                aria-label="View all documents"
                              >
                                <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                              </Button>
                              {['pending', 'under_review'].includes(doc.verificationStatus) && (
                                <Button
                                  onClick={() => handleVerifyClick(doc)}
                                  className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                                >
                                  Verify
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewStaffDocuments(doc.staffId)}
                                className="h-8 w-8 p-0 rounded-lg hover:bg-muted transition-colors"
                                title="View Details"
                                aria-label="View details"
                              >
                                <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {!loading && filteredDocuments.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}

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
                {selectedDocument.staff && (
                  <p className="text-sm text-primary">
                    {selectedDocument.staff.firstName} {selectedDocument.staff.lastName}
                  </p>
                )}
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
                              : 'border-primary bg-primary/10 text-primary'
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
                      : 'bg-primary hover:bg-primary'
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
