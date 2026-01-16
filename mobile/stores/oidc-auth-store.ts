/**
 * OIDC Auth Store
 *
 * Zustand store for managing authentication state using Keycloak OIDC.
 * Implements pass-through authentication where the mobile app acts as a
 * public OAuth client using Authorization Code Flow with PKCE.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  startAuthFlow,
  refreshTokens as oidcRefreshTokens,
  getUserInfo,
  logout as oidcLogout,
  isTokenExpired,
  decodeAccessToken,
} from '@/lib/auth/oidc-client';
import { tenantsApi } from '@/lib/api/tenants';
import { STORAGE_KEYS } from '@/lib/constants';
import { secureStorage } from '@/lib/utils/secure-storage';

import type { Tenant } from '@/types/entities';

/**
 * User type derived from OIDC claims
 */
export interface OIDCUser {
  id: string; // sub claim
  email: string;
  email_verified: boolean;
  first_name?: string;
  last_name?: string;
  name?: string;
  preferred_username?: string;
  tenant_id?: string;
  tenant_slug?: string;
  customer_id?: string;
  loyalty_tier?: string;
  picture?: string;
  roles: string[];
}

/**
 * Token information
 */
export interface OIDCTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
  scope: string;
}

/**
 * Custom storage adapter for zustand persist
 */
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

