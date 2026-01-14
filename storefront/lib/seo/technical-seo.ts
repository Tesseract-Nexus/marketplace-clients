/**
 * Technical SEO Utilities
 *
 * Handles hreflang generation, link prefetching, priority hints,
 * and other technical SEO optimizations.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface LocaleConfig {
  code: string; // e.g., 'en-US', 'de-DE'
  language: string; // e.g., 'en', 'de'
  region?: string; // e.g., 'US', 'DE'
  name: string; // e.g., 'English (US)'
  isDefault?: boolean;
  hreflang: string; // e.g., 'en-us', 'de-de', 'x-default'
}

export interface HreflangLink {
  hreflang: string;
  href: string;
}

export interface PrefetchConfig {
  /** URLs to prefetch */
  urls: string[];
  /** Prefetch strategy */
  strategy: 'hover' | 'viewport' | 'immediate';
  /** Priority (high, low, auto) */
  priority?: 'high' | 'low' | 'auto';
}

export interface ResourceHint {
  rel: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch' | 'modulepreload';
  href: string;
  as?: 'script' | 'style' | 'image' | 'font' | 'fetch' | 'document';
  type?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  fetchPriority?: 'high' | 'low' | 'auto';
}

export interface CanonicalConfig {
  /** Base URL for the site */
  baseUrl: string;
  /** Current path */
  path: string;
  /** Query params to include in canonical */
  includeParams?: string[];
  /** Force trailing slash */
  trailingSlash?: boolean;
}

// =============================================================================
// SUPPORTED LOCALES
// =============================================================================

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: 'en-US', language: 'en', region: 'US', name: 'English (US)', isDefault: true, hreflang: 'en-us' },
  { code: 'en-GB', language: 'en', region: 'GB', name: 'English (UK)', hreflang: 'en-gb' },
  { code: 'de-DE', language: 'de', region: 'DE', name: 'Deutsch', hreflang: 'de-de' },
  { code: 'fr-FR', language: 'fr', region: 'FR', name: 'Français', hreflang: 'fr-fr' },
  { code: 'es-ES', language: 'es', region: 'ES', name: 'Español', hreflang: 'es-es' },
  { code: 'it-IT', language: 'it', region: 'IT', name: 'Italiano', hreflang: 'it-it' },
  { code: 'pt-BR', language: 'pt', region: 'BR', name: 'Português (BR)', hreflang: 'pt-br' },
  { code: 'ja-JP', language: 'ja', region: 'JP', name: '日本語', hreflang: 'ja' },
  { code: 'ko-KR', language: 'ko', region: 'KR', name: '한국어', hreflang: 'ko' },
  { code: 'zh-CN', language: 'zh', region: 'CN', name: '简体中文', hreflang: 'zh-hans' },
  { code: 'zh-TW', language: 'zh', region: 'TW', name: '繁體中文', hreflang: 'zh-hant' },
  { code: 'ar-SA', language: 'ar', region: 'SA', name: 'العربية', hreflang: 'ar' },
  { code: 'hi-IN', language: 'hi', region: 'IN', name: 'हिन्दी', hreflang: 'hi' },
];

// =============================================================================
// HREFLANG GENERATION
// =============================================================================

/**
 * Generate hreflang links for all supported locales
 */
export function generateHreflangLinks(
  baseUrl: string,
  path: string,
  enabledLocales?: string[]
): HreflangLink[] {
  const locales = enabledLocales
    ? SUPPORTED_LOCALES.filter((l) => enabledLocales.includes(l.code))
    : SUPPORTED_LOCALES;

  const defaultLocale = locales.find((l) => l.isDefault) || locales[0];
  const links: HreflangLink[] = [];

  // Add links for each locale
  locales.forEach((locale) => {
    const localePath = locale.isDefault ? path : `/${locale.code.toLowerCase()}${path}`;
    links.push({
      hreflang: locale.hreflang,
      href: `${baseUrl}${localePath}`,
    });
  });

  // Add x-default pointing to default locale
  if (defaultLocale) {
    links.push({
      hreflang: 'x-default',
      href: `${baseUrl}${path}`,
    });
  }

  return links;
}

/**
 * Generate hreflang HTML link elements
 */
export function generateHreflangHtml(links: HreflangLink[]): string {
  return links
    .map((link) => `<link rel="alternate" hreflang="${link.hreflang}" href="${link.href}" />`)
    .join('\n');
}

/**
 * Get locale from path
 */
