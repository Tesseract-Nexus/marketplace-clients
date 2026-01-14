'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTenant } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import {
  isPushSupported,
  requestNotificationPermission,
  onForegroundMessage,
  getNotificationPermissionStatus
} from '@/lib/firebase';
import { registerDevice, unregisterDevice } from '@/lib/api/notifications';

export interface PushNotificationPayload {
  title?: string;
  body?: string;
  data?: Record<string, string>;
}

export interface UsePushNotificationsReturn {
  isSupported: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  permission: 'default' | 'granted' | 'denied' | 'unsupported';
  error: string | null;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
  lastNotification: PushNotificationPayload | null;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { tenant } = useTenant();
  const { accessToken, isAuthenticated } = useAuthStore();

  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [error, setError] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<PushNotificationPayload | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    async function checkSupport() {
      const supported = await isPushSupported();
      setIsSupported(supported);
      setPermission(getNotificationPermissionStatus());
      setIsLoading(false);
    }

    checkSupport();
  }, []);

  // Set up foreground message handler
  useEffect(() => {
    if (!isSupported || !isEnabled) return;

    let unsubscribe: (() => void) | null = null;

    async function setupMessageHandler() {
      unsubscribe = await onForegroundMessage((payload) => {
        setLastNotification({
          title: payload.notification?.title,
          body: payload.notification?.body,
          data: payload.data,
        });

        // Show a browser notification for foreground messages
        if (payload.notification?.title) {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
          });
        }
      });
    }

    setupMessageHandler();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isSupported, isEnabled]);

  // Enable push notifications
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser.');
      return false;
    }

    if (!tenant || !accessToken || !isAuthenticated) {
      setError('You must be logged in to enable notifications.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await requestNotificationPermission();

      if (!token) {
        setPermission(getNotificationPermissionStatus());
        setError('Failed to get notification permission.');
        setIsLoading(false);
        return false;
      }

      // Register device with backend
      await registerDevice(
        tenant.id,
        tenant.storefrontId,
        accessToken,
        {
          token,
          platform: 'web',
          deviceInfo: {
            browser: navigator.userAgent.includes('Chrome') ? 'Chrome' :
                     navigator.userAgent.includes('Firefox') ? 'Firefox' :
                     navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown',
            os: navigator.platform,
          },
        }
      );

      setFcmToken(token);
      setIsEnabled(true);
      setPermission('granted');
      setIsLoading(false);

      // Store in localStorage for persistence
      localStorage.setItem('fcm_token', token);
      localStorage.setItem('push_enabled', 'true');

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable notifications';
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, tenant, accessToken, isAuthenticated]);

  // Disable push notifications
  const disableNotifications = useCallback(async (): Promise<void> => {
    if (!tenant || !accessToken) {
      setIsEnabled(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = fcmToken || localStorage.getItem('fcm_token');

      if (token) {
        await unregisterDevice(
          tenant.id,
          tenant.storefrontId,
          accessToken,
          token
        );
      }

      setFcmToken(null);
      setIsEnabled(false);

      localStorage.removeItem('fcm_token');
      localStorage.removeItem('push_enabled');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable notifications';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [tenant, accessToken, fcmToken]);

  // Check if notifications were previously enabled
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const wasEnabled = localStorage.getItem('push_enabled') === 'true';
    const savedToken = localStorage.getItem('fcm_token');

    if (wasEnabled && savedToken && permission === 'granted') {
      setIsEnabled(true);
      setFcmToken(savedToken);
    }
  }, [permission]);

  return {
    isSupported,
    isEnabled,
    isLoading,
    permission,
    error,
    enableNotifications,
    disableNotifications,
    lastNotification,
  };
}
