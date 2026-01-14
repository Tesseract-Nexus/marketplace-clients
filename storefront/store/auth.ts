import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  customerType: 'RETAIL' | 'WHOLESALE' | 'VIP';
  totalOrders: number;
  totalSpent: number;
  marketingOptIn: boolean;
  emailVerified: boolean;
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
  login: (customer: Customer, token: string) => void;
  logout: () => void;
  updateCustomer: (updates: Partial<Customer>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      customer: null,
      isAuthenticated: false,
      isLoading: false,
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
          accessToken: token,
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
      // SECURITY: Only persist non-sensitive customer info, NOT the access token
      // Access tokens should be stored in HttpOnly cookies or memory only
      // Persisting tokens to localStorage makes them vulnerable to XSS attacks
      partialize: (state) => ({
        customer: state.customer,
        // NOTE: accessToken is intentionally NOT persisted for security
        // The token is kept in memory and will be refreshed on page reload via auth-bff
        // NOTE: isAuthenticated is intentionally NOT persisted
        // The AuthSessionProvider validates the session on mount and sets the correct state
        // This prevents stale auth state from showing when the session has expired
      }),
    }
  )
);
