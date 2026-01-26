import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';
import {
  StorefrontSettings,
  CreateStorefrontSettingsRequest,
  DEFAULT_STOREFRONT_SETTINGS,
  ApiResponse,
  ThemeTemplate,
  ColorMode,
} from '@/lib/api/types';

const SETTINGS_SERVICE_URL = getServiceUrl('SETTINGS');

/**
 * Transform backend homepageConfig to frontend format
 * Backend uses: showHero, Frontend uses: heroEnabled
 */
function transformHomepageConfig(backendConfig: Record<string, unknown> | null): StorefrontSettings['homepageConfig'] {
  if (!backendConfig) return DEFAULT_STOREFRONT_SETTINGS.homepageConfig;

  return {
    heroEnabled: (backendConfig.showHero as boolean) ?? (backendConfig.heroEnabled as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.homepageConfig.heroEnabled,
    heroBackgroundType: (backendConfig.heroBackgroundType as StorefrontSettings['homepageConfig']['heroBackgroundType']) || DEFAULT_STOREFRONT_SETTINGS.homepageConfig.heroBackgroundType,
    heroImage: backendConfig.heroImage as string | undefined,
    heroVideo: backendConfig.heroVideo as string | undefined,
    heroTitle: (backendConfig.heroTitle as string) || DEFAULT_STOREFRONT_SETTINGS.homepageConfig.heroTitle,
    heroSubtitle: (backendConfig.heroSubtitle as string) || DEFAULT_STOREFRONT_SETTINGS.homepageConfig.heroSubtitle,
    heroCtaText: (backendConfig.heroCtaText as string) || DEFAULT_STOREFRONT_SETTINGS.homepageConfig.heroCtaText,
    heroCtaLink: (backendConfig.heroCtaLink as string) || DEFAULT_STOREFRONT_SETTINGS.homepageConfig.heroCtaLink,
    heroOverlayOpacity: (backendConfig.heroOverlayOpacity as number) ?? DEFAULT_STOREFRONT_SETTINGS.homepageConfig.heroOverlayOpacity,
    sections: (backendConfig.sections as StorefrontSettings['homepageConfig']['sections']) || DEFAULT_STOREFRONT_SETTINGS.homepageConfig.sections,
    featuredProductIds: backendConfig.featuredProductIds as string[] | undefined,
    featuredCategoryIds: backendConfig.featuredCategoryIds as string[] | undefined,
    showNewsletter: (backendConfig.showNewsletter as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.homepageConfig.showNewsletter,
    newsletterTitle: backendConfig.newsletterTitle as string | undefined,
    newsletterSubtitle: backendConfig.newsletterSubtitle as string | undefined,
    showTestimonials: (backendConfig.showTestimonials as boolean) ?? false,
    testimonials: backendConfig.testimonials as StorefrontSettings['homepageConfig']['testimonials'],
  };
}

/**
 * Transform backend productConfig to frontend format
 * Backend uses: showWishlistButton, Frontend uses: showWishlist
 */
function transformProductConfig(backendConfig: Record<string, unknown> | null): StorefrontSettings['productConfig'] {
  if (!backendConfig) return DEFAULT_STOREFRONT_SETTINGS.productConfig;

  return {
    gridColumns: (backendConfig.gridColumns as 2 | 3 | 4) || DEFAULT_STOREFRONT_SETTINGS.productConfig.gridColumns,
    cardStyle: (backendConfig.cardStyle as StorefrontSettings['productConfig']['cardStyle']) || DEFAULT_STOREFRONT_SETTINGS.productConfig.cardStyle,
    showQuickView: (backendConfig.showQuickView as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.productConfig.showQuickView,
    showWishlist: (backendConfig.showWishlistButton as boolean) ?? (backendConfig.showWishlist as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.productConfig.showWishlist,
    showRatings: (backendConfig.showRatings as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.productConfig.showRatings,
    showSaleBadge: (backendConfig.showSaleBadge as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.productConfig.showSaleBadge,
    showStockStatus: (backendConfig.showStockStatus as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.productConfig.showStockStatus,
    imageAspectRatio: (backendConfig.imageAspectRatio as StorefrontSettings['productConfig']['imageAspectRatio']) || DEFAULT_STOREFRONT_SETTINGS.productConfig.imageAspectRatio,
    hoverEffect: (backendConfig.hoverEffect as StorefrontSettings['productConfig']['hoverEffect']) || DEFAULT_STOREFRONT_SETTINGS.productConfig.hoverEffect,
  };
}

/**
 * Transform backend footerConfig to frontend format
 */
function transformFooterConfig(backendConfig: Record<string, unknown> | null): StorefrontSettings['footerConfig'] {
  if (!backendConfig) return DEFAULT_STOREFRONT_SETTINGS.footerConfig;

  return {
    showFooter: (backendConfig.showFooter as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.footerConfig.showFooter,
    footerBgColor: backendConfig.footerBgColor as string | undefined,
    footerTextColor: backendConfig.footerTextColor as string | undefined,
    linkGroups: (backendConfig.linkGroups as StorefrontSettings['footerConfig']['linkGroups']) || DEFAULT_STOREFRONT_SETTINGS.footerConfig.linkGroups,
    showSocialIcons: (backendConfig.showSocialIcons as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.footerConfig.showSocialIcons,
    socialLinks: (backendConfig.socialLinks as StorefrontSettings['footerConfig']['socialLinks']) || DEFAULT_STOREFRONT_SETTINGS.footerConfig.socialLinks,
    showContactInfo: (backendConfig.showContactInfo as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.footerConfig.showContactInfo,
    contactEmail: backendConfig.contactEmail as string | undefined,
    contactPhone: backendConfig.contactPhone as string | undefined,
    contactAddress: backendConfig.contactAddress as string | undefined,
    showNewsletter: (backendConfig.showNewsletter as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.footerConfig.showNewsletter,
    copyrightText: backendConfig.copyrightText as string | undefined,
    showPoweredBy: (backendConfig.showPoweredBy as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.footerConfig.showPoweredBy,
  };
}

/**
 * Transform backend checkoutConfig to frontend format
 * Backend uses: termsRequired, Frontend uses: showTermsCheckbox
 */
function transformCheckoutConfig(backendConfig: Record<string, unknown> | null): StorefrontSettings['checkoutConfig'] {
  if (!backendConfig) return DEFAULT_STOREFRONT_SETTINGS.checkoutConfig;

  return {
    guestCheckoutEnabled: (backendConfig.guestCheckoutEnabled as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.checkoutConfig.guestCheckoutEnabled,
    showOrderNotes: (backendConfig.showOrderNotes as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.checkoutConfig.showOrderNotes,
    showGiftOptions: (backendConfig.showGiftOptions as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.checkoutConfig.showGiftOptions,
    requirePhone: (backendConfig.requirePhone as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.checkoutConfig.requirePhone,
    requireCompany: (backendConfig.requireCompany as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.checkoutConfig.requireCompany,
    showTrustBadges: (backendConfig.showTrustBadges as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.checkoutConfig.showTrustBadges,
    trustBadges: backendConfig.trustBadges as string[] | undefined,
    showTermsCheckbox: (backendConfig.termsRequired as boolean) ?? (backendConfig.showTermsCheckbox as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.checkoutConfig.showTermsCheckbox,
    termsText: backendConfig.termsText as string | undefined,
    termsLink: backendConfig.termsLink as string | undefined,
    showPaymentIcons: (backendConfig.showPaymentIcons as boolean) ?? DEFAULT_STOREFRONT_SETTINGS.checkoutConfig.showPaymentIcons,
    paymentIconsUrls: backendConfig.paymentIconsUrls as string[] | undefined,
  };
}

/**
 * Transform frontend config to backend format for saving
 */
function transformToBackendFormat(data: CreateStorefrontSettingsRequest): Record<string, unknown> {
  const advancedCustomCss = data.advancedConfig?.customCss;
  const resolvedCustomCss = data.customCss ?? advancedCustomCss;

  const result: Record<string, unknown> = {
    themeTemplate: data.themeTemplate,
    primaryColor: data.primaryColor,
    secondaryColor: data.secondaryColor,
    accentColor: data.accentColor,
    logoUrl: data.logoUrl,
    faviconUrl: data.faviconUrl,
    fontPrimary: data.fontPrimary,
    fontSecondary: data.fontSecondary,
    colorMode: data.colorMode,
    customCss: resolvedCustomCss,
  };

  // Transform homepageConfig: heroEnabled -> showHero
  if (data.homepageConfig) {
    const homepageConfig = data.homepageConfig as Record<string, unknown>;
    result.homepageConfig = {
      ...homepageConfig,
      showHero: homepageConfig.heroEnabled ?? homepageConfig.showHero,
    };
  }

  // Transform productConfig: showWishlist -> showWishlistButton
  if (data.productConfig) {
    const productConfig = data.productConfig as Record<string, unknown>;
    result.productConfig = {
      ...productConfig,
      showWishlistButton: productConfig.showWishlist ?? productConfig.showWishlistButton,
    };
  }

  // Transform checkoutConfig: showTermsCheckbox -> termsRequired
  if (data.checkoutConfig) {
    const checkoutConfig = data.checkoutConfig as Record<string, unknown>;
    result.checkoutConfig = {
      ...checkoutConfig,
      termsRequired: checkoutConfig.showTermsCheckbox ?? checkoutConfig.termsRequired,
    };
  }

  // Pass through other configs as-is
  if (data.headerConfig) result.headerConfig = data.headerConfig;
  if (data.footerConfig) result.footerConfig = data.footerConfig;

  // Pass through new enhanced configs
  if (data.typographyConfig) result.typographyConfig = data.typographyConfig;
  if (data.layoutConfig) result.layoutConfig = data.layoutConfig;
  if (data.spacingStyleConfig) result.spacingStyleConfig = data.spacingStyleConfig;
  if (data.mobileConfig) result.mobileConfig = data.mobileConfig;
  if (data.advancedConfig) result.advancedConfig = data.advancedConfig;

  return result;
}

/**
 * Transform Settings Service response to StorefrontSettings format
 */
function transformResponse(data: Record<string, unknown>, tenantId: string): StorefrontSettings {
  return {
    id: (data.id as string) || crypto.randomUUID(),
    tenantId: (data.tenantId as string) || tenantId,
    themeTemplate: (data.themeTemplate as ThemeTemplate) || DEFAULT_STOREFRONT_SETTINGS.themeTemplate,
    primaryColor: (data.primaryColor as string) || DEFAULT_STOREFRONT_SETTINGS.primaryColor,
    secondaryColor: (data.secondaryColor as string) || DEFAULT_STOREFRONT_SETTINGS.secondaryColor,
    accentColor: data.accentColor as string | undefined,
    logoUrl: data.logoUrl as string | undefined,
    faviconUrl: data.faviconUrl as string | undefined,
    fontPrimary: (data.fontPrimary as string) || DEFAULT_STOREFRONT_SETTINGS.fontPrimary,
    fontSecondary: (data.fontSecondary as string) || DEFAULT_STOREFRONT_SETTINGS.fontSecondary,
    colorMode: (data.colorMode as ColorMode) || DEFAULT_STOREFRONT_SETTINGS.colorMode,
    headerConfig: (data.headerConfig as StorefrontSettings['headerConfig']) || DEFAULT_STOREFRONT_SETTINGS.headerConfig,
    homepageConfig: transformHomepageConfig(data.homepageConfig as Record<string, unknown> | null),
    footerConfig: transformFooterConfig(data.footerConfig as Record<string, unknown> | null),
    productConfig: transformProductConfig(data.productConfig as Record<string, unknown> | null),
    checkoutConfig: transformCheckoutConfig(data.checkoutConfig as Record<string, unknown> | null),
    customCss: data.customCss as string | undefined,
    // Content pages
    contentPages: data.contentPages as StorefrontSettings['contentPages'],
    // Enhanced configs - pass through directly
    typographyConfig: data.typographyConfig as StorefrontSettings['typographyConfig'],
    layoutConfig: data.layoutConfig as StorefrontSettings['layoutConfig'],
    spacingStyleConfig: data.spacingStyleConfig as StorefrontSettings['spacingStyleConfig'],
    mobileConfig: data.mobileConfig as StorefrontSettings['mobileConfig'],
    advancedConfig: data.advancedConfig as StorefrontSettings['advancedConfig'],
    createdAt: (data.createdAt as string) || new Date().toISOString(),
    updatedAt: (data.updatedAt as string) || new Date().toISOString(),
  };
}

/**
 * GET /api/storefront/settings
 * Get storefront settings for a specific storefront
 * Uses getProxyHeaders which properly extracts JWT claims and forwards Istio headers
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<StorefrontSettings>>> {
  try {
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const storefrontId = request.headers.get('x-storefront-id') || request.headers.get('X-Storefront-ID');
    // IMPORTANT: tenant ID must come from JWT claims/BFF session, NOT from storefront ID
    const tenantId = headers['x-jwt-claim-tenant-id'];

    if (!storefrontId) {
      return NextResponse.json(
        { success: false, data: null as unknown as StorefrontSettings, message: 'X-Storefront-ID header is required' },
        { status: 400 }
      );
    }

    if (!tenantId) {
      console.error('GET /api/storefront/settings: Missing tenant ID in JWT claims');
      return NextResponse.json(
        { success: false, data: null as unknown as StorefrontSettings, message: 'Missing tenant ID - please log in again' },
        { status: 401 }
      );
    }

    // Extract user info from proxy headers (same as POST handler)
    const userId = headers['x-jwt-claim-sub'];
    const userEmail = headers['x-jwt-claim-email'];

    // Build headers for backend request
    const backendHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Storefront-ID': storefrontId,
      // Forward Istio JWT claim headers
      'x-jwt-claim-tenant-id': tenantId,
    };

    // Forward user identity headers (required by backend IstioAuth middleware)
    if (userId) {
      backendHeaders['x-jwt-claim-sub'] = userId;
    }
    if (userEmail) {
      backendHeaders['x-jwt-claim-email'] = userEmail;
    }

    // Forward Authorization header
    if (headers['Authorization']) {
      backendHeaders['Authorization'] = headers['Authorization'];
    }

    // Fetch from Settings Service - use storefrontId as the key
    // IMPORTANT: Use cache: 'no-store' to always fetch fresh data
    // This ensures saved settings are reflected immediately on page refresh
    const response = await fetch(
      `${SETTINGS_SERVICE_URL}/storefront-theme/${storefrontId}`,
      {
        method: 'GET',
        headers: backendHeaders,
        cache: 'no-store', // Disable caching to always get fresh data
      }
    );

    // Log the request for debugging
    console.log(`GET /api/storefront/settings: storefrontId=${storefrontId}, hasAuth=${!!headers['Authorization']}`);

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        console.log(`GET /api/storefront/settings: Success - themeTemplate=${result.data.themeTemplate}`);
        const settings = transformResponse(result.data, storefrontId);
        return NextResponse.json({
          success: true,
          data: settings,
        });
      }
      // Backend returned success=false or no data
      console.warn(`GET /api/storefront/settings: Backend returned success=false or no data:`, result.message || 'unknown');
    } else {
      // Backend returned error status
      const errorText = await response.text().catch(() => 'Unable to read response');
      console.error(`GET /api/storefront/settings: Backend error - status=${response.status}, body=${errorText}`);
    }

    // Return defaults if Settings Service is unavailable or returns error
    console.log(`GET /api/storefront/settings: Returning defaults for storefrontId=${storefrontId}`);
    const now = new Date().toISOString();
    const defaultSettings: StorefrontSettings = {
      id: crypto.randomUUID(),
      tenantId: tenantId,
      ...DEFAULT_STOREFRONT_SETTINGS,
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({
      success: true,
      data: defaultSettings,
    });
  } catch (error) {
    console.error('Error fetching storefront settings from Settings Service:', error);

    // Fallback to defaults on error - re-extract tenant ID from headers
    const errorHeaders = await getProxyHeaders(request).catch(() => ({})) as Record<string, string>;
    const fallbackTenantId = errorHeaders['x-jwt-claim-tenant-id'] || request.headers.get('x-storefront-id') || 'unknown';
    const now = new Date().toISOString();
    const defaultSettings: StorefrontSettings = {
      id: crypto.randomUUID(),
      tenantId: fallbackTenantId,
      ...DEFAULT_STOREFRONT_SETTINGS,
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({
      success: true,
      data: defaultSettings,
    });
  }
}

/**
 * POST /api/storefront/settings
 * Create or update storefront settings
 * Uses getProxyHeaders which properly extracts JWT claims and forwards Istio headers
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<StorefrontSettings>>> {
  try {
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const storefrontId = request.headers.get('x-storefront-id') || request.headers.get('X-Storefront-ID');
    // IMPORTANT: tenant ID must come from JWT claims/BFF session, NOT from storefront ID
    const tenantId = headers['x-jwt-claim-tenant-id'];
    const userId = headers['x-jwt-claim-sub'];
    const userEmail = headers['x-jwt-claim-email'];

    if (!storefrontId) {
      console.error('POST /api/storefront/settings: Missing X-Storefront-ID header');
      return NextResponse.json(
        { success: false, data: null as unknown as StorefrontSettings, message: 'X-Storefront-ID header is required' },
        { status: 400 }
      );
    }

    if (!tenantId) {
      console.error('POST /api/storefront/settings: Missing tenant ID in JWT claims');
      return NextResponse.json(
        { success: false, data: null as unknown as StorefrontSettings, message: 'Missing tenant ID - please log in again' },
        { status: 401 }
      );
    }

    // Log request info for debugging
    console.log(`POST /api/storefront/settings: storefrontId=${storefrontId}, tenantId=${tenantId}, userId=${userId ? 'set' : 'not set'}`);

    const body: CreateStorefrontSettingsRequest = await request.json();

    // Build headers for backend request
    const backendHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Storefront-ID': storefrontId,
      // Forward Istio JWT claim headers
      'x-jwt-claim-tenant-id': tenantId,
    };

    if (userId) {
      backendHeaders['x-jwt-claim-sub'] = userId;
    }
    if (userEmail) {
      backendHeaders['x-jwt-claim-email'] = userEmail;
    }
    if (headers['Authorization']) {
      backendHeaders['Authorization'] = headers['Authorization'];
    }

    // Transform frontend format to backend format
    const backendPayload = transformToBackendFormat(body);

    // Apply defaults for missing fields
    const payload: Record<string, unknown> = {
      themeTemplate: backendPayload.themeTemplate || DEFAULT_STOREFRONT_SETTINGS.themeTemplate,
      primaryColor: backendPayload.primaryColor || DEFAULT_STOREFRONT_SETTINGS.primaryColor,
      secondaryColor: backendPayload.secondaryColor || DEFAULT_STOREFRONT_SETTINGS.secondaryColor,
      accentColor: backendPayload.accentColor,
      logoUrl: backendPayload.logoUrl,
      faviconUrl: backendPayload.faviconUrl,
      fontPrimary: backendPayload.fontPrimary || DEFAULT_STOREFRONT_SETTINGS.fontPrimary,
      fontSecondary: backendPayload.fontSecondary || DEFAULT_STOREFRONT_SETTINGS.fontSecondary,
      colorMode: backendPayload.colorMode || DEFAULT_STOREFRONT_SETTINGS.colorMode,
      headerConfig: backendPayload.headerConfig || DEFAULT_STOREFRONT_SETTINGS.headerConfig,
      homepageConfig: backendPayload.homepageConfig || DEFAULT_STOREFRONT_SETTINGS.homepageConfig,
      footerConfig: backendPayload.footerConfig || DEFAULT_STOREFRONT_SETTINGS.footerConfig,
      productConfig: backendPayload.productConfig || DEFAULT_STOREFRONT_SETTINGS.productConfig,
      checkoutConfig: backendPayload.checkoutConfig || DEFAULT_STOREFRONT_SETTINGS.checkoutConfig,
      customCss: backendPayload.customCss,
    };

    // Include enhanced configs if present
    if (backendPayload.typographyConfig) payload.typographyConfig = backendPayload.typographyConfig;
    if (backendPayload.layoutConfig) payload.layoutConfig = backendPayload.layoutConfig;
    if (backendPayload.spacingStyleConfig) payload.spacingStyleConfig = backendPayload.spacingStyleConfig;
    if (backendPayload.mobileConfig) payload.mobileConfig = backendPayload.mobileConfig;
    if (backendPayload.advancedConfig) payload.advancedConfig = backendPayload.advancedConfig;

    // Send to Settings Service - use storefrontId as the key
    const backendUrl = `${SETTINGS_SERVICE_URL}/storefront-theme/${storefrontId}`;
    console.log(`POST /api/storefront/settings: Calling backend at ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: backendHeaders,
      body: JSON.stringify(payload),
    });

    // Parse response body once
    const result = await response.json().catch((e) => {
      console.error('Failed to parse backend response:', e);
      return { success: false, message: 'Invalid response from backend' };
    });

    if (response.ok && result.success && result.data) {
      console.log(`POST /api/storefront/settings: Success for storefrontId=${storefrontId}`);
      const settings = transformResponse(result.data, storefrontId);
      return NextResponse.json({
        success: true,
        data: settings,
        message: 'Storefront settings saved successfully',
      });
    }

    // Handle error response from Settings Service
    console.error(`POST /api/storefront/settings: Backend error - status=${response.status}, message=${result.message || 'unknown'}`);
    return NextResponse.json(
      {
        success: false,
        data: null as unknown as StorefrontSettings,
        message: result.message || `Failed to save storefront settings (status: ${response.status})`
      },
      { status: response.status || 500 }
    );
  } catch (error) {
    console.error('Error saving storefront settings to Settings Service:', error);
    return NextResponse.json(
      { success: false, data: null as unknown as StorefrontSettings, message: `Failed to save storefront settings: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/storefront/settings
 * Partially update storefront settings
 * Uses getProxyHeaders which properly extracts JWT claims and forwards Istio headers
 */
export async function PATCH(request: NextRequest): Promise<NextResponse<ApiResponse<StorefrontSettings>>> {
  try {
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const storefrontId = request.headers.get('x-storefront-id') || request.headers.get('X-Storefront-ID');
    // IMPORTANT: tenant ID must come from JWT claims/BFF session, NOT from storefront ID
    const tenantId = headers['x-jwt-claim-tenant-id'];
    const userId = headers['x-jwt-claim-sub'];
    const userEmail = headers['x-jwt-claim-email'];

    if (!storefrontId) {
      return NextResponse.json(
        { success: false, data: null as unknown as StorefrontSettings, message: 'X-Storefront-ID header is required' },
        { status: 400 }
      );
    }

    if (!tenantId) {
      console.error('PATCH /api/storefront/settings: Missing tenant ID in JWT claims');
      return NextResponse.json(
        { success: false, data: null as unknown as StorefrontSettings, message: 'Missing tenant ID - please log in again' },
        { status: 401 }
      );
    }

    const body: Partial<CreateStorefrontSettingsRequest> = await request.json();

    // Build headers for backend request
    const backendHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Storefront-ID': storefrontId,
      'x-jwt-claim-tenant-id': tenantId,
    };

    if (userId) {
      backendHeaders['x-jwt-claim-sub'] = userId;
    }
    if (userEmail) {
      backendHeaders['x-jwt-claim-email'] = userEmail;
    }
    if (headers['Authorization']) {
      backendHeaders['Authorization'] = headers['Authorization'];
    }

    // Transform frontend format to backend format
    const backendPayload = transformToBackendFormat(body as CreateStorefrontSettingsRequest);

    // Build partial payload for PATCH
    const patchPayload: Record<string, unknown> = {};
    if (backendPayload.themeTemplate) patchPayload.themeTemplate = backendPayload.themeTemplate;
    if (backendPayload.primaryColor) patchPayload.primaryColor = backendPayload.primaryColor;
    if (backendPayload.secondaryColor) patchPayload.secondaryColor = backendPayload.secondaryColor;
    if (backendPayload.accentColor !== undefined) patchPayload.accentColor = backendPayload.accentColor;
    if (backendPayload.logoUrl !== undefined) patchPayload.logoUrl = backendPayload.logoUrl;
    if (backendPayload.faviconUrl !== undefined) patchPayload.faviconUrl = backendPayload.faviconUrl;
    if (backendPayload.fontPrimary) patchPayload.fontPrimary = backendPayload.fontPrimary;
    if (backendPayload.fontSecondary) patchPayload.fontSecondary = backendPayload.fontSecondary;
    if (backendPayload.headerConfig) patchPayload.headerConfig = backendPayload.headerConfig;
    if (backendPayload.homepageConfig) patchPayload.homepageConfig = backendPayload.homepageConfig;
    if (backendPayload.footerConfig) patchPayload.footerConfig = backendPayload.footerConfig;
    if (backendPayload.productConfig) patchPayload.productConfig = backendPayload.productConfig;
    if (backendPayload.checkoutConfig) patchPayload.checkoutConfig = backendPayload.checkoutConfig;
    if (backendPayload.customCss !== undefined) patchPayload.customCss = backendPayload.customCss;
    // Enhanced configs
    if (backendPayload.typographyConfig) patchPayload.typographyConfig = backendPayload.typographyConfig;
    if (backendPayload.layoutConfig) patchPayload.layoutConfig = backendPayload.layoutConfig;
    if (backendPayload.spacingStyleConfig) patchPayload.spacingStyleConfig = backendPayload.spacingStyleConfig;
    if (backendPayload.mobileConfig) patchPayload.mobileConfig = backendPayload.mobileConfig;
    if (backendPayload.advancedConfig) patchPayload.advancedConfig = backendPayload.advancedConfig;
    // Content pages
    if ((body as Record<string, unknown>).contentPages) patchPayload.contentPages = (body as Record<string, unknown>).contentPages;

    // Send PATCH to Settings Service
    const response = await fetch(
      `${SETTINGS_SERVICE_URL}/storefront-theme/${storefrontId}`,
      {
        method: 'PATCH',
        headers: backendHeaders,
        body: JSON.stringify(patchPayload),
      }
    );

    // Parse response body once
    const result = await response.json().catch(() => ({ success: false, message: 'Invalid response from backend' }));

    if (response.ok && result.success && result.data) {
      const settings = transformResponse(result.data, storefrontId);
      return NextResponse.json({
        success: true,
        data: settings,
        message: 'Storefront settings updated successfully',
      });
    }

    // Handle error response
    return NextResponse.json(
      {
        success: false,
        data: null as unknown as StorefrontSettings,
        message: result.message || `Failed to update storefront settings (status: ${response.status})`
      },
      { status: response.status || 500 }
    );
  } catch (error) {
    console.error('Error updating storefront settings in Settings Service:', error);
    return NextResponse.json(
      { success: false, data: null as unknown as StorefrontSettings, message: 'Failed to update storefront settings' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/storefront/settings
 * Reset storefront settings to defaults
 * Uses getProxyHeaders which properly extracts JWT claims and forwards Istio headers
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<StorefrontSettings>>> {
  try {
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const storefrontId = request.headers.get('x-storefront-id') || request.headers.get('X-Storefront-ID');
    // IMPORTANT: tenant ID must come from JWT claims/BFF session, NOT from storefront ID
    const tenantId = headers['x-jwt-claim-tenant-id'];
    const userId = headers['x-jwt-claim-sub'];
    const userEmail = headers['x-jwt-claim-email'];

    if (!storefrontId) {
      return NextResponse.json(
        { success: false, data: null as unknown as StorefrontSettings, message: 'X-Storefront-ID header is required' },
        { status: 400 }
      );
    }

    if (!tenantId) {
      console.error('DELETE /api/storefront/settings: Missing tenant ID in JWT claims');
      return NextResponse.json(
        { success: false, data: null as unknown as StorefrontSettings, message: 'Missing tenant ID - please log in again' },
        { status: 401 }
      );
    }

    // Build headers for backend request
    const backendHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Storefront-ID': storefrontId,
      'x-jwt-claim-tenant-id': tenantId,
    };

    if (userId) {
      backendHeaders['x-jwt-claim-sub'] = userId;
    }
    if (userEmail) {
      backendHeaders['x-jwt-claim-email'] = userEmail;
    }
    if (headers['Authorization']) {
      backendHeaders['Authorization'] = headers['Authorization'];
    }

    // Delete from Settings Service
    const response = await fetch(
      `${SETTINGS_SERVICE_URL}/storefront-theme/${storefrontId}`,
      {
        method: 'DELETE',
        headers: backendHeaders,
      }
    );

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        const settings = transformResponse(result.data, storefrontId);
        return NextResponse.json({
          success: true,
          data: settings,
          message: 'Storefront settings reset to defaults',
        });
      }
    }

    // Return defaults on error
    const now = new Date().toISOString();
    const defaultSettings: StorefrontSettings = {
      id: crypto.randomUUID(),
      tenantId: tenantId,
      ...DEFAULT_STOREFRONT_SETTINGS,
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({
      success: true,
      data: defaultSettings,
      message: 'Storefront settings reset to defaults',
    });
  } catch (error) {
    console.error('Error resetting storefront settings in Settings Service:', error);

    // Fallback to defaults on error - re-extract tenant ID from headers
    const errorHeaders = await getProxyHeaders(request).catch(() => ({})) as Record<string, string>;
    const fallbackTenantId = errorHeaders['x-jwt-claim-tenant-id'] || request.headers.get('x-storefront-id') || 'unknown';
    const now = new Date().toISOString();
    const defaultSettings: StorefrontSettings = {
      id: crypto.randomUUID(),
      tenantId: fallbackTenantId,
      ...DEFAULT_STOREFRONT_SETTINGS,
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({
      success: true,
      data: defaultSettings,
      message: 'Storefront settings reset to defaults',
    });
  }
}
