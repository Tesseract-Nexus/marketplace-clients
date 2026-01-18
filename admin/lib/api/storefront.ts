/**
 * Storefront Settings API Client
 *
 * Client for managing storefront customization settings from the admin panel.
 * Provides methods for theme, branding, layout, and checkout configuration.
 */

import {
  StorefrontSettings,
  CreateStorefrontSettingsRequest,
  UpdateStorefrontSettingsRequest,
  StorefrontAsset,
  UploadAssetResponse,
  ThemeTemplate,
  THEME_PRESETS,
  ThemePreset,
  ApiResponse,
  ThemeHistoryEntry,
  ThemeHistoryListResponse,
  ThemeHistoryResponse,
} from './types';
import { enhancedApiClient } from './enhanced-client';

const API_BASE = '/api/storefront';

// Store the current storefront ID and tenant ID for API requests
let currentStorefrontId: string | null = null;
let currentTenantId: string | null = null;
// Store user info for auth headers
let currentUserId: string | null = null;
let currentUserEmail: string | null = null;

/**
 * Set the current storefront ID for API requests
 */
export function setCurrentStorefrontId(id: string | null): void {
  currentStorefrontId = id;
}

/**
 * Get the current storefront ID
 */
export function getCurrentStorefrontId(): string | null {
  return currentStorefrontId;
}

/**
 * Set the current tenant ID for API requests
 */
export function setCurrentTenantId(id: string | null): void {
  currentTenantId = id;
}

/**
 * Get the current tenant ID
 */
export function getCurrentTenantId(): string | null {
  return currentTenantId;
}

/**
 * Set user info for auth headers (required for backend IstioAuth via x-jwt-claim-* headers)
 */
export function setCurrentUserInfo(userId: string | null, userEmail: string | null): void {
  currentUserId = userId;
  currentUserEmail = userEmail;
}

/**
 * Get default headers for API requests
 * Requires storefrontId to be set via setCurrentStorefrontId()
 * Includes auth headers (x-jwt-claim-sub, x-jwt-claim-email) for backend IstioAuth middleware
 */
function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // x-storefront-id is required for storefront theme API
  if (currentStorefrontId) {
    headers['x-storefront-id'] = currentStorefrontId;
  }

  // x-jwt-claim-tenant-id is used for authorization
  if (currentTenantId) {
    headers['x-jwt-claim-tenant-id'] = currentTenantId;
  }

  // Auth headers required by backend IstioAuth middleware
  // Without x-jwt-claim-sub, the backend returns 401 Unauthorized
  if (currentUserId) {
    headers['x-jwt-claim-sub'] = currentUserId;
  }
  if (currentUserEmail) {
    headers['x-jwt-claim-email'] = currentUserEmail;
  }

  // Also get auth token from enhancedApiClient if available
  const authToken = enhancedApiClient.getAuthToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
}

/**
 * Storefront Settings API
 */
