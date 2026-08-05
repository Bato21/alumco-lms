'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // En desarrollo el SW cachea /_next/static con URLs estables (sin hash de
    // contenido como en prod), así que sirve CSS/JS viejo tras cada cambio y ni
    // el hard-refresh lo rompe. En dev lo desregistramos y limpiamos su caché
    // para ver siempre lo último; solo se registra en producción.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {})
      if ('caches' in window) {
        caches
          .keys()
          .then((keys) => keys.filter((k) => k.startsWith('alumco-static-')).forEach((k) => caches.delete(k)))
          .catch(() => {})
      }
      return
    }

    if (!window.isSecureContext) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err) => {
        console.warn('No se pudo registrar el service worker de Alumco:', err)
      })
  }, [])

  return null
}
