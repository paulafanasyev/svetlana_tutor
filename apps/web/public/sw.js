/* AI English Teacher — offline shell and safe runtime caching.
   Updates: navigations are network-first (a fresh index.html after every deploy); fingerprinted assets are
   cache-first; a failed asset is a real network error (never index.html in place of JS); the page reloads
   itself when a new build is out (see app/updateWatch.js). */
const CACHE = 'aet-v9';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
];
const FONT_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function cacheFirst(request) {
  return caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
    }
    return response;
  }));
}

function staleWhileRevalidate(request) {
  return caches.match(request).then((cached) => {
    const fresh = fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
      }
      return response;
    });
    return cached || fresh;
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // The app shell: always try the network first, so a new deploy is picked up; offline → the cached shell.
  // Only the actual app entry may overwrite the cached shell: a navigation to any
  // other same-origin document (e.g. privacy.html) must not poison './index.html'.
  if (request.mode === 'navigate') {
    const shellPath = new URL('./index.html', self.registration.scope).pathname;
    event.respondWith(fetch(request, { cache: 'no-store' }).then((response) => {
      if (response.ok && !response.redirected && new URL(response.url).pathname === shellPath) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put('./index.html', copy)).catch(() => {});
      }
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }

  // Never put model weights, WebLLM manifests, or any third-party JS/media in
  // this worker's cache. WebLLM manages model Cache Storage itself.
  if (url.origin !== self.location.origin) {
    if (FONT_HOSTS.has(url.hostname)) event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Vite's fingerprinted bundles are immutable and safe to cache first.
  if (/\/assets\//.test(url.pathname)) {
    // fixed-name media (greeting mp4) must stay fresh: network-first, cache only as offline fallback
    if (/\.(mp4|webm|mp3)$/.test(url.pathname)) {
      event.respondWith(fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      }).catch(() => caches.match(request)));
      return;
    }
    event.respondWith(cacheFirst(request));
  }
});
