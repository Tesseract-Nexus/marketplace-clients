/**
 * Edge Personalization Utilities
 *
 * Uses geo/device signals at CDN edge to inject localized content
 * before HTML hits the browser.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface GeoData {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  postalCode?: string;
}

export interface DeviceData {
  type: 'mobile' | 'tablet' | 'desktop';
  os?: string;
  browser?: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth?: number;
  viewportWidth?: number;
}

export interface EdgeContext {
  geo: GeoData;
  device: DeviceData;
  locale: string;
  currency: string;
  timestamp: number;
  userAgent: string;
}

export interface PersonalizedContent {
  heroCopy?: {
    headline: string;
    subheadline?: string;
  };
  storePickup?: {
    available: boolean;
    nearestStore?: string;
    distance?: string;
    pickupTime?: string;
  };
  currency: {
    code: string;
    symbol: string;
    position: 'before' | 'after';
  };
  shipping?: {
    freeThreshold?: number;
    estimatedDays?: string;
    expressAvailable?: boolean;
  };
  promotions?: Array<{
    id: string;
    text: string;
    code?: string;
  }>;
}

export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  phone?: string;
  hours?: string;
  services?: string[];
}

// =============================================================================
// GEO DETECTION
// =============================================================================

/**
 * Extract geo data from request headers (Cloudflare, Vercel, etc.)
 */
export function extractGeoFromHeaders(headers: Headers): GeoData {
  // Try Cloudflare headers first
  const cfCountry = headers.get('cf-ipcountry');
  const cfCity = headers.get('cf-ipcity');
  const cfRegion = headers.get('cf-region');
  const cfLatitude = headers.get('cf-iplat');
  const cfLongitude = headers.get('cf-iplong');
  const cfTimezone = headers.get('cf-timezone');
  const cfPostalCode = headers.get('cf-postal-code');

  // Try Vercel headers
  const vercelCountry = headers.get('x-vercel-ip-country');
  const vercelCity = headers.get('x-vercel-ip-city');
  const vercelRegion = headers.get('x-vercel-ip-country-region');
  const vercelLatitude = headers.get('x-vercel-ip-latitude');
  const vercelLongitude = headers.get('x-vercel-ip-longitude');
  const vercelTimezone = headers.get('x-vercel-ip-timezone');

  const countryCode = cfCountry || vercelCountry || 'US';

  return {
    country: getCountryName(countryCode),
    countryCode,
    region: cfRegion || vercelRegion || undefined,
    city: cfCity || vercelCity || undefined,
    timezone: cfTimezone || vercelTimezone || 'America/New_York',
    latitude: parseFloat(cfLatitude || vercelLatitude || '0') || undefined,
    longitude: parseFloat(cfLongitude || vercelLongitude || '0') || undefined,
    postalCode: cfPostalCode || undefined,
  };
}

/**
 * Get country name from ISO code
 */
export function getCountryName(code: string): string {
  const countries: Record<string, string> = {
    US: 'United States',
    GB: 'United Kingdom',
    DE: 'Germany',
    FR: 'France',
    ES: 'Spain',
    IT: 'Italy',
    JP: 'Japan',
    KR: 'South Korea',
    CN: 'China',
    IN: 'India',
    BR: 'Brazil',
    AU: 'Australia',
    CA: 'Canada',
    MX: 'Mexico',
    NL: 'Netherlands',
    SE: 'Sweden',
    NO: 'Norway',
    DK: 'Denmark',
    FI: 'Finland',
    PL: 'Poland',
    AT: 'Austria',
    CH: 'Switzerland',
    BE: 'Belgium',
    IE: 'Ireland',
    PT: 'Portugal',
    SG: 'Singapore',
    HK: 'Hong Kong',
    TW: 'Taiwan',
    AE: 'United Arab Emirates',
    SA: 'Saudi Arabia',
    ZA: 'South Africa',
    NZ: 'New Zealand',
  };
  return countries[code] || code;
}

// =============================================================================
// DEVICE DETECTION
// =============================================================================

