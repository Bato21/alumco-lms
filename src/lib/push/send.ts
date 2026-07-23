// Envío de notificaciones push (Web Push / VAPID). Solo server: usa la llave
// privada y el service role. La tabla push_subscriptions guarda un registro
// por navegador/celular suscrito; las suscripciones muertas (endpoint dado de
// baja por el navegador) se limpian al primer envío fallido.
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/server'

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export interface PushSendResult {
  requestedUsers: number
  subscriptions: number
  sent: number
  failed: number
  staleDeleted: number
  missingConfig?: boolean
  missingTable?: boolean
  error?: string
}

let vapidListo = false

function configurarVapid(): boolean {
  if (vapidListo) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!publicKey || !privateKey || !subject) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidListo = true
  return true
}

function emptyResult(userIds: string[]): PushSendResult {
  return {
    requestedUsers: userIds.length,
    subscriptions: 0,
    sent: 0,
    failed: 0,
    staleDeleted: 0,
  }
}

function isPushTableMissing(message?: string | null, code?: string | null): boolean {
  if (code === '42P01' || code === 'PGRST205') return true
  if (!message) return false
  return /does not exist|schema cache/i.test(message)
}

// Manda el payload a todas las suscripciones de los usuarios indicados.
// Nunca lanza: los push son best-effort y jamás deben romper la action que
// los dispara. Si la tabla aún no existe (migración pendiente), no-op.
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<PushSendResult> {
  const base = emptyResult(userIds)
  try {
    if (userIds.length === 0) return base
    if (!configurarVapid()) return { ...base, missingConfig: true }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { data: subs, error } = await ac
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .in('user_id', userIds) as {
      data: { id: string; endpoint: string; p256dh: string; auth: string }[] | null
      error: { message: string; code?: string } | null
      }

    if (error) {
      return {
        ...base,
        missingTable: isPushTableMissing(error.message, error.code),
        error: error.message,
      }
    }
    if (!subs || subs.length === 0) return base

    const body = JSON.stringify(payload)
    const muertas: string[] = []

    const resultados = await Promise.all(subs.map(async (s): Promise<'sent' | 'stale' | 'failed'> => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        )
        return 'sent'
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          muertas.push(s.id)
          return 'stale'
        }
        return 'failed'
      }
    }))

    if (muertas.length > 0) {
      await ac.from('push_subscriptions').delete().in('id', muertas)
    }

    return {
      requestedUsers: userIds.length,
      subscriptions: subs.length,
      sent: resultados.filter(r => r === 'sent').length,
      failed: resultados.filter(r => r === 'failed').length,
      staleDeleted: muertas.length,
    }
  } catch (err) {
    console.error('Error enviando push:', err)
    return { ...base, error: 'Error inesperado al enviar push' }
  }
}
