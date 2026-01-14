import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { authApi } from '@/lib/api/auth';
import { tenantsApi } from '@/lib/api/tenants';
import { STORAGE_KEYS } from '@/lib/constants';
import { secureStorage } from '@/lib/utils/secure-storage';

import type { LoginRequest, RegisterRequest } from '@/types/api';
import type { AuthTokens, Tenant, User } from '@/types/entities';

// Custom storage adapter for zustand persist
const zustandStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return secureStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await secureStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await secureStorage.removeItem(name);
  },
};

interface AuthState {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  tenants: Tenant[];
  currentTenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setCurrentTenant: (tenantId: string) => Promise<void>;
  refreshTenants: () => Promise<void>;
  addTenant: (tenant: Tenant) => void;
  removeTenant: (tenantId: string) => void;
  initialize: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      tenants: [],
      currentTenant: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Login
      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          console.log('[Auth] Starting login...');
          const response = await authApi.login(data);
          console.log('[Auth] Login response received, user:', response.user?.email, 'tenant_id:', response.user?.tenant_id);

          // Build tokens object from flat response
          const tokens: AuthTokens = {
            access_token: response.access_token,
            refresh_token: response.refresh_token,
            token_type: 'Bearer',
            expires_in: response.expires_in,
            expires_at: new Date(Date.now() + response.expires_in * 1000).toISOString(),
          };

