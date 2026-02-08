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
  accessToken: string | null;

  // Actions
  setCustomer: (customer: Customer | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (customer: Customer, token?: string) => void;
  logout: () => void;
  updateCustomer: (updates: Partial<Customer>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      customer: null,
      isAuthenticated: false,
      isLoading: true, // Start as loading until AuthSessionProvider validates session
      accessToken: null,

      setCustomer: (customer) =>
        set({
          customer,
          isAuthenticated: !!customer,
        }),

      setAccessToken: (token) =>
        set({ accessToken: token }),

      setLoading: (loading) =>
        set({ isLoading: loading }),

      login: (customer, token) =>
        set({
          customer,
          accessToken: token || null,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          customer: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
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
      // This ensures:
      // 1. Storefronts always start anonymous on page load
      // 2. Users must explicitly log in to be authenticated
      // 3. Staff sessions from admin don't leak to storefront
      // 4. Browser refresh = anonymous (until user logs in via auth-bff)
      //
      // SECURITY: Access tokens are managed by auth-bff via HttpOnly cookies.
      // Customer sessions are validated server-side, not via localStorage.
      partialize: () => ({
        // Return empty object - don't persist any auth state
        // Customer login state is managed by auth-bff session cookies
      }),
    }
  )
);
