'use client'

// Activación de notificaciones push desde Mi perfil (nunca prompt al entrar
// a la app: el permiso se pide solo cuando el usuario aprieta el botón).
// iOS las soporta desde 16.4 y SOLO con la app instalada en pantalla de
// inicio; Android/desktop las soportan directo.

import { useEffect, useState, useTransition } from 'react'
import {
  savePushSubscriptionAction,
  deletePushSubscriptionAction,
  sendTestPushAction,
} from '@/lib/actions/push'

type Estado = 'cargando' | 'no-soportado' | 'bloqueado' | 'inactivo' | 'activo'

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  const arr = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr.buffer as ArrayBuffer
}

function bufferSourceToBase64Url(source: BufferSource | null | undefined): string | null {
  if (!source) return null
  const bytes = source instanceof ArrayBuffer
    ? new Uint8Array(source)
    : new Uint8Array(source.buffer, source.byteOffset, source.byteLength)
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function normalizarBase64Url(value: string): string {
  return value.trim().replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function usaClaveActual(sub: PushSubscription, vapid: string): boolean {
  const claveSub = bufferSourceToBase64Url(sub.options.applicationServerKey)
  if (!claveSub) return true
  return claveSub === normalizarBase64Url(vapid)
}

async function registrarServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/sw.js', { scope: '/' })
}

async function guardarSuscripcion(sub: PushSubscription): Promise<{ success?: boolean; error?: string }> {
  const json = sub.toJSON()
  const p256dh = json.keys?.p256dh
  const auth = json.keys?.auth
  if (!p256dh || !auth) return { error: 'El navegador entregó una suscripción incompleta' }

  return savePushSubscriptionAction({
    endpoint: sub.endpoint,
    keys: { p256dh, auth },
  })
}

export function ActivarNotificaciones() {
  const [estado, setEstado] = useState<Estado>('cargando')
  const [error, setError] = useState<string | null>(null)
  const [probada, setProbada] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let cancelado = false

    async function cargarEstado() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window) || !window.isSecureContext) {
        if (!cancelado) setEstado('no-soportado')
        return
      }

      if (Notification.permission === 'denied') {
        if (!cancelado) setEstado('bloqueado')
        return
      }

      try {
        const reg = await registrarServiceWorker()
        const sub = await reg.pushManager.getSubscription()
        const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? ''

        if (sub && vapid && !usaClaveActual(sub, vapid)) {
          await deletePushSubscriptionAction(sub.endpoint)
          await sub.unsubscribe()
          if (!cancelado) {
            setEstado('inactivo')
            setError('Se renovaron las llaves de notificación. Actívalas nuevamente en este dispositivo.')
          }
          return
        }

        if (sub && Notification.permission === 'granted') {
          const res = await guardarSuscripcion(sub)
          if (!cancelado && res.error) setError(res.error)
        }

        if (!cancelado) setEstado(sub ? 'activo' : 'inactivo')
      } catch {
        if (!cancelado) setEstado('no-soportado')
      }
    }

    cargarEstado()
    return () => { cancelado = true }
  }, [])

  function activar() {
    setError(null)
    setProbada(false)
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
    if (!vapid) {
      setError('Faltan las llaves de notificación en el servidor (VAPID). Avisa al equipo.')
      return
    }

    startTransition(async () => {
      try {
        const permiso = await Notification.requestPermission()
        if (permiso !== 'granted') {
          setEstado(permiso === 'denied' ? 'bloqueado' : 'inactivo')
          return
        }

        const reg = await registrarServiceWorker()
        let sub = await reg.pushManager.getSubscription()

        if (sub && !usaClaveActual(sub, vapid)) {
          await deletePushSubscriptionAction(sub.endpoint)
          await sub.unsubscribe()
          sub = null
        }

        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: base64ToArrayBuffer(vapid),
          })
        }

        const res = await guardarSuscripcion(sub)
        if (res.error) {
          setError(res.error)
          await sub.unsubscribe()
          setEstado('inactivo')
          return
        }

        setEstado('activo')
      } catch (err) {
        console.error('Error activando notificaciones:', err)
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
    setProbada(false)
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? ''

        if (!sub) {
          setEstado('inactivo')
          setError('Este dispositivo no tiene una suscripción activa. Activa las notificaciones nuevamente.')
          return
        }

        if (vapid && !usaClaveActual(sub, vapid)) {
          await deletePushSubscriptionAction(sub.endpoint)
          await sub.unsubscribe()
          setEstado('inactivo')
          setError('Se renovaron las llaves de notificación. Actívalas nuevamente en este dispositivo.')
          return
        }

        const sync = await guardarSuscripcion(sub)
        if (sync.error) {
          setError(sync.error)
          return
        }

        const res = await sendTestPushAction()
        if (res.error) setError(res.error)
        else setProbada(true)
      } catch {
        setError('No se pudo enviar la notificación de prueba')
      }
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
          {/* Aquí la flecha no adorna: describe una secuencia de menú. Se
              oculta al lector y se le da la palabra equivalente. */}
          (Compartir <span aria-hidden="true">→</span><span className="sr-only">y luego</span>{' '}
          &ldquo;Agregar a pantalla de inicio&rdquo;) y ábrela desde el ícono.
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
