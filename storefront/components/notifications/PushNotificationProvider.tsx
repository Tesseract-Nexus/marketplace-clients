'use client';

import { useEffect } from 'react';
import { NotificationPermissionPrompt } from './NotificationPermissionPrompt';
import { NotificationToast } from './NotificationToast';
import { initializeFirebase } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth';

interface PushNotificationProviderProps {
  children: React.ReactNode;
}

export function PushNotificationProvider({ children }: PushNotificationProviderProps) {
  const { isAuthenticated } = useAuthStore();

  // Initialize Firebase on mount
  useEffect(() => {
    initializeFirebase();
  }, []);

  return (
    <>
      {children}
      {/* Show notification toast for foreground messages */}
      <NotificationToast />
      {/* Show permission prompt for authenticated users */}
      {isAuthenticated && (
        <NotificationPermissionPrompt
          variant="banner"
          showAfterDelay={10000} // Show after 10 seconds
        />
      )}
    </>
  );
}
