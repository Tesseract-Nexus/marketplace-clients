import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';

import { useThemeStore, useTheme, useIsDark, useThemeMode } from '@/stores/theme-store';
import { useTenantStore } from '@/stores/tenant-store';

import type { Theme, ThemeMode } from '@/types/theme';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useTheme();
  const mode = useThemeMode();
  const isDark = useIsDark();
  const { setMode, toggleMode, applyTenantTheme } = useThemeStore();
  const currentTenant = useTenantStore((state) => state.currentTenant);

  // Apply tenant theme when tenant changes
  useEffect(() => {
    applyTenantTheme();
  }, [currentTenant?.id, currentTenant?.settings?.theme, applyTenantTheme]);

  // Update navigation bar on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      void NavigationBar.setBackgroundColorAsync(
        isDark ? theme.colors.background : theme.colors.background
      );
      void NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [isDark, theme.colors.background]);

  const contextValue: ThemeContextValue = {
    theme,
    mode,
    isDark,
    setMode,
    toggleMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

// Re-export theme hooks for convenience
export { useTheme, useIsDark, useThemeMode, useColors, useBorderRadius, useShadows, useSpacing } from '@/stores/theme-store';
