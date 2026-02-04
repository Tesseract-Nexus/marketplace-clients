'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface BrandedLoaderProps {
  /** Loader variant */
  variant?: 'full' | 'icon' | 'minimal';
  /** Size of the loader */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional message */
  message?: string;
  /** Show progress bar for long operations */
  progress?: number;
  /** Custom className */
  className?: string;
}

const sizeConfig = {
  sm: { icon: 40, logo: 80, border: 56, borderWidth: 2, text: 'text-xs' },
  md: { icon: 56, logo: 112, border: 72, borderWidth: 3, text: 'text-sm' },
  lg: { icon: 72, logo: 144, border: 96, borderWidth: 3, text: 'text-base' },
  xl: { icon: 96, logo: 192, border: 120, borderWidth: 4, text: 'text-lg' },
};

/**
 * Mark8ly Icon - Rocket with Cart (using actual logo image)
 * Used for quick loading states
 */
function Mark8lyIcon({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo-icon.png"
      alt=""
      width={size}
      height={size}
      className={cn('object-contain', className)}
      aria-hidden="true"
    />
  );
}

/**
 * Animated Border Ring
 * Creates a spinning gradient border effect
 */
function AnimatedBorderRing({
  size,
  borderWidth,
  className
}: {
  size: number;
  borderWidth: number;
  className?: string;
}) {
  return (
    <div
      className={cn('absolute inset-0 rounded-full animate-spin-slow', className)}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(from 0deg, transparent 0deg, var(--accent) 60deg, transparent 120deg)`,
        mask: `radial-gradient(farthest-side, transparent calc(100% - ${borderWidth}px), black calc(100% - ${borderWidth}px))`,
        WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${borderWidth}px), black calc(100% - ${borderWidth}px))`,
      }}
    />
  );
}

/**
 * Full Mark8ly Logo Loader
 * Used for initial app load and major transitions
 */
function FullLogoLoader({ size = 96, borderSize = 120, borderWidth = 4 }: { size?: number; borderSize?: number; borderWidth?: number }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex items-center justify-center"
        style={{ width: borderSize, height: borderSize }}
      >
        {/* Animated border ring */}
        <AnimatedBorderRing size={borderSize} borderWidth={borderWidth} />

        {/* Static background ring */}
        <div
          className="absolute inset-0 rounded-full border-muted/30"
          style={{
            borderWidth: borderWidth,
            borderStyle: 'solid',
          }}
        />

        {/* Logo image - centered */}
        <img
          src="/logo.png"
          alt=""
          width={size}
          height={size}
          className="object-contain relative z-10"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/**
 * BrandedLoader - Tiered loading component
 *
 * Variants:
 * - 'full': Full logo with animated border (initial load, major transitions)
 * - 'icon': Simplified rocket icon with border (page navigation, medium waits)
 * - 'minimal': Simple spinner (quick actions, inline loading)
 *
 * Usage:
 * ```tsx
 * // Initial app load - no message, just animated logo
 * <BrandedLoader variant="full" size="xl" />
 *
 * // Page navigation
 * <BrandedLoader variant="icon" />
 *
 * // Quick inline loading
 * <BrandedLoader variant="minimal" size="sm" />
 *
 * // Long operation with progress
 * <BrandedLoader variant="icon" progress={45} message="Exporting data..." />
 * ```
 */
export function BrandedLoader({
  variant = 'icon',
  size = 'md',
  message,
  progress,
  className,
}: BrandedLoaderProps) {
  const config = sizeConfig[size];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message || 'Loading'}
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        className
      )}
    >
      {/* Loader visual based on variant */}
      {variant === 'full' && (
        <FullLogoLoader
          size={config.logo}
          borderSize={config.logo + 32}
          borderWidth={config.borderWidth}
        />
      )}

      {variant === 'icon' && (
        <div
          className="relative flex items-center justify-center"
          style={{ width: config.border, height: config.border }}
        >
          {/* Animated border ring */}
          <AnimatedBorderRing size={config.border} borderWidth={config.borderWidth} />

          {/* Static background ring */}
          <div
            className="absolute inset-0 rounded-full border-muted/30"
            style={{
              borderWidth: config.borderWidth,
              borderStyle: 'solid',
            }}
          />

          {/* Icon - centered */}
          <Mark8lyIcon size={config.icon} className="relative z-10" />
        </div>
      )}

      {variant === 'minimal' && (
        <Loader2
          className="text-primary animate-spin"
          style={{ width: config.icon * 0.75, height: config.icon * 0.75 }}
        />
      )}

      {/* Progress bar for long operations */}
      {typeof progress === 'number' && (
        <div className="w-48 max-w-full">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-1">
            {Math.round(progress)}%
          </p>
        </div>
      )}

      {/* Screen reader text */}
      <span className="sr-only">
        {message || 'Loading, please wait...'}
        {typeof progress === 'number' && ` ${Math.round(progress)}% complete`}
      </span>
    </div>
  );
}

/**
 * InitialLoader - Full screen branded loader for app initialization
 */
export function InitialLoader() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <BrandedLoader variant="full" size="xl" />
    </div>
  );
}

/**
 * PageLoader - Branded loader for page transitions
 */
export function PageLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div className={cn(
      'flex items-center justify-center',
      fullScreen ? 'min-h-screen' : 'py-16'
    )}>
      <BrandedLoader variant="icon" size="lg" />
    </div>
  );
}

export { Mark8lyIcon };
