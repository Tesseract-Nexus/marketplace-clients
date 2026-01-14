/**
 * AI-Powered Merchandising - Intent Scoring
 *
 * Leverages user intent scoring to reorder blocks dynamically
 * while preserving static HTML for search bots.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface UserIntent {
  primary: IntentCategory;
  secondary: IntentCategory[];
  confidence: number;
  signals: IntentSignal[];
  timestamp: number;
}

export type IntentCategory =
  | 'browse'           // Exploratory, no specific goal
  | 'research'         // Comparing products, reading reviews
  | 'purchase-ready'   // High intent, ready to buy
  | 'deal-seeking'     // Looking for discounts
  | 'brand-loyal'      // Returning to specific brand
  | 'category-focused' // Interested in specific category
  | 'gift-shopping'    // Shopping for others
  | 'replenish'        // Buying previously purchased items
  | 'new-arrival'      // Looking for latest products
  | 'activity-based';  // Shopping for specific activity (sports, etc.)

export interface IntentSignal {
  type: SignalType;
  value: string | number | boolean;
  weight: number;
  timestamp: number;
}

export type SignalType =
  | 'page-view'
  | 'search-query'
  | 'category-visit'
  | 'product-view'
  | 'add-to-cart'
  | 'add-to-wishlist'
  | 'price-filter'
  | 'sort-selection'
  | 'time-on-page'
  | 'scroll-depth'
  | 'click-pattern'
  | 'return-visit'
  | 'purchase-history'
  | 'referrer'
  | 'device-type'
  | 'time-of-day';

export interface PersonaCohort {
  id: string;
  name: string;
  description: string;
  criteria: CohortCriteria;
  blockOrder: string[]; // Block IDs in preferred order
  emphasis: BlockEmphasis[];
}

export interface CohortCriteria {
  intents?: IntentCategory[];
  minConfidence?: number;
  behaviors?: BehaviorCriteria;
  demographics?: DemographicCriteria;
}

export interface BehaviorCriteria {
  minVisits?: number;
  minPurchases?: number;
  avgOrderValue?: { min?: number; max?: number };
  daysSinceLastPurchase?: { min?: number; max?: number };
  preferredCategories?: string[];
  preferredBrands?: string[];
}

export interface DemographicCriteria {
  countries?: string[];
  regions?: string[];
  devices?: ('mobile' | 'tablet' | 'desktop')[];
  newUser?: boolean;
}

export interface BlockEmphasis {
  blockId: string;
  emphasis: 'highlight' | 'expand' | 'collapse' | 'hide';
  reason: string;
}

// =============================================================================
// INTENT SCORING ENGINE
// =============================================================================

export class IntentScoringEngine {
  private signals: IntentSignal[] = [];
  private readonly signalWeights: Record<SignalType, number> = {
    'page-view': 0.1,
    'search-query': 0.3,
    'category-visit': 0.2,
    'product-view': 0.3,
    'add-to-cart': 0.8,
    'add-to-wishlist': 0.4,
    'price-filter': 0.3,
    'sort-selection': 0.2,
    'time-on-page': 0.2,
    'scroll-depth': 0.1,
    'click-pattern': 0.2,
    'return-visit': 0.3,
    'purchase-history': 0.5,
    'referrer': 0.2,
    'device-type': 0.1,
    'time-of-day': 0.1,
  };

  constructor(initialSignals?: IntentSignal[]) {
    if (initialSignals) {
      this.signals = initialSignals;
    }
  }

  // ==========================================================================
  // SIGNAL COLLECTION
  // ==========================================================================

  addSignal(signal: Omit<IntentSignal, 'weight' | 'timestamp'>): void {
    const fullSignal: IntentSignal = {
      ...signal,
      weight: this.signalWeights[signal.type] || 0.1,
      timestamp: Date.now(),
    };
    this.signals.push(fullSignal);

    // Keep only recent signals (last 30 minutes)
    this.pruneOldSignals();
  }

  private pruneOldSignals(): void {
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    this.signals = this.signals.filter((s) => s.timestamp > thirtyMinutesAgo);
  }

  // ==========================================================================
  // INTENT CALCULATION
  // ==========================================================================

  calculateIntent(): UserIntent {
    const intentScores = this.calculateIntentScores();
    const sorted = Object.entries(intentScores)
      .sort(([, a], [, b]) => b - a);

    const primary = (sorted[0]?.[0] || 'browse') as IntentCategory;
    const primaryScore = sorted[0]?.[1] || 0;

    // Secondary intents are those with score > 50% of primary
    const threshold = primaryScore * 0.5;
    const secondary = sorted
      .slice(1)
      .filter(([, score]) => score >= threshold)
      .map(([intent]) => intent as IntentCategory);

    return {
      primary,
      secondary,
      confidence: this.calculateConfidence(primaryScore, sorted),
      signals: this.signals,
      timestamp: Date.now(),
    };
  }

  private calculateIntentScores(): Record<IntentCategory, number> {
    const scores: Record<IntentCategory, number> = {
      'browse': 0,
      'research': 0,
      'purchase-ready': 0,
      'deal-seeking': 0,
      'brand-loyal': 0,
      'category-focused': 0,
      'gift-shopping': 0,
      'replenish': 0,
      'new-arrival': 0,
      'activity-based': 0,
    };

    this.signals.forEach((signal) => {
      const contribution = this.getIntentContribution(signal);
      Object.entries(contribution).forEach(([intent, score]) => {
        scores[intent as IntentCategory] += score * signal.weight;
      });
    });

    // Normalize scores
    const maxScore = Math.max(...Object.values(scores), 1);
    Object.keys(scores).forEach((key) => {
      scores[key as IntentCategory] /= maxScore;
    });

    return scores;
  }

  private getIntentContribution(signal: IntentSignal): Partial<Record<IntentCategory, number>> {
    switch (signal.type) {
      case 'add-to-cart':
        return { 'purchase-ready': 1.0 };

      case 'add-to-wishlist':
        return { 'research': 0.5, 'browse': 0.3, 'gift-shopping': 0.2 };

      case 'price-filter':
        if (signal.value === 'low-to-high' || signal.value === 'on-sale') {
          return { 'deal-seeking': 1.0 };
        }
        return { 'research': 0.5 };

      case 'sort-selection':
        if (signal.value === 'newest') {
          return { 'new-arrival': 1.0 };
        }
        if (signal.value === 'price-low') {
          return { 'deal-seeking': 0.8 };
        }
        if (signal.value === 'rating') {
          return { 'research': 0.7 };
        }
        return { 'browse': 0.5 };

      case 'search-query':
        const query = String(signal.value).toLowerCase();
        if (query.includes('gift') || query.includes('present')) {
          return { 'gift-shopping': 1.0 };
        }
        if (query.includes('sale') || query.includes('discount') || query.includes('cheap')) {
          return { 'deal-seeking': 1.0 };
        }
        if (query.includes('new') || query.includes('latest')) {
          return { 'new-arrival': 1.0 };
        }
        return { 'category-focused': 0.6, 'research': 0.4 };

      case 'category-visit':
        return { 'category-focused': 0.8, 'browse': 0.2 };

      case 'product-view':
        return { 'research': 0.5, 'browse': 0.3 };

      case 'purchase-history':
        return { 'replenish': 0.7, 'brand-loyal': 0.3 };

      case 'return-visit':
        return { 'brand-loyal': 0.5, 'replenish': 0.3 };

      case 'time-on-page':
        const time = Number(signal.value);
        if (time > 120) { // 2+ minutes
          return { 'research': 0.8 };
        }
        return { 'browse': 0.5 };

      case 'scroll-depth':
        const depth = Number(signal.value);
        if (depth > 75) {
          return { 'research': 0.6 };
        }
        return { 'browse': 0.3 };

      default:
        return { 'browse': 0.2 };
    }
  }

  private calculateConfidence(primaryScore: number, sorted: [string, number][]): number {
    if (sorted.length < 2) return primaryScore;

    const secondScore = sorted[1]?.[1] || 0;
    const gap = primaryScore - secondScore;

    // Higher gap = higher confidence
    return Math.min(0.5 + gap * 0.5, 1);
  }

  // ==========================================================================
  // COHORT MATCHING
  // ==========================================================================

  matchCohort(cohorts: PersonaCohort[]): PersonaCohort | null {
    const intent = this.calculateIntent();

    for (const cohort of cohorts) {
      if (this.matchesCriteria(intent, cohort.criteria)) {
        return cohort;
      }
    }

    return null;
  }

  private matchesCriteria(intent: UserIntent, criteria: CohortCriteria): boolean {
    // Check intent match
    if (criteria.intents && criteria.intents.length > 0) {
      const hasIntent =
        criteria.intents.includes(intent.primary) ||
        intent.secondary.some((s) => criteria.intents!.includes(s));
      if (!hasIntent) return false;
    }

    // Check confidence threshold
    if (criteria.minConfidence && intent.confidence < criteria.minConfidence) {
      return false;
    }

    // Additional criteria checks would go here (behaviors, demographics)
    // These would require additional user data

    return true;
  }
}

// =============================================================================
// BLOCK REORDERING ENGINE
// =============================================================================

export interface BlockReorderResult {
  blockOrder: string[];
  emphasis: BlockEmphasis[];
  preserveForBots: boolean;
  userIntent: UserIntent;
}

/**
 * Reorder homepage blocks based on user intent
 * Preserves static HTML structure for search bots
 */
