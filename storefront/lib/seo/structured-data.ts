/**
 * Structured Data / Schema.org Utilities
 *
 * Generates JSON-LD structured data for SEO optimization.
 * Supports Product, Organization, FAQ, HowTo, Speakable, and more.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ProductSchemaData {
  id: string;
  name: string;
  description: string;
  sku: string;
  gtin?: string;
  mpn?: string;
  brand?: string;
  category?: string;
  images: string[];
  price: number;
  currency: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder' | 'BackOrder' | 'LimitedAvailability';
  condition?: 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition';
  url: string;
  reviewCount?: number;
  ratingValue?: number;
  offers?: ProductOffer[];
  variants?: ProductVariant[];
  shippingDetails?: ShippingDetails;
  returnPolicy?: ReturnPolicy;
  hasMerchantReturnPolicy?: boolean;
}

export interface ProductOffer {
  price: number;
  priceCurrency: string;
  priceValidUntil?: string;
  availability: string;
  seller?: {
    name: string;
    url?: string;
  };
  itemCondition?: string;
}

export interface ProductVariant {
  name: string;
  sku: string;
  price: number;
  availability: string;
  image?: string;
  attributes?: Record<string, string>;
}

export interface ShippingDetails {
  shippingRate?: {
    currency: string;
    value: number;
  };
  shippingDestination?: {
    country: string;
    region?: string;
  };
  deliveryTime?: {
    handlingDays: { min: number; max: number };
    transitDays: { min: number; max: number };
  };
  freeShippingThreshold?: number;
}

export interface ReturnPolicy {
  applicableCountry: string;
  returnPolicyCategory: 'MerchantReturnFiniteReturnWindow' | 'MerchantReturnNotPermitted' | 'MerchantReturnUnlimitedWindow';
  merchantReturnDays?: number;
  returnMethod?: 'ReturnByMail' | 'ReturnInStore' | 'ReturnAtKiosk';
  returnFees?: 'FreeReturn' | 'RestockingFees' | 'ReturnShippingFees';
  returnShippingFeesAmount?: number;
  refundType?: 'FullRefund' | 'ExchangeOnly' | 'StoreCreditOnly';
}

export interface OrganizationSchema {
  name: string;
  url: string;
  logo: string;
  description?: string;
  sameAs?: string[];
  contactPoint?: {
    telephone: string;
    contactType: string;
    email?: string;
    areaServed?: string[];
    availableLanguage?: string[];
  };
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface HowToStep {
  name: string;
  text: string;
  image?: string;
  url?: string;
}

export interface HowToSchema {
  name: string;
  description: string;
  image?: string;
  totalTime?: string; // ISO 8601 duration
  estimatedCost?: {
    currency: string;
    value: number;
  };
  supply?: string[];
  tool?: string[];
  steps: HowToStep[];
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ArticleSchema {
  headline: string;
  description: string;
  image: string | string[];
  datePublished: string;
  dateModified?: string;
  author: AuthorSchema | AuthorSchema[];
  publisher: {
    name: string;
    logo: string;
  };
  mainEntityOfPage?: string;
  wordCount?: number;
  articleSection?: string;
}

export interface AuthorSchema {
  name: string;
  url?: string;
  image?: string;
  jobTitle?: string;
  description?: string;
  sameAs?: string[];
  knowsAbout?: string[];
}

export interface LocalBusinessSchema {
  name: string;
  image: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  url: string;
  telephone?: string;
  email?: string;
  openingHours?: string[];
  priceRange?: string;
  paymentAccepted?: string[];
  currenciesAccepted?: string[];
  areaServed?: string[];
}

export interface SpeakableSchema {
  cssSelector?: string[];
  xpath?: string[];
}

export interface VideoSchema {
  name: string;
  description: string;
  thumbnailUrl: string | string[];
  uploadDate: string;
  duration?: string; // ISO 8601 duration
  contentUrl?: string;
  embedUrl?: string;
  interactionCount?: number;
  expires?: string;
}

export interface ReviewSchema {
  author: string;
  datePublished: string;
  reviewBody: string;
  reviewRating: {
    ratingValue: number;
    bestRating?: number;
    worstRating?: number;
  };
}

// =============================================================================
// SCHEMA GENERATORS
// =============================================================================

/**
 * Generate Product schema with offers, shipping, and return policy
 */
