import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import "./globals.css";
import { TenantProvider } from '@/context/TenantContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthSessionProvider } from '@/components/providers/AuthSessionProvider';
import { CartSyncProvider } from '@/components/providers/CartSyncProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { NavigationLayout } from '@/components/layout/NavigationLayout';
import { PushNotificationProvider } from '@/components/notifications/PushNotificationProvider';
import { TranslationProviderWrapper } from '@/components/providers/TranslationProviderWrapper';
import { RoutePrefetcher } from '@/components/providers/RoutePrefetcher';
import { StorefrontSettings, TenantInfo, DEFAULT_STOREFRONT_SETTINGS, THEME_PRESETS, GOOGLE_FONTS, NavigationStyle } from '@/types/storefront';
import { generateCssVariables, generateCssString } from '@/lib/theme/theme-utils';

import { resolveStorefront, getContentPages, getStorefrontTheme, getMarketingSettings, getStoreLocalization, getStoreName } from '@/lib/api/storefront';
import { resolveTenantInfo } from '@/lib/tenant';
import { ComingSoonPage } from '@/components/ComingSoonPage';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { CookieConsentBanner } from '@/components/ui/CookieConsentBanner';
import { Toaster } from '@/components/ui/sonner';

// Generate Google Fonts URL for preloading
function getGoogleFontsUrl(fonts: string[]): string | null {
  const FONT_WEIGHTS = [300, 400, 500, 600, 700, 800];
  const validFonts = fonts.filter(f => f && GOOGLE_FONTS.some(gf => gf.name === f));
  const uniqueFonts = [...new Set(validFonts)];

  if (uniqueFonts.length === 0) return null;

  const familyParams = uniqueFonts
    .map((font) => {
      const formattedName = font.replace(/\s+/g, '+');
      const weightString = FONT_WEIGHTS.join(';');
      return `family=${formattedName}:wght@${weightString}`;
    })
    .join('&');

  return `https://fonts.googleapis.com/css2?${familyParams}&display=swap`;
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Storefront",
  description: "Beautiful multi-tenant ecommerce storefront",
};

