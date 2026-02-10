'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * Silent push notification registration component.
 * Mounts the usePushNotifications hook which auto-registers the push subscription
 * when the browser permission is already 'granted' (e.g. granted on the login page).
 * Renders nothing — the layout mount point stays unchanged.
 */
export function PushNotificationPrompt() {
  usePushNotifications();
  return null;
}
