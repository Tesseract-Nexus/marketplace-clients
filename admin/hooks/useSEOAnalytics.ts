'use client';

import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/contexts/TenantContext';
import { CACHE_TIMES, queryKeys } from '@/contexts/QueryProvider';
import { productsService } from '@/lib/api/products';
import { categoriesService } from '@/lib/api/categories';
import { aggregateSEOAnalytics, type SEOAnalytics } from '@/lib/utils/seo-scoring';

/**
 * Hook for SEO analytics — fetches all products and categories,
 * then computes SEO scores client-side.
 *
 * No new backend endpoint required; uses existing product/category APIs.
 */
export function useSEOAnalytics() {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id || '';

  return useQuery<SEOAnalytics>({
    queryKey: [...queryKeys.products.all, 'seo-analytics', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant selected');

      // Fetch all products and categories in parallel
      const [productsRes, categoriesRes] = await Promise.all([
        productsService.getProducts({ page: 1, limit: 1000 }),
        categoriesService.getCategories({ page: 1, limit: 1000 }),
      ]);

      return aggregateSEOAnalytics(productsRes.data, categoriesRes.data);
    },
    enabled: !!tenantId,
    staleTime: CACHE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.SEMI_STATIC,
  });
}
