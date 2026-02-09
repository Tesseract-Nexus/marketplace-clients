import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string; // ISO date string e.g. "1990-05-15"
  country?: string; // Full country name (e.g., "Australia")
  countryCode?: string; // ISO 2-letter code (e.g., "AU") - used for payment method filtering
  avatarUrl?: string; // Profile picture URL (GCS or social provider)
  tenantId?: string; // Tenant the customer belongs to
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  customerType?: 'RETAIL' | 'WHOLESALE' | 'VIP';
  totalOrders?: number;
  totalSpent?: number;
  marketingOptIn?: boolean;
  emailVerified?: boolean;
  createdAt: string;
}

export interface AuthState {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  expiresAt: number | null; // Session expiry timestamp (ms) — used for auto-refresh scheduling

  // Actions
  setCustomer: (customer: Customer | null) => void;
  setExpiresAt: (expiresAt: number | null) => void;
  setLoading: (loading: boolean) => void;
  login: (customer: Customer) => void;
  logout: () => void;
  updateCustomer: (updates: Partial<Customer>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      customer: null,
      isAuthenticated: false,
      isLoading: true, // Start as loading until AuthSessionProvider validates session
      expiresAt: null,

      setCustomer: (customer) =>
        set({
          customer,
          isAuthenticated: !!customer,
        }),

      setExpiresAt: (expiresAt) =>
        set({ expiresAt }),

      setLoading: (loading) =>
        set({ isLoading: loading }),

      login: (customer) =>
        set({
          customer,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          customer: null,
          isAuthenticated: false,
          isLoading: false,
          expiresAt: null,
        }),

      updateCustomer: (updates) =>
        set((state) => ({
          customer: state.customer
            ? { ...state.customer, ...updates }
            : null,
        })),
    }),
    {
      name: 'auth-storage',
      // STOREFRONT DESIGN: Anonymous by default
      // We intentionally do NOT persist any auth state to localStorage.
      // Auth is managed server-side by auth-bff via HttpOnly session cookies.
      // On every page load, AuthSessionProvider calls /auth/session to
      // rehydrate the client-side store from the server-side session.
      partialize: () => ({}),
    }
  )
);
