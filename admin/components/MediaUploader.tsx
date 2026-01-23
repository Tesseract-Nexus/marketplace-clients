'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Film, Loader2, Plus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MediaLimits, DefaultMediaURLs } from '@/lib/api/types';

export type MediaType = 'image' | 'video' | 'logo' | 'banner' | 'icon' | 'gallery';
export type EntityType = 'product' | 'category' | 'warehouse';

export interface MediaItem {
  id: string;
  url: string;
  file?: File;
  altText?: string;
  position: number;
  width?: number;
  height?: number;
  title?: string;
  thumbnailUrl?: string;
  isUploading?: boolean;
  isNew?: boolean;
}

interface MediaUploaderProps {
  type: MediaType;
  entityType: EntityType;
  entityId?: string;
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  maxItems?: number;
  maxSizeBytes?: number;
  acceptedTypes?: string[];
  aspectRatio?: string;
  placeholder?: string;
  defaultUrl?: string;
  className?: string;
  disabled?: boolean;
  onUpload?: (file: File) => Promise<{ url: string; id: string }>;
  label?: string;
  description?: string;
}

const defaultAcceptedTypes: Record<MediaType, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  logo: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
  banner: ['image/jpeg', 'image/png', 'image/webp'],
  icon: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  gallery: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

const defaultMaxSize: Record<MediaType, number> = {
  image: MediaLimits.maxImageSizeBytes,
  logo: MediaLimits.maxLogoSizeBytes,
  banner: MediaLimits.maxBannerSizeBytes,
  icon: MediaLimits.maxLogoSizeBytes,
  video: MediaLimits.maxVideoSizeBytes,
  gallery: MediaLimits.maxImageSizeBytes,
};

const defaultMaxItems: Record<MediaType, number> = {
  image: MediaLimits.maxGalleryImages,
  logo: 1,
  banner: 1,
  icon: 1,
  video: MediaLimits.maxVideos,
  gallery: MediaLimits.maxCategoryImages,
};

const aspectRatios: Record<MediaType, string> = {
  image: '1/1',
  logo: '1/1',
  banner: '4/1',
  icon: '1/1',
  video: '16/9',
  gallery: '1/1',
};

// Default upload function that calls the API
async function defaultUploadToServer(
  file: File,
  entityType: EntityType,
  mediaType: MediaType,
  entityId?: string,
  position: number = 0
): Promise<{ url: string; id: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('entityType', entityType);
  formData.append('mediaType', mediaType);
  if (entityId) {
    formData.append('entityId', entityId);
  }
  formData.append('position', position.toString());

  const response = await fetch('/api/media/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Upload failed');
  }

  const result = await response.json();
  if (!result.success || !result.media) {
    throw new Error(result.message || 'Upload failed');
  }

  return {
    url: result.media.url,
    id: result.media.id,
  };
}

