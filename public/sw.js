const CACHE_NAME = 'app-cache-v1'
const ICON_CACHE = 'icons-cache-v1'
const V86_CACHE = 'v86-cache-v1'
const PRECACHE_URLS = [
  '/icons/chrome.png',
  '/icons/terminal.png',
  '/icons/settings.png',
  '/icons/windows-11.png',
  '/icons/vscode.png',
  '/icons/doom.png',
  '/icons/libreoffice.jpg',
  '/icons/minecraft.png',
  '/icons/music.png',
]
const V86_URLS = [
  '/v86/libv86.js',
  '/v86/v86.wasm',
  '/v86/bios/seabios.bin',
  '/v86/bios/vgabios.bin',
  '/v86/images/buildroot-bzimage68.bin',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(ICON_CACHE).then((cache) => {
        console.log('hi sir caching icons')
        return cache.addAll(PRECACHE_URLS).catch((err) => {
          console.warn('why sir', err)
        })
      }),
      caches.open(V86_CACHE).then((cache) => {
        console.log('caching v86 files')
        return cache.addAll(V86_URLS).catch((err) => {
          console.warn('v86 cache failed', err)
        })
      })
    ])
  )
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== ICON_CACHE && cacheName !== CACHE_NAME && cacheName !== V86_CACHE) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (url.pathname.startsWith('/icons/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const cache = caches.open(ICON_CACHE)
            cache.then((c) => c.put(request, response.clone()))
          }
          return response
        })
        .catch(() => {
          return caches.match(request)
        })
    )
    return
  }
  if (url.pathname.startsWith('/v86/')) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response
        }
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const cache = caches.open(V86_CACHE)
            cache.then((c) => c.put(request, response.clone()))
          }
          return response
        }).catch(() => {
          return caches.match(request)
        })
      })
    )
    return
  }
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }
        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache)
        })
        return response
      }).catch((err) => {
        console.warn('Fetch failed, returning cached or empty response', err)
        return caches.match(request) || new Response('Offline', { status: 503 })
      })
    })
  )
})
