import { useEffect, useCallback } from 'react';
import { useTenant } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import { useLoyaltyStore } from '@/store/loyalty';
import { calculatePointsForPurchase, calculateRedemptionValue } from '@/lib/api/loyalty';

export function useLoyalty() {
  const { tenant } = useTenant();
  const { customer, isAuthenticated } = useAuthStore();
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
    if (tenant && isAuthenticated && customer?.id && !hasFetchedCustomer && !isLoadingCustomer) {
      fetchCustomerLoyalty(tenant.id, tenant.storefrontId, customer.id);
    }
  }, [tenant, isAuthenticated, customer?.id, hasFetchedCustomer, isLoadingCustomer, fetchCustomerLoyalty]);

  // Reset customer loyalty when logged out
  useEffect(() => {
    if (!isAuthenticated) {
      reset();
    }
  }, [isAuthenticated, reset]);

  const loadTransactions = useCallback(() => {
    if (tenant && customer?.id) {
      fetchTransactions(tenant.id, tenant.storefrontId, customer.id);
    }
  }, [tenant, customer?.id, fetchTransactions]);

  const enrollInProgram = useCallback(async (referralCode?: string) => {
    if (!tenant || !isAuthenticated || !customer?.id) {
      throw new Error('Not authenticated');
    }
    // Auto-pass customer's dateOfBirth from profile if available
    await enroll(tenant.id, tenant.storefrontId, customer.id, referralCode, customer.dateOfBirth);
  }, [tenant, isAuthenticated, customer?.id, customer?.dateOfBirth, enroll]);

  const redeem = useCallback(async (points: number, orderId: string) => {
    if (!tenant || !isAuthenticated || !customer?.id) {
      throw new Error('Not authenticated');
    }
    return redeemPoints(tenant.id, tenant.storefrontId, points, orderId, customer.id);
  }, [tenant, isAuthenticated, customer?.id, redeemPoints]);

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
