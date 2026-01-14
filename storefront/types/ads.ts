/**
 * Ad Zones Types
 *
 * Commerce-friendly ad placement system that feels native
 * while driving revenue without disrupting the purchase journey.
 */

// =============================================================================
// AD ZONE TYPES
// =============================================================================

export type AdZoneType =
  | 'promo-ribbon'      // Slim ribbon between content blocks
  | 'right-rail'        // Sidebar ad on desktop (PLP/PDP)
  | 'story-card'        // Instagram-style story ad
  | 'featured-partner'  // Collapsible mobile module
  | 'mega-menu-card'    // Card within mega-menu columns
  | 'in-feed'           // Native card within product grid
  | 'banner-strip'      // Full-width thin banner
  | 'interstitial';     // Between-section full-width

export type AdPlacement =
  | 'homepage-hero-below'
  | 'homepage-products-between'
  | 'plp-sidebar'
  | 'plp-after-row-3'
  | 'plp-after-row-6'
  | 'pdp-sidebar'
  | 'pdp-below-description'
  | 'cart-sidebar'
  | 'mega-menu'
  | 'search-results'
  | 'category-header';

// =============================================================================
// AD CONTENT TYPES
// =============================================================================

export interface AdContent {
  id: string;
  type: AdZoneType;
  placement: AdPlacement;
  creative: AdCreative;
  targeting: AdTargeting;
  tracking: AdTracking;
  scheduling?: AdSchedule;
  performance?: AdPerformance;
  priority: number;
  status: 'active' | 'paused' | 'scheduled' | 'ended';
}

export interface AdCreative {
  headline: string;
  subheadline?: string;
  image?: string;
  video?: {
    url: string;
    thumbnail: string;
    autoplay?: boolean;
    muted?: boolean;
  };
  logo?: string;
  cta: {
    text: string;
    href: string;
    style?: 'primary' | 'secondary' | 'outline';
  };
  backgroundColor?: string;
  textColor?: string;
  badge?: string;
  sponsoredLabel?: string; // Defaults to "Sponsored"
  brandName: string;
  brandUrl?: string;
  // For native styling
  products?: AdProduct[];
  collection?: {
    name: string;
    slug: string;
    productCount: number;
  };
}

export interface AdProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  url: string;
}

// =============================================================================
// TARGETING RULES
// =============================================================================

export interface AdTargeting {
  // Category affinity
  categories?: string[];
  excludeCategories?: string[];

  // Brand affinity
  brands?: string[];
  excludeBrands?: string[];

  // Geographic targeting
  countries?: string[];
  regions?: string[];
  cities?: string[];

  // Device targeting
  devices?: ('mobile' | 'tablet' | 'desktop')[];

  // User segment targeting
  userSegments?: UserSegment[];
  excludeSegments?: UserSegment[];

  // Behavioral targeting
  minCartValue?: number;
  maxCartValue?: number;
  hasItemsInCart?: boolean;
  viewedCategories?: string[];
  purchaseHistory?: {
    hasOrdered?: boolean;
    orderCountMin?: number;
    orderCountMax?: number;
    daysSinceLastOrder?: number;
  };

  // Contextual targeting
  pageTypes?: ('home' | 'plp' | 'pdp' | 'cart' | 'search')[];
  searchQueries?: string[];

  // Time-based targeting
  dayOfWeek?: number[];
  hourOfDay?: { start: number; end: number };
}

export type UserSegment =
  | 'new-visitor'
  | 'returning-visitor'
  | 'registered'
  | 'guest'
  | 'vip'
  | 'high-value'
  | 'at-risk'
  | 'deal-seeker'
  | 'brand-loyal';

// =============================================================================
// TRACKING & ANALYTICS
// =============================================================================

export interface AdTracking {
  impressionUrl?: string;
  clickUrl?: string;
  viewableUrl?: string;
  conversionPixels?: string[];
  utmParams?: {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
    term?: string;
  };
  customDimensions?: Record<string, string>;
}

export interface AdPerformance {
  impressions: number;
  clicks: number;
  viewableImpressions: number;
  ctr: number;
  conversions: number;
  revenue: number;
  addToCarts: number;
  avgTimeViewed: number;
}

