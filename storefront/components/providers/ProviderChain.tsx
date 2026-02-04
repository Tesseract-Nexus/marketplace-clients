'use client';

import { ReactNode } from 'react';
import { TenantProvider } from '@/context/TenantContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthSessionProvider } from '@/components/providers/AuthSessionProvider';
import { CartSyncProvider } from '@/components/providers/CartSyncProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { TranslationProviderWrapper } from '@/components/providers/TranslationProviderWrapper';
import { RoutePrefetcher } from '@/components/providers/RoutePrefetcher';
import { NavigationLayout } from '@/components/layout/NavigationLayout';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { CookieConsentBanner } from '@/components/ui/CookieConsentBanner';
import { Toaster } from '@/components/ui/sonner';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd';
import type { StorefrontSettings, TenantInfo, StoreLocalization } from '@/types/storefront';

interface ProviderChainProps {
  children: ReactNode;
  tenant: TenantInfo;
  settings: StorefrontSettings;
  localization: StoreLocalization | null;
  baseUrl: string;
  storeName: string;
}

/**
 * Provider chain component
 * Groups all context providers in the correct order
 */
export function ProviderChain({
  children,
  tenant,
  settings,
  localization,
  baseUrl,
  storeName,
}: ProviderChainProps) {
  return (
    <>
      {/* Organization and WebSite JSON-LD for brand identity and search */}
      <OrganizationJsonLd
        organization={{
          name: storeName,
          url: baseUrl,
          logo: settings.logoUrl,
          sameAs: settings.footerConfig?.socialLinks?.map((s) => s.url) || [],
        }}
      />
      <WebSiteJsonLd name={storeName} url={baseUrl} searchUrl={`${baseUrl}/search`} />
      <QueryProvider>
        <TenantProvider tenant={tenant} settings={settings} localization={localization}>
          <CurrencyProvider>
            <ThemeProvider settings={settings}>
              <TranslationProviderWrapper>
                <AuthSessionProvider>
                  <CartSyncProvider>
                    <AnalyticsProvider>
                      <RoutePrefetcher />
                      <NavigationLayout
                        navigationStyle={settings.layoutConfig?.navigationStyle || 'header'}
                      >
                        <main id="main-content" tabIndex={-1}>
                          {children}
                        </main>
                      </NavigationLayout>
                      <CookieConsentBanner />
                      <Toaster />
                    </AnalyticsProvider>
                  </CartSyncProvider>
                </AuthSessionProvider>
              </TranslationProviderWrapper>
            </ThemeProvider>
          </CurrencyProvider>
        </TenantProvider>
      </QueryProvider>
    </>
  );
}

export default ProviderChain;
