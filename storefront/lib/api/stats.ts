// ========================================
// Store Statistics Types & API
// ========================================

export interface StoreStats {
  productCount: number;
  customerCount: number;
  averageRating: number;
  totalReviews: number;
}

export interface StoreStatsResponse {
  data: StoreStats;
}

// ========================================
// Store Statistics API Functions
// ========================================

/**
 * Fetch store statistics (product count, customer count, average rating)
 * These stats are cached on the server for 5 minutes
 */
export async function getStoreStats(
  tenantId: string,
  storefrontId: string
): Promise<StoreStats> {
  try {
    const response = await fetch('/api/stats', {
      headers: {
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error('Failed to fetch store stats:', response.status);
      return getEmptyStats();
    }

    const data: StoreStatsResponse = await response.json();
    return data.data || getEmptyStats();
  } catch (error) {
    console.error('Error fetching store stats:', error);
    return getEmptyStats();
  }
}

/**
 * Server-side fetch for store statistics
 * Use this in Server Components for SSR
 */
export async function getStoreStatsServer(
  tenantId: string,
  storefrontId: string,
  baseUrl?: string
): Promise<StoreStats> {
  try {
    // For server-side, we need the full URL
    const url = baseUrl
      ? `${baseUrl}/api/stats`
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/stats`;

    const response = await fetch(url, {
      headers: {
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return getEmptyStats();
    }

    const data: StoreStatsResponse = await response.json();
    return data.data || getEmptyStats();
  } catch (error) {
    console.error('Error fetching store stats (server):', error);
    return getEmptyStats();
  }
}

/**
 * Returns empty stats object - used as fallback
 */
export function getEmptyStats(): StoreStats {
  return {
    productCount: 0,
    customerCount: 0,
    averageRating: 0,
    totalReviews: 0,
  };
}

/**
 * Returns default placeholder stats for display when no real data exists
 * These values are shown to give the storefront a professional look
 */
export function getDefaultStats(): StoreStats {
  return {
    productCount: 50,      // "50+ Products"
    customerCount: 100,    // "100+ Happy Customers"
    averageRating: 4.8,    // "4.8 Rating"
    totalReviews: 25,      // For rating display
  };
}

/**
 * Returns stats for display - uses real data if available, otherwise defaults
 * This ensures the hero section always shows meaningful values
 */
export function getDisplayStats(stats: StoreStats): StoreStats {
  const defaults = getDefaultStats();
  return {
    productCount: stats.productCount > 0 ? stats.productCount : defaults.productCount,
    customerCount: stats.customerCount > 0 ? stats.customerCount : defaults.customerCount,
    averageRating: stats.averageRating > 0 ? stats.averageRating : defaults.averageRating,
    totalReviews: stats.totalReviews > 0 ? stats.totalReviews : defaults.totalReviews,
  };
}

/**
 * Check if stats have any data
 */
export function hasStats(stats: StoreStats): boolean {
  return (
    stats.productCount > 0 ||
    stats.customerCount > 0 ||
    stats.averageRating > 0 ||
    stats.totalReviews > 0
  );
}

/**
 * Format stats for display
 */
export function formatStatValue(value: number, suffix?: string): string {
  if (value >= 10000) {
    return `${Math.floor(value / 1000)}K${suffix || ''}`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K${suffix || ''}`;
  }
  return `${value}${suffix || ''}`;
}
