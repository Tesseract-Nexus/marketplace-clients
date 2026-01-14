// ========================================
// Types
// ========================================

export interface Promotion {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: 'BANNER' | 'POPUP' | 'INLINE';
  content: string;
  htmlContent?: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  backgroundColor?: string;
  textColor?: string;
  position: 'TOP' | 'BOTTOM' | 'HERO' | 'SIDEBAR';
  displayConditions?: {
    pages?: string[];
    customerSegments?: string[];
    minCartValue?: number;
    showOnFirstVisit?: boolean;
  };
  countdown?: {
    enabled: boolean;
    endDate: string;
  };
  priority: number;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface ActivePromotionsResponse {
  promotions: Promotion[];
}

// ========================================
// API Functions
// ========================================

export async function getActivePromotions(
  tenantId: string,
  storefrontId: string,
  options?: {
    position?: Promotion['position'];
    page?: string;
  }
): Promise<Promotion[]> {
  const params = new URLSearchParams();
  if (options?.position) params.set('position', options.position);
  if (options?.page) params.set('page', options.page);

  try {
    const response = await fetch(`/api/promotions?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    });

    if (!response.ok) {
      // Return empty array if endpoint not available
      return [];
    }

    const data = await response.json();
    return data.promotions || data || [];
  } catch (error) {
    console.error('Failed to fetch promotions:', error);
    return [];
  }
}

export async function trackPromotionImpression(
  tenantId: string,
  storefrontId: string,
  promotionId: string
): Promise<void> {
  try {
    await fetch(`/api/promotions/${promotionId}/impression`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    });
  } catch (error) {
    // Silently fail - tracking is non-critical
    console.error('Failed to track promotion impression:', error);
  }
}

export async function trackPromotionClick(
  tenantId: string,
  storefrontId: string,
  promotionId: string
): Promise<void> {
  try {
    await fetch(`/api/promotions/${promotionId}/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    });
  } catch (error) {
    // Silently fail - tracking is non-critical
    console.error('Failed to track promotion click:', error);
  }
}

// ========================================
// Helpers
// ========================================

export function getDismissedPromotions(): string[] {
  if (typeof window === 'undefined') return [];
  const dismissed = localStorage.getItem('dismissed_promotions');
  return dismissed ? JSON.parse(dismissed) : [];
}

export function dismissPromotion(promotionId: string): void {
  if (typeof window === 'undefined') return;
  const dismissed = getDismissedPromotions();
  if (!dismissed.includes(promotionId)) {
    dismissed.push(promotionId);
    localStorage.setItem('dismissed_promotions', JSON.stringify(dismissed));
  }
}

export function isPromotionDismissed(promotionId: string): boolean {
  return getDismissedPromotions().includes(promotionId);
}
