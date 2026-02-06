import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  LoyaltyProgram,
  CustomerLoyalty,
  LoyaltyTransaction,
  getLoyaltyProgram,
  getCustomerLoyalty,
  getLoyaltyTransactions,
  enrollInLoyalty,
  redeemPoints as redeemPointsApi,
} from '@/lib/api/loyalty';

export interface LoyaltyState {
  // Data
  program: LoyaltyProgram | null;
  customerLoyalty: CustomerLoyalty | null;
  transactions: LoyaltyTransaction[];

  // Loading states
  isLoadingProgram: boolean;
  isLoadingCustomer: boolean;
  isLoadingTransactions: boolean;
  isEnrolling: boolean;
  isRedeeming: boolean;

  // Fetch tracking (prevents infinite loops when service unavailable)
  hasFetchedProgram: boolean;
  hasFetchedCustomer: boolean;

  // Error states
  error: string | null;

  // Actions
  fetchProgram: (tenantId: string, storefrontId: string) => Promise<void>;
  fetchCustomerLoyalty: (tenantId: string, storefrontId: string, customerId: string) => Promise<void>;
  fetchTransactions: (tenantId: string, storefrontId: string, customerId: string) => Promise<void>;
  enroll: (tenantId: string, storefrontId: string, customerId: string, referralCode?: string, dateOfBirth?: string) => Promise<void>;
  redeemPoints: (tenantId: string, storefrontId: string, points: number, orderId: string, customerId: string) => Promise<{ success: boolean; dollarValue: number }>;
  updateBalance: (newBalance: number) => void;
  reset: () => void;
}

const initialState = {
  program: null,
  customerLoyalty: null,
  transactions: [],
  isLoadingProgram: false,
  isLoadingCustomer: false,
  isLoadingTransactions: false,
  isEnrolling: false,
  isRedeeming: false,
  hasFetchedProgram: false,
  hasFetchedCustomer: false,
  error: null,
};

export const useLoyaltyStore = create<LoyaltyState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchProgram: async (tenantId, storefrontId) => {
        set({ isLoadingProgram: true, error: null });
        try {
          const program = await getLoyaltyProgram(tenantId, storefrontId);
          set({ program, isLoadingProgram: false, hasFetchedProgram: true });
        } catch (error) {
          set({
            isLoadingProgram: false,
            hasFetchedProgram: true,
            error: error instanceof Error ? error.message : 'Failed to fetch program'
          });
        }
      },

      fetchCustomerLoyalty: async (tenantId, storefrontId, customerId) => {
        set({ isLoadingCustomer: true, error: null });
        try {
          const customerLoyalty = await getCustomerLoyalty(tenantId, storefrontId, customerId);
          set({ customerLoyalty, isLoadingCustomer: false, hasFetchedCustomer: true });
        } catch (error) {
          set({
            isLoadingCustomer: false,
            hasFetchedCustomer: true,
            error: error instanceof Error ? error.message : 'Failed to fetch loyalty status'
          });
        }
      },

      fetchTransactions: async (tenantId, storefrontId, customerId) => {
        set({ isLoadingTransactions: true, error: null });
        try {
          const result = await getLoyaltyTransactions(tenantId, storefrontId, customerId, { limit: 20 });
          set({ transactions: result.transactions, isLoadingTransactions: false });
        } catch (error) {
          set({
            isLoadingTransactions: false,
            error: error instanceof Error ? error.message : 'Failed to fetch transactions'
          });
        }
      },

      enroll: async (tenantId, storefrontId, customerId, referralCode, dateOfBirth) => {
        set({ isEnrolling: true, error: null });
        try {
          const customerLoyalty = await enrollInLoyalty(tenantId, storefrontId, customerId, referralCode, dateOfBirth);
          set({ customerLoyalty, isEnrolling: false });
        } catch (error) {
          set({
            isEnrolling: false,
            error: error instanceof Error ? error.message : 'Failed to enroll'
          });
          throw error;
        }
      },

      redeemPoints: async (tenantId, storefrontId, points, orderId, customerId) => {
        set({ isRedeeming: true, error: null });
        try {
          const result = await redeemPointsApi(tenantId, storefrontId, points, orderId, customerId);
          if (result.success) {
            set((state) => ({
              customerLoyalty: state.customerLoyalty
                ? { ...state.customerLoyalty, pointsBalance: result.newBalance }
                : null,
              isRedeeming: false,
            }));
          }
          return { success: result.success, dollarValue: result.dollarValue };
        } catch (error) {
          set({
            isRedeeming: false,
            error: error instanceof Error ? error.message : 'Failed to redeem points'
          });
          throw error;
        }
      },

      updateBalance: (newBalance) => {
        set((state) => ({
          customerLoyalty: state.customerLoyalty
            ? { ...state.customerLoyalty, pointsBalance: newBalance }
            : null,
        }));
      },

      reset: () => {
        set({ customerLoyalty: null, transactions: [], hasFetchedCustomer: false, error: null });
      },
    }),
    {
      name: 'loyalty-storage',
      partialize: (state) => ({
        program: state.program,
        customerLoyalty: state.customerLoyalty,
      }),
    }
  )
);