export function generateProductSchema(product: ProductSchemaData): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': product.url,
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.images,
    url: product.url,
  };

  if (product.gtin) schema.gtin = product.gtin;
  if (product.mpn) schema.mpn = product.mpn;
  if (product.brand) {
    schema.brand = {
      '@type': 'Brand',
      name: product.brand,
    };
  }
  if (product.category) schema.category = product.category;

  // Aggregate Rating
  if (product.reviewCount && product.ratingValue) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.ratingValue,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Main Offer
  schema.offers = {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: product.currency,
    availability: `https://schema.org/${product.availability}`,
    url: product.url,
    itemCondition: product.condition
      ? `https://schema.org/${product.condition}`
      : 'https://schema.org/NewCondition',
  };

  // Shipping Details
  if (product.shippingDetails) {
    schema.offers.shippingDetails = generateShippingDetailsSchema(product.shippingDetails);
  }

  // Return Policy
  if (product.returnPolicy) {
    schema.offers.hasMerchantReturnPolicy = generateReturnPolicySchema(product.returnPolicy);
  }

  return schema;
}

/**
 * Generate OfferShippingDetails schema
 */
export function generateShippingDetailsSchema(shipping: ShippingDetails): object {
  const schema: any = {
    '@type': 'OfferShippingDetails',
  };

  if (shipping.shippingRate) {
    schema.shippingRate = {
      '@type': 'MonetaryAmount',
      currency: shipping.shippingRate.currency,
      value: shipping.shippingRate.value,
    };
  }

  if (shipping.shippingDestination) {
    schema.shippingDestination = {
      '@type': 'DefinedRegion',
      addressCountry: shipping.shippingDestination.country,
    };
    if (shipping.shippingDestination.region) {
      schema.shippingDestination.addressRegion = shipping.shippingDestination.region;
    }
  }

  if (shipping.deliveryTime) {
    schema.deliveryTime = {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: shipping.deliveryTime.handlingDays.min,
        maxValue: shipping.deliveryTime.handlingDays.max,
        unitCode: 'DAY',
      },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: shipping.deliveryTime.transitDays.min,
        maxValue: shipping.deliveryTime.transitDays.max,
        unitCode: 'DAY',
      },
    };
  }

  return schema;
}

/**
 * Generate MerchantReturnPolicy schema
 */
export function generateReturnPolicySchema(policy: ReturnPolicy): object {
  const schema: any = {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: policy.applicableCountry,
    returnPolicyCategory: `https://schema.org/${policy.returnPolicyCategory}`,
  };

  if (policy.merchantReturnDays) {
    schema.merchantReturnDays = policy.merchantReturnDays;
  }

  if (policy.returnMethod) {
    schema.returnMethod = `https://schema.org/${policy.returnMethod}`;
  }

  if (policy.returnFees) {
    schema.returnFees = `https://schema.org/${policy.returnFees}`;
  }

  if (policy.returnShippingFeesAmount !== undefined) {
    schema.returnShippingFeesAmount = {
      '@type': 'MonetaryAmount',
      value: policy.returnShippingFeesAmount,
      currency: 'USD', // Should be parameterized
    };
  }

  if (policy.refundType) {
    schema.refundType = `https://schema.org/${policy.refundType}`;
  }

  return schema;
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(org: OrganizationSchema): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    url: org.url,
    logo: org.logo,
  };

  if (org.description) schema.description = org.description;
  if (org.sameAs) schema.sameAs = org.sameAs;

  if (org.contactPoint) {
    schema.contactPoint = {
      '@type': 'ContactPoint',
      telephone: org.contactPoint.telephone,
      contactType: org.contactPoint.contactType,
      ...(org.contactPoint.email && { email: org.contactPoint.email }),
      ...(org.contactPoint.areaServed && { areaServed: org.contactPoint.areaServed }),
      ...(org.contactPoint.availableLanguage && {
        availableLanguage: org.contactPoint.availableLanguage,
      }),
    };
  }

  if (org.address) {
    schema.address = {
      '@type': 'PostalAddress',
      ...org.address,
    };
  }

  return schema;
}

/**
 * Generate FAQ schema
 */
export function generateFAQSchema(items: FAQItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Generate HowTo schema
 */
export function generateHowToSchema(howTo: HowToSchema): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    step: howTo.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
      ...(step.url && { url: step.url }),
    })),
  };

  if (howTo.image) schema.image = howTo.image;
  if (howTo.totalTime) schema.totalTime = howTo.totalTime;

  if (howTo.estimatedCost) {
    schema.estimatedCost = {
      '@type': 'MonetaryAmount',
      currency: howTo.estimatedCost.currency,
      value: howTo.estimatedCost.value,
    };
  }

  if (howTo.supply) {
    schema.supply = howTo.supply.map((s) => ({ '@type': 'HowToSupply', name: s }));
  }

  if (howTo.tool) {
    schema.tool = howTo.tool.map((t) => ({ '@type': 'HowToTool', name: t }));
  }

  return schema;
}

