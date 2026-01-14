'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  Trash2,
} from 'lucide-react';
import { config } from '../lib/config/app';
import { documentsApi, type DocumentCategory } from '../lib/api/documents';

export interface UploadedDocument {
  id: string;
  file: File;
  preview?: string;
  remotePath?: string;  // GCS path for the uploaded file
  remoteUrl?: string;   // Signed URL for accessing the file
  status: 'uploading' | 'success' | 'error';
  progress: number;
  errorMessage?: string;
}

interface DocumentUploadProps {
  id: string;
  label: string;
  description?: string;
  hint?: string;
  accept?: string[];
  maxSizeMB?: number;
  required?: boolean;
  disabled?: boolean;
  value?: UploadedDocument | null;
  onChange: (document: UploadedDocument | null) => void;
  // Session and category for GCS upload
  sessionId?: string;
  tenantId?: string;
  category?: DocumentCategory;
  documentType?: string;  // e.g., 'utility_bill', 'abn'
  // Legacy callback - overrides built-in upload if provided
  onUpload?: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>;
  className?: string;
}

export function DocumentUpload({
  id,
  label,
  description,
  hint,
  accept = ['image/jpeg', 'image/png', 'application/pdf'],
  maxSizeMB = config.documents.maxFileSizeMB,
  required = false,
  disabled = false,
  value,
  onChange,
  sessionId,
  tenantId,
  category = 'general',
  documentType,
  onUpload,
  className = '',
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptString = accept.join(',');
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-8 h-8" />;
    return <FileText className="w-8 h-8" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (file: File): string | null => {
    if (!accept.includes(file.type)) {
      return `Invalid file type. Allowed: ${accept.map(t => t.split('/')[1]?.toUpperCase() || t).join(', ')}`;
    }
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }
    return null;
  };

  const handleFile = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      onChange({
        id: crypto.randomUUID(),
        file,
        status: 'error',
        progress: 0,
        errorMessage: error,
      });
      return;
    }

    // Create preview for images
    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    const documentId = crypto.randomUUID();
    const document: UploadedDocument = {
      id: documentId,
      file,
      preview,
      status: 'uploading',
      progress: 0,
    };

    onChange(document);
    setIsUploading(true);

    // Use legacy callback if provided (for backward compatibility)
    if (onUpload) {
      try {
        const result = await onUpload(file);
        onChange({
          ...document,
          status: result.success ? 'success' : 'error',
          progress: 100,
          errorMessage: result.error,
        });
      } catch (err) {
        onChange({
          ...document,
          status: 'error',
          progress: 0,
          errorMessage: 'Upload failed. Please try again.',
        });
      }
      setIsUploading(false);
      return;
    }

    // Use built-in document upload API if sessionId or tenantId is provided
    if (sessionId || tenantId) {
      try {
        const result = await documentsApi.upload({
          file,
          sessionId,
          tenantId,
          category,
          documentType,
          onProgress: (progress) => {
            onChange({
              ...document,
              progress,
            });
          },
        });

        if (result.success) {
          onChange({
            ...document,
            id: result.id || documentId,
            status: 'success',
            progress: 100,
            remotePath: result.path,
            remoteUrl: result.url,
          });
        } else {
          onChange({
            ...document,
            status: 'error',
            progress: 0,
            errorMessage: result.error || 'Upload failed. Please try again.',
          });
        }
      } catch (err) {
        onChange({
          ...document,
          status: 'error',
          progress: 0,
          errorMessage: err instanceof Error ? err.message : 'Upload failed. Please try again.',
        });
      }
      setIsUploading(false);
      return;
    }

    // Fallback: Simulate upload for demo/preview (no actual upload)
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        clearInterval(interval);
        onChange({
          ...document,
          status: 'success',
          progress: 100,
        });
        setIsUploading(false);
      } else {
        onChange({
          ...document,
          progress,
        });
      }
    }, 200);
  }, [accept, maxSizeBytes, onChange, onUpload, sessionId, tenantId, category, documentType]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [disabled, handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    if (value?.preview) {
      URL.revokeObjectURL(value.preview);
    }
    onChange(null);
  }, [value, onChange]);

  const openFileDialog = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  // Render uploaded file
  if (value && value.status !== 'error') {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        <div className={`
          relative rounded-xl border-2 overflow-hidden
          ${value.status === 'success'
            ? 'border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10'
            : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5'
          }
        `}>
          <div className="flex items-center gap-4 p-4">
            {/* Preview */}
            <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
              {value.preview ? (
                <img
                  src={value.preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 dark:text-white/40">
                  {getFileIcon(value.file.type)}
                </div>
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {value.file.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(value.file.size)}
              </p>

              {/* Progress bar */}
              {value.status === 'uploading' && (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${value.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success indicator */}
              {value.status === 'success' && (
                <div className="mt-1 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Uploaded successfully</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {value.preview && (
                <button
                  type="button"
                  onClick={() => window.open(value.preview, '_blank')}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
                  title="Preview"
                >
                  <Eye className="w-5 h-5" />
                </button>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {hint && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
        )}
      </div>
    );
  }

  // Render upload area
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {!required && <span className="text-gray-400 dark:text-gray-500 ml-2 text-xs font-normal">(Optional)</span>}
      </label>

      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}

      <div
        onClick={openFileDialog}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative rounded-xl border-2 border-dashed p-6 cursor-pointer
          transition-all duration-200 text-center
          ${disabled
            ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'
            : isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 scale-[1.02]'
              : value?.status === 'error'
                ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10 hover:border-red-400'
                : 'border-gray-300 dark:border-white/20 hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-white/5'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          id={id}
          accept={acceptString}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="space-y-3">
          {/* Icon */}
          <div className={`
            w-14 h-14 mx-auto rounded-full flex items-center justify-center
            ${isDragging
              ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-500'
              : value?.status === 'error'
                ? 'bg-red-100 dark:bg-red-500/20 text-red-500'
                : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/40'
            }
          `}>
            {isUploading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : value?.status === 'error' ? (
              <AlertCircle className="w-7 h-7" />
            ) : (
              <Upload className="w-7 h-7" />
            )}
          </div>

          {/* Text */}
          <div>
            {value?.status === 'error' ? (
              <>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {value.errorMessage}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Click to try again
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {isDragging ? 'Drop your file here' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {accept.map(t => t.split('/')[1]?.toUpperCase() || t).join(', ')} up to {maxSizeMB}MB
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {hint && !value?.errorMessage && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
}

export default DocumentUpload;
