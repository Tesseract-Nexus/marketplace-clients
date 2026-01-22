'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  Building2,
  Hash,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/Select';
import {
  StaffDocumentType,
  DocumentAccessLevel,
  DOCUMENT_TYPE_INFO,
  DOCUMENT_CATEGORIES,
  CreateStaffDocumentRequest,
} from '@/lib/api/staffDocumentTypes';

interface DocumentUploaderProps {
  staffId: string;
  onUpload: (data: CreateStaffDocumentRequest, file: File) => Promise<void>;
  onCancel?: () => void;
  allowedTypes?: StaffDocumentType[];
  maxFileSizeMB?: number;
}

const accessLevelOptions = [
  { value: 'self_only', label: 'Self Only' },
  { value: 'manager', label: 'Manager' },
  { value: 'hr_only', label: 'HR Only' },
  { value: 'public', label: 'Public' },
];

export function DocumentUploader({
  staffId,
  onUpload,
  onCancel,
  allowedTypes,
  maxFileSizeMB = 10,
}: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    documentType: '' as StaffDocumentType,
    documentName: '',
    documentNumber: '',
    issuingAuthority: '',
    issueDate: '',
    expiryDate: '',
    accessLevel: 'hr_only' as DocumentAccessLevel,
    isMandatory: false,
  });

  const documentTypes = allowedTypes
    ? Object.values(DOCUMENT_TYPE_INFO).filter((info) => allowedTypes.includes(info.type))
    : Object.values(DOCUMENT_TYPE_INFO);

  const documentTypeOptions = documentTypes.map((info) => ({
    value: info.type,
    label: info.displayName,
  }));

  const selectedTypeInfo = formData.documentType
    ? DOCUMENT_TYPE_INFO[formData.documentType]
    : null;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    const maxSize = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size exceeds ${maxFileSizeMB}MB limit`;
    }

    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      return 'Invalid file type. Allowed: PDF, JPEG, PNG, GIF, DOC, DOCX';
    }

    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validationError = validateFile(droppedFile);
      if (validationError) {
        setError(validationError);
        return;
      }
      setFile(droppedFile);
      if (!formData.documentName) {
        setFormData((prev) => ({
          ...prev,
          documentName: droppedFile.name.replace(/\.[^/.]+$/, ''),
        }));
      }
    }
  }, [formData.documentName, maxFileSizeMB]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        return;
      }
      setFile(selectedFile);
      if (!formData.documentName) {
        setFormData((prev) => ({
          ...prev,
          documentName: selectedFile.name.replace(/\.[^/.]+$/, ''),
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!formData.documentType) {
      setError('Please select a document type');
      return;
    }

    if (!formData.documentName.trim()) {
      setError('Please enter a document name');
      return;
    }

    try {
      setUploading(true);

      // In a real implementation, you would upload the file to storage first
      // and get back a storagePath. For now, we'll use a placeholder.
      const storagePath = `documents/${staffId}/${formData.documentType}/${Date.now()}_${file.name}`;

      const request: CreateStaffDocumentRequest = {
        documentType: formData.documentType,
        documentName: formData.documentName,
        storagePath,
        fileMimeType: file.type,
        fileSizeBytes: file.size,
        documentNumber: formData.documentNumber || undefined,
        issuingAuthority: formData.issuingAuthority || undefined,
        issueDate: formData.issueDate || undefined,
        expiryDate: formData.expiryDate || undefined,
        accessLevel: formData.accessLevel,
        isMandatory: formData.isMandatory,
      };

      await onUpload(request, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* File Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-colors',
          dragActive
            ? 'border-primary bg-primary/10'
            : file
            ? 'border-success/40 bg-success-muted'
            : 'border-border hover:border-border bg-muted'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {file ? (
          <div className="flex items-center justify-center gap-4">
            <div className="p-3 bg-success-muted rounded-lg">
              <FileText className="w-8 h-8 text-success" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <div>
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">
              {dragActive ? 'Drop file here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF, JPEG, PNG, DOC, DOCX (max {maxFileSizeMB}MB)
            </p>
          </div>
        )}
      </div>

      {/* Document Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Document Type */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Document Type <span className="text-destructive">*</span>
          </label>
          <Select
            value={formData.documentType}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, documentType: value as StaffDocumentType }))
            }
            options={documentTypeOptions}
            className="w-full"
          />
          {selectedTypeInfo && (
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3" />
              {selectedTypeInfo.description}
            </p>
          )}
        </div>

        {/* Document Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Document Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={formData.documentName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, documentName: e.target.value }))
            }
            placeholder="e.g., Passport - John Smith"
            className="w-full px-4 py-2.5 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
        </div>

        {/* Document Number */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <Hash className="w-4 h-4 inline mr-1" />
            Document Number
          </label>
          <input
            type="text"
            value={formData.documentNumber}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, documentNumber: e.target.value }))
            }
            placeholder="e.g., ABC123456"
            className="w-full px-4 py-2.5 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
        </div>

        {/* Issuing Authority */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <Building2 className="w-4 h-4 inline mr-1" />
            Issuing Authority
          </label>
          <input
            type="text"
            value={formData.issuingAuthority}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, issuingAuthority: e.target.value }))
            }
            placeholder="e.g., Department of State"
            className="w-full px-4 py-2.5 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
        </div>

        {/* Issue Date */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Issue Date
          </label>
          <input
            type="date"
            value={formData.issueDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, issueDate: e.target.value }))
            }
            className="w-full px-4 py-2.5 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
        </div>

        {/* Expiry Date */}
        {selectedTypeInfo?.hasExpiry && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Expiry Date
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))
              }
              className="w-full px-4 py-2.5 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
          </div>
        )}

        {/* Access Level */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Access Level
          </label>
          <Select
            value={formData.accessLevel}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, accessLevel: value as DocumentAccessLevel }))
            }
            options={accessLevelOptions}
            className="w-full"
          />
        </div>
      </div>

      {/* Mandatory Checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isMandatory"
          checked={formData.isMandatory}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, isMandatory: e.target.checked }))
          }
          className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
        />
        <label htmlFor="isMandatory" className="text-sm text-foreground">
          Mark as mandatory document
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={uploading}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={uploading || !file || !formData.documentType || !formData.documentName}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Upload Document
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
