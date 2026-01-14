'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import { Loader2 } from 'lucide-react';

export default function ApprovalsPage() {
  const router = useRouter();
  const { currentTenant } = useTenant();

  const isStoreOwner = ['owner', 'admin', 'store_owner', 'store_admin'].includes(
    currentTenant?.role || ''
  );

  useEffect(() => {
    // Redirect based on role
    if (isStoreOwner) {
      router.replace('/ad-manager/approvals/incoming');
    } else {
      router.replace('/ad-manager/approvals/outgoing');
    }
  }, [isStoreOwner, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
