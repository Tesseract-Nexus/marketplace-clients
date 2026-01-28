'use client';

import { useEffect, useMemo } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { StorefrontSettings } from '@/types/storefront';
import { generateCssVariables, isDarkTheme, isEditorialTheme } from '@/lib/theme/theme-utils';
import { loadFonts } from '@/lib/theme/fonts';
import { PushNotificationProvider } from '@/components/notifications';

// ========================================
// Theme Provider Props
// ========================================

interface ThemeProviderProps {
  children: React.ReactNode;
  settings: StorefrontSettings;
}

// ========================================
// Theme Provider Component
// ========================================

export function ThemeProvider({ children, settings }: ThemeProviderProps) {
  // Debug: Log theme settings for troubleshooting
  useEffect(() => {
    console.log('[ThemeProvider] Settings received:', {
      colorMode: settings.colorMode,
      themeTemplate: settings.themeTemplate,
      primaryColor: settings.primaryColor,
    });
  }, [settings.colorMode, settings.themeTemplate, settings.primaryColor]);

  // Generate CSS variables from settings
  const cssVariables = useMemo(() => generateCssVariables(settings), [settings]);

  // Detect if editorial mode is active
  const isEditorialMode = useMemo(() => {
    return settings.themeTemplate ? isEditorialTheme(settings.themeTemplate) : false;
  }, [settings.themeTemplate]);

  // Determine theme configuration
  // Explicit colorMode settings take precedence over themeTemplate
  const defaultTheme = useMemo(() => {
    let result: 'light' | 'dark' | 'system';
    // Explicit light mode always wins
    if (settings.colorMode === 'light') {
      result = 'light';
    }
    // Explicit dark mode always wins
    else if (settings.colorMode === 'dark') {
      result = 'dark';
    }
    // For 'system' or 'both', use theme template's dark-ness as default
    else if (isDarkTheme(settings.themeTemplate)) {
      result = 'dark';
    }
    else {
      result = 'system';
    }

    console.log('[ThemeProvider] Computed defaultTheme:', result, {
      colorMode: settings.colorMode,
      themeTemplate: settings.themeTemplate,
      isDarkTemplate: isDarkTheme(settings.themeTemplate),
    });

    return result;
  }, [settings.colorMode, settings.themeTemplate]);

  // Critical CSS variables that need !important to override globals.css defaults
  // Must match CRITICAL_VARIABLES in theme-utils.ts
  const CRITICAL_VARIABLES = [
    // Tenant colors
    '--tenant-primary',
    '--tenant-primary-light',
    '--tenant-primary-dark',
    '--tenant-secondary',
    '--tenant-secondary-light',
    '--tenant-secondary-dark',
    '--tenant-accent',
    '--tenant-background',
    '--tenant-foreground',
    '--tenant-primary-foreground',
    '--tenant-secondary-foreground',
    '--tenant-gradient',
    '--tenant-gradient-subtle',
    // Typography - prevent font flash
    '--font-heading',
    '--font-body',
    '--font-size-base',
    '--font-weight-heading',
    '--font-weight-body',
  ];

  // Inject CSS variables into document
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(cssVariables).forEach(([key, value]) => {
      // Use !important for critical variables to prevent FOUC
      const priority = CRITICAL_VARIABLES.includes(key) ? 'important' : '';
      root.style.setProperty(key, value, priority);
    });

    // Clean up on unmount
    return () => {
      Object.keys(cssVariables).forEach((key) => {
        root.style.removeProperty(key);
      });
    };
  }, [cssVariables]);

  // Toggle editorial mode class on body
  useEffect(() => {
    document.body.classList.toggle('editorial', isEditorialMode);

    // Clean up on unmount
    return () => {
      document.body.classList.remove('editorial');
    };
  }, [isEditorialMode]);

  // Load fonts
  useEffect(() => {
    const fonts = [
      settings.fontPrimary,
      settings.fontSecondary,
      settings.typographyConfig?.headingFont,
      settings.typographyConfig?.bodyFont,
    ].filter((f): f is string => Boolean(f));

    const uniqueFonts = [...new Set(fonts)];
    if (uniqueFonts.length > 0) {
      loadFonts(uniqueFonts).catch(console.error);
    }
  }, [settings.fontPrimary, settings.fontSecondary, settings.typographyConfig]);

  // Inject custom CSS
  useEffect(() => {
    const customCss = settings.advancedConfig?.customCss || settings.customCss;
    if (!customCss) return;

    const styleId = 'tenant-custom-css';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = customCss;

    return () => {
      styleEl?.remove();
    };
  }, [settings.advancedConfig?.customCss, settings.customCss]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem={settings.colorMode === 'system' || settings.colorMode === 'both'}
      disableTransitionOnChange
    >
      <PushNotificationProvider>
        {children}
      </PushNotificationProvider>
    </NextThemesProvider>
  );
}

// ========================================
// CSS Variables Style Component
// ========================================

interface CssVariablesStyleProps {
  settings: StorefrontSettings;
}

export function CssVariablesStyle({ settings }: CssVariablesStyleProps) {
  const cssVariables = useMemo(() => generateCssVariables(settings), [settings]);

  const cssString = Object.entries(cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n    ');

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root {\n    ${cssString}\n  }`,
      }}
    />
  );
}
