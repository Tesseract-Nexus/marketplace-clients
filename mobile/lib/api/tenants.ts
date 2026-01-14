import axios from 'axios';

import { DEFAULT_API_URL, ENDPOINTS } from '../constants';
import { decodeJwtPayload } from '../utils/base64';
import { secureStorage } from '../utils/secure-storage';

import { apiGet, apiPatch, apiPost } from './client';

import type { CheckSlugResponse, CreateTenantRequest, UpdateTenantRequest } from '@/types/api';
import type { Tenant, TenantSettings } from '@/types/entities';

export const tenantsApi = {
  /**
   * Get user's tenants (uses correct endpoint that matches web admin)
   * This must use the default API URL, not tenant-specific URL
   */
  list: async (): Promise<Tenant[]> => {
    try {
      // Get access token and extract user ID
      const accessToken = await secureStorage.getItem('tesseract_access_token');
      if (!accessToken) {
        console.log('[Tenants API] No access token, cannot fetch tenants');
        return [];
      }

      // Extract user ID from JWT token using React Native compatible base64 decode
      let userId = '';
      try {
        const payload = decodeJwtPayload(accessToken);
        if (payload) {
          userId = payload.sub || payload.user_id || payload.userId || '';
        }
      } catch (e) {
        console.log('[Tenants API] Failed to extract user ID from token');
      }

      if (!userId) {
        console.log('[Tenants API] No user ID found in token');
        return [];
      }

      console.log('[Tenants API] Fetching tenants for user:', userId);

      // Call the tenant service endpoint via the default API gateway
      // Using the DEFAULT_API_URL ensures we go through the central gateway
      const response = await axios.get(`${DEFAULT_API_URL}${ENDPOINTS.TENANTS.USER_TENANTS}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-User-ID': userId,
          'Content-Type': 'application/json',
        },
      });

      // Response format: { success: true, data: { tenants: [...], count: N } }
      const responseData = response.data;
      console.log('[Tenants API] Response:', JSON.stringify(responseData).substring(0, 200));

      // Parse tenants from response
      let tenantsArray = [];
      if (responseData.data?.tenants) {
        tenantsArray = responseData.data.tenants;
      } else if (responseData.tenants) {
        tenantsArray = responseData.tenants;
      } else if (Array.isArray(responseData)) {
        tenantsArray = responseData;
      }

      // Transform to Tenant format
      const tenants: Tenant[] = tenantsArray.map((t: any) => ({
        id: t.tenant_id || t.id,
        name: t.name || t.tenant_name,
        slug: t.slug,
        owner_id: t.owner_id || '',
        status: t.status || 'active',
        subscription_plan: t.subscription_plan || 'free',
        subscription_status: t.subscription_status || 'active',
        logo_url: t.logo_url,
        settings: {
          currency: t.currency || 'USD',
          timezone: t.timezone || 'UTC',
          language: t.language || 'en',
          theme: {
            primary_color: t.primary_color || '#6366f1',
            secondary_color: t.secondary_color || '#8b5cf6',
            primary_dark: t.primary_dark || '#4f46e5',
            primary_light: t.primary_light || '#a5b4fc',
            accent_color: t.accent_color || '#f59e0b',
            background_color: t.background_color || '#ffffff',
            text_color: t.text_color || '#111827',
            border_radius: t.border_radius || 'md',
          },
          features: {
            multi_vendor: false,
            reviews: true,
            wishlist: true,
            compare: false,
            coupons: true,
            loyalty_points: false,
            gift_cards: false,
            subscriptions: false,
            digital_products: false,
          },
          notifications: {
            email_enabled: true,
            sms_enabled: false,
            push_enabled: true,
            order_updates: true,
            marketing: false,
          },
          checkout: {
            guest_checkout: true,
            require_phone: true,
            require_address: true,
          },
          shipping: {},
          taxes: {},
        } as TenantSettings,
        is_default: t.is_default || false,
        role: t.role || 'owner',
        created_at: t.created_at || new Date().toISOString(),
        updated_at: t.updated_at || new Date().toISOString(),
      }));

      console.log('[Tenants API] Fetched', tenants.length, 'tenants');
      return tenants;
    } catch (error: any) {
      console.log('[Tenants API] Error fetching tenants:', error.message || error);
      // Fallback to legacy endpoint
      try {
        const response = await apiGet<Tenant[]>(ENDPOINTS.TENANTS.LIST);
        return response.data || [];
      } catch {
        return [];
      }
    }
  },

  /**
   * Get a single tenant by ID
   */
  get: async (id: string): Promise<Tenant> => {
    const response = await apiGet<Tenant>(ENDPOINTS.TENANTS.GET(id));
    return response.data;
  },

  /**
   * Create a new tenant
   */
  create: async (data: CreateTenantRequest): Promise<Tenant> => {
    const response = await apiPost<Tenant>(ENDPOINTS.TENANTS.CREATE, data);
    return response.data;
  },

  /**
   * Update a tenant
   */
  update: async (id: string, data: UpdateTenantRequest): Promise<Tenant> => {
    const response = await apiPatch<Tenant>(ENDPOINTS.TENANTS.UPDATE(id), data);
    return response.data;
  },

  /**
   * Check if a slug is available
   */
  checkSlug: async (slug: string): Promise<CheckSlugResponse> => {
    const response = await apiGet<CheckSlugResponse>(ENDPOINTS.TENANTS.CHECK_SLUG(slug));
    return response.data;
  },

  /**
   * Switch to a different tenant
   */
  switch: async (tenantId: string): Promise<Tenant> => {
    const response = await apiPost<Tenant>(ENDPOINTS.TENANTS.SWITCH, { tenant_id: tenantId });
    return response.data;
  },

  /**
   * Update tenant settings
   */
  updateSettings: async (id: string, settings: Partial<TenantSettings>): Promise<Tenant> => {
    const response = await apiPatch<Tenant>(ENDPOINTS.TENANTS.UPDATE(id), { settings });
    return response.data;
  },

  /**
   * Update tenant theme
   */
  updateTheme: async (
    id: string,
    theme: Partial<TenantSettings['theme']>
  ): Promise<Tenant> => {
    const tenant = await tenantsApi.get(id);
    const updatedSettings: Partial<TenantSettings> = {
      ...tenant.settings,
      theme: {
        ...tenant.settings.theme,
        ...theme,
      },
    };
    return tenantsApi.updateSettings(id, updatedSettings);
  },

  /**
   * Update tenant logo
   */
  updateLogo: async (id: string, logoUrl: string): Promise<Tenant> => {
    const response = await apiPatch<Tenant>(ENDPOINTS.TENANTS.UPDATE(id), { logo_url: logoUrl });
    return response.data;
  },

  /**
   * Update tenant favicon
   */
  updateFavicon: async (id: string, faviconUrl: string): Promise<Tenant> => {
    const response = await apiPatch<Tenant>(ENDPOINTS.TENANTS.UPDATE(id), { favicon_url: faviconUrl });
    return response.data;
  },

  /**
   * Enable a feature
   */
  enableFeature: async (
    id: string,
    feature: keyof TenantSettings['features']
  ): Promise<Tenant> => {
    const tenant = await tenantsApi.get(id);
    const updatedFeatures = {
      ...tenant.settings.features,
      [feature]: true,
    };
    return tenantsApi.updateSettings(id, { features: updatedFeatures });
  },

  /**
   * Disable a feature
   */
  disableFeature: async (
    id: string,
    feature: keyof TenantSettings['features']
  ): Promise<Tenant> => {
    const tenant = await tenantsApi.get(id);
    const updatedFeatures = {
      ...tenant.settings.features,
      [feature]: false,
    };
    return tenantsApi.updateSettings(id, { features: updatedFeatures });
  },

  /**
   * Get tenant by slug
   */
  getBySlug: async (slug: string): Promise<Tenant> => {
    const response = await apiGet<Tenant>(ENDPOINTS.TENANTS.BY_SLUG(slug));
    return response.data;
  },

  /**
   * Validate tenant slug availability (matches web admin)
   */
  validate: async (slug: string): Promise<{ available: boolean; message?: string }> => {
    const response = await apiGet<{ available: boolean; message?: string }>(ENDPOINTS.TENANTS.VALIDATE(slug));
    return response.data;
  },

  /**
   * Set default tenant for user (matches web admin)
   */
  setDefault: async (tenantId: string): Promise<void> => {
    await apiPost(ENDPOINTS.TENANTS.SET_DEFAULT, { tenant_id: tenantId });
  },

  /**
   * Get tenant details (matches web admin)
   */
  getDetails: async (id: string): Promise<Tenant> => {
    const response = await apiGet<Tenant>(ENDPOINTS.TENANTS.DETAILS(id));
    return response.data;
  },
};
