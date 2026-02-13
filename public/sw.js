const CACHE_NAME = 'fulbito-v1'
const STATIC_ASSETS = [
    '/',
    '/offline',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
]

// Install — precache shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS)
        })
    )
    self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        })
    )
    self.clients.claim()
})

// Fetch — network-first for navigations/API, cache-first for assets
self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)

    // Skip non-GET and external requests
    if (request.method !== 'GET') return
    if (url.origin !== self.location.origin) return

    // Navigations: network-first with offline fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone()
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
                    return response
                })
                .catch(() => caches.match('/offline') || caches.match('/'))
        )
        return
    }

    // Static assets (_next/static, icons, images): cache-first
    if (
        url.pathname.startsWith('/_next/static') ||
        url.pathname.startsWith('/icons') ||
        url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|woff2?|ttf|css|js)$/)
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached
                return fetch(request).then((response) => {
                    const clone = response.clone()
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
                    return response
                })
            })
        )
        return
    }

    // Everything else: network-first
    event.respondWith(
        fetch(request)
            .then((response) => {
                const clone = response.clone()
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
                return response
            })
            .catch(() => caches.match(request))
    )
})