export function MediaUploader({
  type,
  entityType,
  entityId,
  value = [],
  onChange,
  maxItems = defaultMaxItems[type],
  maxSizeBytes = defaultMaxSize[type],
  acceptedTypes = defaultAcceptedTypes[type],
  aspectRatio = aspectRatios[type],
  placeholder,
  defaultUrl,
  className,
  disabled = false,
  onUpload,
  label,
  description,
}: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSingle = maxItems === 1;
  const isVideo = type === 'video';

  // Use provided onUpload or default to server upload
  const uploadFile = onUpload || ((file: File) => defaultUploadToServer(file, entityType, type, entityId, value.length));

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }
    return `${(bytes / 1024).toFixed(0)}KB`;
  };

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Accepted: ${acceptedTypes.map(t => t.split('/')[1]).join(', ')}`;
    }
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum size: ${formatFileSize(maxSizeBytes)}`;
    }
    return null;
  };

  const processFile = useCallback(async (file: File): Promise<MediaItem | null> => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return null;
    }

    setUploadError(null);
    const id = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const localUrl = URL.createObjectURL(file);

    const item: MediaItem = {
      id,
      url: localUrl,
      file,
      position: value.length,
      isNew: true,
      isUploading: true,
    };

    // Get image dimensions if it's an image
    if (!isVideo) {
      try {
        const dimensions = await getImageDimensions(file);
        item.width = dimensions.width;
        item.height = dimensions.height;
      } catch {
        // Ignore dimension errors
      }
    }

    // Always upload to server
    try {
      const result = await uploadFile(file);
      item.url = result.url;
      item.id = result.id;
      item.isUploading = false;
      item.file = undefined; // Clear file reference after successful upload
      URL.revokeObjectURL(localUrl);
    } catch (err) {
      console.error('Upload failed:', err);
      item.isUploading = false;
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      URL.revokeObjectURL(localUrl);
      return null; // Don't add failed uploads to the list
    }

    return item;
  }, [value.length, uploadFile, isVideo, acceptedTypes, maxSizeBytes]);

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxItems - value.length;

    if (remainingSlots <= 0) {
      alert(`Maximum ${maxItems} ${type}(s) allowed`);
      return;
    }

    const filesToProcess = fileArray.slice(0, remainingSlots);
    const newItems: MediaItem[] = [];

    for (const file of filesToProcess) {
      const item = await processFile(file);
      if (item) {
        newItems.push(item);
      }
    }

    if (isSingle && newItems.length > 0) {
      onChange(newItems);
    } else {
      onChange([...value, ...newItems]);
    }

    // Reset file input to allow re-uploading same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [value, maxItems, type, isSingle, onChange, processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemove = useCallback((id: string) => {
    const item = value.find(v => v.id === id);
    if (item?.file) {
      URL.revokeObjectURL(item.url);
    }
    onChange(value.filter(v => v.id !== id).map((v, i) => ({ ...v, position: i })));
  }, [value, onChange]);

  const handleReorder = useCallback((dragId: string, dropId: string) => {
    const dragIndex = value.findIndex(v => v.id === dragId);
    const dropIndex = value.findIndex(v => v.id === dropId);

    if (dragIndex === -1 || dropIndex === -1) return;

    const newItems = [...value];
    const [draggedItem] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);

    onChange(newItems.map((v, i) => ({ ...v, position: i })));
    setDraggedItem(null);
  }, [value, onChange]);

  const renderUploadArea = () => {
    if (isSingle && value.length > 0) return null;
    if (!isSingle && value.length >= maxItems) return null;

    // Compact mode for category uploaders in forms
    const isCompactMode = className?.includes('w-full');

    if (isCompactMode) {
      return (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative border border-dashed rounded-lg cursor-pointer transition-all duration-200 py-2 px-3',
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/60 hover:bg-muted',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {placeholder || 'Click to upload'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Max {formatFileSize(maxSizeBytes)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/60 hover:bg-muted',
          disabled && 'opacity-50 cursor-not-allowed',
          isSingle ? 'aspect-square' : 'aspect-[4/3]',
          className
        )}
        style={{ aspectRatio }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          {isVideo ? (
            <Film className="w-10 h-10 text-muted-foreground mb-2" />
          ) : (
            <Upload className="w-10 h-10 text-muted-foreground mb-2" />
          )}
          <p className="text-sm font-medium text-foreground">
            {placeholder || `Drop ${type} here or click to upload`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Max {formatFileSize(maxSizeBytes)} • {acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}
          </p>
          {!isSingle && (
            <p className="text-xs text-muted-foreground mt-1">
              {value.length} / {maxItems} uploaded
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderMediaItem = (item: MediaItem, index: number) => {
    const isFirst = index === 0 && !isSingle;

    return (
      <div
        key={item.id}
        className={cn(
          'relative group rounded-xl overflow-hidden bg-muted border-2',
          isFirst ? 'border-primary' : 'border-transparent',
          draggedItem === item.id && 'opacity-50',
        )}
        style={{ aspectRatio }}
        draggable={!isSingle && !disabled}
        onDragStart={() => setDraggedItem(item.id)}
        onDragEnd={() => setDraggedItem(null)}
        onDragOver={(e) => {
          e.preventDefault();
          if (draggedItem && draggedItem !== item.id) {
            handleReorder(draggedItem, item.id);
          }
        }}
      >
        {/* Media Preview */}
        {isVideo ? (
          <video
            src={item.url}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
        ) : (
          <img
            src={item.url}
            alt={item.altText || `${type} ${index + 1}`}
            className="w-full h-full object-cover"
          />
        )}

        {/* Loading Overlay */}
        {item.isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Primary Badge */}
        {isFirst && !isSingle && (
          <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
            Primary
          </div>
        )}

        {/* Actions Overlay */}
        {!disabled && !item.isUploading && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            {!isSingle && (
              <div className="absolute top-2 left-2 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-5 h-5 text-white drop-shadow-md" />
              </div>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleRemove(item.id)}
              className="rounded-full h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      {(label || description) && (
        <div>
          {label && (
            <label className="block text-sm font-medium text-foreground mb-1">
              {label}
              {maxItems > 1 && (
                <span className="text-muted-foreground font-normal ml-1">
                  ({value.length}/{maxItems})
                </span>
              )}
            </label>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
          {uploadError}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        multiple={!isSingle}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Media Grid */}
      {isSingle ? (
        // Single item layout
        <div className="relative">
          {value.length > 0 ? (
            renderMediaItem(value[0], 0)
          ) : (
            <>
              {renderUploadArea()}
              {/* Default Image Preview */}
              {defaultUrl && value.length === 0 && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Default:</p>
                  <img
                    src={defaultUrl}
                    alt="Default"
                    className="w-16 h-16 object-cover rounded-lg mx-auto opacity-50"
                  />
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Multi-item grid layout
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((item, index) => renderMediaItem(item, index))}
          {renderUploadArea()}
        </div>
      )}
    </div>
  );
}

// Convenience exports for common use cases
export function ProductGalleryUploader(props: Omit<MediaUploaderProps, 'type' | 'entityType'>) {
  return (
    <MediaUploader
      type="image"
      entityType="product"
      label="Product Gallery"
      description="Add up to 12 product images. First image is the primary."
      defaultUrl={DefaultMediaURLs.productImage}
      maxItems={12}
      {...props}
    />
  );
}

export function ProductLogoUploader(props: Omit<MediaUploaderProps, 'type' | 'entityType' | 'maxItems'>) {
  return (
    <MediaUploader
      type="logo"
      entityType="product"
      maxItems={1}
      label="Product Logo"
      description="Square logo for product cards (512x512 recommended)"
      defaultUrl={DefaultMediaURLs.productLogo}
      {...props}
    />
  );
}

export function ProductBannerUploader(props: Omit<MediaUploaderProps, 'type' | 'entityType' | 'maxItems'>) {
  return (
    <MediaUploader
      type="banner"
      entityType="product"
      maxItems={1}
      label="Product Banner"
      description="Wide banner for product pages (1920x480 recommended)"
      defaultUrl={DefaultMediaURLs.productBanner}
      {...props}
    />
  );
}

export function ProductVideoUploader(props: Omit<MediaUploaderProps, 'type' | 'entityType'>) {
  return (
    <MediaUploader
      type="video"
      entityType="product"
      label="Promotional Videos"
      description="Add up to 2 promotional videos (MP4, WebM)"
      maxItems={2}
      {...props}
    />
  );
}

export function CategoryIconUploader(props: Omit<MediaUploaderProps, 'type' | 'entityType' | 'maxItems'>) {
  // Remove label and description if className includes w-full (compact mode)
  const isCompact = props.className?.includes('w-full');
  return (
    <MediaUploader
      type="icon"
      entityType="category"
      maxItems={1}
      label={isCompact ? undefined : "Category Icon"}
      description={isCompact ? undefined : "Square icon for category navigation"}
      defaultUrl={DefaultMediaURLs.categoryIcon}
      {...props}
    />
  );
}

export function CategoryBannerUploader(props: Omit<MediaUploaderProps, 'type' | 'entityType' | 'maxItems'>) {
  // Remove label and description if className includes w-full (compact mode)
  const isCompact = props.className?.includes('w-full');
  return (
    <MediaUploader
      type="banner"
      entityType="category"
      maxItems={1}
      label={isCompact ? undefined : "Category Banner"}
      description={isCompact ? undefined : "Wide banner for category pages"}
      defaultUrl={DefaultMediaURLs.categoryBanner}
      {...props}
    />
  );
}

export function CategoryGalleryUploader(props: Omit<MediaUploaderProps, 'type' | 'entityType'>) {
  return (
    <MediaUploader
      type="gallery"
      entityType="category"
      label="Category Gallery"
      description="Add up to 3 category images"
      defaultUrl={DefaultMediaURLs.categoryIcon}
      maxItems={3}
      {...props}
    />
  );
}

export function WarehouseLogoUploader(props: Omit<MediaUploaderProps, 'type' | 'entityType' | 'maxItems'> & { compact?: boolean }) {
  const { compact, className, ...rest } = props;

  if (compact) {
    return (
      <MediaUploader
        type="logo"
        entityType="warehouse"
        maxItems={1}
        placeholder="Upload logo"
        defaultUrl={DefaultMediaURLs.warehouseLogo}
        className={cn('w-full', className)}
        {...rest}
      />
    );
  }

  return (
    <MediaUploader
      type="logo"
      entityType="warehouse"
      maxItems={1}
      label="Warehouse Logo"
      description="Logo for warehouse identification"
      defaultUrl={DefaultMediaURLs.warehouseLogo}
      className={className}
      {...rest}
    />
  );
}

export default MediaUploader;