export const storefrontSettingsApi = {
  /**
   * Get storefront settings for the current tenant
   */
  async getSettings(): Promise<ApiResponse<StorefrontSettings>> {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return response.json();
  },

  /**
   * Create or fully update storefront settings
   */
  async saveSettings(data: CreateStorefrontSettingsRequest): Promise<ApiResponse<StorefrontSettings>> {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Partially update storefront settings
   */
  async updateSettings(data: UpdateStorefrontSettingsRequest): Promise<ApiResponse<StorefrontSettings>> {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Reset storefront settings to defaults
   */
  async resetSettings(): Promise<ApiResponse<StorefrontSettings>> {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  /**
   * Clone theme settings from another storefront
   */
  async cloneFromStorefront(sourceStorefrontId: string): Promise<ApiResponse<StorefrontSettings>> {
    const response = await fetch(`${API_BASE}/settings/clone`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sourceStorefrontId }),
    });
    return response.json();
  },

  /**
   * Get version history for the storefront theme settings
   */
  async getHistory(limit?: number): Promise<ThemeHistoryListResponse> {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit.toString());

    const response = await fetch(`${API_BASE}/settings/history?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return response.json();
  },

  /**
   * Get a specific version from history
   */
  async getHistoryVersion(version: number): Promise<ThemeHistoryResponse> {
    const response = await fetch(`${API_BASE}/settings/history/${version}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return response.json();
  },

  /**
   * Restore a specific version from history
   */
  async restoreVersion(version: number): Promise<ApiResponse<StorefrontSettings>> {
    const response = await fetch(`${API_BASE}/settings/history/${version}/restore`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return response.json();
  },

  /**
   * Update theme template
   */
  async updateTheme(themeTemplate: ThemeTemplate): Promise<ApiResponse<StorefrontSettings>> {
    const preset = THEME_PRESETS.find((p) => p.id === themeTemplate);
    return this.updateSettings({
      themeTemplate,
      primaryColor: preset?.primaryColor,
      secondaryColor: preset?.secondaryColor,
    });
  },

  /**
   * Update colors only
   */
  async updateColors(primaryColor: string, secondaryColor: string): Promise<ApiResponse<StorefrontSettings>> {
    return this.updateSettings({ primaryColor, secondaryColor });
  },

  /**
   * Update header configuration
   */
  async updateHeaderConfig(
    config: Partial<StorefrontSettings['headerConfig']>
  ): Promise<ApiResponse<StorefrontSettings>> {
    return this.updateSettings({ headerConfig: config });
  },

  /**
   * Update homepage configuration
   */
  async updateHomepageConfig(
    config: Partial<StorefrontSettings['homepageConfig']>
  ): Promise<ApiResponse<StorefrontSettings>> {
    return this.updateSettings({ homepageConfig: config });
  },

  /**
   * Update footer configuration
   */
  async updateFooterConfig(
    config: Partial<StorefrontSettings['footerConfig']>
  ): Promise<ApiResponse<StorefrontSettings>> {
    return this.updateSettings({ footerConfig: config });
  },

  /**
   * Update product display configuration
   */
  async updateProductConfig(
    config: Partial<StorefrontSettings['productConfig']>
  ): Promise<ApiResponse<StorefrontSettings>> {
    return this.updateSettings({ productConfig: config });
  },

  /**
   * Update checkout configuration
   */
  async updateCheckoutConfig(
    config: Partial<StorefrontSettings['checkoutConfig']>
  ): Promise<ApiResponse<StorefrontSettings>> {
    return this.updateSettings({ checkoutConfig: config });
  },
};

/**
 * Storefront Assets API
 */
export const storefrontAssetsApi = {
  /**
   * List all assets for the current tenant
   */
  async listAssets(type?: StorefrontAsset['type']): Promise<ApiResponse<StorefrontAsset[]>> {
    const params = new URLSearchParams();
    if (type) params.set('type', type);

    const response = await fetch(`${API_BASE}/assets?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return response.json();
  },

  /**
   * Upload a new asset
   */
  async uploadAsset(file: File, type: StorefrontAsset['type']): Promise<UploadAssetResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    // Build headers - don't include Content-Type for FormData
    const headers: Record<string, string> = {};
    if (currentStorefrontId) {
      headers['x-storefront-id'] = currentStorefrontId;
    }
    if (currentTenantId) {
      headers['x-jwt-claim-tenant-id'] = currentTenantId;
    }

    const response = await fetch(`${API_BASE}/assets`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return response.json();
  },

  /**
   * Delete an asset
   */
  async deleteAsset(assetId: string): Promise<ApiResponse<null>> {
    const response = await fetch(`${API_BASE}/assets?id=${assetId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },
};

/**
 * Storefront Preview API
 */
export const storefrontPreviewApi = {
  /**
   * Generate a preview URL
   */
  async generatePreview(slug?: string): Promise<ApiResponse<{ previewUrl: string; expiresAt: string }>> {
    const response = await fetch(`${API_BASE}/preview`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ slug }),
    });
    return response.json();
  },

  /**
   * Get current preview URL
   */
  async getPreviewUrl(): Promise<ApiResponse<{ previewUrl: string; expiresAt: string } | null>> {
    const response = await fetch(`${API_BASE}/preview`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return response.json();
  },
};

/**
 * Theme utilities
 */
export const themeUtils = {
  /**
   * Get all available theme presets
   */
  getThemePresets(): ThemePreset[] {
    return THEME_PRESETS;
  },

  /**
   * Get a specific theme preset by ID
   */
  getThemePreset(id: ThemeTemplate): ThemePreset | undefined {
    return THEME_PRESETS.find((p) => p.id === id);
  },

  /**
   * Generate CSS variables from settings
   */
  generateCssVariables(settings: StorefrontSettings): string {
    const preset = this.getThemePreset(settings.themeTemplate);

    return `
      --storefront-primary: ${settings.primaryColor};
      --storefront-secondary: ${settings.secondaryColor};
      --storefront-accent: ${settings.accentColor || preset?.accentColor || '#F59E0B'};
      --storefront-background: ${preset?.backgroundColor || '#FFFFFF'};
      --storefront-text: ${preset?.textColor || '#18181B'};
      --storefront-font-primary: ${settings.fontPrimary}, system-ui, sans-serif;
      --storefront-font-secondary: ${settings.fontSecondary}, system-ui, sans-serif;
    `.trim();
  },

  /**
   * Check if a color is dark (for contrast calculations)
   */
  isColorDark(hex: string): boolean {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length < 4) {
      return false;
    }
    try {
      const rgb = parseInt(hex.slice(1), 16);
      if (isNaN(rgb)) return false;
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = rgb & 0xff;
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.5;
    } catch {
      return false;
    }
  },

  /**
   * Get contrasting text color for a background
   */
  getContrastColor(bgColor: string): string {
    return this.isColorDark(bgColor) ? '#FFFFFF' : '#000000';
  },

  /**
   * Lighten a hex color
   */
  lightenColor(hex: string, percent: number): string {
    // Return a default color if hex is invalid
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length < 4) {
      return '#FFFFFF';
    }
    try {
      const num = parseInt(hex.slice(1), 16);
      if (isNaN(num)) return '#FFFFFF';
      const amt = Math.round(2.55 * percent);
      const r = Math.min(255, (num >> 16) + amt);
      const g = Math.min(255, ((num >> 8) & 0x00ff) + amt);
      const b = Math.min(255, (num & 0x0000ff) + amt);
      return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
    } catch {
      return '#FFFFFF';
    }
  },

  /**
   * Darken a hex color
   */
  darkenColor(hex: string, percent: number): string {
    // Return a default color if hex is invalid
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length < 4) {
      return '#000000';
    }
    try {
      const num = parseInt(hex.slice(1), 16);
      if (isNaN(num)) return '#000000';
      const amt = Math.round(2.55 * percent);
      const r = Math.max(0, (num >> 16) - amt);
      const g = Math.max(0, ((num >> 8) & 0x00ff) - amt);
      const b = Math.max(0, (num & 0x0000ff) - amt);
      return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
    } catch {
      return '#000000';
    }
  },
};

/**
 * Combined Storefront API
 */
export const storefrontApi = {
  settings: storefrontSettingsApi,
  assets: storefrontAssetsApi,
  preview: storefrontPreviewApi,
  theme: themeUtils,
};

export default storefrontApi;
