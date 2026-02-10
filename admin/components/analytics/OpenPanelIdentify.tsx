'use client';

import { useEffect } from 'react';
import { useOpenPanel } from '@openpanel/nextjs';
import { useUser } from '@/contexts/UserContext';

export function OpenPanelIdentify() {
  const op = useOpenPanel();
  const { user } = useUser();

  useEffect(() => {
    if (user?.id) {
      op.identify({
        profileId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      });
    }
  }, [user?.id, user?.email, op]);

  return null;
}
