'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Box,
  Camera,
  Image as ImageIcon,
  Video,
  X,
  ZoomIn,
  RotateCw,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImageLightbox } from '@/components/ui/ImageLightbox';

// =============================================================================
// TYPES
// =============================================================================

export interface MediaAsset {
  id: string;
  type: 'image' | 'video' | '360' | 'ar';
  url: string;
  thumbnail?: string;
  alt: string;
  width?: number;
  height?: number;
  // Video specific
  duration?: number;
  poster?: string;
  // AR specific
  arModelUrl?: string;
  arIosUrl?: string;
  // 360 specific
  frames?: string[];
  // Captions for accessibility
  caption?: string;
}

export interface LifestyleImage {
  id: string;
  url: string;
  alt: string;
  context?: string; // e.g., "Running outdoors", "Gym workout"
  hotspots?: Hotspot[];
}

export interface Hotspot {
  x: number;
  y: number;
  productId: string;
  productName: string;
}

interface PDPMediaGalleryProps {
  media: MediaAsset[];
  lifestyleImages?: LifestyleImage[];
  productName: string;
  onMediaChange?: (index: number) => void;
  enableAR?: boolean;
  enable360?: boolean;
  className?: string;
}

// =============================================================================
// PDP MEDIA GALLERY
// =============================================================================

export function PDPMediaGallery({
  media,
  lifestyleImages = [],
  productName,
  onMediaChange,
  enableAR = true,
  enable360 = true,
  className,
}: PDPMediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'product' | 'lifestyle'>('product');

  const allMedia = activeTab === 'product' ? media : lifestyleImages.map((img) => ({
    id: img.id,
    type: 'image' as const,
    url: img.url,
    alt: img.alt,
  }));

  const activeMedia = allMedia[activeIndex];

  const handleIndexChange = useCallback((index: number) => {
    setActiveIndex(index);
    onMediaChange?.(index);
  }, [onMediaChange]);

  const nextMedia = useCallback(() => {
    handleIndexChange((activeIndex + 1) % allMedia.length);
  }, [activeIndex, allMedia.length, handleIndexChange]);

  const prevMedia = useCallback(() => {
    handleIndexChange((activeIndex - 1 + allMedia.length) % allMedia.length);
  }, [activeIndex, allMedia.length, handleIndexChange]);

  return (
    <div className={cn('pdp-media-gallery', className)}>
      {/* Tab Switcher */}
      {lifestyleImages.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setActiveTab('product'); setActiveIndex(0); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'product'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            <ImageIcon className="w-4 h-4" />
            Product
          </button>
          <button
            onClick={() => { setActiveTab('lifestyle'); setActiveIndex(0); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'lifestyle'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            <Camera className="w-4 h-4" />
            In Action
          </button>
        </div>
      )}

      {/* Main Media Display */}
      <div className="relative aspect-square md:aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${activeIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {activeMedia && (
              <MediaRenderer
                media={activeMedia}
                productName={productName}
                onZoom={() => setIsLightboxOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {allMedia.length > 1 && (
          <>
            <button
              onClick={prevMedia}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMedia}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Media Type Indicator */}
        {activeMedia?.type !== 'image' && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 text-white rounded-full text-sm">
            {activeMedia?.type === 'video' && <Video className="w-4 h-4" />}
            {activeMedia?.type === '360' && <RotateCw className="w-4 h-4" />}
            {activeMedia?.type === 'ar' && <Box className="w-4 h-4" />}
            <span className="capitalize">{activeMedia?.type}</span>
          </div>
        )}

        {/* Zoom Button */}
        <button
          onClick={() => setIsLightboxOpen(true)}
          className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center"
          aria-label="Zoom"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      {/* Thumbnail Strip */}
      <div className="mt-4 overflow-x-auto">
        <div className="flex gap-2 min-w-min">
          {allMedia.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleIndexChange(index)}
              className={cn(
                'relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors',
                activeIndex === index
                  ? 'border-primary'
                  : 'border-transparent hover:border-muted-foreground/50'
              )}
            >
              <Image
                src={item.type === 'video' ? (item as MediaAsset).poster || item.url : item.url}
                alt={item.alt}
                fill
                className="object-cover"
                sizes="80px"
              />
              {item.type !== 'image' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  {item.type === 'video' && <Play className="w-5 h-5 text-white" />}
                  {item.type === '360' && <RotateCw className="w-5 h-5 text-white" />}
                  {item.type === 'ar' && <Box className="w-5 h-5 text-white" />}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* AR Try-On Button */}
      {enableAR && media.some((m) => m.type === 'ar') && (
        <ARTryOnButton
          arAsset={media.find((m) => m.type === 'ar')!}
          productName={productName}
        />
      )}

      {/* Enhanced Lightbox with zoom/pan */}
      <ImageLightbox
        images={allMedia
          .filter((m) => m.type === 'image')
          .map((m) => ({
            url: m.url,
            alt: m.alt,
          }))}
        initialIndex={activeIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
}

// =============================================================================
// MEDIA RENDERER
// =============================================================================

interface MediaRendererProps {
  media: MediaAsset;
  productName: string;
  onZoom?: () => void;
}

function MediaRenderer({ media, productName, onZoom }: MediaRendererProps) {
  switch (media.type) {
    case 'video':
      return <VideoPlayer media={media} />;
    case '360':
      return <View360 media={media} />;
    case 'ar':
      return <ARPreview media={media} productName={productName} />;
    default:
      return (
        <Image
          src={media.url}
          alt={media.alt}
          fill
          className="object-contain cursor-zoom-in"
          onClick={onZoom}
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      );
  }
}

// =============================================================================
// VIDEO PLAYER
// =============================================================================

function VideoPlayer({ media }: { media: MediaAsset }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(percent);
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        src={media.url}
        poster={media.poster}
        className="w-full h-full object-contain"
        loop
        muted={isMuted}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/30 rounded-full mb-3">
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={toggleMute}
            className="text-white hover:text-white/80"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {media.duration && (
            <span className="text-white/80 text-sm">
              {formatDuration(media.duration)}
            </span>
          )}
        </div>
      </div>

      {/* Play Button Overlay */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20"
        >
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-8 h-8 text-black ml-1" />
          </div>
        </button>
      )}
    </div>
  );
}

// =============================================================================
// 360 VIEW
// =============================================================================

function View360({ media }: { media: MediaAsset }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const frames = media.frames || [];
  const totalFrames = frames.length || 36;

  const handleDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const sensitivity = 0.5;
    const delta = Math.round(info.offset.x * sensitivity / 10);
    const newIndex = (frameIndex - delta + totalFrames) % totalFrames;
    setFrameIndex(newIndex);
  }, [frameIndex, totalFrames]);

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0}
      onDrag={handleDrag}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      {frames.length > 0 ? (
        <Image
          src={frames[frameIndex] || media.url}
          alt={media.alt}
          fill
          className="object-contain pointer-events-none"
          draggable={false}
        />
      ) : (
        <Image
          src={media.url}
          alt={media.alt}
          fill
          className="object-contain"
        />
      )}

      {/* 360 Instruction */}
      {!isDragging && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/60 text-white rounded-full text-sm">
          <RotateCw className="w-4 h-4" />
          Drag to rotate
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// AR PREVIEW / TRY-ON
// =============================================================================

function ARPreview({ media, productName }: { media: MediaAsset; productName: string }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
      <Image
        src={media.url}
        alt={media.alt}
        fill
        className="object-contain"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 text-center p-8">
        <Box className="w-16 h-16 text-primary mb-4" />
        <h3 className="text-xl font-bold mb-2">View in Your Space</h3>
        <p className="text-muted-foreground mb-4 max-w-xs">
          See how {productName} looks in your environment using AR
        </p>
        <ARTryOnButton arAsset={media} productName={productName} inline />
      </div>
    </div>
  );
}

