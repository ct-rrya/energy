const CACHE_NAME = 'ecostep-static-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle same-origin GET requests
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache live API calls, Socket.IO, or local Wi-Fi scan endpoints
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/socket.io/') ||
    url.pathname.startsWith('/__local/')
  ) {
    return;
  }

  // Page navigations: network-first with branded offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cachedOffline = await caches.match(OFFLINE_URL);
        return cachedOffline || new Response('Offline', { status: 503 });
      }),
    );
    return;
  }

  // Static assets (JS/CSS/images/fonts/emojis): stale-while-revalidate
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/emojis/') ||
    url.pathname.startsWith('/brand/') ||
    /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?|ttf)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkPromise;
      }),
    );
  }
});
