'use client';

import React from 'react';
import {
  FileText,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Calendar,
  Shield,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  StaffDocument,
  DocumentVerificationStatus,
  DOCUMENT_TYPE_INFO,
  VERIFICATION_STATUS_STYLES,
} from '@/lib/api/staffDocumentTypes';

interface DocumentCardProps {
  document: StaffDocument;
  onView?: (document: StaffDocument) => void;
  onDownload?: (document: StaffDocument) => void;
  onDelete?: (document: StaffDocument) => void;
  onVerify?: (document: StaffDocument) => void;
  showStaffInfo?: boolean;
  compact?: boolean;
}

const statusIcons: Record<DocumentVerificationStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  under_review: <Search className="w-4 h-4" />,
  verified: <CheckCircle className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
  expired: <AlertTriangle className="w-4 h-4" />,
  requires_update: <RefreshCw className="w-4 h-4" />,
};

export function DocumentCard({
  document,
  onView,
  onDownload,
  onDelete,
  onVerify,
  showStaffInfo = false,
  compact = false,
}: DocumentCardProps) {
  const typeInfo = DOCUMENT_TYPE_INFO[document.documentType];
  const statusStyle = VERIFICATION_STATUS_STYLES[document.verificationStatus];

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpiringSoon = () => {
    if (!document.expiryDate) return false;
    const expiryDate = new Date(document.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = () => {
    if (!document.expiryDate) return false;
    return new Date(document.expiryDate) < new Date();
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:border-border transition-colors">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', statusStyle.bgColor)}>
            <FileText className={cn('w-4 h-4', statusStyle.color)} />
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">{document.documentName}</p>
            <p className="text-xs text-muted-foreground">{typeInfo?.displayName || document.documentType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2 py-1 text-xs font-medium rounded-full border',
              statusStyle.bgColor,
              statusStyle.color,
              statusStyle.borderColor
            )}
          >
            {statusStyle.label}
          </span>
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(document)}
              className="p-1.5"
            >
              <Eye className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className={cn('px-4 py-3 border-b', statusStyle.bgColor, statusStyle.borderColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {statusIcons[document.verificationStatus]}
            <span className={cn('text-sm font-medium', statusStyle.color)}>
              {statusStyle.label}
            </span>
          </div>
          {document.isMandatory && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              Required
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-muted rounded-lg">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{document.documentName}</h3>
            <p className="text-sm text-muted-foreground">{typeInfo?.displayName || document.documentType}</p>

            {showStaffInfo && document.staff && (
              <p className="text-sm text-primary mt-1">
                {document.staff.firstName} {document.staff.lastName}
              </p>
            )}

            <div className="mt-3 space-y-1">
              {document.documentNumber && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Document #:</span> {document.documentNumber}
                </p>
              )}
              {document.issuingAuthority && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Issued by:</span> {document.issuingAuthority}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          {document.issueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Issued: {formatDate(document.issueDate)}</span>
            </div>
          )}
          {document.expiryDate && (
            <div
              className={cn(
                'flex items-center gap-1',
                isExpired() && 'text-red-600 font-medium',
                isExpiringSoon() && 'text-orange-600 font-medium'
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                {isExpired() ? 'Expired' : 'Expires'}: {formatDate(document.expiryDate)}
              </span>
            </div>
          )}
        </div>

        {/* Verification Notes */}
        {document.verificationNotes && (
          <div className="mt-3 p-2 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Notes:</span> {document.verificationNotes}
            </p>
          </div>
        )}

        {/* Rejection Reason */}
        {document.verificationStatus === 'rejected' && document.rejectionReason && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">
              <span className="font-medium">Rejection Reason:</span> {document.rejectionReason}
            </p>
          </div>
        )}

        {/* Access Level */}
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5" />
          <span>Access: {document.accessLevel.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 bg-muted border-t border-border flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Added {formatDate(document.createdAt)}
        </div>
        <div className="flex items-center gap-1">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(document)}
              className="p-2 text-primary hover:bg-primary/10"
              title="View"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          {onDownload && document.storagePath && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(document)}
              className="p-2 text-success hover:bg-success-muted"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          {onVerify && ['pending', 'under_review'].includes(document.verificationStatus) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onVerify(document)}
              className="p-2 text-purple-600 hover:bg-purple-50"
              title="Verify"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(document)}
              className="p-2 text-red-600 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Export a grid wrapper for multiple cards
export function DocumentCardGrid({
  documents,
  onView,
  onDownload,
  onDelete,
  onVerify,
  showStaffInfo = false,
}: {
  documents: StaffDocument[];
  onView?: (document: StaffDocument) => void;
  onDownload?: (document: StaffDocument) => void;
  onDelete?: (document: StaffDocument) => void;
  onVerify?: (document: StaffDocument) => void;
  showStaffInfo?: boolean;
}) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No documents found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          onView={onView}
          onDownload={onDownload}
          onDelete={onDelete}
          onVerify={onVerify}
          showStaffInfo={showStaffInfo}
        />
      ))}
    </div>
  );
}
