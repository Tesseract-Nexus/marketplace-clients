'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  uploading?: boolean;
  error?: string;
  uploaded?: boolean;
  url?: string;
}

interface ReviewImageUploadProps {
  maxImages?: number;
  maxSizeMB?: number;
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_DEFAULT = 5; // 5MB

export function ReviewImageUpload({
  maxImages = 5,
  maxSizeMB = MAX_SIZE_DEFAULT,
  images,
  onImagesChange,
  disabled = false,
}: ReviewImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, and WebP images are allowed';
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Image must be smaller than ${maxSizeMB}MB`;
    }
    return null;
  }, [maxSizeMB]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    const remainingSlots = maxImages - images.length;

    if (remainingSlots <= 0) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const newImages: UploadedImage[] = [];
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      if (!file) continue;

      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        continue;
      }

      const preview = URL.createObjectURL(file);
      newImages.push({
        id: `${Date.now()}-${i}`,
        file,
        preview,
        uploading: false,
        uploaded: false,
      });
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }
  }, [images, maxImages, validateFile, onImagesChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [disabled, handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const removeImage = useCallback((id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove?.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    onImagesChange(images.filter(img => img.id !== id));
  }, [images, onImagesChange]);

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const canAddMore = images.length < maxImages && !disabled;

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        multiple
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer',
          dragActive && 'border-tenant-primary bg-tenant-primary/5',
          !canAddMore && 'opacity-50 cursor-not-allowed',
          canAddMore && 'hover:border-tenant-primary hover:bg-muted/50'
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
            dragActive ? 'bg-tenant-primary/20' : 'bg-muted'
          )}>
            <ImagePlus className={cn(
              'h-5 w-5 transition-colors',
              dragActive ? 'text-tenant-primary' : 'text-muted-foreground'
            )} />
          </div>
          <div>
            <p className="text-sm font-medium">
              {dragActive ? 'Drop images here' : 'Add photos'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {images.length}/{maxImages} images (max {maxSizeMB}MB each)
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2 text-sm text-red-600"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </motion.div>
      )}

      {/* Image Previews */}
      <AnimatePresence mode="popLayout">
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-5 gap-2"
          >
            {images.map((image) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square group"
              >
                <img
                  src={image.preview}
                  alt="Review image preview"
                  className={cn(
                    'w-full h-full object-cover rounded-lg',
                    image.uploading && 'opacity-50',
                    image.error && 'ring-2 ring-red-500'
                  )}
                />

                {/* Loading Overlay */}
                {image.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </div>
                )}

                {/* Success Overlay */}
                {image.uploaded && !image.uploading && (
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Error Badge */}
                {image.error && (
                  <div className="absolute bottom-1 right-1" title={image.error}>
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}

                {/* Remove Button */}
                {!disabled && !image.uploading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(image.id);
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type { UploadedImage };
