'use client';

import * as React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ImageLightboxProps {
  images: { url: string; alt?: string }[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  enablePinchToZoom?: boolean;
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  enablePinchToZoom = true,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastPosition = useRef({ x: 0, y: 0 });

  // Reset state when opening or changing images
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetZoom();
    }
  }, [isOpen, initialIndex]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    resetZoom();
  }, [images.length, resetZoom]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    resetZoom();
  }, [images.length, resetZoom]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case '0':
          resetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext, zoomIn, zoomOut, resetZoom]);

  // Handle mouse drag for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale > 1) {
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        lastPosition.current = position;
      }
    },
    [scale, position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && scale > 1) {
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;
        setPosition({
          x: lastPosition.current.x + deltaX,
          y: lastPosition.current.y + deltaY,
        });
      }
    },
    [isDragging, scale]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle touch gestures for mobile
  const touchStart = useRef<{ x: number; y: number; distance?: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - pan
        touchStart.current = {
          x: e.touches[0]?.clientX ?? 0,
          y: e.touches[0]?.clientY ?? 0,
        };
        lastPosition.current = position;
      } else if (e.touches.length === 2) {
        // Pinch zoom
        const distance = Math.hypot(
          (e.touches[0]?.clientX ?? 0) - (e.touches[1]?.clientX ?? 0),
          (e.touches[0]?.clientY ?? 0) - (e.touches[1]?.clientY ?? 0)
        );
        touchStart.current = {
          x: ((e.touches[0]?.clientX ?? 0) + (e.touches[1]?.clientX ?? 0)) / 2,
          y: ((e.touches[0]?.clientY ?? 0) + (e.touches[1]?.clientY ?? 0)) / 2,
          distance,
        };
      }
    },
    [position]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;

      if (e.touches.length === 1 && scale > 1) {
        // Pan
        const deltaX = (e.touches[0]?.clientX ?? 0) - touchStart.current.x;
        const deltaY = (e.touches[0]?.clientY ?? 0) - touchStart.current.y;
        setPosition({
          x: lastPosition.current.x + deltaX,
          y: lastPosition.current.y + deltaY,
        });
      } else if (e.touches.length === 2 && touchStart.current.distance && enablePinchToZoom) {
        // Pinch zoom - only if enabled
        const newDistance = Math.hypot(
          (e.touches[0]?.clientX ?? 0) - (e.touches[1]?.clientX ?? 0),
          (e.touches[0]?.clientY ?? 0) - (e.touches[1]?.clientY ?? 0)
        );
        const scaleChange = newDistance / touchStart.current.distance;
        const newScale = Math.min(Math.max(scale * scaleChange, 1), 4);
        setScale(newScale);
        touchStart.current.distance = newDistance;

        if (newScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
      }
    },
    [scale]
  );

  const handleTouchEnd = useCallback(() => {
    touchStart.current = null;
  }, []);

  // Handle double-tap to zoom
  const lastTap = useRef<number>(0);
  const handleDoubleTap = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        if (scale > 1) {
          resetZoom();
        } else {
          setScale(2);
        }
      }
      lastTap.current = now;
    },
    [scale, resetZoom]
  );

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    },
    [zoomIn, zoomOut]
  );

  const currentImage = images[currentIndex];
  if (!isOpen || images.length === 0 || !currentImage) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Header Controls */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/60 to-transparent">
            {/* Image counter */}
            <div className="text-white/90 text-sm sm:text-base font-medium">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Control buttons */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 sm:h-11 sm:w-11 text-white hover:bg-white/20 rounded-full"
                onClick={zoomOut}
                disabled={scale <= 1}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 sm:h-11 sm:w-11 text-white hover:bg-white/20 rounded-full"
                onClick={zoomIn}
                disabled={scale >= 4}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 sm:h-11 sm:w-11 text-white hover:bg-white/20 rounded-full"
                onClick={resetZoom}
                disabled={scale === 1}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex h-11 w-11 text-white hover:bg-white/20 rounded-full"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 sm:h-11 sm:w-11 text-white hover:bg-white/20 rounded-full"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Main Image Area */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleDoubleTap}
            onWheel={handleWheel}
            style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
          >
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors touch-manipulation"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors touch-manipulation"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Image */}
            <motion.div
              ref={imageRef}
              className="relative w-full h-full flex items-center justify-center select-none"
              animate={{
                scale,
                x: position.x,
                y: position.y,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={currentImage.url}
                    alt={currentImage.alt || `Image ${currentIndex + 1}`}
                    fill
                    className="object-contain pointer-events-none"
                    sizes="100vw"
                    priority
                    draggable={false}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Zoom indicator */}
            {scale > 1 && (
              <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                {Math.round(scale * 100)}%
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4">
              <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide pb-safe">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      resetZoom();
                    }}
                    className={cn(
                      'relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all touch-manipulation',
                      index === currentIndex
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-black/50 scale-105'
                        : 'opacity-60 hover:opacity-100'
                    )}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || `Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hint text */}
          <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 text-white/50 text-xs sm:text-sm hidden sm:block pointer-events-none">
            Double-click to zoom | Scroll to zoom | Drag to pan
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for easy lightbox state management
export function useImageLightbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<{ url: string; alt?: string }[]>([]);
  const [initialIndex, setInitialIndex] = useState(0);

  const openLightbox = useCallback(
    (imageList: { url: string; alt?: string }[], startIndex = 0) => {
      setImages(imageList);
      setInitialIndex(startIndex);
      setIsOpen(true);
    },
    []
  );

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    images,
    initialIndex,
    openLightbox,
    closeLightbox,
  };
}