/**
 * Extract device data from user agent
 */
export function extractDeviceFromUserAgent(userAgent: string): DeviceData {
  const ua = userAgent.toLowerCase();

  // Mobile detection
  const isMobile = /mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua);

  // Tablet detection
  const isTablet = /tablet|ipad|android(?!.*mobile)|kindle|silk/i.test(ua) && !isMobile;

  // OS detection
  let os: string | undefined;
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

  // Browser detection
  let browser: string | undefined;
  if (/chrome/i.test(ua) && !/edge|edg/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/edge|edg/i.test(ua)) browser = 'Edge';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  return {
    type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
    os,
    browser,
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
  };
}

// =============================================================================
// CURRENCY & LOCALE
// =============================================================================

/**
 * Get currency for country
 */
export function getCurrencyForCountry(countryCode: string): {
  code: string;
  symbol: string;
  position: 'before' | 'after';
} {
  const currencies: Record<string, { code: string; symbol: string; position: 'before' | 'after' }> = {
    US: { code: 'USD', symbol: '$', position: 'before' },
    GB: { code: 'GBP', symbol: '£', position: 'before' },
    EU: { code: 'EUR', symbol: '€', position: 'before' },
    DE: { code: 'EUR', symbol: '€', position: 'after' },
    FR: { code: 'EUR', symbol: '€', position: 'after' },
    ES: { code: 'EUR', symbol: '€', position: 'after' },
    IT: { code: 'EUR', symbol: '€', position: 'after' },
    JP: { code: 'JPY', symbol: '¥', position: 'before' },
    CN: { code: 'CNY', symbol: '¥', position: 'before' },
    KR: { code: 'KRW', symbol: '₩', position: 'before' },
    IN: { code: 'INR', symbol: '₹', position: 'before' },
    BR: { code: 'BRL', symbol: 'R$', position: 'before' },
    AU: { code: 'AUD', symbol: 'A$', position: 'before' },
    CA: { code: 'CAD', symbol: 'C$', position: 'before' },
    MX: { code: 'MXN', symbol: '$', position: 'before' },
    CH: { code: 'CHF', symbol: 'CHF', position: 'before' },
    SE: { code: 'SEK', symbol: 'kr', position: 'after' },
    NO: { code: 'NOK', symbol: 'kr', position: 'after' },
    DK: { code: 'DKK', symbol: 'kr', position: 'after' },
    PL: { code: 'PLN', symbol: 'zł', position: 'after' },
    AE: { code: 'AED', symbol: 'د.إ', position: 'after' },
    SA: { code: 'SAR', symbol: 'ر.س', position: 'after' },
    SG: { code: 'SGD', symbol: 'S$', position: 'before' },
    HK: { code: 'HKD', symbol: 'HK$', position: 'before' },
    NZ: { code: 'NZD', symbol: 'NZ$', position: 'before' },
    ZA: { code: 'ZAR', symbol: 'R', position: 'before' },
  };

  return currencies[countryCode] || currencies['US']!;
}

/**
 * Get locale for country
 */
export function getLocaleForCountry(countryCode: string): string {
  const locales: Record<string, string> = {
    US: 'en-US',
    GB: 'en-GB',
    DE: 'de-DE',
    FR: 'fr-FR',
    ES: 'es-ES',
    IT: 'it-IT',
    JP: 'ja-JP',
    KR: 'ko-KR',
    CN: 'zh-CN',
    TW: 'zh-TW',
    IN: 'hi-IN',
    BR: 'pt-BR',
    PT: 'pt-PT',
    MX: 'es-MX',
    AR: 'es-AR',
    NL: 'nl-NL',
    SE: 'sv-SE',
    NO: 'nb-NO',
    DK: 'da-DK',
    FI: 'fi-FI',
    PL: 'pl-PL',
    RU: 'ru-RU',
    AE: 'ar-AE',
    SA: 'ar-SA',
    AU: 'en-AU',
    CA: 'en-CA',
    NZ: 'en-NZ',
  };

  return locales[countryCode] || 'en-US';
}

