// Service worker de Alumco: notificaciones push + caché de assets estáticos.
// Solo se cachean archivos inmutables (/_next/static lleva hash de contenido
// en el nombre, /icons y fuentes cambian de URL al cambiar). El HTML de las
// páginas y los datos JAMÁS se cachean: siempre van a la red (auth y RLS
// mandan).
//
// Única excepción: /offline, que es estática y no contiene datos de usuario.
// Se precachea para poder responder una navegación que falla por falta de red
// en vez de mostrar el error del navegador.

const CACHE_ESTATICOS = 'alumco-static-v3'
const RUTA_OFFLINE = '/offline'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_ESTATICOS)
      .then((cache) => cache.add(new Request(RUTA_OFFLINE, { cache: 'reload' })))
      .catch(() => {})
      .then(() => self.skipWaiting())
  )
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
  if (event.request.method !== 'GET') return

  // Navegaciones: siempre a la red (nunca se cachea HTML de sesión). Si la red
  // falla, se responde la pantalla /offline precacheada en vez del error del
  // navegador. Un fallo de red no es lo mismo que un 401/404: esos vienen del
  // servidor y pasan tal cual.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_ESTATICOS)
        const offline = await cache.match(RUTA_OFFLINE)
        return (
          offline ??
          new Response('Sin conexión', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        )
      })
    )
    return
  }

  if (!esAssetInmutable(url)) return

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