export function getLocaleFromPath(path: string): LocaleConfig | null {
  const pathParts = path.split('/').filter(Boolean);
  if (pathParts.length === 0) return null;

  const potentialLocale = pathParts[0]?.toLowerCase();
  return SUPPORTED_LOCALES.find(
    (l) => l.code.toLowerCase() === potentialLocale || l.language === potentialLocale
  ) || null;
}

/**
 * Strip locale prefix from path
 */
export function stripLocaleFromPath(path: string): string {
  const locale = getLocaleFromPath(path);
  if (!locale) return path;

  const localePrefix = `/${locale.code.toLowerCase()}`;
  if (path.toLowerCase().startsWith(localePrefix)) {
    return path.slice(localePrefix.length) || '/';
  }
  return path;
}

// =============================================================================
// CANONICAL URL GENERATION
// =============================================================================

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(config: CanonicalConfig): string {
  let url = `${config.baseUrl}${config.path}`;

  // Handle query params
  if (config.includeParams && config.includeParams.length > 0) {
    const urlObj = new URL(url);
    const params = new URLSearchParams();

    config.includeParams.forEach((param) => {
      const value = urlObj.searchParams.get(param);
      if (value) params.set(param, value);
    });

    const paramString = params.toString();
    if (paramString) {
      url = `${url.split('?')[0]}?${paramString}`;
    }
  } else {
    // Remove all query params for canonical
    url = url.split('?')[0]!;
  }

  // Handle trailing slash
  if (config.trailingSlash && !url.endsWith('/')) {
    url = `${url}/`;
  } else if (!config.trailingSlash && url.endsWith('/') && url !== `${config.baseUrl}/`) {
    url = url.slice(0, -1);
  }

  return url;
}

// =============================================================================
// RESOURCE HINTS
// =============================================================================

/**
 * Generate resource hints for critical assets
 */
export function generateResourceHints(hints: ResourceHint[]): string {
  return hints
    .map((hint) => {
      const attrs = [`rel="${hint.rel}"`, `href="${hint.href}"`];

      if (hint.as) attrs.push(`as="${hint.as}"`);
      if (hint.type) attrs.push(`type="${hint.type}"`);
      if (hint.crossOrigin) attrs.push(`crossorigin="${hint.crossOrigin}"`);
      if (hint.fetchPriority) attrs.push(`fetchpriority="${hint.fetchPriority}"`);

      return `<link ${attrs.join(' ')} />`;
    })
    .join('\n');
}

/**
 * Get default resource hints for e-commerce
 */
export function getDefaultResourceHints(baseUrl: string): ResourceHint[] {
  return [
    // Preconnect to critical origins
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    // DNS prefetch for common CDNs
    { rel: 'dns-prefetch', href: 'https://cdn.shopify.com' },
    { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com' },
    { rel: 'dns-prefetch', href: 'https://www.google-analytics.com' },
  ];
}

/**
 * Generate preload hints for hero images
 */
export function generateHeroPreload(
  imageSrc: string,
  srcSet?: string,
  sizes?: string
): ResourceHint {
  const hint: ResourceHint = {
    rel: 'preload',
    href: imageSrc,
    as: 'image',
    fetchPriority: 'high',
  };

  return hint;
}

// =============================================================================
// PRIORITY HINTS
// =============================================================================

/**
 * Priority hint configuration for different resource types
 */
export const PRIORITY_HINTS = {
  // Critical resources - fetch ASAP
  hero: { fetchPriority: 'high' as const, loading: 'eager' as const },
  lcp: { fetchPriority: 'high' as const, loading: 'eager' as const },

  // Important but not critical
  aboveFold: { fetchPriority: 'high' as const, loading: 'eager' as const },

  // Below fold - can be lazy
  belowFold: { fetchPriority: 'low' as const, loading: 'lazy' as const },

  // Decorative - lowest priority
  decorative: { fetchPriority: 'low' as const, loading: 'lazy' as const },
};

/**
 * Determine priority based on viewport position
 */
export function getImagePriority(
  index: number,
  isAboveFold: boolean
): { fetchPriority: 'high' | 'low' | 'auto'; loading: 'eager' | 'lazy' } {
  if (index === 0 || isAboveFold) {
    return PRIORITY_HINTS.aboveFold;
  }
  return PRIORITY_HINTS.belowFold;
}

// =============================================================================
// PREFETCH UTILITIES
// =============================================================================

/**
 * Generate prefetch links for internal navigation
 */
export function generatePrefetchLinks(urls: string[]): string {
  return urls
    .map((url) => `<link rel="prefetch" href="${url}" as="document" />`)
    .join('\n');
}

/**
 * Viewport-based prefetch observer
 */
export function createPrefetchObserver(options?: {
  rootMargin?: string;
  threshold?: number;
}): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  const prefetched = new Set<string>();

  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const link = entry.target as HTMLAnchorElement;
          const href = link.href;

          if (href && !prefetched.has(href) && href.startsWith(window.location.origin)) {
            prefetched.add(href);

            // Create prefetch link
            const prefetchLink = document.createElement('link');
            prefetchLink.rel = 'prefetch';
            prefetchLink.href = href;
            prefetchLink.as = 'document';
            document.head.appendChild(prefetchLink);
          }
        }
      });
    },
    {
      rootMargin: options?.rootMargin || '200px',
      threshold: options?.threshold || 0,
    }
  );
}

