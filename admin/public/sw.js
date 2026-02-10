// Service Worker for Web Push Notifications
// Standard W3C Push API — no Firebase, no third-party imports

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const { title = 'Notification', body, icon, data: notifData } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || '/logo-icon.png',
      badge: '/logo-icon.png',
      data: notifData,
      tag: notifData?.type || 'default',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.actionUrl || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
