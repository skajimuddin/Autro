// Bump this whenever the strategy below changes — a different CACHE_NAME is
// what makes the browser notice the file differs and go through install /
// activate again. It is NOT a release version; do not bump it per deploy.
const CACHE_NAME = 'autro-cache-v3'

// The app shell precached at install time, before any page has had a chance
// to populate the runtime cache. Without this, a device that installs the
// PWA and then loses connection on its very first launch has nothing
// cached yet — not even the offline screen — and gets the browser's bare
// "no internet" page instead of ours.
const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-192-maskable.png',
  '/icon-512.png',
  '/icon-512-maskable.png',
  '/apple-touch-icon.png',
  '/fonts/geist-var.woff2',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      // Take over as soon as this worker finishes installing, instead of
      // sitting "waiting" until every open tab of the old worker closes.
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  // The API lives on a different origin (api.<domain> vs the app's own).
  // Deliberately not cached: responses are per-tenant and carry whatever
  // JWT was current when fetched, and the Cache API keys on URL, not on
  // Authorization header — caching them risks one account's data getting
  // served back on the same device after a different account signs in
  // later (a shared shop phone, an owner briefly using a staff handset).
  // The app shell + a clear offline screen degrade gracefully instead;
  // live data always requires a real connection.
  if (new URL(request.url).origin !== self.location.origin) return

  // The HTML shell: always go to the network first. It references the
  // current deploy's hashed asset filenames, so serving a stale copy is what
  // causes a white screen after a new build ships. Cache is offline-only.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(
          () =>
            // 1. This exact URL, if it was ever visited online before.
            // 2. The app shell — any client-side route resolves through it.
            // 3. The precached offline screen — always present, even on a
            //    device that has never once been online long enough to
            //    cache anything else.
            caches.match(request).then(
              (cached) => cached ?? caches.match('/index.html').then((shell) => shell ?? caches.match('/offline.html')),
            ),
        ),
    )
    return
  }

  // Everything else (Vite's hashed JS/CSS/images): cache-first. The filename
  // changes whenever the content does, so a cache hit is always correct.
  // No offline.html fallback here — a failed sub-resource (an image, a JS
  // chunk) should fail as itself, not get silently replaced with an HTML
  // document of the wrong content-type.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
    }),
  )
})
