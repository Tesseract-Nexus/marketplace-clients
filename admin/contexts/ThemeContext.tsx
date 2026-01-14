'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AdminBrandingSettings } from '@/lib/types/settings';

// Re-export the type for backwards compatibility
export type BrandingSettings = AdminBrandingSettings;

const defaultBrandingSettings: BrandingSettings = {
  general: {
    adminTitle: 'Admin Panel',
    adminSubtitle: 'Ecommerce Hub',
    logoUrl: '',
    faviconUrl: '',
    loginPageTitle: 'Welcome Back',
    loginPageSubtitle: 'Sign in to your account',
  },
  colors: {
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    accentColor: '#a855f7',
    sidebarBg: '#1e293b',
    sidebarText: '#cbd5e1',
    sidebarActiveText: '#60a5fa',
    headerBg: '#ffffff',
    headerText: '#374151',
  },
  appearance: {
    sidebarStyle: 'dark',
    headerStyle: 'light',
    borderRadius: 'medium',
    fontFamily: 'inter',
    compactMode: false,
    showBreadcrumbs: true,
    showSearch: true,
    animationsEnabled: true,
  },
  advanced: {
    customCss: '',
    customLogo: true,
    showPoweredBy: false,
    enableCustomFonts: false,
    customFontUrl: '',
  },
};

interface ThemeContextType {
  branding: BrandingSettings;
  updateBranding: (newBranding: BrandingSettings) => void;
  resetBranding: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>(defaultBrandingSettings);
  const [isClient, setIsClient] = useState(false);

  // Load branding from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('admin-branding');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Deep merge with defaults to ensure all required properties exist
        const merged: BrandingSettings = {
          general: { ...defaultBrandingSettings.general, ...parsed.general },
          colors: { ...defaultBrandingSettings.colors, ...parsed.colors },
          appearance: { ...defaultBrandingSettings.appearance, ...parsed.appearance },
          advanced: { ...defaultBrandingSettings.advanced, ...parsed.advanced },
        };
        setBranding(merged);
      } catch (error) {
        console.error('Failed to parse saved branding:', error);
        // Clear corrupted data
        localStorage.removeItem('admin-branding');
      }
    }
  }, []);

  // Apply CSS variables when branding changes
  useEffect(() => {
    if (!isClient) return;

    const root = document.documentElement;
    const colors = branding.colors || defaultBrandingSettings.colors;
    const appearance = branding.appearance || defaultBrandingSettings.appearance;
    const general = branding.general || defaultBrandingSettings.general;
    const advanced = branding.advanced || defaultBrandingSettings.advanced;

    // Apply color variables
    root.style.setProperty('--color-primary', colors.primaryColor);
    root.style.setProperty('--color-secondary', colors.secondaryColor);
    root.style.setProperty('--color-accent', colors.accentColor);
    root.style.setProperty('--color-sidebar-bg', colors.sidebarBg);
    root.style.setProperty('--color-sidebar-text', colors.sidebarText);
    root.style.setProperty('--color-sidebar-active-text', colors.sidebarActiveText);
    root.style.setProperty('--color-header-bg', colors.headerBg);
    root.style.setProperty('--color-header-text', colors.headerText);

    // Apply border radius
    const radiusMap: Record<string, string> = {
      none: '0px',
      small: '4px',
      medium: '8px',
      large: '12px',
      xl: '16px',
    };
    root.style.setProperty('--border-radius', radiusMap[appearance.borderRadius] || '8px');

    // Apply font family
    const fontMap: Record<string, string> = {
      inter: 'Inter, system-ui, sans-serif',
      roboto: 'Roboto, system-ui, sans-serif',
      poppins: 'Poppins, system-ui, sans-serif',
      montserrat: 'Montserrat, system-ui, sans-serif',
      system: 'system-ui, -apple-system, sans-serif',
    };
    root.style.setProperty('--font-family', fontMap[appearance.fontFamily] || fontMap.inter);

    // Apply compact mode
    if (appearance.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }

    // Apply animations
    if (!appearance.animationsEnabled) {
      root.classList.add('no-animations');
    } else {
      root.classList.remove('no-animations');
    }

    // Apply custom CSS
    let styleElement = document.getElementById('custom-admin-css');
    if (advanced.customCss) {
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'custom-admin-css';
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = advanced.customCss;
    } else if (styleElement) {
      styleElement.remove();
    }

    // Apply custom fonts
    let fontLinkElement = document.getElementById('custom-font-link') as HTMLLinkElement | null;
    if (advanced.enableCustomFonts && advanced.customFontUrl) {
      if (!fontLinkElement) {
        fontLinkElement = document.createElement('link') as HTMLLinkElement;
        fontLinkElement.id = 'custom-font-link';
        fontLinkElement.rel = 'stylesheet';
        document.head.appendChild(fontLinkElement);
      }
      fontLinkElement.href = advanced.customFontUrl;
    } else if (fontLinkElement) {
      fontLinkElement.remove();
    }

    // Update favicon
    if (general.faviconUrl) {
      let faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
      }
      faviconLink.href = general.faviconUrl;
    }

    // Update page title
    document.title = `${general.adminTitle || 'Admin Panel'} - ${general.adminSubtitle || 'Ecommerce Hub'}`;
  }, [branding, isClient]);

  const updateBranding = (newBranding: BrandingSettings) => {
    setBranding(newBranding);
    localStorage.setItem('admin-branding', JSON.stringify(newBranding));
  };

  const resetBranding = () => {
    setBranding(defaultBrandingSettings);
    localStorage.removeItem('admin-branding');
  };

  return (
    <ThemeContext.Provider value={{ branding, updateBranding, resetBranding }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