// =============================================================================
// META TAGS
// =============================================================================

export interface MetaTagsConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string;
  robots?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * Generate meta tags HTML
 */
export function generateMetaTags(config: MetaTagsConfig): string {
  const tags: string[] = [
    `<title>${config.title}</title>`,
    `<meta name="description" content="${config.description}" />`,
    `<link rel="canonical" href="${config.canonical}" />`,
  ];

  if (config.keywords && config.keywords.length > 0) {
    tags.push(`<meta name="keywords" content="${config.keywords.join(', ')}" />`);
  }

  if (config.robots) {
    tags.push(`<meta name="robots" content="${config.robots}" />`);
  }

  if (config.author) {
    tags.push(`<meta name="author" content="${config.author}" />`);
  }

  // Open Graph
  tags.push(`<meta property="og:title" content="${config.ogTitle || config.title}" />`);
  tags.push(`<meta property="og:description" content="${config.ogDescription || config.description}" />`);
  tags.push(`<meta property="og:type" content="${config.ogType || 'website'}" />`);
  tags.push(`<meta property="og:url" content="${config.canonical}" />`);

  if (config.ogImage) {
    tags.push(`<meta property="og:image" content="${config.ogImage}" />`);
  }

  if (config.publishedTime) {
    tags.push(`<meta property="article:published_time" content="${config.publishedTime}" />`);
  }

  if (config.modifiedTime) {
    tags.push(`<meta property="article:modified_time" content="${config.modifiedTime}" />`);
  }

  // Twitter
  tags.push(`<meta name="twitter:card" content="${config.twitterCard || 'summary_large_image'}" />`);
  tags.push(`<meta name="twitter:title" content="${config.ogTitle || config.title}" />`);
  tags.push(`<meta name="twitter:description" content="${config.ogDescription || config.description}" />`);

  if (config.twitterSite) {
    tags.push(`<meta name="twitter:site" content="${config.twitterSite}" />`);
  }

  if (config.ogImage) {
    tags.push(`<meta name="twitter:image" content="${config.ogImage}" />`);
  }

  return tags.join('\n');
}

// =============================================================================
// SITEMAP UTILITIES
// =============================================================================

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: Array<{
    loc: string;
    title?: string;
    caption?: string;
  }>;
  alternates?: HreflangLink[];
}

/**
 * Generate sitemap XML for a list of URLs
 */
export function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlEntries = urls
    .map((url) => {
      let entry = `  <url>\n    <loc>${escapeXml(url.loc)}</loc>`;

      if (url.lastmod) {
        entry += `\n    <lastmod>${url.lastmod}</lastmod>`;
      }

      if (url.changefreq) {
        entry += `\n    <changefreq>${url.changefreq}</changefreq>`;
      }

      if (url.priority !== undefined) {
        entry += `\n    <priority>${url.priority.toFixed(1)}</priority>`;
      }

      // Image sitemap extension
      if (url.images && url.images.length > 0) {
        url.images.forEach((img) => {
          entry += `\n    <image:image>`;
          entry += `\n      <image:loc>${escapeXml(img.loc)}</image:loc>`;
          if (img.title) entry += `\n      <image:title>${escapeXml(img.title)}</image:title>`;
          if (img.caption) entry += `\n      <image:caption>${escapeXml(img.caption)}</image:caption>`;
          entry += `\n    </image:image>`;
        });
      }

      // Hreflang alternates
      if (url.alternates && url.alternates.length > 0) {
        url.alternates.forEach((alt) => {
          entry += `\n    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}" />`;
        });
      }

      entry += '\n  </url>';
      return entry;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
