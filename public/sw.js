const CACHE_NAME = 'qin-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg',
]

const API_CACHE = 'qin-api-v1'

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== API_CACHE).map((key) => caches.delete(key)),
      ),
    ),
  )
  self.clients.claim()
})

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API requests: try network first, cache the response
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(API_CACHE).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() => caches.match(request)),
    )
    return
  }

  // Static assets: cache first, then network
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  )
})

// Handle push notifications (future-ready)
self.addEventListener('push', (event) => {
  if (!event.data) return
  const payload = event.data.json()
  const options = {
    body: payload.body || 'You have a new notification from Q-In.',
    icon: '/icons/android-chrome-192x192.png',
    badge: '/icons/android-chrome-192x192.png',
    tag: payload.tag || 'qin-notification',
    data: payload.data || {},
  }
  event.waitUntil(self.registration.showNotification(payload.title || 'Q-In', options))
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data.url || '/app/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const running = clients.find((client) => client.url.includes(url) || client.url.includes('/app'))
      if (running) return running.focus()
      return self.clients.openWindow(url)
    }),
  )
})
