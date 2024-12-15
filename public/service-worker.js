const CACHE_NAME = 'nutprom-v2';
const STATIC_CACHE_NAME = 'nutprom-static-v2';
const DYNAMIC_CACHE_NAME = 'nutprom-dynamic-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html',
];

// Function to determine if a request is for a static asset
const isStaticAsset = (url) => {
  const staticExtensions = ['.html', '.css', '.js', '.json', '.ico', '.png', '.svg', '.jpg', '.jpeg'];
  return staticExtensions.some(ext => url.endsWith(ext)) && !url.includes('firestore') && !url.includes('firebase');
};

// Function to determine if a request is for the tablet page
const isTabletPage = (url) => {
  return url.includes('/tablet') || url.includes('TabletClock');
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = event.request.url;

  // Skip caching for Firebase and Firestore requests
  if (requestUrl.includes('firestore') || requestUrl.includes('firebase')) {
    return;
  }

  // Network-first strategy for tablet page
  if (isTabletPage(requestUrl)) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first strategy for static assets
  if (isStaticAsset(requestUrl)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request).then(fetchResponse => {
            return caches.open(STATIC_CACHE_NAME)
              .then(cache => {
                cache.put(event.request, fetchResponse.clone());
                return fetchResponse;
              });
          });
        })
        .catch(() => {
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // Network-first strategy for all other requests
  event.respondWith(
    fetch(event.request)
      .then(response => {
        return caches.open(DYNAMIC_CACHE_NAME)
          .then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
      })
      .catch(() => {
        return caches.match(event.request)
          .then(response => response || caches.match('/offline.html'));
      })
  );
});

self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
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
