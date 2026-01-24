'use client';

import { useState, useEffect } from 'react';
import { useMobileConfig } from '@/context/TenantContext';

/**
 * Hook to detect if reduced motion should be used.
 * Respects both the system preference (prefers-reduced-motion) and
 * the mobileConfig.reducedMotion setting.
 *
 * @returns true if reduced motion should be used
 */
export function useReducedMotion(): boolean {
  const mobileConfig = useMobileConfig();
  const [systemPrefersReducedMotion, setSystemPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if running in browser
    if (typeof window === 'undefined') return;

    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSystemPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Return true if either the setting is enabled or system prefers reduced motion
  return mobileConfig?.reducedMotion === true || systemPrefersReducedMotion;
}

export default useReducedMotion;
