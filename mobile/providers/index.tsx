import React, { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';
import { ToastProvider } from './ToastProvider';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Root providers wrapper that sets up all app-wide contexts
 * Order matters: QueryProvider -> ThemeProvider -> AuthProvider -> ToastProvider
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Re-export individual providers and hooks
export { ThemeProvider, useThemeContext, useTheme, useColors, useIsDark } from './ThemeProvider';
export { AuthProvider, useAuth } from './AuthProvider';
export { QueryProvider, queryClient, queryKeys, invalidateTenantQueries } from './QueryProvider';
