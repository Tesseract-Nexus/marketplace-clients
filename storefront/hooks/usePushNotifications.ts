'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const PUSH_ENABLED = process.env.NEXT_PUBLIC_PUSH_ENABLED !== 'false';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isRegistered, setIsRegistered] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = PUSH_ENABLED && VAPID_PUBLIC_KEY !== '' &&
      'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (!supported) return;

    setPermission(Notification.permission);

    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      registrationRef.current = reg;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setIsRegistered(true);
      }
    }).catch((err) => {
      console.error('[Push] Failed to register service worker:', err);
    });
  }, []);

  // Auto-register push subscription when permission is already granted (e.g. granted on login page)
  useEffect(() => {
    if (!isSupported || permission !== 'granted' || isRegistered) return;
    if (!registrationRef.current) return;

    const autoRegister = async () => {
      try {
        const existing = await registrationRef.current!.pushManager.getSubscription();
        if (existing) {
          setIsRegistered(true);
          return;
        }

        const subscription = await registrationRef.current!.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });

        const sub = subscription.toJSON();
        const response = await fetch('/api/push-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys?.p256dh,
              auth: sub.keys?.auth,
            },
            platform: 'web',
          }),
        });

        if (response.ok) {
          setIsRegistered(true);
        } else {
          console.error('[Push] Auto-register failed:', response.status);
        }
      } catch (err) {
        console.error('[Push] Auto-register error:', err);
      }
    };

    autoRegister();
  }, [isSupported, permission, isRegistered]);

  const requestPermission = useCallback(async () => {
    if (!isSupported || !registrationRef.current) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') return false;

      const subscription = await registrationRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      const sub = subscription.toJSON();
      const response = await fetch('/api/push-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys?.p256dh,
            auth: sub.keys?.auth,
          },
          platform: 'web',
        }),
      });

      if (response.ok) {
        setIsRegistered(true);
        return true;
      }

      console.error('[Push] Failed to register subscription:', response.status);
      return false;
    } catch (err) {
      console.error('[Push] Failed to subscribe:', err);
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!registrationRef.current) return;

    try {
      const subscription = await registrationRef.current.pushManager.getSubscription();
      if (!subscription) return;

      await fetch('/api/push-token', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      await subscription.unsubscribe();
      setIsRegistered(false);
    } catch (err) {
      console.error('[Push] Failed to unsubscribe:', err);
    }
  }, []);

  return { isSupported, permission, isRegistered, requestPermission, unsubscribe };
}
