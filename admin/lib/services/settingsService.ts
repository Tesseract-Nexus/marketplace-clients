import type {
  Settings,
  CreateSettingsRequest,
  UpdateSettingsRequest,
  SettingsResponse,
  SettingsListResponse,
  PresetListResponse,
} from '../types/settings';
import { tenantFetch, type TenantFetchOptions } from '../api/tenantFetch';

const API_BASE = '/api/settings';

/**
 * Settings Service
 *
 * All methods require a tenantId to be passed for proper multi-tenant isolation.
 * The tenantId should come from TenantContext.currentTenant.id
 */
class SettingsService {
  /**
   * Create new settings
   */
  async createSettings(
    data: CreateSettingsRequest,
    tenantId: string
  ): Promise<Settings> {
    const response = await tenantFetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      tenantId,
    });

    const result: SettingsResponse = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to create settings');
    }

    return result.data;
  }

  /**
   * Get settings by ID
   */
  async getSettings(id: string, tenantId: string): Promise<Settings> {
    const response = await tenantFetch(`${API_BASE}/${id}`, { tenantId });
    const result: SettingsResponse = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to fetch settings');
    }

    return result.data;
  }

  /**
   * Get settings by context (tenant, application, scope)
   */
  async getSettingsByContext(params: {
    applicationId: string;
    scope: string;
    userId?: string;
    tenantId: string; // Required - the tenant ID for isolation
  }): Promise<Settings | null> {
    const queryParams = new URLSearchParams({
      applicationId: params.applicationId,
      scope: params.scope,
      ...(params.userId && { userId: params.userId }),
      tenantId: params.tenantId,
    });

    const response = await tenantFetch(`${API_BASE}/context?${queryParams}`, {
      tenantId: params.tenantId,
    });
    const result: SettingsResponse = await response.json();

    if (!result.success) {
      if (response.status === 404) {
        return null; // Settings not found for this context
      }
      throw new Error(result.message || 'Failed to fetch settings');
    }

    return result.data || null;
  }

  /**
   * Get inherited settings with fallback chain
   * (user → application → tenant → global)
   */
  async getInheritedSettings(params: {
    applicationId: string;
    scope: string;
    userId?: string;
    tenantId: string;
  }): Promise<Settings> {
    const queryParams = new URLSearchParams({
      applicationId: params.applicationId,
      scope: params.scope,
      ...(params.userId && { userId: params.userId }),
    });

    const response = await tenantFetch(`${API_BASE}/inherited?${queryParams}`, {
      tenantId: params.tenantId,
    });
    const result: SettingsResponse = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to fetch inherited settings');
    }

    return result.data;
  }

  /**
   * Update settings
   */
  async updateSettings(
    id: string,
    data: UpdateSettingsRequest,
    tenantId: string
  ): Promise<Settings> {
    const response = await tenantFetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      tenantId,
    });

    const result: SettingsResponse = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to update settings');
    }

    return result.data;
  }

  /**
   * Delete settings
   */
  async deleteSettings(id: string, tenantId: string): Promise<void> {
    const response = await tenantFetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      tenantId,
    });

    const result: SettingsResponse = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete settings');
    }
  }

  /**
   * List settings with filters
   */
  async listSettings(
    filters: {
      applicationId?: string;
      userId?: string;
      scope?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } | undefined,
    tenantId: string
  ): Promise<{ data: Settings[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await tenantFetch(`${API_BASE}?${queryParams}`, { tenantId });
    const result: SettingsListResponse = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to list settings');
    }

    return {
      data: result.data || [],
      pagination: result.pagination || null,
    };
  }

  /**
   * List available presets
   */
  async listPresets(
    filters: {
      category?: string;
      isDefault?: boolean;
      page?: number;
      limit?: number;
    } | undefined,
    tenantId: string
  ): Promise<{ data: any[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await tenantFetch(`/api/settings/presets?${queryParams}`, {
      tenantId,
    });
    const result: PresetListResponse = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to list presets');
    }

    return {
      data: result.data || [],
      pagination: result.pagination || null,
    };
  }

  /**
   * Apply a preset to settings
   */
  async applyPreset(
    settingsId: string,
    presetId: string,
    tenantId: string
  ): Promise<Settings> {
    const response = await tenantFetch(
      `${API_BASE}/${settingsId}/apply-preset/${presetId}`,
      {
        method: 'POST',
        tenantId,
      }
    );

    const result: SettingsResponse = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to apply preset');
    }

    return result.data;
  }

  /**
   * Get settings history
   */
  async getSettingsHistory(
    id: string,
    tenantId: string,
    limit = 50
  ): Promise<any[]> {
    const response = await tenantFetch(`${API_BASE}/${id}/history?limit=${limit}`, {
      tenantId,
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch settings history');
    }

    return result.data || [];
  }
}

export const settingsService = new SettingsService();
export default settingsService;
