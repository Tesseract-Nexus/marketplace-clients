'use client';

import { ReactNode } from 'react';
import { OpenPanelComponent } from '@openpanel/nextjs';
import { TenantProvider } from '@/context/TenantContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthSessionProvider } from '@/components/providers/AuthSessionProvider';
import { CartSyncProvider } from '@/components/providers/CartSyncProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { CsrfTokenInitializer } from '@/hooks/useCsrfToken';
import { TranslationProviderWrapper } from '@/components/providers/TranslationProviderWrapper';
import { RoutePrefetcher } from '@/components/providers/RoutePrefetcher';
import { NavigationLayout } from '@/components/layout/NavigationLayout';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { OpenPanelIdentify } from '@/components/analytics/OpenPanelIdentify';
import { CookieConsentBanner } from '@/components/ui/CookieConsentBanner';
import { PushNotificationPrompt } from '@/components/PushNotificationPrompt';
import { Toaster } from '@/components/ui/sonner';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd';
import type { StorefrontSettings, TenantInfo } from '@/types/storefront';
import type { StoreLocalization } from '@/lib/api/storefront';

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
      {/* OpenPanel product analytics */}
      <OpenPanelComponent
        clientId={process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!}
        apiUrl="/api/op"
        cdnUrl="/op1.js"
        trackScreenViews={true}
        trackAttributes={true}
        trackOutgoingLinks={true}
      />
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
        <CsrfTokenInitializer>
        <TenantProvider tenant={tenant} settings={settings} localization={localization ?? undefined}>
          <CurrencyProvider>
            <ThemeProvider settings={settings}>
              <TranslationProviderWrapper>
                <AuthSessionProvider>
                  <OpenPanelIdentify />
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
                      <PushNotificationPrompt />
                      <CookieConsentBanner />
                      <Toaster />
                    </AnalyticsProvider>
                  </CartSyncProvider>
                </AuthSessionProvider>
              </TranslationProviderWrapper>
            </ThemeProvider>
          </CurrencyProvider>
        </TenantProvider>
        </CsrfTokenInitializer>
      </QueryProvider>
    </>
  );
}

export default ProviderChain;