export function reorderBlocksForIntent(
  defaultOrder: string[],
  userIntent: UserIntent,
  cohorts: PersonaCohort[],
  isBot: boolean
): BlockReorderResult {
  // For bots, always return default order
  if (isBot) {
    return {
      blockOrder: defaultOrder,
      emphasis: [],
      preserveForBots: true,
      userIntent,
    };
  }

  // Find matching cohort
  const engine = new IntentScoringEngine();
  const matchedCohort = cohorts.find((c) =>
    c.criteria.intents?.includes(userIntent.primary)
  );

  if (matchedCohort) {
    return {
      blockOrder: matchedCohort.blockOrder.filter((id) => defaultOrder.includes(id)),
      emphasis: matchedCohort.emphasis,
      preserveForBots: false,
      userIntent,
    };
  }

  // Default reordering based on intent
  return {
    blockOrder: getDefaultBlockOrderForIntent(defaultOrder, userIntent),
    emphasis: getDefaultEmphasisForIntent(userIntent),
    preserveForBots: false,
    userIntent,
  };
}

function getDefaultBlockOrderForIntent(
  defaultOrder: string[],
  intent: UserIntent
): string[] {
  const order = [...defaultOrder];

  // Move relevant blocks to top based on intent
  const priorityBlocks: Record<IntentCategory, string[]> = {
    'browse': ['hero', 'category-grid', 'featured-products'],
    'research': ['featured-products', 'reviews', 'comparison'],
    'purchase-ready': ['featured-products', 'deals-carousel', 'recently-viewed'],
    'deal-seeking': ['deals-carousel', 'countdown-banner', 'campaign-rail'],
    'brand-loyal': ['brand-showcase', 'new-arrivals', 'recommendations'],
    'category-focused': ['category-grid', 'featured-products', 'filters'],
    'gift-shopping': ['gift-guide', 'bestsellers', 'gift-cards'],
    'replenish': ['recently-purchased', 'recommendations', 'quick-reorder'],
    'new-arrival': ['new-arrivals', 'hero', 'trending'],
    'activity-based': ['activity-hub', 'category-grid', 'service-promos'],
  };

  const priority = priorityBlocks[intent.primary] || [];

  // Sort: priority blocks first, then rest in original order
  order.sort((a, b) => {
    const aIndex = priority.indexOf(a);
    const bIndex = priority.indexOf(b);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });

  return order;
}

