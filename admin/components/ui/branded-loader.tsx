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
  sm: { icon: 32, logo: 64, text: 'text-xs' },
  md: { icon: 48, logo: 96, text: 'text-sm' },
  lg: { icon: 64, logo: 128, text: 'text-base' },
  xl: { icon: 80, logo: 160, text: 'text-lg' },
};

/**
 * Mark8ly Icon - Rocket with Cart (using actual logo image)
 * Used for quick loading states
 */
function Mark8lyIcon({ size = 32, className }: { size?: number; className?: string }) {
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
 * Full Mark8ly Logo Loader
 * Used for initial app load and major transitions
 */
function FullLogoLoader({ size = 80 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {/* Logo image */}
        <img
          src="/logo.png"
          alt=""
          width={size}
          height={size}
          className="object-contain animate-pulse"
          aria-hidden="true"
        />
        {/* Subtle glow effect */}
        <div
          className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse"
          style={{ transform: 'scale(1.2)' }}
        />
      </div>
    </div>
  );
}

/**
 * BrandedLoader - Tiered loading component
 *
 * Variants:
 * - 'full': Full logo with animation (initial load, major transitions)
 * - 'icon': Simplified rocket icon (page navigation, medium waits)
 * - 'minimal': Simple spinner (quick actions, inline loading)
 *
 * Usage:
 * ```tsx
 * // Initial app load
 * <BrandedLoader variant="full" size="xl" message="Loading admin panel..." />
 *
 * // Page navigation
 * <BrandedLoader variant="icon" message="Loading orders..." />
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

  // Respect reduced motion preferences
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message || 'Loading'}
      className={cn(
        'flex flex-col items-center justify-center gap-2',
        className
      )}
    >
      {/* Loader visual based on variant */}
      {variant === 'full' && (
        <FullLogoLoader size={config.logo} />
      )}

      {variant === 'icon' && (
        <div className={cn(
          'relative',
          !prefersReducedMotion && 'animate-bounce-gentle'
        )}>
          <Mark8lyIcon size={config.icon} />
        </div>
      )}

      {variant === 'minimal' && (
        <Loader2
          className={cn(
            'text-primary',
            !prefersReducedMotion && 'animate-spin'
          )}
          style={{ width: config.icon * 0.75, height: config.icon * 0.75 }}
        />
      )}

      {/* Message */}
      {message && (
        <p className={cn('text-muted-foreground', config.text)}>
          {message}
        </p>
      )}

      {/* Progress bar for long operations */}
      {typeof progress === 'number' && (
        <div className="w-48 max-w-full">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
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
export function InitialLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <BrandedLoader variant="full" size="xl" message={message} />
    </div>
  );
}

/**
 * PageLoader - Branded loader for page transitions
 */
export function PageLoader({
  message = 'Loading...',
  fullScreen = false
}: {
  message?: string;
  fullScreen?: boolean;
}) {
  return (
    <div className={cn(
      'flex items-center justify-center',
      fullScreen ? 'min-h-screen' : 'py-16'
    )}>
      <BrandedLoader variant="icon" size="lg" message={message} />
    </div>
  );
}

export { Mark8lyIcon };
