import { config } from '@/lib/config';

const NOTIFICATION_SERVICE_URL = config.api.notificationService;

export interface DeviceRegistration {
  token: string;
  platform: 'web' | 'android' | 'ios';
  deviceInfo?: {
    browser?: string;
    os?: string;
    version?: string;
  };
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  marketingEnabled: boolean;
  ordersEnabled: boolean;
  securityEnabled: boolean;
}

export interface Notification {
  id: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  status: string;
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  readAt?: string;
}

/**
 * Register a device for push notifications
 */
export async function registerDevice(
  tenantId: string,
  storefrontId: string,
  accessToken: string,
  device: DeviceRegistration
): Promise<void> {
  const response = await fetch(
    `${NOTIFICATION_SERVICE_URL}/api/v1/devices/register`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
      body: JSON.stringify(device),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to register device');
  }
}

/**
 * Unregister a device from push notifications
 */
export async function unregisterDevice(
  tenantId: string,
  storefrontId: string,
  accessToken: string,
  token: string
): Promise<void> {
  const response = await fetch(
    `${NOTIFICATION_SERVICE_URL}/api/v1/devices/unregister`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
      body: JSON.stringify({ token }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to unregister device');
  }
}

/**
 * Get user notification preferences
 */
export async function getPreferences(
  tenantId: string,
  storefrontId: string,
  accessToken: string
): Promise<NotificationPreferences> {
  const response = await fetch(
    `${NOTIFICATION_SERVICE_URL}/api/v1/preferences`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    }
  );

  if (!response.ok) {
    // Return default preferences if not found
    if (response.status === 404) {
      return {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
        marketingEnabled: true,
        ordersEnabled: true,
        securityEnabled: true,
      };
    }
    throw new Error('Failed to fetch preferences');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update notification preferences
 */
export async function updatePreferences(
  tenantId: string,
  storefrontId: string,
  accessToken: string,
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const response = await fetch(
    `${NOTIFICATION_SERVICE_URL}/api/v1/preferences`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
      body: JSON.stringify(preferences),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to update preferences');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get user notifications (in-app)
 */
export async function getNotifications(
  tenantId: string,
  storefrontId: string,
  accessToken: string,
  options?: { page?: number; limit?: number; unreadOnly?: boolean }
): Promise<{ data: Notification[]; total: number; unreadCount: number }> {
  const params = new URLSearchParams({
    page: String(options?.page || 1),
    limit: String(options?.limit || 20),
  });

  if (options?.unreadOnly) {
    params.set('unread', 'true');
  }

  const response = await fetch(
    `${NOTIFICATION_SERVICE_URL}/api/v1/notifications/inbox?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return { data: [], total: 0, unreadCount: 0 };
    }
    throw new Error('Failed to fetch notifications');
  }

  return response.json();
}

/**
 * Mark notification as read
 */
export async function markAsRead(
  tenantId: string,
  storefrontId: string,
  accessToken: string,
  notificationId: string
): Promise<void> {
  const response = await fetch(
    `${NOTIFICATION_SERVICE_URL}/api/v1/notifications/${notificationId}/read`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(
  tenantId: string,
  storefrontId: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `${NOTIFICATION_SERVICE_URL}/api/v1/notifications/mark-all-read`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to mark all notifications as read');
  }
}
