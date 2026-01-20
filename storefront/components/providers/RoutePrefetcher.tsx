'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Key routes to prefetch based on current page
const PREFETCH_ROUTES: Record<string, string[]> = {
  '/': ['/products', '/categories', '/cart', '/account'],
  '/products': ['/cart', '/categories'],
  '/categories': ['/products'],
  '/cart': ['/checkout'],
};

export function RoutePrefetcher() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get routes to prefetch based on current path
    const routesToPrefetch = PREFETCH_ROUTES[pathname] ?? PREFETCH_ROUTES['/'] ?? [];

    if (routesToPrefetch.length === 0) return;

    // Only prefetch after initial load and if user is idle
    const timeoutId = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          routesToPrefetch.forEach((route) => {
            router.prefetch(route);
          });
        });
      } else {
        // Fallback for Safari
        routesToPrefetch.forEach((route) => {
          router.prefetch(route);
        });
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [pathname, router]);

  return null;
}
