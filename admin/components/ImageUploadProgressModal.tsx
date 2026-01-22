'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, Loader2, Image as ImageIcon, Upload, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface UploadingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  previewUrl?: string;
}

interface ImageUploadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: UploadingFile[];
  onComplete?: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const StatusIcon = ({ status }: { status: UploadStatus }) => {
  switch (status) {
    case 'pending':
      return <div className="w-5 h-5 rounded-full border-2 border-border" />;
    case 'uploading':
      return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    case 'success':
      return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-destructive" />;
  }
};

export function ImageUploadProgressModal({
  isOpen,
  onClose,
  files,
  onComplete,
}: ImageUploadProgressModalProps) {
  const [showComplete, setShowComplete] = useState(false);

  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const totalCount = files.length;
  const isAllDone = successCount + errorCount === totalCount && totalCount > 0;
  const isAllSuccess = successCount === totalCount && totalCount > 0;

  // Show completion state when all uploads are done
  useEffect(() => {
    if (isAllDone) {
      const timer = setTimeout(() => {
        setShowComplete(true);
        if (isAllSuccess && onComplete) {
          onComplete();
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowComplete(false);
    }
  }, [isAllDone, isAllSuccess, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={isAllDone ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-border bg-muted">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl shadow-lg">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {showComplete ? 'Upload Complete' : 'Uploading Images'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {showComplete
                  ? `${successCount} of ${totalCount} images uploaded successfully`
                  : `${successCount} of ${totalCount} completed`
                }
              </p>
            </div>
          </div>
          {isAllDone && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-muted border-b border-border">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground font-medium">Overall Progress</span>
            <span className="text-foreground font-semibold">
              {totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                isAllSuccess
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                  : errorCount > 0
                    ? "bg-gradient-to-r from-amber-400 to-amber-500"
                    : "bg-gradient-to-r from-blue-400 to-violet-500"
              )}
              style={{ width: `${totalCount > 0 ? (successCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* File List */}
        <div className="max-h-80 overflow-y-auto">
          <div className="px-6 py-4 space-y-3">
            {files.map((file, index) => (
              <div
                key={file.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                  file.status === 'success' && "bg-emerald-50 border-emerald-200",
                  file.status === 'error' && "bg-destructive/10 border-destructive/30",
                  file.status === 'uploading' && "bg-primary/10 border-primary/30",
                  file.status === 'pending' && "bg-muted border-border"
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Preview or Icon */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {file.previewUrl ? (
                    <img
                      src={file.previewUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  {file.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    file.status === 'success' && "text-emerald-700",
                    file.status === 'error' && "text-destructive",
                    file.status === 'uploading' && "text-primary",
                    file.status === 'pending' && "text-foreground"
                  )}>
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                    {file.error && (
                      <span className="text-destructive ml-2">{file.error}</span>
                    )}
                  </p>
                </div>

                {/* Status Icon */}
                <StatusIcon status={file.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {showComplete && (
          <div className="px-6 py-4 border-t border-border bg-gradient-to-r from-gray-50 to-white">
            {isAllSuccess ? (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    All images uploaded successfully!
                  </p>
                  <p className="text-xs text-emerald-600">
                    {totalCount} image{totalCount !== 1 ? 's' : ''} ready for your product
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-warning-muted rounded-xl border border-warning/30">
                <div className="p-2 bg-warning rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-warning-foreground">
                    Upload completed with {errorCount} error{errorCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-warning">
                    {successCount} of {totalCount} images uploaded successfully
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className={cn(
                "w-full mt-3 py-2.5 px-4 rounded-xl font-medium text-white transition-all duration-200",
                "bg-gradient-to-r shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
                isAllSuccess
                  ? "from-emerald-500 to-teal-500 shadow-emerald-500/25"
                  : "from-amber-500 to-orange-500 shadow-amber-500/25"
              )}
            >
              {isAllSuccess ? 'Done' : 'Close'}
            </button>
          </div>
        )}

        {/* Uploading indicator */}
        {!isAllDone && (
          <div className="px-6 py-4 border-t border-border">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Please wait while images are being uploaded...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageUploadProgressModal;
