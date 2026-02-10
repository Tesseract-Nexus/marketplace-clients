'use client';

import { useEffect } from 'react';
import { useOpenPanel } from '@openpanel/nextjs';
import { useAuthStore } from '@/store/auth';

export function OpenPanelIdentify() {
  const op = useOpenPanel();
  const customer = useAuthStore((s) => s.customer);

  useEffect(() => {
    if (customer?.id) {
      try {
        op.identify({
          profileId: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          avatar: customer.avatarUrl,
        });
      } catch {
        // Silently ignore — analytics failures must never break the UI
      }
    }
  }, [customer?.id, customer?.email, op]);

  return null;
}
