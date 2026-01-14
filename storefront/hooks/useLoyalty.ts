import { useEffect, useCallback } from 'react';
import { useTenant } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import { useLoyaltyStore } from '@/store/loyalty';
import { calculatePointsForPurchase, calculateRedemptionValue } from '@/lib/api/loyalty';

export function useLoyalty() {
  const { tenant } = useTenant();
  const { customer, accessToken, isAuthenticated } = useAuthStore();
  const {
    program,
    customerLoyalty,
    transactions,
    isLoadingProgram,
    isLoadingCustomer,
    isLoadingTransactions,
    isEnrolling,
    isRedeeming,
    hasFetchedProgram,
    hasFetchedCustomer,
    error,
    fetchProgram,
    fetchCustomerLoyalty,
    fetchTransactions,
    enroll,
    redeemPoints,
    reset,
  } = useLoyaltyStore();

  // Fetch program on mount (only once)
  useEffect(() => {
    if (tenant && !hasFetchedProgram && !isLoadingProgram) {
      fetchProgram(tenant.id, tenant.storefrontId);
    }
  }, [tenant, hasFetchedProgram, isLoadingProgram, fetchProgram]);

  // Fetch customer loyalty when authenticated (only once per session)
  useEffect(() => {
    if (tenant && isAuthenticated && customer?.id && accessToken && !hasFetchedCustomer && !isLoadingCustomer) {
      fetchCustomerLoyalty(tenant.id, tenant.storefrontId, customer.id, accessToken);
    }
  }, [tenant, isAuthenticated, customer?.id, accessToken, hasFetchedCustomer, isLoadingCustomer, fetchCustomerLoyalty]);

  // Reset customer loyalty when logged out
  useEffect(() => {
    if (!isAuthenticated) {
      reset();
    }
  }, [isAuthenticated, reset]);

  const loadTransactions = useCallback(() => {
    if (tenant && accessToken) {
      fetchTransactions(tenant.id, tenant.storefrontId, accessToken);
    }
  }, [tenant, accessToken, fetchTransactions]);

  const enrollInProgram = useCallback(async (referralCode?: string) => {
    if (!tenant || !accessToken) {
      throw new Error('Not authenticated');
    }
    await enroll(tenant.id, tenant.storefrontId, accessToken, referralCode);
  }, [tenant, accessToken, enroll]);

  const redeem = useCallback(async (points: number, orderId: string) => {
    if (!tenant || !accessToken) {
      throw new Error('Not authenticated');
    }
    return redeemPoints(tenant.id, tenant.storefrontId, points, orderId, accessToken);
  }, [tenant, accessToken, redeemPoints]);

  // Helper calculations
  const pointsBalance = customerLoyalty?.pointsBalance ?? 0;
  const lifetimePoints = customerLoyalty?.lifetimePoints ?? 0;
  const currentTier = customerLoyalty?.currentTier ?? 'Member';
  const isEnrolled = !!customerLoyalty;
  const isProgramActive = program?.isActive ?? false;

  // Calculate points value
  const pointsValue = program
    ? calculateRedemptionValue(pointsBalance, program.pointsRedemptionRate || 100)
    : pointsBalance / 100;

  // Calculate points that would be earned for an amount
  const calculateEarnablePoints = useCallback((amount: number) => {
    if (!program) return 0;
    return calculatePointsForPurchase(amount, program.pointsPerDollar);
  }, [program]);

  // Get tier benefits
  const tierBenefits = program?.tiers?.find(t => t.name === currentTier)?.benefits || '';

  return {
    // Data
    program,
    customerLoyalty,
    transactions,
    pointsBalance,
    lifetimePoints,
    currentTier,
    pointsValue,
    tierBenefits,

    // State
    isEnrolled,
    isProgramActive,
    isLoading: isLoadingProgram || isLoadingCustomer,
    isLoadingTransactions,
    isEnrolling,
    isRedeeming,
    error,

    // Actions
    loadTransactions,
    enrollInProgram,
    redeem,
    calculateEarnablePoints,
  };
}
