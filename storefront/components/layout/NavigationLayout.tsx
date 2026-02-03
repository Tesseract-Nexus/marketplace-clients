'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { SidebarNav } from './SidebarNav';
import { MinimalNav } from './MinimalNav';
import { PromoBanner } from '@/components/marketing/PromoBanner';
import { BackToTop } from '@/components/ui/BackToTop';
import { NavigationStyle } from '@/types/storefront';
import { cn } from '@/lib/utils';

// Auth pages that should render without header/footer navigation
const AUTH_PAGES = [
  '/verify-email',
  '/forgot-password',
  '/reset-password',
];

interface NavigationLayoutProps {
  children: ReactNode;
  navigationStyle: NavigationStyle;
}

export function NavigationLayout({ children, navigationStyle }: NavigationLayoutProps) {
  const pathname = usePathname();

  // Check if current page is an auth page that should hide navigation
  // Handle both /verify-email and /tenant-slug/verify-email patterns
  const isAuthPage = AUTH_PAGES.some(authPath => {
    const pathParts = pathname.split('/').filter(Boolean);
    // Check if the last part(s) match the auth path
    const authParts = authPath.split('/').filter(Boolean);
    if (pathParts.length >= authParts.length) {
      const lastParts = pathParts.slice(-authParts.length);
      return lastParts.join('/') === authParts.join('/');
    }
    return false;
  });

  // For auth pages, render minimal layout without header/footer
  if (isAuthPage) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1">{children}</main>
      </div>
    );
  }
  // Header-based navigation (default)
  if (navigationStyle === 'header') {
    return (
      <div className="flex min-h-screen flex-col">
        <PromoBanner position="TOP" />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileNav />
        <BackToTop />
      </div>
    );
  }

  // Left sidebar navigation
  if (navigationStyle === 'sidebar-left') {
    return (
      <div className="flex min-h-screen">
        <SidebarNav position="left" />
        <div className="flex flex-col flex-1 ml-16">
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <BackToTop />
      </div>
    );
  }

  // Right sidebar navigation
  if (navigationStyle === 'sidebar-right') {
    return (
      <div className="flex min-h-screen">
        <div className="flex flex-col flex-1 mr-16">
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <SidebarNav position="right" />
        <BackToTop />
      </div>
    );
  }

  // Minimal navigation (headerless with floating menu)
  if (navigationStyle === 'minimal') {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">{children}</main>
        <Footer />
        <MinimalNav />
        <BackToTop />
      </div>
    );
  }

  // Fallback to header
  return (
    <div className="flex min-h-screen flex-col">
      <PromoBanner position="TOP" />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileNav />
      <BackToTop />
    </div>
  );
}
