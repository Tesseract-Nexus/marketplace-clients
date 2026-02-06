'use client';

import { use } from 'react';
import { CouponForm } from '@/components/coupons/CouponForm';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { PageLoading } from '@/components/common';

interface EditCouponPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCouponPage({ params }: EditCouponPageProps) {
  const { id } = use(params);

  return (
    <PermissionGate
      permission={Permission.MARKETING_COUPONS_MANAGE}
      fallback="styled"
      fallbackTitle="Coupon Edit Access Required"
      fallbackDescription="You don't have the required permissions to edit coupons. Please contact your administrator to request access."
      loading={<PageLoading fullScreen />}
    >
      <CouponForm mode="edit" couponId={id} />
    </PermissionGate>
  );
}
