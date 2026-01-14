'use client';

import { useMemo, useCallback } from 'react';
import { useAuthStore, type Customer } from '@/store/auth';
import type { PersonalizationConfig, TargetingRule } from '@/types/blocks';

// =============================================================================
// USER COHORT TYPES
// =============================================================================

export type UserCohort =
  | 'new-user'
  | 'returning-user'
  | 'vip'
  | 'frequent-buyer'
  | 'high-value'
  | 'inactive'
  | 'cart-abandoner'
  | 'wishlist-user'
  | 'mobile-user'
  | 'desktop-user'
  | 'logged-in'
  | 'guest';

// =============================================================================
// PERSONALIZATION CONTEXT
// =============================================================================

interface PersonalizationContext {
  userCohorts: UserCohort[];
  userLocation?: {
    country?: string;
    region?: string;
    city?: string;
  };
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userBehavior?: {
    lastVisit?: Date;
    visitCount?: number;
    purchaseCount?: number;
    cartValue?: number;
    viewedCategories?: string[];
    viewedProducts?: string[];
  };
  customAttributes?: Record<string, string | number | boolean>;
}

// =============================================================================
// TARGETING RULE EVALUATION
// =============================================================================

function evaluateRule(
  rule: TargetingRule,
  context: PersonalizationContext
): boolean {
  let fieldValue: unknown;

  switch (rule.type) {
    case 'cohort':
      fieldValue = context.userCohorts;
      break;
    case 'location':
      fieldValue = rule.field
        ? context.userLocation?.[rule.field as keyof typeof context.userLocation]
        : context.userLocation?.country;
      break;
    case 'device':
      fieldValue = context.deviceType;
      break;
    case 'behavior':
      fieldValue = rule.field
        ? context.userBehavior?.[rule.field as keyof typeof context.userBehavior]
        : undefined;
      break;
    case 'time':
      const now = new Date();
      if (rule.field === 'hour') fieldValue = now.getHours();
      else if (rule.field === 'dayOfWeek') fieldValue = now.getDay();
      else if (rule.field === 'dayOfMonth') fieldValue = now.getDate();
      else if (rule.field === 'month') fieldValue = now.getMonth();
      break;
    case 'custom':
      fieldValue = rule.field ? context.customAttributes?.[rule.field] : undefined;
      break;
  }

  // Evaluate operator
  switch (rule.operator) {
    case 'equals':
      return fieldValue === rule.value;
    case 'not_equals':
      return fieldValue !== rule.value;
    case 'contains':
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(rule.value as string);
      }
      if (typeof fieldValue === 'string') {
        return fieldValue.includes(rule.value as string);
      }
      return false;
    case 'in':
      if (Array.isArray(rule.value)) {
        if (Array.isArray(fieldValue)) {
          return fieldValue.some((v) => (rule.value as unknown[]).includes(v));
        }
        return (rule.value as unknown[]).includes(fieldValue);
      }
      return false;
    case 'not_in':
      if (Array.isArray(rule.value)) {
        if (Array.isArray(fieldValue)) {
          return !fieldValue.some((v) => (rule.value as unknown[]).includes(v));
        }
        return !(rule.value as unknown[]).includes(fieldValue);
      }
      return true;
    case 'greater_than':
      return typeof fieldValue === 'number' && fieldValue > (rule.value as number);
    case 'less_than':
      return typeof fieldValue === 'number' && fieldValue < (rule.value as number);
    default:
      return false;
  }
}

// =============================================================================
// USE PERSONALIZATION HOOK
// =============================================================================

export function usePersonalization() {
  const { customer, isAuthenticated } = useAuthStore();

  // Build user cohorts based on available data
  const userCohorts = useMemo<UserCohort[]>(() => {
    const cohorts: UserCohort[] = [];

    // Auth status
    if (isAuthenticated && customer) {
      cohorts.push('logged-in');
      cohorts.push('returning-user');

      // Check for VIP status from customer type
      if (customer.customerType === 'VIP') {
        cohorts.push('vip');
      }

      // Check for frequent buyer based on order count
      if (customer.totalOrders >= 5) {
        cohorts.push('frequent-buyer');
      }

      // Check for high value based on total spend
      if (customer.totalSpent >= 1000) {
        cohorts.push('high-value');
      }
    } else {
      cohorts.push('guest');
      cohorts.push('new-user');
    }

    // Device detection (SSR-safe)
    if (typeof window !== 'undefined') {
      const isMobile = window.matchMedia('(pointer: coarse)').matches;
      cohorts.push(isMobile ? 'mobile-user' : 'desktop-user');
    }

    return cohorts;
  }, [customer, isAuthenticated]);

  // Build full context
  const context = useMemo<PersonalizationContext>(() => {
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';

    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) deviceType = 'mobile';
      else if (width < 1024) deviceType = 'tablet';
    }

    return {
      userCohorts,
      deviceType,
      // Location and behavior would come from analytics/backend
      userLocation: undefined,
      userBehavior: undefined,
      customAttributes: {},
    };
  }, [userCohorts]);

  // Check if personalization config matches current user
  const checkPersonalization = useCallback(
    (config: PersonalizationConfig): boolean => {
      if (!config.enabled) return true;

      // Check cohort targeting
      if (config.targetCohorts && config.targetCohorts.length > 0) {
        const hasMatchingCohort = config.targetCohorts.some((cohort) =>
          userCohorts.includes(cohort as UserCohort)
        );
        if (!hasMatchingCohort) return false;
      }

      // Check targeting rules
      if (config.targetingRules && config.targetingRules.length > 0) {
        // All rules must match (AND logic)
        const allRulesMatch = config.targetingRules.every((rule) =>
          evaluateRule(rule, context)
        );
        if (!allRulesMatch) return false;
      }

      return true;
    },
    [userCohorts, context]
  );

  // Get personalized content variant
  const getVariant = useCallback(
    <T extends { personalization?: PersonalizationConfig; id: string }>(
      variants: T[],
      fallbackId?: string
    ): T | undefined => {
      // Sort by priority (higher first)
      const sorted = [...variants].sort(
        (a, b) =>
          (b.personalization?.priority ?? 0) - (a.personalization?.priority ?? 0)
      );

      // Find first matching variant
      const match = sorted.find((variant) => {
        if (!variant.personalization?.enabled) return true;
        return checkPersonalization(variant.personalization);
      });

      // Return match or fallback
      if (match) return match;
      if (fallbackId) return variants.find((v) => v.id === fallbackId);
      return variants[0];
    },
    [checkPersonalization]
  );

  return {
    userCohorts,
    context,
    checkPersonalization,
    getVariant,
    isAuthenticated,
    customer,
  };
}

export default usePersonalization;
