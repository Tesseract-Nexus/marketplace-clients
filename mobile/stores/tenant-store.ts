import { create } from 'zustand';

import { tenantsApi } from '@/lib/api/tenants';
import { secureStorage } from '@/lib/utils/secure-storage';
import { STORAGE_KEYS } from '@/lib/constants';

import type { CreateTenantRequest, UpdateTenantRequest } from '@/types/api';
import type { Tenant, TenantSettings, TenantTheme } from '@/types/entities';

interface TenantState {
  // State
  tenants: Tenant[];
  currentTenant: Tenant | null;
  isLoading: boolean;
  isSwitching: boolean;
  error: string | null;

  // Actions
  fetchTenants: () => Promise<void>;
  setCurrentTenant: (tenantId: string) => Promise<void>;
  createTenant: (data: CreateTenantRequest) => Promise<Tenant>;
  updateTenant: (id: string, data: UpdateTenantRequest) => Promise<Tenant>;
  updateSettings: (settings: Partial<TenantSettings>) => Promise<Tenant>;
  updateTheme: (theme: Partial<TenantTheme>) => Promise<Tenant>;
  updateLogo: (logoUrl: string) => Promise<Tenant>;
  checkSlugAvailability: (slug: string) => Promise<boolean>;
  addTenant: (tenant: Tenant) => void;
  removeTenant: (tenantId: string) => void;
  clearError: () => void;
  reset: () => void;
}

export const useTenantStore = create<TenantState>((set, get) => ({
  // Initial state
  tenants: [],
  currentTenant: null,
  isLoading: false,
  isSwitching: false,
  error: null,

  // Fetch all user's tenants
  fetchTenants: async () => {
    set({ isLoading: true, error: null });
    try {
      const tenants = await tenantsApi.list();

      // Restore current tenant from storage
      const storedTenant = await secureStorage.getObject<Tenant>(STORAGE_KEYS.CURRENT_TENANT);
      const currentTenant = tenants.find((t) => t.id === storedTenant?.id) || tenants[0] || null;

      set({
        tenants,
        currentTenant,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tenants',
      });
      throw error;
    }
  },

  // Switch to a different tenant
  setCurrentTenant: async (tenantId: string) => {
    const { tenants, currentTenant } = get();

    if (currentTenant?.id === tenantId) {
      return; // Already on this tenant
    }

    const tenant = tenants.find((t) => t.id === tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    set({ isSwitching: true, error: null });
    try {
      // Notify backend about tenant switch
      await tenantsApi.switch(tenantId);

      // Store current tenant
      await secureStorage.setObject(STORAGE_KEYS.CURRENT_TENANT, tenant);

      set({
        currentTenant: tenant,
        isSwitching: false,
      });
    } catch (error) {
      set({
        isSwitching: false,
        error: error instanceof Error ? error.message : 'Failed to switch tenant',
      });
      throw error;
    }
  },

  // Create a new tenant
  createTenant: async (data: CreateTenantRequest) => {
    set({ isLoading: true, error: null });
    try {
      const tenant = await tenantsApi.create(data);

      const { tenants } = get();
      set({
        tenants: [...tenants, tenant],
        currentTenant: tenant,
        isLoading: false,
      });

      // Store as current tenant
      await secureStorage.setObject(STORAGE_KEYS.CURRENT_TENANT, tenant);

      return tenant;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create tenant',
      });
      throw error;
    }
  },

  // Update tenant
  updateTenant: async (id: string, data: UpdateTenantRequest) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTenant = await tenantsApi.update(id, data);

      const { tenants, currentTenant } = get();
      const updatedTenants = tenants.map((t) => (t.id === id ? updatedTenant : t));

      set({
        tenants: updatedTenants,
        currentTenant: currentTenant?.id === id ? updatedTenant : currentTenant,
        isLoading: false,
      });

      // Update stored tenant if current
      if (currentTenant?.id === id) {
        await secureStorage.setObject(STORAGE_KEYS.CURRENT_TENANT, updatedTenant);
      }

      return updatedTenant;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update tenant',
      });
      throw error;
    }
  },

  // Update tenant settings
  updateSettings: async (settings: Partial<TenantSettings>) => {
    const { currentTenant } = get();
    if (!currentTenant) {
      throw new Error('No current tenant');
    }

    const updatedSettings: Partial<TenantSettings> = {
      ...currentTenant.settings,
      ...settings,
    };

    return get().updateTenant(currentTenant.id, { settings: updatedSettings });
  },

  // Update tenant theme
  updateTheme: async (theme: Partial<TenantTheme>) => {
    const { currentTenant } = get();
    if (!currentTenant) {
      throw new Error('No current tenant');
    }

    const updatedTheme: TenantTheme = {
      ...currentTenant.settings.theme,
      ...theme,
    };

    return get().updateSettings({ theme: updatedTheme });
  },

  // Update tenant logo
  updateLogo: async (logoUrl: string) => {
    const { currentTenant } = get();
    if (!currentTenant) {
      throw new Error('No current tenant');
    }

    return get().updateTenant(currentTenant.id, { logo_url: logoUrl });
  },

  // Check slug availability
  checkSlugAvailability: async (slug: string) => {
    try {
      const response = await tenantsApi.checkSlug(slug);
      return response.available;
    } catch {
      return false;
    }
  },

  // Add tenant to list
  addTenant: (tenant: Tenant) => {
    const { tenants } = get();
    if (!tenants.find((t) => t.id === tenant.id)) {
      set({ tenants: [...tenants, tenant] });
    }
  },

  // Remove tenant from list
  removeTenant: (tenantId: string) => {
    const { tenants, currentTenant } = get();
    const updatedTenants = tenants.filter((t) => t.id !== tenantId);

    set({
      tenants: updatedTenants,
      currentTenant: currentTenant?.id === tenantId ? updatedTenants[0] || null : currentTenant,
    });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset store
  reset: () => {
    set({
      tenants: [],
      currentTenant: null,
      isLoading: false,
      isSwitching: false,
      error: null,
    });
  },
}));

// Selector hooks
export const useTenantStoreCurrentTenant = () => useTenantStore((state) => state.currentTenant);
export const useTenantStoreTenants = () => useTenantStore((state) => state.tenants);
export const useTenantLoading = () => useTenantStore((state) => state.isLoading);
export const useTenantSwitching = () => useTenantStore((state) => state.isSwitching);
export const useTenantTheme = () => useTenantStore((state) => state.currentTenant?.settings?.theme);
