// service-worker.js

const STATIC_CACHE_NAME = 'qran-top-static-v26'; // Version bump to force update
const DATA_CACHE_NAME = 'qran-top-data-v18';

// Core data files that are essential for the app to work offline.
const CORE_DATA_URLS = [
  'https://api.alquran.cloud/v1/quran/quran-simple-clean',
  'https://api.alquran.cloud/v1/quran/quran-uthmani',
];

// The "app shell" - minimal files needed for the UI to render.
const STATIC_FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './thumbnail.svg'
];

// Install event: cache static assets and core data.
self.addEventListener('install', event => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('[Service Worker] Pre-caching static app shell');
        const requests = STATIC_FILES_TO_CACHE.map(url => new Request(url, { cache: 'reload' }));
        return cache.addAll(requests);
      }),
      caches.open(DATA_CACHE_NAME).then(cache => {
        console.log('[Service Worker] Pre-caching core Quran data');
        const requests = CORE_DATA_URLS.map(url => new Request(url, { cache: 'reload' }));
        return cache.addAll(requests);
      })
    ]).then(() => {
        console.log('[Service Worker] Installation complete. Activating immediately.');
        return self.skipWaiting();
    })
  );
});

// Activate event: clean up old caches.
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate');
  const cacheWhitelist = [STATIC_CACHE_NAME, DATA_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[Service Worker] Activation complete. Claiming clients.');
        return self.clients.claim();
    })
  );
});

// Fetch event: handle network requests with different strategies.
self.addEventListener('fetch', event => {
  const { request } = event;

  if (!request.url.startsWith('http')) {
    return;
  }
  
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }
  
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis.com')) {
    if (url.hostname !== 'storage.googleapis.com' || !url.pathname.startsWith('/qurantxt/')) {
        return;
    }
  }

  // Strategy 1: Network First for App Shell files and all source code
  // Ensures the user gets the latest version of the app if online.
  const isAppShellFile = url.pathname.endsWith('/') || 
                         url.pathname.endsWith('.html') || 
                         url.pathname.endsWith('.tsx') || 
                         url.pathname.endsWith('.ts') || 
                         url.pathname.endsWith('.jsx') || 
                         url.pathname.endsWith('.js') || 
                         url.pathname.endsWith('.css');
  if (isAppShellFile) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
                 return caches.open(STATIC_CACHE_NAME).then(cache => {
                    cache.put(request, networkResponse.clone());
                    return networkResponse;
                });
            }
            // If network gives a non-200 response (like 304), try cache, but fallback to responding with the networkResponse anyway
            return caches.match(request, { ignoreSearch: true }).then(cached => {
                return cached || networkResponse;
            });
        })
        .catch(() => {
            // If network fails (offline), fall back to cache, then fallback to index.html
            return caches.match(request, { ignoreSearch: true }).then(cached => {
                if (cached) return cached;
                return caches.match('./index.html').then(htmlCached => {
                    return htmlCached || caches.match('./');
                });
            });
        })
    );
    return;
  }

  // Strategy 2: Stale-While-Revalidate for API calls and other data.
  // Serves from cache immediately, then updates cache in the background.
  if (url.hostname === 'storage.googleapis.com' || url.hostname === 'api.alquran.cloud' || url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'everyayah.com' || url.hostname === 'cdn.islamic.network') {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(err => {
            console.warn('[Service Worker] Network fetch failed for data:', request.url);
          });

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Strategy 3: Cache First for other static assets (fonts, images, etc.).
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(cachedResponse => {
      return cachedResponse || fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
            return caches.open(STATIC_CACHE_NAME).then(cache => {
                cache.put(request, networkResponse.clone());
                return networkResponse;
            });
        }
        return networkResponse;
      });
    })
  );
});

// Listen for a message from the client to activate the new service worker.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});