// =============================================================================
// PERSONALIZED CONTENT GENERATION
// =============================================================================

/**
 * Generate personalized content based on edge context
 */
export function generatePersonalizedContent(
  context: EdgeContext,
  config: {
    stores?: StoreLocation[];
    promotions?: Record<string, Array<{ id: string; text: string; code?: string }>>;
    shippingRules?: Record<string, { freeThreshold?: number; estimatedDays?: string; expressAvailable?: boolean }>;
    heroCopy?: Record<string, { headline: string; subheadline?: string }>;
  }
): PersonalizedContent {
  const { geo, device } = context;
  const currency = getCurrencyForCountry(geo.countryCode);

  const content: PersonalizedContent = {
    currency,
  };

  // Localized hero copy
  if (config.heroCopy) {
    content.heroCopy = config.heroCopy[geo.countryCode] || config.heroCopy['default'];
  }

  // Store pickup availability
  if (config.stores && geo.latitude && geo.longitude) {
    const nearestStore = findNearestStore(config.stores, geo.latitude, geo.longitude);
    if (nearestStore) {
      const distance = calculateDistance(
        geo.latitude,
        geo.longitude,
        nearestStore.latitude,
        nearestStore.longitude
      );
      content.storePickup = {
        available: distance <= 50, // Within 50km
        nearestStore: nearestStore.name,
        distance: `${distance.toFixed(1)} km`,
        pickupTime: 'Ready in 2 hours',
      };
    }
  }

  // Shipping info
  if (config.shippingRules) {
    content.shipping = config.shippingRules[geo.countryCode] || config.shippingRules['default'];
  }

  // Country-specific promotions
  if (config.promotions) {
    content.promotions = config.promotions[geo.countryCode] || config.promotions['default'];
  }

  return content;
}

/**
 * Find nearest store to coordinates
 */
export function findNearestStore(
  stores: StoreLocation[],
  lat: number,
  lng: number
): StoreLocation | null {
  if (stores.length === 0) return null;

  let nearest: StoreLocation | null = null;
  let minDistance = Infinity;

  stores.forEach((store) => {
    const distance = calculateDistance(lat, lng, store.latitude, store.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = store;
    }
  });

  return nearest;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// =============================================================================
// EDGE CONTEXT BUILDER
// =============================================================================

/**
 * Build edge context from request
 */
export function buildEdgeContext(request: Request): EdgeContext {
  const headers = new Headers(request.headers);
  const userAgent = headers.get('user-agent') || '';

  const geo = extractGeoFromHeaders(headers);
  const device = extractDeviceFromUserAgent(userAgent);
  const locale = getLocaleForCountry(geo.countryCode);
  const currency = getCurrencyForCountry(geo.countryCode).code;

  return {
    geo,
    device,
    locale,
    currency,
    timestamp: Date.now(),
    userAgent,
  };
}

// =============================================================================
// COOKIE UTILITIES
// =============================================================================

/**
 * Serialize edge context to cookie
 */
export function serializeEdgeContext(context: EdgeContext): string {
  const data = {
    cc: context.geo.countryCode,
    ct: context.geo.city,
    tz: context.geo.timezone,
    dt: context.device.type,
    lc: context.locale,
    cr: context.currency,
  };
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Deserialize edge context from cookie
 */
export function deserializeEdgeContext(cookie: string): Partial<EdgeContext> | null {
  try {
    const data = JSON.parse(Buffer.from(cookie, 'base64').toString('utf-8'));
    return {
      geo: {
        countryCode: data.cc,
        country: getCountryName(data.cc),
        city: data.ct,
        timezone: data.tz,
      },
      device: {
        type: data.dt,
        isMobile: data.dt === 'mobile',
        isTablet: data.dt === 'tablet',
        isDesktop: data.dt === 'desktop',
      },
      locale: data.lc,
      currency: data.cr,
    };
  } catch {
    return null;
  }
}
