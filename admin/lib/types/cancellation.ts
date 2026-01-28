export interface CancellationWindow {
  id: string;
  name: string;
  maxHoursAfterOrder: number;
  feeType: 'percentage' | 'fixed';
  feeValue: number;
  description: string;
}

export interface CancellationSettings {
  enabled: boolean;
  windows: CancellationWindow[];
  defaultFeeType: 'percentage' | 'fixed';
  defaultFeeValue: number;
  nonCancellableStatuses: string[];
  requireApprovalForPolicyChanges: boolean;
  requireReason: boolean;
  allowPartialCancellation: boolean;
  refundMethod: 'original_payment' | 'store_credit' | 'either';
  policyText: string;
  cancellationReasons: string[];
}
