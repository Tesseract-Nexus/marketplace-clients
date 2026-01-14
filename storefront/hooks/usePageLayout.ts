'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTenant } from '@/context/TenantContext';
import type { PageLayout, LayoutTemplate } from '@/types/blocks';
import { getLayoutTemplate, filterVisibleSections } from '@/lib/layouts';

// =============================================================================
// USE PAGE LAYOUT HOOK
// =============================================================================

interface UsePageLayoutOptions {
  slug?: string;
  fallbackTemplate?: LayoutTemplate;
  preview?: boolean;
}

interface UsePageLayoutResult {
  layout: PageLayout | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function usePageLayout(options: UsePageLayoutOptions = {}): UsePageLayoutResult {
  const { slug = 'home', fallbackTemplate = 'myntra-editorial', preview = false } = options;
  const { tenant } = useTenant();
  const [layout, setLayout] = useState<PageLayout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!tenant?.id || !tenant?.storefrontId) {
      // Use fallback template when no tenant
      const template = getLayoutTemplate(fallbackTemplate);
      setLayout(template.defaultLayout);
      setIsLoading(false);
      return;
    }

    async function fetchLayout() {
      setIsLoading(true);
      setError(null);

      try {
        // Try to fetch from API
        const params = new URLSearchParams({
          slug,
          ...(preview && { preview: 'true' }),
        });

        const response = await fetch(`/api/layouts?${params.toString()}`, {
          headers: {
            'X-Tenant-ID': tenant!.id,
            'X-Storefront-ID': tenant!.storefrontId,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.layout) {
            setLayout(data.layout);
            return;
          }
        }

        // Fallback to template if no custom layout
        const template = getLayoutTemplate(fallbackTemplate);
        setLayout(template.defaultLayout);
      } catch (err) {
        console.error('Failed to fetch page layout:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch layout'));

        // Use fallback template on error
        const template = getLayoutTemplate(fallbackTemplate);
        setLayout(template.defaultLayout);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLayout();
  }, [tenant?.id, tenant?.storefrontId, slug, fallbackTemplate, preview, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  return { layout, isLoading, error, refresh };
}

// =============================================================================
// USE LAYOUT VISIBILITY HOOK
// =============================================================================

interface UseLayoutVisibilityOptions {
  userCohorts?: string[];
}

export function useLayoutVisibility(
  layout: PageLayout | null,
  options: UseLayoutVisibilityOptions = {}
) {
  const { userCohorts = [] } = options;
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 768) setDevice('mobile');
      else if (width < 1024) setDevice('tablet');
      else setDevice('desktop');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const visibleSections = useMemo(() => {
    if (!layout) return [];
    return filterVisibleSections(layout.sections, {
      device,
      userCohorts,
      currentTime: new Date(),
    });
  }, [layout, device, userCohorts]);

  return {
    device,
    visibleSections,
    totalSections: layout?.sections.length ?? 0,
    visibleCount: visibleSections.length,
  };
}

// =============================================================================
// USE LAYOUT PRESETS HOOK
// =============================================================================

export function useLayoutPresets() {
  const presets: LayoutTemplate[] = [
    'myntra-editorial',
    'flipkart-deals',
    'decathlon-activity',
    'minimal-modern',
    'luxury-immersive',
    'marketplace-dense',
    'content-commerce',
  ];

  const getPreset = (id: LayoutTemplate) => getLayoutTemplate(id);

  return { presets, getPreset };
}

export default usePageLayout;
