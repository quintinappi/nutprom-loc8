const CACHE_NAME = 'nutprom-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => caches.match('/offline.html'));
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    tag: 'nutprom-notification',
    data: {
      url: self.registration.scope
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

async function syncClockEntries() {
  try {
    const db = await openDB('clockingDB', 1, {
      upgrade(db) {
        db.createObjectStore('clockEntries', { keyPath: 'id', autoIncrement: true });
      },
    });

    const tx = db.transaction('clockEntries', 'readonly');
    const store = tx.objectStore('clockEntries');
    const entries = await store.getAll();

    for (const entry of entries) {
      await fetch('/api/clock-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      const deleteTx = db.transaction('clockEntries', 'readwrite');
      const deleteStore = deleteTx.objectStore('clockEntries');
      await deleteStore.delete(entry.id);
    }

    console.log('Synced clock entries successfully');
  } catch (error) {
    console.error('Error syncing clock entries:', error);
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-clock-entries') {
    event.waitUntil(syncClockEntries());
  }
});
