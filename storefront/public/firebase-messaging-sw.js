// Firebase Cloud Messaging Service Worker
// This handles background push notifications

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase (the config will be injected from the main app)
// These values are replaced at build time or can be fetched
firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY || '',
  authDomain: self.FIREBASE_AUTH_DOMAIN || '',
  projectId: self.FIREBASE_PROJECT_ID || '',
  storageBucket: self.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: self.FIREBASE_APP_ID || '',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Order Update';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: payload.data?.notificationId || 'default',
    data: payload.data,
    actions: getNotificationActions(payload.data),
    vibrate: [100, 50, 100],
    requireInteraction: shouldRequireInteraction(payload.data),
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Determine notification actions based on type
function getNotificationActions(data) {
  const type = data?.type || data?.notificationType;

  switch (type) {
    case 'ORDER_SHIPPED':
    case 'ORDER_OUT_FOR_DELIVERY':
      return [
        { action: 'track', title: 'Track Order' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'ORDER_DELIVERED':
      return [
        { action: 'view', title: 'View Order' },
        { action: 'review', title: 'Leave Review' },
      ];
    case 'TICKET_REPLIED':
      return [
        { action: 'reply', title: 'Reply' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    default:
      return [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
  }
}

// Determine if notification should require user interaction
function shouldRequireInteraction(data) {
  const type = data?.type || data?.notificationType;
  const importantTypes = [
    'ORDER_CANCELLED',
    'ORDER_FAILED',
    'PAYMENT_FAILED',
    'TICKET_ESCALATED',
  ];
  return importantTypes.includes(type);
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);

  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/';

  // Determine target URL based on action and data
  if (event.action === 'track' || event.action === 'view') {
    if (data.orderId) {
      targetUrl = `/account/orders/${data.orderId}`;
    }
  } else if (event.action === 'review' && data.orderId) {
    targetUrl = `/account/orders/${data.orderId}?review=true`;
  } else if (event.action === 'reply' && data.ticketId) {
    targetUrl = `/account/tickets/${data.ticketId}`;
  } else if (data.orderId) {
    targetUrl = `/account/orders/${data.orderId}`;
  } else if (data.ticketId) {
    targetUrl = `/account/tickets/${data.ticketId}`;
  } else if (data.url) {
    targetUrl = data.url;
  }

  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);

  // You could track this for analytics
  const data = event.notification.data || {};
  if (data.notificationId) {
    // Could send analytics event here
  }
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[firebase-messaging-sw.js] Push subscription changed');

  // Re-subscribe with new subscription
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((subscription) => {
        console.log('[firebase-messaging-sw.js] New subscription:', subscription);
        // You could send this to your server to update the token
      })
  );
});

console.log('[firebase-messaging-sw.js] Service worker loaded');
