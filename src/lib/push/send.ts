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

// Manda el payload a todas las suscripciones de los usuarios indicados.
// Nunca lanza: los push son best-effort y jamás deben romper la action que
// los dispara. Si la tabla aún no existe (migración pendiente), no-op.
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  try {
    if (userIds.length === 0 || !configurarVapid()) return

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

    if (error || !subs || subs.length === 0) return

    const body = JSON.stringify(payload)
    const muertas: string[] = []

    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        )
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) muertas.push(s.id)
      }
    }))

    if (muertas.length > 0) {
      await ac.from('push_subscriptions').delete().in('id', muertas)
    }
  } catch (err) {
    console.error('Error enviando push:', err)
  }
}
