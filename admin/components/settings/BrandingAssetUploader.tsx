'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type BrandingAssetType = 'logo' | 'favicon' | 'banner';

interface BrandingAssetUploaderProps {
  /** Type of asset being uploaded */
  assetType: BrandingAssetType;
  /** Current asset URL (if exists) */
  currentUrl?: string;
  /** Callback when upload completes */
  onUpload: (url: string, path: string) => void;
  /** Callback when asset is removed */
  onRemove?: () => void;
  /** Label text */
  label?: string;
  /** Description/help text */
  description?: string;
  /** Aspect ratio for preview container */
  aspectRatio?: 'square' | '16:9' | '4:3' | 'banner' | 'auto';
  /** Whether the uploader is disabled */
  disabled?: boolean;
  /** Optional storefront ID for storefront-specific assets */
  storefrontId?: string;
  /** Custom tenant ID (uses header default if not provided) */
  tenantId?: string;
}

const ASSET_CONFIG = {
  logo: {
    maxSizeMB: 5,
    accept: 'image/jpeg,image/png,image/svg+xml,image/webp',
    acceptLabel: 'PNG, JPG, SVG, WebP',
  },
  favicon: {
    maxSizeMB: 1,
    accept: 'image/x-icon,image/png,image/svg+xml,image/vnd.microsoft.icon',
    acceptLabel: 'ICO, PNG, SVG',
  },
  banner: {
    maxSizeMB: 10,
    accept: 'image/jpeg,image/png,image/webp',
    acceptLabel: 'PNG, JPG, WebP',
  },
};

export function BrandingAssetUploader({
  assetType,
  currentUrl,
  onUpload,
  onRemove,
  label,
  description,
  aspectRatio = 'auto',
  disabled = false,
  storefrontId,
  tenantId,
}: BrandingAssetUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = ASSET_CONFIG[assetType];

  const aspectRatioClasses: Record<string, string> = {
    square: 'h-24 w-24', // Compact square for favicon/icons
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    banner: 'aspect-[3/1]',
    auto: 'h-28', // Compact height for logo
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    // Create local preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 15, 90));
      }, 150);

      // Build form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assetType', assetType);
      if (storefrontId) {
        formData.append('storefrontId', storefrontId);
      }

      // Upload to API
      const headers: Record<string, string> = {};
      if (tenantId) {
        headers['x-jwt-claim-tenant-id'] = tenantId;
      }

      const response = await fetch('/api/admin/branding/assets', {
        method: 'POST',
        headers,
        body: formData,
      });

      clearInterval(progressInterval);

      const result = await response.json();

      if (result.success && result.asset) {
        setUploadProgress(100);
        // Use the URL from the response (presigned URL for immediate display)
        onUpload(result.asset.url, result.asset.path);
        // Clear local preview since we now have the real URL
        URL.revokeObjectURL(localPreview);
        setPreviewUrl(null);
      } else {
        setError(result.message || 'Failed to upload file. Please try again.');
        setPreviewUrl(null);
        URL.revokeObjectURL(localPreview);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('An error occurred during upload. Please try again.');
      setPreviewUrl(null);
      URL.revokeObjectURL(localPreview);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const validateAndUpload = (file: File) => {
    // Check file type
    const allowedTypes = config.accept.split(',');
    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type. Allowed: ${config.acceptLabel}`);
      return;
    }

    // Check file size
    const maxSize = config.maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size exceeds ${config.maxSizeMB}MB limit.`);
      return;
    }

    uploadFile(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        validateAndUpload(files[0]);
      }
    },
    [disabled, assetType]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndUpload(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;

    try {
      // Delete from server
      const params = new URLSearchParams({ assetType });
      if (storefrontId) {
        params.append('storefrontId', storefrontId);
      }

      const headers: Record<string, string> = {};
      if (tenantId) {
        headers['x-jwt-claim-tenant-id'] = tenantId;
      }

      await fetch(`/api/admin/branding/assets?${params.toString()}`, {
        method: 'DELETE',
        headers,
      });

      onRemove();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to remove asset.');
    }
  };

  const displayUrl = previewUrl || currentUrl;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-foreground">{label}</label>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <div
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all overflow-hidden',
          aspectRatioClasses[aspectRatio],
          isDragging
            ? 'border-primary bg-primary/10'
            : displayUrl
            ? 'border-border bg-muted'
            : 'border-border hover:border-border',
          disabled && 'opacity-50 cursor-not-allowed',
          !displayUrl && !disabled && 'cursor-pointer'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !displayUrl && !disabled && fileInputRef.current?.click()}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={config.accept}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        {/* Current/preview image */}
        {displayUrl && !isUploading ? (
          <div className="absolute inset-0 p-2 flex items-center justify-center">
            <img
              src={displayUrl}
              alt={`${assetType} preview`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={() => {
                // If image fails to load, show placeholder
                setPreviewUrl(null);
              }}
            />
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={disabled}
                className="px-3 py-1.5 bg-card rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                Replace
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  disabled={disabled}
                  className="p-1.5 bg-card rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  <X className="h-4 w-4 text-destructive" />
                </button>
              )}
            </div>
          </div>
        ) : isUploading ? (
          /* Upload progress */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white/80">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <div className="w-full max-w-[200px] h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
          </div>
        ) : (
          /* Upload prompt */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
            <div
              className={cn(
                'p-2 rounded-full mb-1',
                isDragging ? 'bg-primary/20' : 'bg-muted'
              )}
            >
              {isDragging ? (
                <Upload className="h-4 w-4 text-primary" />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <p className="text-xs font-medium text-foreground text-center">
              {isDragging ? 'Drop here' : 'Click to upload'}
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default BrandingAssetUploader;