function getDefaultEmphasisForIntent(intent: UserIntent): BlockEmphasis[] {
  const emphasis: BlockEmphasis[] = [];

  switch (intent.primary) {
    case 'deal-seeking':
      emphasis.push({
        blockId: 'deals-carousel',
        emphasis: 'expand',
        reason: 'User is actively seeking deals',
      });
      emphasis.push({
        blockId: 'newsletter',
        emphasis: 'highlight',
        reason: 'Offer discount code signup',
      });
      break;

    case 'purchase-ready':
      emphasis.push({
        blockId: 'featured-products',
        emphasis: 'expand',
        reason: 'User ready to purchase',
      });
      emphasis.push({
        blockId: 'promotional',
        emphasis: 'collapse',
        reason: 'Minimize distractions',
      });
      break;

    case 'research':
      emphasis.push({
        blockId: 'testimonials',
        emphasis: 'highlight',
        reason: 'User is researching',
      });
      emphasis.push({
        blockId: 'comparison',
        emphasis: 'expand',
        reason: 'Help comparison shopping',
      });
      break;

    case 'activity-based':
      emphasis.push({
        blockId: 'activity-hub',
        emphasis: 'expand',
        reason: 'User interested in activity shopping',
      });
      break;
  }

  return emphasis;
}

// =============================================================================
// BOT DETECTION
// =============================================================================