interface OIDCAuthState {
  // State
  user: OIDCUser | null;
  tokens: OIDCTokens | null;
  tenants: Tenant[];
  currentTenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  login: (options?: { prompt?: 'login' | 'none'; loginHint?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setCurrentTenant: (tenantId: string) => Promise<void>;
  addTenant: (tenant: Tenant) => void;
  removeTenant: (tenantId: string) => void;
  initialize: () => Promise<void>;
  clearError: () => void;
  getAccessToken: () => Promise<string | null>;
}

export const useOIDCAuthStore = create<OIDCAuthState>()(
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

      /**
       * Login using Keycloak OIDC
       * Opens system browser for authentication
       */
      login: async (options) => {
        set({ isLoading: true, error: null });

        try {
          // Start OIDC auth flow
          const tokenResponse = await startAuthFlow({
            prompt: options?.prompt,
            loginHint: options?.loginHint,
          });

          // Calculate expiration timestamp
          const expiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expires_in;

          // Build tokens object
          const tokens: OIDCTokens = {
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            idToken: tokenResponse.id_token,
            expiresAt,
            scope: tokenResponse.scope,
          };

          // Store tokens securely
          await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
          if (tokens.refreshToken) {
            await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
          }
          if (tokens.idToken) {
            await secureStorage.setItem(STORAGE_KEYS.ID_TOKEN, tokens.idToken);
          }
          await secureStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(expiresAt));

          // Get user info from Keycloak
          const userInfo = await getUserInfo(tokens.accessToken);

          // Also decode token for additional claims
          const tokenClaims = decodeAccessToken(tokens.accessToken);

          // Build user object
          const user: OIDCUser = {
            id: userInfo.sub,
            email: userInfo.email || '',
            email_verified: userInfo.email_verified || false,
            first_name: userInfo.given_name,
            last_name: userInfo.family_name,
            name: userInfo.name,
            preferred_username: userInfo.preferred_username,
            tenant_id: userInfo.tenant_id || tokenClaims.tenant_id,
            tenant_slug: userInfo.tenant_slug || tokenClaims.tenant_slug,
            customer_id: userInfo.customer_id || tokenClaims.customer_id,
            loyalty_tier: userInfo.loyalty_tier,
            picture: userInfo.picture,
            roles: userInfo.realm_access?.roles || tokenClaims.realm_access?.roles || ['customer'],
          };

          // Fetch tenants
          let tenants: Tenant[] = [];
          try {
            tenants = await tenantsApi.list();
          } catch {
            // If tenant fetch fails, create minimal tenant from user claims
            if (user.tenant_id) {
              tenants = [
                {
                  id: user.tenant_id,
                  name: 'My Store',
                  slug: user.tenant_slug || 'demo-store',
                  owner_id: user.id,
                  status: 'active',
                  subscription_plan: 'free',
                  subscription_status: 'active',
                  settings: {} as Tenant['settings'],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ];
            }
          }

          // Get or set default tenant
          const storedTenant = await secureStorage.getObject<Tenant>(STORAGE_KEYS.CURRENT_TENANT);
          const currentTenant =
            storedTenant && tenants.find((t) => t.id === storedTenant.id)
              ? storedTenant
              : tenants[0] || null;

          if (currentTenant) {
            await secureStorage.setObject(STORAGE_KEYS.CURRENT_TENANT, currentTenant);
          }

          set({
            user,
            tokens,
            tenants,
            currentTenant,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({
            isLoading: false,
            error: message,
          });
          throw error;
        }
      },

      /**
       * Logout - revokes tokens and ends Keycloak session
       */
      logout: async () => {
        set({ isLoading: true });

        const { tokens } = get();

        try {
          // Perform OIDC logout
          await oidcLogout(tokens?.idToken, tokens?.refreshToken);
        } catch (error) {
          console.warn('Logout error:', error);
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

      /**
       * Refresh access token using refresh token
       */
      refreshToken: async () => {
        const { tokens: currentTokens } = get();

        if (!currentTokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const tokenResponse = await oidcRefreshTokens(currentTokens.refreshToken);

          const expiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expires_in;

          const newTokens: OIDCTokens = {
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token || currentTokens.refreshToken,
            idToken: tokenResponse.id_token || currentTokens.idToken,
            expiresAt,
            scope: tokenResponse.scope,
          };

          await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newTokens.accessToken);
          if (newTokens.refreshToken !== currentTokens.refreshToken) {
            await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newTokens.refreshToken);
          }
          if (newTokens.idToken) {
            await secureStorage.setItem(STORAGE_KEYS.ID_TOKEN, newTokens.idToken);
          }
          await secureStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(expiresAt));

          set({ tokens: newTokens });
        } catch (error) {
          // Refresh failed - force logout
          await get().logout();
          throw error;
        }
      },

      /**
       * Get valid access token, refreshing if needed
       */
      getAccessToken: async (): Promise<string | null> => {
        const { tokens, refreshToken } = get();

        if (!tokens?.accessToken) {
          return null;
        }

        // Check if token is expired or about to expire
        if (isTokenExpired(tokens.expiresAt, 60)) {
          if (tokens.refreshToken) {
            try {
              await refreshToken();
              return get().tokens?.accessToken || null;
            } catch {
              return null;
            }
          }
          return null;
        }

        return tokens.accessToken;
      },

      /**
       * Set current tenant
       */
      setCurrentTenant: async (tenantId: string) => {
        const { tenants } = get();
        const tenant = tenants.find((t) => t.id === tenantId);

        if (tenant) {
          await secureStorage.setObject(STORAGE_KEYS.CURRENT_TENANT, tenant);
          set({ currentTenant: tenant });

          // Notify backend about tenant switch
          try {
            await tenantsApi.switch(tenantId);
          } catch {
            // Non-critical error
          }
        }
      },

      /**
       * Add tenant to list
       */
      addTenant: (tenant: Tenant) => {
        const { tenants } = get();
        if (!tenants.find((t) => t.id === tenant.id)) {
          set({ tenants: [...tenants, tenant] });
        }
      },

      /**
       * Remove tenant from list
       */
      removeTenant: (tenantId: string) => {
        const { tenants, currentTenant } = get();
        const updatedTenants = tenants.filter((t) => t.id !== tenantId);
        set({
          tenants: updatedTenants,
          currentTenant: currentTenant?.id === tenantId ? updatedTenants[0] || null : currentTenant,
        });
      },

      /**
       * Initialize auth state from secure storage
       */
      initialize: async () => {
        try {
          const accessToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
          const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          const idToken = await secureStorage.getItem(STORAGE_KEYS.ID_TOKEN);
          const expiresAtStr = await secureStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
          const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;

          if (accessToken) {
            // Check if token is valid
            if (!isTokenExpired(expiresAt, 0)) {
              try {
                // Fetch user info
                const userInfo = await getUserInfo(accessToken);
                const tokenClaims = decodeAccessToken(accessToken);

                const user: OIDCUser = {
                  id: userInfo.sub,
                  email: userInfo.email || '',
                  email_verified: userInfo.email_verified || false,
                  first_name: userInfo.given_name,
                  last_name: userInfo.family_name,
                  name: userInfo.name,
                  preferred_username: userInfo.preferred_username,
                  tenant_id: userInfo.tenant_id || tokenClaims.tenant_id,
                  tenant_slug: userInfo.tenant_slug || tokenClaims.tenant_slug,
                  customer_id: userInfo.customer_id || tokenClaims.customer_id,
                  loyalty_tier: userInfo.loyalty_tier,
                  picture: userInfo.picture,
                  roles: userInfo.realm_access?.roles ||
                    tokenClaims.realm_access?.roles || ['customer'],
                };

                const tokens: OIDCTokens = {
                  accessToken,
                  refreshToken: refreshToken || undefined,
                  idToken: idToken || undefined,
                  expiresAt,
                  scope: tokenClaims.scope,
                };

                // Fetch tenants
                let tenants: Tenant[] = [];
                try {
                  tenants = await tenantsApi.list();
                } catch {
                  if (user.tenant_id) {
                    tenants = [
                      {
                        id: user.tenant_id,
                        name: 'My Store',
                        slug: user.tenant_slug || 'demo-store',
                        owner_id: user.id,
                        status: 'active',
                        subscription_plan: 'free',
                        subscription_status: 'active',
                        settings: {} as Tenant['settings'],
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      },
                    ];
                  }
                }

                const storedTenant = await secureStorage.getObject<Tenant>(
                  STORAGE_KEYS.CURRENT_TENANT
                );
                const currentTenant = storedTenant || tenants[0] || null;

                set({
                  user,
                  tokens,
                  tenants,
                  currentTenant,
                  isAuthenticated: true,
                  isInitialized: true,
                });

                return;
              } catch {
                // Token validation failed, try refresh
              }
            }

            // Token expired or invalid, try to refresh
            if (refreshToken) {
              try {
                await get().refreshToken();

                const newTokens = get().tokens;
                if (newTokens?.accessToken) {
                  const userInfo = await getUserInfo(newTokens.accessToken);
                  const tokenClaims = decodeAccessToken(newTokens.accessToken);

                  const user: OIDCUser = {
                    id: userInfo.sub,
                    email: userInfo.email || '',
                    email_verified: userInfo.email_verified || false,
                    first_name: userInfo.given_name,
                    last_name: userInfo.family_name,
                    name: userInfo.name,
                    preferred_username: userInfo.preferred_username,
                    tenant_id: userInfo.tenant_id || tokenClaims.tenant_id,
                    tenant_slug: userInfo.tenant_slug || tokenClaims.tenant_slug,
                    customer_id: userInfo.customer_id || tokenClaims.customer_id,
                    loyalty_tier: userInfo.loyalty_tier,
                    picture: userInfo.picture,
                    roles: userInfo.realm_access?.roles ||
                      tokenClaims.realm_access?.roles || ['customer'],
                  };

                  let tenants: Tenant[] = [];
                  try {
                    tenants = await tenantsApi.list();
                  } catch {
                    if (user.tenant_id) {
                      tenants = [
                        {
                          id: user.tenant_id,
                          name: 'My Store',
                          slug: user.tenant_slug || 'demo-store',
                          owner_id: user.id,
                          status: 'active',
                          subscription_plan: 'free',
                          subscription_status: 'active',
                          settings: {} as Tenant['settings'],
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        },
                      ];
                    }
                  }

                  const storedTenant = await secureStorage.getObject<Tenant>(
                    STORAGE_KEYS.CURRENT_TENANT
                  );
                  const currentTenant = storedTenant || tenants[0] || null;

                  set({
                    user,
                    tenants,
                    currentTenant,
                    isAuthenticated: true,
                    isInitialized: true,
                  });

                  return;
                }
              } catch {
                // Refresh failed
              }
            }

            // All attempts failed, clear auth data
            await secureStorage.clearAuthData();
          }

          set({ isInitialized: true });
        } catch {
          set({ isInitialized: true });
        }
      },

      /**
       * Clear error state
       */
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'oidc-auth-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        user: state.user
          ? {
              id: state.user.id,
              email: state.user.email,
              first_name: state.user.first_name,
              last_name: state.user.last_name,
              tenant_id: state.user.tenant_id,
              tenant_slug: state.user.tenant_slug,
              roles: state.user.roles,
            }
          : null,
        currentTenantId: state.currentTenant?.id || null,
      }),
      merge: (persistedState: unknown, currentState) => ({
        ...currentState,
        user: (persistedState as { user?: OIDCUser })?.user || null,
        isAuthenticated: !!(persistedState as { user?: OIDCUser })?.user,
      }),
    }
  )
);

// Selector hooks for performance
export const useOIDCUser = () => useOIDCAuthStore((state) => state.user);
export const useOIDCIsAuthenticated = () => useOIDCAuthStore((state) => state.isAuthenticated);
export const useOIDCCurrentTenant = () => useOIDCAuthStore((state) => state.currentTenant);
export const useOIDCTenants = () => useOIDCAuthStore((state) => state.tenants);
export const useOIDCAuthLoading = () => useOIDCAuthStore((state) => state.isLoading);
export const useOIDCAuthError = () => useOIDCAuthStore((state) => state.error);
