// Bellaro Service Worker for Web Push Notifications & PWA Installation

self.addEventListener('install', function (event) {
  // Activate worker immediately
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  // Claim all active clients so the service worker is immediately active
  event.waitUntil(self.clients.claim());
});

// Pass-through fetch event handler required by Chrome PWA installability criteria
self.addEventListener('fetch', function (event) {
  // Allow all network requests to proceed normally through Next.js
  return;
});

self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'Bellaro Notification';
    const options = {
      body: payload.body || 'You have a new update.',
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-192x192.png',
      vibrate: [200, 100, 200],
      tag: payload.data?.orderId ? `order-${payload.data.orderId}` : 'bellaro-alert',
      data: {
        url: payload.url || '/admin/manageOrders',
        timestamp: Date.now(),
        ...payload.data,
      },
      actions: [
        {
          action: 'open_url',
          title: 'View Details',
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
