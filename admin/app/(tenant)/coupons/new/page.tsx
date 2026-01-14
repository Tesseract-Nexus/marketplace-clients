'use client';

import { CouponForm } from '@/components/coupons/CouponForm';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Loader2 } from 'lucide-react';

export default function NewCouponPage() {
  return (
    <PermissionGate
      permission={Permission.MARKETING_COUPONS_MANAGE}
      fallback="styled"
      fallbackTitle="Coupon Creation Access Required"
      fallbackDescription="You don't have the required permissions to create coupons. Please contact your administrator to request access."
      loading={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
    >
      <CouponForm mode="create" />
    </PermissionGate>
  );
}