/**
 * Generate Breadcrumb schema
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate Article schema with author info (E-E-A-T)
 */
export function generateArticleSchema(article: ArticleSchema): object {
  const authors = Array.isArray(article.author) ? article.author : [article.author];

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: authors.map((author) => ({
      '@type': 'Person',
      name: author.name,
      ...(author.url && { url: author.url }),
      ...(author.image && { image: author.image }),
      ...(author.jobTitle && { jobTitle: author.jobTitle }),
      ...(author.description && { description: author.description }),
      ...(author.sameAs && { sameAs: author.sameAs }),
      ...(author.knowsAbout && { knowsAbout: author.knowsAbout }),
    })),
    publisher: {
      '@type': 'Organization',
      name: article.publisher.name,
      logo: {
        '@type': 'ImageObject',
        url: article.publisher.logo,
      },
    },
    ...(article.mainEntityOfPage && { mainEntityOfPage: article.mainEntityOfPage }),
    ...(article.wordCount && { wordCount: article.wordCount }),
    ...(article.articleSection && { articleSection: article.articleSection }),
  };
}

/**
 * Generate LocalBusiness / Store schema
 */
export function generateLocalBusinessSchema(business: LocalBusinessSchema): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: business.name,
    image: business.image,
    url: business.url,
    address: {
      '@type': 'PostalAddress',
      ...business.address,
    },
  };

  if (business.geo) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: business.geo.latitude,
      longitude: business.geo.longitude,
    };
  }

  if (business.telephone) schema.telephone = business.telephone;
  if (business.email) schema.email = business.email;
  if (business.openingHours) schema.openingHoursSpecification = business.openingHours;
  if (business.priceRange) schema.priceRange = business.priceRange;
  if (business.paymentAccepted) schema.paymentAccepted = business.paymentAccepted.join(', ');
  if (business.currenciesAccepted) schema.currenciesAccepted = business.currenciesAccepted.join(', ');
  if (business.areaServed) schema.areaServed = business.areaServed;

  return schema;
}

/**
 * Generate Speakable schema for Google Assistant
 */
export function generateSpeakableSchema(
  pageUrl: string,
  speakable: SpeakableSchema
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': pageUrl,
    speakable: {
      '@type': 'SpeakableSpecification',
      ...(speakable.cssSelector && { cssSelector: speakable.cssSelector }),
      ...(speakable.xpath && { xpath: speakable.xpath }),
    },
  };
}

/**
 * Generate Video schema
 */
export function generateVideoSchema(video: VideoSchema): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.uploadDate,
    ...(video.duration && { duration: video.duration }),
    ...(video.contentUrl && { contentUrl: video.contentUrl }),
    ...(video.embedUrl && { embedUrl: video.embedUrl }),
    ...(video.interactionCount && {
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: { '@type': 'WatchAction' },
        userInteractionCount: video.interactionCount,
      },
    }),
    ...(video.expires && { expires: video.expires }),
  };
}

/**
 * Generate Review schema
 */
export function generateReviewSchema(
  review: ReviewSchema,
  itemReviewed: { name: string; type: string }
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author,
    },
    datePublished: review.datePublished,
    reviewBody: review.reviewBody,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.reviewRating.ratingValue,
      bestRating: review.reviewRating.bestRating || 5,
      worstRating: review.reviewRating.worstRating || 1,
    },
    itemReviewed: {
      '@type': itemReviewed.type,
      name: itemReviewed.name,
    },
  };
}

/**
 * Generate ItemList schema for product collections
 */
export function generateItemListSchema(
  items: Array<{ name: string; url: string; image?: string; position?: number }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: item.position || index + 1,
      name: item.name,
      url: item.url,
      ...(item.image && { image: item.image }),
    })),
  };
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebSiteSchema(
  name: string,
  url: string,
  searchUrl: string
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${searchUrl}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// =============================================================================
// JSON-LD RENDERER
// =============================================================================

/**
 * Render schema as JSON-LD script tag content
 */
export function renderJsonLd(schema: object | object[]): string {
  return JSON.stringify(schema, null, 0);
}

/**
 * Combine multiple schemas into a single graph
 */
export function combineSchemas(schemas: object[]): object {
  return {
    '@context': 'https://schema.org',
    '@graph': schemas.map((s) => {
      // Remove @context from individual schemas when combining
      const { '@context': _, ...rest } = s as any;
      return rest;
    }),
  };
}
