import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import "./globals.css";
import { TenantInfo } from '@/types/storefront';
import { generateCssVariables, generateCssString } from '@/lib/theme/theme-utils';
import { getGoogleFontsUrl } from '@/lib/theme/fonts';
import { generateThemeScript, getThemeLoadingStyles } from '@/lib/theme/theme-script';
import { getDefaultSettings, mergeWithDefaults } from '@/lib/settings/settings-merge';
import { resolveStorefront, getContentPages, getStorefrontTheme, getMarketingSettings, getStoreLocalization, getStoreName } from '@/lib/api/storefront';
import { resolveTenantInfo } from '@/lib/tenant';
import { ComingSoonPage } from '@/components/ComingSoonPage';
import { ThemeSkeleton } from '@/components/loading/ThemeSkeleton';
import { ProviderChain } from '@/components/providers/ProviderChain';
import Script from 'next/script';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Storefront",
  description: "Beautiful multi-tenant ecommerce storefront",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug');
  const headerTenantId = headersList.get('x-tenant-id');
  const isPreviewMode = headersList.get('x-preview-mode') === 'true';
  const isCustomDomain = headersList.get('x-is-custom-domain') === 'true';
  const nonce = headersList.get('x-nonce') || '';

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
              Example: demo-store.mark8ly.com
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

  // Resolve real storefront ID from vendor-service
  const resolution = await resolveStorefront(slug);
  const storefrontId = resolution?.id || tenantHost.storefront_id || tenantHost.tenant_id;
  const tenantId = resolution?.tenantId || tenantHost.tenant_id;

  // Fetch theme settings, content pages, marketing settings, and localization in parallel
  const adminTenantId = (isCustomDomain && headerTenantId) ? headerTenantId : tenantHost.tenant_id;
  const [themeSettings, contentPages, marketingConfig, localization, adminStoreName] = await Promise.all([
    getStorefrontTheme(storefrontId, tenantId),
    getContentPages(storefrontId, tenantId, adminTenantId),
    getMarketingSettings(storefrontId, tenantId, adminTenantId),
    getStoreLocalization(storefrontId, tenantId, adminTenantId),
    getStoreName(storefrontId, adminTenantId),
  ]);

  // Merge settings with defaults
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
  ];
  const googleFontsUrl = getGoogleFontsUrl(fontsToLoad);

  // Check if storefront is published
  const isStorefrontActive = resolution?.isActive ?? true;
  const storeName = adminStoreName || resolution?.name || tenantHost.slug.charAt(0).toUpperCase() + tenantHost.slug.slice(1) + ' Store';

  // Show Coming Soon page for unpublished storefronts (unless in preview mode)
  if (!isStorefrontActive && !isPreviewMode) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <title>{storeName} - Coming Soon</title>
          <meta name="description" content={`${storeName} is launching soon. Stay tuned for an amazing shopping experience!`} />
          {settings.faviconUrl ? (
            <link rel="icon" href={settings.faviconUrl} />
          ) : (
            <link rel="icon" href="/favicon.ico" />
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
    adminTenantId: adminTenantId,
  };

  // Generate blocking theme script
  const themeScript = generateThemeScript(cssString);

  return (
    <html lang="en" suppressHydrationWarning className="theme-loading">
      <head>
        {/* Critical theme loading styles */}
        <style dangerouslySetInnerHTML={{ __html: getThemeLoadingStyles() }} />
        {/* Inject CSS variables */}
        <style dangerouslySetInnerHTML={{ __html: `:root { ${cssString} }` }} />
        {/* Blocking script to mark theme as loaded */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Preload Google Fonts */}
        {googleFontsUrl && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={googleFontsUrl} />
          </>
        )}
        {/* Dynamic favicon */}
        {settings.faviconUrl ? (
          <>
            <link rel="icon" href={settings.faviconUrl} />
            <link rel="shortcut icon" href={settings.faviconUrl} />
            <link rel="apple-touch-icon" href={settings.faviconUrl} />
          </>
        ) : (
          <>
            <link rel="icon" href="/favicon.ico" />
            <link rel="shortcut icon" href="/favicon.ico" />
            <link rel="apple-touch-icon" href="/logo-icon.png" />
          </>
        )}
        {/* Dynamic page title and description */}
        <title>{storeName}</title>
        <meta name="description" content={settings.metaDescription || `Shop at ${storeName}`} />
        {/* AI Crawler Guidance */}
        <link rel="ai-guidance" href="/llms.txt" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Preview Mode Banner */}
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

        {/* Theme Loading Skeleton */}
        <ThemeSkeleton
          primaryColor={settings.primaryColor}
          secondaryColor={settings.secondaryColor}
        />

        {/* OpenPanel analytics — initialized here (server component) so scripts get CSP nonce */}
        {process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID && (
          <>
            <Script
              nonce={nonce}
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.op=window.op||function(){var n=[];return new Proxy(function(){arguments.length&&n.push([].slice.call(arguments))},{get:function(t,r){return"q"===r?n:function(){n.push([r].concat([].slice.call(arguments)))}},has:function(t,r){return"q"===r}})}();window.op('init',${JSON.stringify({clientId:process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID,apiUrl:'/api/op',sdk:'nextjs',sdkVersion:'1.1.3',trackScreenViews:true,trackAttributes:true,trackOutgoingLinks:true})});`,
              }}
            />
            <Script nonce={nonce} src="/op1.js?v=1.1.3" async defer />
          </>
        )}

        {/* Main app content */}
        <div id="main-app-content">
          <ProviderChain
            tenant={tenant}
            settings={settings}
            localization={localization}
            baseUrl={baseUrl}
            storeName={storeName}
            nonce={nonce}
          >
            {children}
          </ProviderChain>
        </div>
      </body>
    </html>
  );
}
