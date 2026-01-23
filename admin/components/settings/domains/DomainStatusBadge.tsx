'use client';

import React from 'react';
import { StatusBadge } from '@/components/ui/status-badge';

type DomainStatus = 'pending' | 'verifying' | 'provisioning' | 'active' | 'inactive' | 'failed' | 'expired';

interface DomainStatusBadgeProps {
  status: DomainStatus | string;
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
}

const statusMapping: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending Setup' },
  verifying: { variant: 'info', label: 'Verifying DNS' },
  provisioning: { variant: 'info', label: 'Provisioning SSL' },
  active: { variant: 'success', label: 'Active' },
  inactive: { variant: 'neutral', label: 'Inactive' },
  failed: { variant: 'error', label: 'Failed' },
  expired: { variant: 'warning', label: 'SSL Expired' },
};

export function DomainStatusBadge({ status, size = 'default', showIcon = true }: DomainStatusBadgeProps) {
  const { variant, label } = statusMapping[status] || statusMapping.pending;

  return (
    <StatusBadge status={variant} size={size} showIcon={showIcon}>
      {label}
    </StatusBadge>
  );
}
