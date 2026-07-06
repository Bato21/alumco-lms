'use client'

// Activación de notificaciones push desde Mi perfil (nunca prompt al entrar
// a la app — el permiso se pide solo cuando el usuario aprieta el botón).
// iOS las soporta desde 16.4 y SOLO con la app instalada en pantalla de
// inicio; Android/desktop las soportan directo.

import { useEffect, useState, useTransition } from 'react'
import {
  savePushSubscriptionAction,
  deletePushSubscriptionAction,
  sendTestPushAction,
} from '@/lib/actions/push'

type Estado = 'cargando' | 'no-soportado' | 'bloqueado' | 'inactivo' | 'activo'

function base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  const arr = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function ActivarNotificaciones() {
  const [estado, setEstado] = useState<Estado>('cargando')
  const [error, setError] = useState<string | null>(null)
  const [probada, setProbada] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setEstado('no-soportado')
      return
    }
    if (Notification.permission === 'denied') {
      setEstado('bloqueado')
      return
    }
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEstado(sub ? 'activo' : 'inactivo'))
      .catch(() => setEstado('no-soportado'))
  }, [])

  function activar() {
    setError(null)
    startTransition(async () => {
      try {
        const permiso = await Notification.requestPermission()
        if (permiso !== 'granted') {
          setEstado(permiso === 'denied' ? 'bloqueado' : 'inactivo')
          return
        }
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''),
        })
        const json = sub.toJSON()
        const res = await savePushSubscriptionAction({
          endpoint: sub.endpoint,
          keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
        })
        if (res.error) {
          setError(res.error)
          await sub.unsubscribe()
          return
        }
        setEstado('activo')
      } catch {
        setError('No se pudo activar las notificaciones en este dispositivo')
      }
    })
  }

  function desactivar() {
    setError(null)
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await deletePushSubscriptionAction(sub.endpoint)
          await sub.unsubscribe()
        }
        setEstado('inactivo')
        setProbada(false)
      } catch {
        setError('No se pudo desactivar')
      }
    })
  }

  function probar() {
    setError(null)
    startTransition(async () => {
      const res = await sendTestPushAction()
      if (res.error) setError(res.error)
      else setProbada(true)
    })
  }

  if (estado === 'cargando') return null

  return (
    <section className="card card-pad col entra" style={{ gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 16.5 }}>Notificaciones</h2>
        <p className="texto-s silencio-3">
          Avisos de tareas de eventos y plazos de cursos, directo a este dispositivo.
        </p>
      </div>

      {estado === 'no-soportado' && (
        <p className="texto-s silencio">
          Este navegador no soporta notificaciones. En iPhone: instala la app primero
          (Compartir → &ldquo;Agregar a pantalla de inicio&rdquo;) y ábrela desde el ícono.
        </p>
      )}

      {estado === 'bloqueado' && (
        <p className="texto-s silencio">
          Las notificaciones están bloqueadas para este sitio. Actívalas en la
          configuración del navegador y recarga la página.
        </p>
      )}

      {estado === 'inactivo' && (
        <button type="button" onClick={activar} disabled={pending} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
          {pending ? 'Activando…' : 'Activar notificaciones'}
        </button>
      )}

      {estado === 'activo' && (
        <div className="fila" style={{ gap: 10, flexWrap: 'wrap' }}>
          <span className="badge badge-info">Activas en este dispositivo</span>
          <button type="button" onClick={probar} disabled={pending} className="btn btn-ghost btn-sm">
            {probada ? '¡Enviada! Revisa la barra de notificaciones' : 'Probar notificación'}
          </button>
          <button type="button" onClick={desactivar} disabled={pending} className="btn btn-ghost btn-sm">
            Desactivar
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="texto-s" style={{ color: 'var(--peligro)', fontWeight: 600 }}>{error}</p>
      )}
    </section>
  )
}