function ARTryOnButton({
  arAsset,
  productName,
  inline = false,
}: {
  arAsset: MediaAsset;
  productName: string;
  inline?: boolean;
}) {
  const handleARClick = () => {
    // Check for iOS AR Quick Look
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS && arAsset.arIosUrl) {
      // Use iOS AR Quick Look
      const anchor = document.createElement('a');
      anchor.setAttribute('rel', 'ar');
      anchor.setAttribute('href', arAsset.arIosUrl);
      anchor.appendChild(document.createElement('img'));
      anchor.click();
    } else if (arAsset.arModelUrl) {
      // Use model-viewer or WebXR
      // This would typically open a modal with a <model-viewer> component
      window.open(arAsset.arModelUrl, '_blank');
    }
  };

  if (inline) {
    return (
      <Button onClick={handleARClick} size="lg">
        <Smartphone className="w-5 h-5 mr-2" />
        Try AR View
      </Button>
    );
  }

  return (
    <div className="mt-4 p-4 bg-primary/5 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Box className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">View in AR</p>
            <p className="text-sm text-muted-foreground">
              See {productName} in your space
            </p>
          </div>
        </div>
        <Button onClick={handleARClick} variant="outline">
          <Smartphone className="w-4 h-4 mr-2" />
          Try Now
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// LIGHTBOX
// =============================================================================

interface MediaLightboxProps {
  media: (MediaAsset | { id: string; type: 'image'; url: string; alt: string })[];
  activeIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

function MediaLightbox({
  media,
  activeIndex,
  onClose,
  onIndexChange,
}: MediaLightboxProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') onIndexChange((activeIndex + 1) % media.length);
    if (e.key === 'ArrowLeft') onIndexChange((activeIndex - 1 + media.length) % media.length);
  }, [activeIndex, media.length, onClose, onIndexChange]);

  // Add keyboard listener
  useState(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  const activeMedia = media[activeIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-50"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation */}
      {media.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((activeIndex - 1 + media.length) % media.length);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((activeIndex + 1) % media.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Image */}
      {activeMedia && (
        <div
          className="relative w-full h-full max-w-6xl max-h-[90vh] m-8"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={activeMedia.url}
            alt={activeMedia.alt}
            fill
            className="object-contain"
            sizes="100vw"
          />
        </div>
      )}

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
        {activeIndex + 1} / {media.length}
      </div>
    </motion.div>
  );
}

// =============================================================================
// UTILITIES
// =============================================================================

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default PDPMediaGallery;
