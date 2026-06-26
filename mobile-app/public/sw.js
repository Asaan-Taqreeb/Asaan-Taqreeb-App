// Service Worker for Asaan Taqreeb PWA
const CACHE_NAME = 'asaan-taqreeb-cache-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(self.clients.claim());
});

// Listen for push notifications from the backend
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  let data = { title: 'Asaan Taqreeb', body: 'New notification!' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Asaan Taqreeb', body: event.data.text() };
    }
  }

  // Support nested or flat payload layouts
  const title = data.title || data.notification?.title || 'Asaan Taqreeb';
  const body = data.body || data.notification?.body || '';
  const payloadData = data.data || data.notification?.data || {};

  const options = {
    body: body,
    icon: '/logo.png',
    badge: '/logo.png',
    data: payloadData,
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle user clicking on the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notificationData = event.notification.data || {};

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and post a message to route inside the SPA
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: notificationData
          });
          return client.focus();
        }
      }

      // If the app is closed, open it to the specified screen using URL query parameters or paths
      if (self.clients.openWindow) {
        let url = '/';
        if (notificationData.chatId) {
          url = `/?chatId=${notificationData.chatId}`;
          if (notificationData.vendorId) {
            url += `&vendorId=${notificationData.vendorId}`;
          } else if (notificationData.clientId) {
            url += `&clientId=${notificationData.clientId}`;
          }
        } else if (notificationData.bookingId) {
          url = '/?bookingId=' + notificationData.bookingId;
        }
        return self.clients.openWindow(url);
      }
    })
  );
});