          // Store tokens securely FIRST so tenantsApi.list() can use them
          await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
          await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);

          // Fetch user's tenants from the tenant service
          console.log('[Auth] Fetching user tenants...');
          let tenants: Tenant[] = [];
          try {
            tenants = await tenantsApi.list();
            console.log('[Auth] Fetched', tenants.length, 'tenants from API');
          } catch (tenantErr) {
            console.log('[Auth] Failed to fetch tenants:', tenantErr);
          }

          // Known tenant ID to slug mapping (fallback for environments where tenant API isn't available)
          const KNOWN_TENANT_SLUGS: Record<string, string> = {
            '4a97f9ca-3e4c-4c91-bda5-436a661a3d95': 'demo-store',
          };
          const KNOWN_TENANT_NAMES: Record<string, string> = {
            '4a97f9ca-3e4c-4c91-bda5-436a661a3d95': 'Demo Store',
          };

          // If no tenants from API but user has tenant_id, create a minimal tenant object
          if (tenants.length === 0 && response.user.tenant_id) {
            console.log('[Auth] No tenants from API, creating from tenant_id:', response.user.tenant_id);

            const tenantSlug = KNOWN_TENANT_SLUGS[response.user.tenant_id] || 'demo-store';
            const derivedTenant: Tenant = {
              id: response.user.tenant_id,
              name: KNOWN_TENANT_NAMES[response.user.tenant_id] || `${response.user.first_name}'s Store`,
              slug: tenantSlug,
              owner_id: response.user.id,
              status: 'active',
              subscription_plan: 'free',
              subscription_status: 'active',
              settings: {
                currency: 'USD',
                timezone: 'UTC',
                language: 'en',
              } as Tenant['settings'],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            tenants = [derivedTenant];
            console.log('[Auth] Created derived tenant:', derivedTenant.id, derivedTenant.slug, derivedTenant.name);
          }

          // Find default tenant (prefer is_default flag, otherwise use first tenant)
          const defaultTenant = tenants.find(t => (t as any).is_default) || tenants[0] || null;
          console.log('[Auth] Default tenant:', defaultTenant?.id, defaultTenant?.slug, defaultTenant?.name);
          console.log('[Auth] Total tenants:', tenants.length, tenants.map(t => t.name).join(', '));

          // Set state with all tenants
          set({
            user: response.user,
            tokens,
            tenants,
            currentTenant: defaultTenant,
            isAuthenticated: true,
            isLoading: false,
          });
          console.log('[Auth] State updated with', tenants.length, 'tenants');

          // Store current tenant in secure storage (minimal data)
          if (defaultTenant) {
            try {
              const minimalTenant = {
                id: defaultTenant.id,
                name: defaultTenant.name,
                slug: defaultTenant.slug,
                owner_id: defaultTenant.owner_id,
                status: defaultTenant.status,
              };
              await secureStorage.setItem(STORAGE_KEYS.CURRENT_TENANT, JSON.stringify(minimalTenant));
              console.log('[Auth] Current tenant saved to secure storage');
            } catch (storageError) {
              console.warn('[Auth] Failed to save tenant to secure storage:', storageError);
            }
          }
        } catch (error) {
          console.error('[Auth] Login error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      // Register
      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);

          // Build tokens object from flat response
          const tokens: AuthTokens = {
            access_token: response.access_token,
            refresh_token: response.refresh_token,
            token_type: 'Bearer',
            expires_in: response.expires_in,
            expires_at: new Date(Date.now() + response.expires_in * 1000).toISOString(),
          };

          // Store tokens securely
          await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
          await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);

          set({
            user: response.user,
            tokens,
            tenants: [],
            currentTenant: null,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch {
          // Ignore logout errors
        } finally {
          // Clear secure storage
          await secureStorage.clearAuthData();

          set({
            user: null,
            tokens: null,
            tenants: [],
            currentTenant: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // Refresh token
      refreshToken: async () => {
        const { tokens: currentTokens } = get();
        if (!currentTokens?.refresh_token) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await authApi.refresh(currentTokens.refresh_token);

          // Build tokens object from flat response
          const newTokens: AuthTokens = {
            access_token: response.access_token,
            refresh_token: response.refresh_token,
            token_type: 'Bearer',
            expires_in: response.expires_in,
            expires_at: new Date(Date.now() + response.expires_in * 1000).toISOString(),
          };

          await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newTokens.access_token);
          await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newTokens.refresh_token);

          set({ tokens: newTokens });
        } catch (error) {
          // Token refresh failed, logout
          await get().logout();
          throw error;
        }
      },

      // Verify email
      verifyEmail: async (code: string) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.verifyEmail({ code });

          // Update user's email_verified status
          const { user } = get();
          if (user) {
            set({
              user: { ...user, email_verified: true },
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Verification failed',
          });
          throw error;
        }
      },

      // Resend verification
      resendVerification: async () => {
        set({ isLoading: true, error: null });
        try {
          await authApi.resendVerification();
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to resend verification',
          });
          throw error;
        }
      },

      // Forgot password
      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.forgotPassword({ email });
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to send reset email',
          });
          throw error;
        }
      },

      // Reset password
      resetPassword: async (token: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.resetPassword({
            token,
            password,
            password_confirmation: password,
          });
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to reset password',
          });
          throw error;
        }
      },

      // Update user
      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      // Set current tenant
      setCurrentTenant: async (tenantId: string) => {
        const { tenants } = get();
        const tenant = tenants.find((t) => t.id === tenantId);

        if (tenant) {
          console.log('[Auth] Switching to tenant:', tenant.id, tenant.slug, tenant.name);

          // Store minimal tenant data
          try {
            const minimalTenant = {
              id: tenant.id,
              name: tenant.name,
              slug: tenant.slug,
              owner_id: tenant.owner_id,
              status: tenant.status,
            };
            await secureStorage.setItem(STORAGE_KEYS.CURRENT_TENANT, JSON.stringify(minimalTenant));
          } catch (e) {
            console.warn('[Auth] Failed to save tenant:', e);
          }

          set({ currentTenant: tenant });

          // Notify backend about tenant switch (non-blocking)
          try {
            await tenantsApi.switch(tenantId);
          } catch {
            // Non-critical error
          }
        }
      },

      // Refresh tenants list
      refreshTenants: async () => {
        console.log('[Auth] Refreshing tenants list...');
        try {
          const tenants = await tenantsApi.list();
          console.log('[Auth] Refreshed tenants:', tenants.length);
          set({ tenants });

          // Update current tenant if it's in the list
          const { currentTenant } = get();
          if (currentTenant) {
            const updatedTenant = tenants.find(t => t.id === currentTenant.id);
            if (updatedTenant) {
              set({ currentTenant: updatedTenant });
            }
          }
        } catch (err) {
          console.error('[Auth] Failed to refresh tenants:', err);
        }
      },

      // Add tenant
      addTenant: (tenant: Tenant) => {
        const { tenants } = get();
        if (!tenants.find((t) => t.id === tenant.id)) {
          set({ tenants: [...tenants, tenant] });
        }
      },

      // Remove tenant
      removeTenant: (tenantId: string) => {
        const { tenants, currentTenant } = get();
        const updatedTenants = tenants.filter((t) => t.id !== tenantId);
        set({
          tenants: updatedTenants,
          currentTenant: currentTenant?.id === tenantId ? updatedTenants[0] || null : currentTenant,
        });
      },

      // Initialize auth state
      initialize: async () => {
        console.log('[Auth Init] Starting initialization...');

        // Known tenant ID to slug mapping
        const KNOWN_TENANT_SLUGS: Record<string, string> = {
          '4a97f9ca-3e4c-4c91-bda5-436a661a3d95': 'demo-store',
        };

        const KNOWN_TENANT_NAMES: Record<string, string> = {
          '4a97f9ca-3e4c-4c91-bda5-436a661a3d95': 'Demo Store',
        };

        // Helper to fix/create tenant from stored data
        const resolveTenant = (storedData: any, user: User | null): Tenant | null => {
          if (!storedData && !user?.tenant_id) return null;

          const tenantId = storedData?.id || user?.tenant_id;
          if (!tenantId) return null;

          const correctSlug = KNOWN_TENANT_SLUGS[tenantId] || storedData?.slug || 'demo-store';
          const name = KNOWN_TENANT_NAMES[tenantId] || storedData?.name || `${user?.first_name || 'My'}'s Store`;

          return {
            id: tenantId,
            name,
            slug: correctSlug,
            owner_id: storedData?.owner_id || user?.id || '',
            status: storedData?.status || 'active',
            subscription_plan: 'free',
            subscription_status: 'active',
            settings: {
              currency: 'USD',
              timezone: 'UTC',
              language: 'en',
            } as Tenant['settings'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        };

        try {
          const accessToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
          console.log('[Auth Init] Access token exists:', !!accessToken);

          if (accessToken) {
            // Try to get current user
            try {
              console.log('[Auth Init] Fetching user profile...');
              const user = await authApi.me();
              console.log('[Auth Init] User fetched:', user?.email, 'tenant_id:', user?.tenant_id);

              // Try to get tenants from API, but don't fail if it doesn't work
              let tenants: Tenant[] = [];
              try {
                tenants = await tenantsApi.list();
                console.log('[Auth Init] Tenants from API:', tenants.length);
              } catch (tenantErr) {
                console.log('[Auth Init] Tenant API failed, using stored tenant:', tenantErr);
              }

              // Get stored tenant data
              const storedTenantStr = await secureStorage.getItem(STORAGE_KEYS.CURRENT_TENANT);
              let storedTenant: any = null;
              if (storedTenantStr) {
                try {
                  storedTenant = JSON.parse(storedTenantStr);
                } catch {
                  console.log('[Auth Init] Failed to parse stored tenant');
                }
              }

              // Resolve current tenant from stored data or user's tenant_id
              const currentTenant = resolveTenant(storedTenant || tenants[0], user);
              console.log('[Auth Init] Resolved tenant:', currentTenant?.id, currentTenant?.slug, currentTenant?.name);

              // If we have a resolved tenant but no tenants array, add it
              if (currentTenant && tenants.length === 0) {
                tenants = [currentTenant];
              }

              set({
                user,
                tenants,
                currentTenant,
                isAuthenticated: true,
                isInitialized: true,
              });
              console.log('[Auth Init] State initialized with tenant:', currentTenant?.slug);
            } catch (err) {
              console.log('[Auth Init] Auth check failed, trying refresh:', err);
              // Token is invalid, try to refresh
              try {
                await get().refreshToken();
                const user = await authApi.me();

                let tenants: Tenant[] = [];
                try {
                  tenants = await tenantsApi.list();
                } catch {
                  // Ignore tenant list failures
                }

                const storedTenantStr = await secureStorage.getItem(STORAGE_KEYS.CURRENT_TENANT);
                let storedTenant: any = null;
                if (storedTenantStr) {
                  try {
                    storedTenant = JSON.parse(storedTenantStr);
                  } catch {
                    // Ignore parse errors
                  }
                }

                const currentTenant = resolveTenant(storedTenant || tenants[0], user);

                if (currentTenant && tenants.length === 0) {
                  tenants = [currentTenant];
                }

                set({
                  user,
                  tenants,
                  currentTenant,
                  isAuthenticated: true,
                  isInitialized: true,
                });
                console.log('[Auth Init] Refresh successful, tenant:', currentTenant?.slug);
              } catch (refreshErr) {
                // Refresh failed, clear auth state
                console.log('[Auth Init] Refresh failed, clearing auth:', refreshErr);
                await secureStorage.clearAuthData();
                set({
                  user: null,
                  tokens: null,
                  tenants: [],
                  currentTenant: null,
                  isAuthenticated: false,
                  isInitialized: true,
                });
              }
            }
          } else {
            console.log('[Auth Init] No access token, not authenticated');
            set({ isInitialized: true });
          }
        } catch (err) {
          console.error('[Auth Init] Initialization error:', err);
          set({ isInitialized: true });
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandStorage),
      // Only persist minimal data to avoid SecureStore size limits
      partialize: (state) => ({
        // Store only essential user fields
        user: state.user ? {
          id: state.user.id,
          email: state.user.email,
          first_name: state.user.first_name,
          last_name: state.user.last_name,
          role: state.user.role,
          tenant_id: state.user.tenant_id,
          email_verified: state.user.email_verified,
        } : null,
        // Store minimal tenant data
        currentTenant: state.currentTenant ? {
          id: state.currentTenant.id,
          name: state.currentTenant.name,
          slug: state.currentTenant.slug,
          owner_id: state.currentTenant.owner_id,
          status: state.currentTenant.status,
        } : null,
      }),
      // Merge persisted state on rehydration
      merge: (persistedState: any, currentState) => {
        console.log('[Auth Persist] Merging state, persisted user:', persistedState?.user?.email, 'tenant:', persistedState?.currentTenant?.slug);

        // Known tenant slugs for fixing
        const KNOWN_TENANT_SLUGS: Record<string, string> = {
          '4a97f9ca-3e4c-4c91-bda5-436a661a3d95': 'demo-store',
        };
        const KNOWN_TENANT_NAMES: Record<string, string> = {
          '4a97f9ca-3e4c-4c91-bda5-436a661a3d95': 'Demo Store',
        };

        // Build full tenant object from persisted data
        let currentTenant: Tenant | null = null;
        const tenantId = persistedState?.currentTenant?.id || persistedState?.user?.tenant_id;
        if (tenantId) {
          currentTenant = {
            id: tenantId,
            name: KNOWN_TENANT_NAMES[tenantId] || persistedState?.currentTenant?.name || 'Store',
            slug: KNOWN_TENANT_SLUGS[tenantId] || persistedState?.currentTenant?.slug || 'demo-store',
            owner_id: persistedState?.currentTenant?.owner_id || persistedState?.user?.id || '',
            status: persistedState?.currentTenant?.status || 'active',
            subscription_plan: 'free',
            subscription_status: 'active',
            settings: {
              currency: 'USD',
              timezone: 'UTC',
              language: 'en',
            } as Tenant['settings'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }

        return {
          ...currentState,
          user: persistedState?.user || null,
          currentTenant,
          tenants: currentTenant ? [currentTenant] : [],
          isAuthenticated: !!persistedState?.user,
        };
      },
    }
  )
);

// Selector hooks for performance
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useCurrentTenant = () => useAuthStore((state) => state.currentTenant);
export const useTenants = () => useAuthStore((state) => state.tenants);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