const BOT_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'pinterest',
  'whatsapp',
  'telegrambot',
];

/**
 * Detect if request is from a search bot
 */
export function isSearchBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot));
}

// =============================================================================
// DEFAULT COHORTS
// =============================================================================

export const DEFAULT_PERSONA_COHORTS: PersonaCohort[] = [
  {
    id: 'fitness-enthusiast',
    name: 'Fitness Enthusiast',
    description: 'Users interested in sports and fitness products',
    criteria: {
      intents: ['activity-based', 'category-focused'],
      behaviors: {
        preferredCategories: ['sports', 'fitness', 'outdoor'],
      },
    },
    blockOrder: [
      'hero',
      'activity-hub',
      'featured-products',
      'service-promos',
      'testimonials',
      'newsletter',
    ],
    emphasis: [
      { blockId: 'activity-hub', emphasis: 'expand', reason: 'Primary interest' },
    ],
  },
  {
    id: 'deal-hunter',
    name: 'Deal Hunter',
    description: 'Price-sensitive shoppers looking for discounts',
    criteria: {
      intents: ['deal-seeking'],
      minConfidence: 0.6,
    },
    blockOrder: [
      'banner-strip',
      'deals-carousel',
      'countdown-banner',
      'featured-products',
      'campaign-rail',
      'newsletter',
    ],
    emphasis: [
      { blockId: 'deals-carousel', emphasis: 'expand', reason: 'Deal seeker' },
      { blockId: 'countdown-banner', emphasis: 'highlight', reason: 'Urgency' },
    ],
  },
  {
    id: 'brand-loyalist',
    name: 'Brand Loyalist',
    description: 'Returning customers with brand affinity',
    criteria: {
      intents: ['brand-loyal', 'replenish'],
      behaviors: {
        minPurchases: 2,
      },
    },
    blockOrder: [
      'hero',
      'new-arrivals',
      'recommendations',
      'loyalty-banner',
      'featured-products',
      'newsletter',
    ],
    emphasis: [
      { blockId: 'loyalty-banner', emphasis: 'highlight', reason: 'Returning customer' },
      { blockId: 'recommendations', emphasis: 'expand', reason: 'Personalized picks' },
    ],
  },
];
