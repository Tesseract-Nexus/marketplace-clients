import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';

import { useAuthStore } from '@/stores/auth-store';

import type { User, Tenant } from '@/types/entities';

interface AuthContextValue {
  user: User | null;
  tenants: Tenant[];
  currentTenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; first_name: string; last_name: string }) => Promise<void>;
  logout: () => Promise<void>;
  setCurrentTenant: (tenantId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  const {
    user,
    tenants,
    currentTenant,
    isAuthenticated,
    isLoading,
    isInitialized,
    login: authLogin,
    register: authRegister,
    logout: authLogout,
    setCurrentTenant,
    initialize,
  } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    void initialize();
  }, [initialize]);

  // Handle auth-based navigation
  useEffect(() => {
    if (!navigationState?.key || !isInitialized) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    // Check if user has a store (either through tenants list or user's tenant_id)
    const hasStore = tenants.length > 0 || !!user?.tenant_id;

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated and not on auth screens -> go to login
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated but on auth screens - navigate to appropriate location
      // Skip email verification check for now (dev bypass available)
      // In production, uncomment the email verification check
      // if (!user?.email_verified) {
      //   router.replace('/verify-email');
      // } else
      if (hasStore) {
        // User has a store -> go to admin dashboard
        router.replace('/(tabs)/(admin)/dashboard');
      } else {
        // No store -> go to onboarding
        router.replace('/store-setup');
      }
    } else if (isAuthenticated && !hasStore && !inOnboardingGroup && !inAuthGroup) {
      // Authenticated but no store and not in onboarding -> go to onboarding
      router.replace('/store-setup');
    }
  }, [isAuthenticated, isInitialized, user, tenants, segments, navigationState?.key, router]);

  const login = async (email: string, password: string) => {
    await authLogin({ email, password });
  };

  const register = async (data: { email: string; password: string; first_name: string; last_name: string }) => {
    await authRegister(data);
  };

  const logout = async () => {
    await authLogout();
    router.replace('/login');
  };

  const contextValue: AuthContextValue = {
    user,
    tenants,
    currentTenant,
    isAuthenticated,
    isLoading,
    isInitialized,
    login,
    register,
    logout,
    setCurrentTenant,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export auth hooks
export { useUser, useIsAuthenticated, useCurrentTenant, useTenants, useAuthLoading } from '@/stores/auth-store';