// =============================================================================
// SCHEDULING
// =============================================================================

export interface AdSchedule {
  startDate: string;
  endDate?: string;
  timezone?: string;
  dayParting?: {
    days: number[];
    hours: { start: number; end: number };
  };
  frequencyCap?: {
    impressions: number;
    period: 'hour' | 'day' | 'week' | 'session';
  };
}

// =============================================================================
// AD ZONE CONFIGURATION
// =============================================================================

export interface AdZoneConfig {
  id: string;
  name: string;
  type: AdZoneType;
  placement: AdPlacement;
  enabled: boolean;

  // Display rules
  maxAdsPerPage: number;
  minSpacingBetweenAds: number; // In viewport heights
  allowAnimation: boolean;
  maxAnimationDuration: number; // In ms

  // Performance safeguards
  lazyLoad: boolean;
  belowFoldOnly: boolean;
  minViewportDistance: number; // How far below fold to show

  // Revenue settings
  minBid?: number;
  fillRate?: number;

  // Native styling
  matchContentStyle: boolean;

  // A/B testing
  testVariants?: AdZoneVariant[];
}

export interface AdZoneVariant {
  id: string;
  weight: number;
  config: Partial<AdZoneConfig>;
}

// =============================================================================
// AD REQUEST/RESPONSE
// =============================================================================

export interface AdRequest {
  placement: AdPlacement;
  context: AdContext;
  limit?: number;
}

export interface AdContext {
  pageType: string;
  categoryId?: string;
  brandId?: string;
  productId?: string;
  searchQuery?: string;
  cartValue?: number;
  cartItems?: string[];
  userId?: string;
  sessionId: string;
  device: 'mobile' | 'tablet' | 'desktop';
  country?: string;
  region?: string;
  viewedProducts?: string[];
  purchaseHistory?: string[];
}

export interface AdResponse {
  ads: AdContent[];
  trackingId: string;
  ttl: number;
}

// =============================================================================
// DEFAULT ZONE CONFIGS
// =============================================================================

export const DEFAULT_AD_ZONE_CONFIGS: Record<AdZoneType, Partial<AdZoneConfig>> = {
  'promo-ribbon': {
    maxAdsPerPage: 2,
    minSpacingBetweenAds: 2,
    allowAnimation: false,
    lazyLoad: false,
    belowFoldOnly: false,
    matchContentStyle: true,
  },
  'right-rail': {
    maxAdsPerPage: 3,
    minSpacingBetweenAds: 1,
    allowAnimation: false,
    lazyLoad: true,
    belowFoldOnly: true,
    minViewportDistance: 0.5,
    matchContentStyle: true,
  },
  'story-card': {
    maxAdsPerPage: 2,
    minSpacingBetweenAds: 3,
    allowAnimation: true,
    maxAnimationDuration: 300,
    lazyLoad: true,
    belowFoldOnly: true,
    matchContentStyle: true,
  },
  'featured-partner': {
    maxAdsPerPage: 1,
    allowAnimation: true,
    maxAnimationDuration: 200,
    lazyLoad: true,
    belowFoldOnly: false,
    matchContentStyle: true,
  },
  'mega-menu-card': {
    maxAdsPerPage: 2,
    allowAnimation: false,
    lazyLoad: false,
    matchContentStyle: true,
  },
  'in-feed': {
    maxAdsPerPage: 2,
    minSpacingBetweenAds: 4, // Every 4th row minimum
    allowAnimation: false,
    lazyLoad: true,
    belowFoldOnly: true,
    minViewportDistance: 1,
    matchContentStyle: true,
  },
  'banner-strip': {
    maxAdsPerPage: 1,
    allowAnimation: true,
    maxAnimationDuration: 500,
    lazyLoad: false,
    belowFoldOnly: false,
    matchContentStyle: false,
  },
  'interstitial': {
    maxAdsPerPage: 1,
    minSpacingBetweenAds: 3,
    allowAnimation: false,
    lazyLoad: true,
    belowFoldOnly: true,
    minViewportDistance: 1.5,
    matchContentStyle: true,
  },
};
