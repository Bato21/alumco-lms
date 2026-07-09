// Service worker de Alumco: recibe notificaciones push con la app cerrada
// y abre la URL del aviso al tocarlas. Sin caché offline (por ahora).

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
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
