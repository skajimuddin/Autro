// Bump this whenever the strategy below changes — a different CACHE_NAME is
// what makes the browser notice the file differs and go through install /
// activate again. It is NOT a release version; do not bump it per deploy.
const CACHE_NAME = 'autro-cache-v2'

self.addEventListener('install', () => {
  // Take over as soon as this worker finishes installing, instead of sitting
  // "waiting" until every open tab of the old worker closes.
  self.skipWaiting()
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
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html'))),
    )
    return
  }

  // Everything else (Vite's hashed JS/CSS/images): cache-first. The filename
  // changes whenever the content does, so a cache hit is always correct.
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
