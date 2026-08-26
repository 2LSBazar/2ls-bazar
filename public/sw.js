const CACHE_NAME = "2ls-bazar-shell-v2";
const APP_SHELL = ["/manifest.json"];

// Install: cache only tiny app-shell files (not product data/images)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: remove old caches from previous versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null)))
    )
  );
  self.clients.claim();
});

// Fetch: do NOT intercept anything except the app shell files.
// Everything else (product images, Firebase/API calls, JS chunks) goes
// straight to the network exactly as if there were no service worker.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isShellFile = APP_SHELL.includes(url.pathname);

  if (!isSameOrigin || !isShellFile) {
    return; // let the browser handle it normally — no caching, no delay
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
