'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { SidebarNav } from './SidebarNav';
import { MinimalNav } from './MinimalNav';
import { PromoBanner } from '@/components/marketing/PromoBanner';
import { BackToTop } from '@/components/ui/BackToTop';
import { NavigationStyle } from '@/types/storefront';
import { cn } from '@/lib/utils';

interface NavigationLayoutProps {
  children: ReactNode;
  navigationStyle: NavigationStyle;
}

export function NavigationLayout({ children, navigationStyle }: NavigationLayoutProps) {
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
