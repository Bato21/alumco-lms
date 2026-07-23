// Service worker de Alumco: notificaciones push + caché de assets estáticos.
// Solo se cachean archivos inmutables (/_next/static lleva hash de contenido
// en el nombre, /icons y fuentes cambian de URL al cambiar). HTML y datos
// JAMÁS se cachean: siempre van a la red (auth y RLS mandan).

const CACHE_ESTATICOS = 'alumco-static-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('alumco-static-') && k !== CACHE_ESTATICOS)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

function esAssetInmutable(url) {
  if (url.origin !== self.location.origin) return false
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.woff2')
  )
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || !esAssetInmutable(url)) return

  event.respondWith(
    caches.open(CACHE_ESTATICOS).then(async (cache) => {
      const cacheada = await cache.match(event.request)
      if (cacheada) return cacheada
      const respuesta = await fetch(event.request)
      if (respuesta.ok) cache.put(event.request, respuesta.clone())
      return respuesta
    })
  )
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Alumco', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/inicio' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const rawUrl = (event.notification.data && event.notification.data.url) || '/inicio'
  const targetUrl = new URL(rawUrl, self.location.origin)

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client && client.url.startsWith(self.location.origin)) {
          if ('navigate' in client) {
            return client.navigate(targetUrl.href).then((navigatedClient) => {
              return (navigatedClient || client).focus()
            })
          }
          return client.focus()
        }
      }
      return clients.openWindow(targetUrl.href)
    })
  )
})
