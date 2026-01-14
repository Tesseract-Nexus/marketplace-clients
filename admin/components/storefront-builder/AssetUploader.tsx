'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { StorefrontAsset } from '@/lib/api/types';
import { storefrontAssetsApi } from '@/lib/api/storefront';
import { cn } from '@/lib/utils';

interface AssetUploaderProps {
  type: StorefrontAsset['type'];
  currentUrl?: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  description?: string;
  aspectRatio?: 'square' | '16:9' | '4:3' | 'banner';
  /** Size constraint for the upload area */
  size?: 'sm' | 'md' | 'lg' | 'full';
  maxSizeMB?: number;
  disabled?: boolean;
}

export function AssetUploader({
  type,
  currentUrl,
  onUpload,
  onRemove,
  label = 'Upload Image',
  description,
  aspectRatio = 'square',
  size = 'full',
  maxSizeMB = 5,
  disabled,
}: AssetUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatioClasses = {
    square: 'aspect-square',
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    banner: 'aspect-[3/1]',
  };

  const sizeClasses = {
    sm: 'max-w-[120px]',
    md: 'max-w-[200px]',
    lg: 'max-w-[300px]',
    full: 'w-full',
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

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload JPEG, PNG, GIF, WebP, or SVG.';
    }

    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size exceeds ${maxSizeMB}MB limit.`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setIsUploading(false);
      return;
    }

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const response = await storefrontAssetsApi.uploadAsset(file, type);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success && response.asset) {
        onUpload(response.asset.url);
      } else {
        setError('Failed to upload file. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during upload. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        uploadFile(files[0]);
      }
    },
    [disabled]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-foreground">{label}</label>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <div
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all',
          aspectRatioClasses[aspectRatio],
          sizeClasses[size],
          isDragging
            ? 'border-purple-500 bg-purple-50'
            : currentUrl
            ? 'border-border bg-muted'
            : 'border-border hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
          !currentUrl && !disabled && 'cursor-pointer'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !currentUrl && !disabled && fileInputRef.current?.click()}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        {/* Current image */}
        {currentUrl && !isUploading ? (
          <div className="absolute inset-0 p-2">
            <img
              src={currentUrl}
              alt="Uploaded asset"
              className="w-full h-full object-contain rounded-lg"
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
                  className="p-1.5 bg-card rounded-lg hover:bg-red-50 transition-colors"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              )}
            </div>
          </div>
        ) : isUploading ? (
          /* Upload progress */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin mb-2" />
            <div className="w-full max-w-[200px] h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
          </div>
        ) : (
          /* Upload prompt */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div
              className={cn(
                'p-3 rounded-full mb-3',
                isDragging ? 'bg-purple-100' : 'bg-muted'
              )}
            >
              {isDragging ? (
                <Upload className="h-6 w-6 text-purple-500" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm font-medium text-foreground">
              {isDragging ? 'Drop image here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, GIF, WebP, SVG (max {maxSizeMB}MB)
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default AssetUploader;