// Get default settings with theme preset
function getDefaultSettings(slug: string, tenantId?: string, themeTemplate?: string): StorefrontSettings {
  // Use the specified themeTemplate, or fall back to 'vibrant' as default
  const templateId = themeTemplate || 'vibrant';
  const theme = THEME_PRESETS.find(t => t.id === templateId) ?? THEME_PRESETS.find(t => t.id === 'vibrant') ?? THEME_PRESETS[0];
  return {
    ...DEFAULT_STOREFRONT_SETTINGS,
    id: slug,
    tenantId: tenantId || slug,
    themeTemplate: templateId,
    primaryColor: theme?.primaryColor ?? '#8B5CF6',
    secondaryColor: theme?.secondaryColor ?? '#EC4899',
    accentColor: theme?.accentColor ?? '#F59E0B',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as StorefrontSettings;
}

// Merge typography config ensuring all required fields exist
function mergeTypographyConfig(
  defaultConfig: StorefrontSettings['typographyConfig'],
  apiConfig: StorefrontSettings['typographyConfig'] | undefined
): StorefrontSettings['typographyConfig'] {
  const baseConfig = {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    baseFontSize: 16,
    headingScale: 'default' as const,
    headingWeight: 700 as const,
    bodyWeight: 400 as const,
    headingLineHeight: 'normal' as const,
    bodyLineHeight: 'normal' as const,
    headingLetterSpacing: 'normal' as const,
  };

  const merged = {
    ...baseConfig,
    ...(defaultConfig || {}),
    ...(apiConfig || {}),
  };

  // Ensure fonts are always set even if API returns empty strings
  return {
    ...merged,
    headingFont: merged.headingFont || baseConfig.headingFont,
    bodyFont: merged.bodyFont || baseConfig.bodyFont,
  };
}

// Merge layout config ensuring all required fields exist
function mergeLayoutConfig(
  defaultConfig: StorefrontSettings['layoutConfig'],
  apiConfig: StorefrontSettings['layoutConfig'] | undefined
): StorefrontSettings['layoutConfig'] {
  const baseConfig: StorefrontSettings['layoutConfig'] = {
    navigationStyle: 'header' as const,
    containerWidth: 'default' as const,
    contentPadding: 'default' as const,
    homepageLayout: 'hero-grid' as const,
    headerLayout: 'logo-left' as const,
    headerHeight: 'default' as const,
    footerLayout: 'multi-column' as const,
    productListLayout: 'grid' as const,
    productGridColumns: { mobile: 2, tablet: 3, desktop: 4 },
    productDetailLayout: 'image-left' as const,
    categoryLayout: 'sidebar-left' as const,
    showCategoryBanner: true,
  };

  return {
    ...baseConfig,
    ...(defaultConfig || {}),
    ...(apiConfig || {}),
  };
}

// Deep merge settings with defaults to ensure all required fields exist
function mergeWithDefaults(apiSettings: Partial<StorefrontSettings> | null, defaults: StorefrontSettings): StorefrontSettings {
  if (!apiSettings) return defaults;

  // If themeTemplate is set, derive colors from the preset if not explicitly provided
  let themeColors: { primaryColor?: string; secondaryColor?: string; accentColor?: string } = {};
  if (apiSettings.themeTemplate) {
    const preset = THEME_PRESETS.find(t => t.id === apiSettings.themeTemplate);
    if (preset) {
      themeColors = {
        primaryColor: preset.primaryColor,
        secondaryColor: preset.secondaryColor,
        accentColor: preset.accentColor,
      };
    }
  }

  return {
    ...defaults,
    ...apiSettings,
    // Use API colors if provided, otherwise use theme preset colors, then defaults
    primaryColor: apiSettings.primaryColor || themeColors.primaryColor || defaults.primaryColor,
    secondaryColor: apiSettings.secondaryColor || themeColors.secondaryColor || defaults.secondaryColor,
    accentColor: apiSettings.accentColor || themeColors.accentColor || defaults.accentColor,
    // Ensure fonts are always set (even if API returns empty strings)
    fontPrimary: apiSettings.fontPrimary || defaults.fontPrimary,
    fontSecondary: apiSettings.fontSecondary || defaults.fontSecondary,
    colorMode: apiSettings.colorMode || defaults.colorMode,
    // Deep merge nested configs
    headerConfig: {
      ...defaults.headerConfig,
      ...(apiSettings.headerConfig || {}),
    },
    homepageConfig: {
      ...defaults.homepageConfig,
      ...(apiSettings.homepageConfig || {}),
    },
    footerConfig: {
      ...defaults.footerConfig,
      ...(apiSettings.footerConfig || {}),
    },
    productConfig: {
      ...defaults.productConfig,
      ...(apiSettings.productConfig || {}),
    },
    checkoutConfig: {
      ...defaults.checkoutConfig,
      ...(apiSettings.checkoutConfig || {}),
    },
    typographyConfig: mergeTypographyConfig(defaults.typographyConfig, apiSettings.typographyConfig),
    layoutConfig: mergeLayoutConfig(defaults.layoutConfig, apiSettings.layoutConfig),
    // Merge marketing config from admin settings
    marketingConfig: {
      ...defaults.marketingConfig,
      ...(apiSettings.marketingConfig || {}),
    } as StorefrontSettings['marketingConfig'],
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get tenant slug and preview mode from headers (set by middleware)
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug');
  const isPreviewMode = headersList.get('x-preview-mode') === 'true';

  // If no tenant slug, show landing page
  if (!slug) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 p-8 text-white">
            <h1 className="mb-4 text-4xl font-bold">Tesserix Storefront</h1>
            <p className="mb-8 text-lg opacity-90">
              Access your store via your tenant subdomain
            </p>
            <p className="text-sm opacity-75">
              Example: demo-store.tesserix.app
            </p>
          </div>
        </body>
      </html>
    );
  }

  // Fetch tenant info to validate
  const tenantHost = await resolveTenantInfo(slug);

  if (!tenantHost) {
    notFound();
  }

  // Resolve real storefront ID from vendor-service to ensure we have the correct ID for settings
  const resolution = await resolveStorefront(slug);

  // Use resolved ID if available, otherwise fall back to tenant-router info
  const storefrontId = resolution?.id || tenantHost.storefront_id || tenantHost.tenant_id;
  const tenantId = resolution?.tenantId || tenantHost.tenant_id;

  // Log ID resolution for debugging theme settings issues
  console.log(`[RootLayout] Tenant slug: ${slug}`);
  console.log(`[RootLayout] Resolution from vendor-service: id=${resolution?.id}, tenantId=${resolution?.tenantId}`);
  console.log(`[RootLayout] TenantHost from router: storefront_id=${tenantHost.storefront_id}, tenant_id=${tenantHost.tenant_id}`);
  console.log(`[RootLayout] Final IDs: storefrontId=${storefrontId}, tenantId=${tenantId}`);

  // Fetch theme settings, content pages, marketing settings, and localization in parallel
  // tenantHost.tenant_id is the authoritative tenant ID from the tenant-router,
  // matching the JWT tenant_id the admin uses when saving settings
  const adminTenantId = tenantHost.tenant_id;
  const [themeSettings, contentPages, marketingConfig, localization, adminStoreName] = await Promise.all([
    getStorefrontTheme(storefrontId, tenantId),
    getContentPages(storefrontId, tenantId, adminTenantId),
    getMarketingSettings(storefrontId, tenantId, adminTenantId),
    getStoreLocalization(storefrontId, tenantId, adminTenantId),
    getStoreName(storefrontId, adminTenantId),
  ]);

  // Pass themeTemplate to get correct default colors based on the selected theme
  const defaults = getDefaultSettings(slug, tenantId, themeSettings?.themeTemplate);
  const settings = mergeWithDefaults(
    { ...themeSettings, contentPages, marketingConfig: marketingConfig || undefined },
    defaults
  );

  // Construct base URL for SEO schemas
  const host = headersList.get('host') || '';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  // Generate CSS variables server-side to prevent FOUC
  const cssVariables = generateCssVariables(settings);
  const cssString = generateCssString(cssVariables);

  // Generate Google Fonts URL for server-side preloading
  const fontsToLoad = [
    settings.typographyConfig?.headingFont,
    settings.typographyConfig?.bodyFont,
    settings.fontPrimary,
    settings.fontSecondary,
  ].filter((f): f is string => Boolean(f));
  const googleFontsUrl = getGoogleFontsUrl(fontsToLoad);

  // Check if storefront is published (isActive)
  // If not published and not in preview mode, show Coming Soon page
  const isStorefrontActive = resolution?.isActive ?? true; // Default to true for backward compatibility
  const storeName = adminStoreName || resolution?.name || tenantHost.slug.charAt(0).toUpperCase() + tenantHost.slug.slice(1) + ' Store';

  // Show Coming Soon page for unpublished storefronts (unless in preview mode)
  if (!isStorefrontActive && !isPreviewMode) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <title>{storeName} - Coming Soon</title>
          <meta name="description" content={`${storeName} is launching soon. Stay tuned for an amazing shopping experience!`} />
          {/* Dynamic Favicon from storefront settings */}
          {settings.faviconUrl && (
            <link rel="icon" href={settings.faviconUrl} />
          )}
        </head>
        <body className={`${inter.variable} font-sans antialiased`}>
          <ComingSoonPage
            storeName={storeName}
            logoUrl={resolution?.logoUrl || settings.logoUrl}
            themeConfig={{
              primaryColor: settings.primaryColor,
              secondaryColor: settings.secondaryColor,
              accentColor: settings.accentColor,
            }}
          />
        </body>
      </html>
    );
  }

  // Create tenant info
  const tenant: TenantInfo = {
    id: tenantHost.tenant_id,
    slug: tenantHost.slug,
    name: storeName,
    storefrontId: storefrontId,
    logoUrl: settings.logoUrl,
    isActive: isStorefrontActive,
  };

  // Create blocking script that sets CSS variables before any paint
  const themeScript = `
    (function() {
      var css = ${JSON.stringify(cssString)};
      var style = document.createElement('style');
      style.id = 'theme-blocking';
      style.textContent = ':root{' + css + '}';
      document.head.insertBefore(style, document.head.firstChild);
      document.documentElement.classList.add('theme-loaded');
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning className="theme-loading">
      <head>
        {/* CRITICAL: Theme loading styles - show skeleton while loading */}
        <style dangerouslySetInnerHTML={{ __html: `
          /* Hide main content until theme is loaded */
          html.theme-loading #main-app-content {
            display: none !important;
          }
          /* Show skeleton loader while theme is loading */
          html.theme-loading #theme-skeleton {
            display: block !important;
          }
          /* Once loaded, show content and hide skeleton */
          html.theme-loaded #main-app-content {
            display: block !important;
            animation: fadeIn 0.2s ease-out;
          }
          html.theme-loaded #theme-skeleton {
            display: none !important;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          /* Skeleton styles */
          @keyframes skeleton-pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
          }
          @keyframes skeleton-shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .skeleton-pulse {
            animation: skeleton-pulse 1.5s ease-in-out infinite;
          }
          .skeleton-shimmer {
            position: relative;
            overflow: hidden;
          }
          .skeleton-shimmer::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            animation: skeleton-shimmer 1.5s ease-in-out infinite;
          }
        `}} />
        {/* Inject CSS variables as style tag - before any other styles */}
        <style dangerouslySetInnerHTML={{ __html: `:root { ${cssString} }` }} />
        {/* Blocking script to mark theme as loaded */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Preload Google Fonts to prevent flash of unstyled text */}
        {googleFontsUrl && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={googleFontsUrl} />
          </>
        )}
        {/* Dynamic favicon from admin settings */}
        {settings.faviconUrl && (
          <>
            <link rel="icon" href={settings.faviconUrl} />
            <link rel="shortcut icon" href={settings.faviconUrl} />
            <link rel="apple-touch-icon" href={settings.faviconUrl} />
          </>
        )}
        {/* Dynamic page title */}
        <title>{storeName}</title>
        <meta name="description" content={`Shop at ${storeName} - Discover amazing products`} />
        {/* AI Crawler Guidance */}
        <link rel="ai-guidance" href="/llms.txt" />
        {/* Dynamic Favicon from storefront settings */}
        {settings.faviconUrl && (
          <link rel="icon" href={settings.faviconUrl} />
        )}
        {/* Dynamic page title and description */}
        <title>{storeName}</title>
        <meta name="description" content={(settings as any).metaDescription || `Shop at ${storeName}`} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Preview Mode Banner for unpublished stores */}
        {isPreviewMode && !isStorefrontActive && (
          <div
            className="fixed top-0 left-0 right-0 py-2 px-4 text-center text-sm font-medium text-white z-[var(--z-sticky)]"
            style={{ backgroundColor: settings.accentColor || '#F59E0B' }}
          >
            Preview Mode - This store is not yet published. Only you can see this preview.
          </div>
        )}
        {/* Skip to main content link for accessibility */}
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>

        {/* Theme Loading Skeleton - shown while styles initialize */}
        <div id="theme-skeleton" style={{ display: 'none' }}>
          {/* Header skeleton */}
          <div style={{
            height: '64px',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            background: 'var(--background, #fff)'
          }}>
            <div className="skeleton-pulse skeleton-shimmer" style={{
              height: '32px',
              width: '120px',
              borderRadius: '6px',
              background: 'var(--muted, #f1f5f9)'
            }} />
            <div style={{ display: 'flex', gap: '24px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-pulse" style={{
                  height: '16px',
                  width: '60px',
                  borderRadius: '4px',
                  background: 'var(--muted, #f1f5f9)'
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="skeleton-pulse" style={{
                height: '36px',
                width: '36px',
                borderRadius: '50%',
                background: 'var(--muted, #f1f5f9)'
              }} />
              <div className="skeleton-pulse" style={{
                height: '36px',
                width: '36px',
                borderRadius: '50%',
                background: 'var(--muted, #f1f5f9)'
              }} />
            </div>
          </div>

          {/* Hero skeleton */}
          <div style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${settings.primaryColor}15 0%, ${settings.secondaryColor}15 100%)`
          }}>
            <div style={{ padding: '64px 24px', maxWidth: '600px' }}>
              <div className="skeleton-pulse skeleton-shimmer" style={{
                height: '32px',
                width: '180px',
                borderRadius: '16px',
                marginBottom: '24px',
                background: 'var(--muted, #f1f5f9)'
              }} />
              <div className="skeleton-pulse skeleton-shimmer" style={{
                height: '48px',
                width: '100%',
                maxWidth: '500px',
                borderRadius: '8px',
                marginBottom: '12px',
                background: 'var(--muted, #f1f5f9)'
              }} />
              <div className="skeleton-pulse skeleton-shimmer" style={{
                height: '48px',
                width: '75%',
                borderRadius: '8px',
                marginBottom: '24px',
                background: 'var(--muted, #f1f5f9)'
              }} />
              <div className="skeleton-pulse" style={{
                height: '24px',
                width: '300px',
                borderRadius: '4px',
                marginBottom: '32px',
                background: 'var(--muted, #f1f5f9)'
              }} />
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="skeleton-pulse" style={{
                  height: '48px',
                  width: '140px',
                  borderRadius: '8px',
                  background: settings.primaryColor,
                  opacity: 0.4
                }} />
                <div className="skeleton-pulse" style={{
                  height: '48px',
                  width: '140px',
                  borderRadius: '8px',
                  background: 'var(--muted, #f1f5f9)'
                }} />
              </div>
            </div>
          </div>

          {/* Products grid skeleton */}
          <div style={{ padding: '64px 24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px'
            }}>
              <div className="skeleton-pulse skeleton-shimmer" style={{
                height: '32px',
                width: '200px',
                borderRadius: '8px',
                background: 'var(--muted, #f1f5f9)'
              }} />
              <div className="skeleton-pulse" style={{
                height: '16px',
                width: '80px',
                borderRadius: '4px',
                background: 'var(--muted, #f1f5f9)'
              }} />
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '24px'
            }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid rgba(0,0,0,0.1)',
                  background: 'var(--card, #fff)'
                }}>
                  <div className="skeleton-pulse skeleton-shimmer" style={{
                    aspectRatio: '1',
                    background: 'var(--muted, #f1f5f9)'
                  }} />
                  <div style={{ padding: '16px' }}>
                    <div className="skeleton-pulse" style={{
                      height: '12px',
                      width: '60px',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      background: 'var(--muted, #f1f5f9)'
                    }} />
                    <div className="skeleton-pulse" style={{
                      height: '16px',
                      width: '100%',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      background: 'var(--muted, #f1f5f9)'
                    }} />
                    <div className="skeleton-pulse" style={{
                      height: '20px',
                      width: '80px',
                      borderRadius: '4px',
                      marginTop: '12px',
                      background: 'var(--muted, #f1f5f9)'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Loading indicator */}
          <div style={{
            position: 'fixed',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '9999px',
            background: 'var(--background, #fff)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.1)'
          }}>
            {[0, 150, 300].map((delay) => (
              <div
                key={delay}
                style={{
                  height: '8px',
                  width: '8px',
                  borderRadius: '50%',
                  background: settings.primaryColor,
                  animation: 'bounce 1s ease-in-out infinite',
                  animationDelay: `${delay}ms`
                }}
              />
            ))}
          </div>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
            }
          `}} />
        </div>

        {/* Main app content - hidden while skeleton is shown */}
        <div id="main-app-content">
        {/* Organization and WebSite JSON-LD for brand identity and search */}
        <OrganizationJsonLd
          organization={{
            name: storeName,
            url: baseUrl,
            logo: settings.logoUrl,
            sameAs: settings.footerConfig?.socialLinks?.map(s => s.url) || [],
          }}
        />
        <WebSiteJsonLd
          name={storeName}
          url={baseUrl}
          searchUrl={`${baseUrl}/search`}
        />
        <QueryProvider>
          <TenantProvider tenant={tenant} settings={settings} localization={localization}>
            <CurrencyProvider>
              <ThemeProvider settings={settings}>
                <TranslationProviderWrapper>
                  <AuthSessionProvider>
                    <CartSyncProvider>
                      <PushNotificationProvider>
                        <AnalyticsProvider>
                          <RoutePrefetcher />
                          <NavigationLayout navigationStyle={settings.layoutConfig?.navigationStyle || 'header'}>
                            <main id="main-content" tabIndex={-1}>
                              {children}
                            </main>
                          </NavigationLayout>
                          <CookieConsentBanner />
                          <Toaster />
                        </AnalyticsProvider>
                      </PushNotificationProvider>
                    </CartSyncProvider>
                  </AuthSessionProvider>
                </TranslationProviderWrapper>
              </ThemeProvider>
            </CurrencyProvider>
          </TenantProvider>
        </QueryProvider>
        </div>{/* End main-app-content */}
      </body>
    </html>
  );
}
