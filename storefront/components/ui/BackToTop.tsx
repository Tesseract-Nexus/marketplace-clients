'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackToTopProps {
  showAfter?: number; // Show button after scrolling this many pixels
  className?: string;
}

/**
 * BackToTop Component
 *
 * A floating button that appears after scrolling and smoothly scrolls to top.
 * Includes smooth animations and respects reduced motion preferences.
 */
export function BackToTop({ showAfter = 400, className }: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showAfter);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfter]);

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Scroll to top"
      className={cn(
        // Base styles
        'fixed bottom-6 right-6 z-50',
        'w-12 h-12 rounded-full',
        'flex items-center justify-center',
        // Colors and effects
        'bg-tenant-primary text-white',
        'shadow-lg shadow-tenant-primary/30',
        'hover:shadow-xl hover:shadow-tenant-primary/40',
        'hover:scale-110',
        // Transitions
        'transition-all duration-300 ease-out',
        // Visibility
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none',
        // Focus styles
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-tenant-primary focus-visible:ring-offset-2',
        className
      )}
    >
      <ArrowUp
        className={cn(
          'w-5 h-5 transition-transform duration-300',
          isHovered && '-translate-y-0.5'
        )}
      />

      {/* Ripple effect ring */}
      <span
        className={cn(
          'absolute inset-0 rounded-full border-2 border-tenant-primary',
          'transition-all duration-500 ease-out',
          isHovered ? 'scale-125 opacity-0' : 'scale-100 opacity-0'
        )}
      />
    </button>
  );
}

export default BackToTop;
