'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendPushToUsers } from '@/lib/push/send'

// La tabla push_subscriptions todavía puede no existir (migración pendiente
// de Bato — ver supabase/propuestas/push-subscriptions.sql): mensaje amable
// en vez del error crudo de PostgREST.
function isPushNoHabilitado(message?: string | null, code?: string | null): boolean {
  if (code === '42P01' || code === 'PGRST205') return true
  if (!message) return false
  return /does not exist|schema cache/i.test(message)
}

async function getCallerId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function savePushSubscriptionAction(sub: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const userId = await getCallerId()
    if (!userId) return { error: 'No autenticado' }

    if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return { error: 'Suscripción inválida' }
    }

    // Upsert por endpoint con service role: el user_id lo fija el server (el
    // cliente no puede suscribir a otro), y re-suscribirse en el mismo
    // navegador actualiza la fila en vez de duplicarla.
    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { error } = await ac
      .from('push_subscriptions')
      .upsert(
        { user_id: userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
        { onConflict: 'endpoint' },
      ) as { error: { message: string; code?: string } | null }

    if (error) {
      return {
        error: isPushNoHabilitado(error.message, error.code)
          ? 'Las notificaciones aún no están habilitadas en el servidor'
          : error.message,
      }
    }
    return { success: true }
  } catch {
    return { error: 'Error inesperado al activar las notificaciones' }
  }
}

export async function deletePushSubscriptionAction(
  endpoint: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const userId = await getCallerId()
    if (!userId) return { error: 'No autenticado' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    // Solo borra suscripciones propias: el filtro por user_id lo garantiza.
    const { error } = await ac
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', userId) as { error: { message: string; code?: string } | null }

    if (error && !isPushNoHabilitado(error.message, error.code)) {
      return { error: error.message }
    }
    return { success: true }
  } catch {
    return { error: 'Error inesperado al desactivar las notificaciones' }
  }
}

export async function sendTestPushAction(): Promise<{ success?: boolean; error?: string }> {
  try {
    const userId = await getCallerId()
    if (!userId) return { error: 'No autenticado' }

    const result = await sendPushToUsers([userId], {
      title: 'Alumco 🔔',
      body: 'Las notificaciones están funcionando. Así te avisaremos de tareas y plazos.',
      url: '/inicio',
    })
    if (result.missingConfig) {
      return { error: 'Faltan las llaves de notificación en el servidor (VAPID)' }
    }
    if (result.missingTable) {
      return { error: 'Las notificaciones aún no están habilitadas en el servidor' }
    }
    if (result.subscriptions === 0) {
      return { error: 'Este dispositivo no quedó guardado. Desactiva y vuelve a activar las notificaciones.' }
    }
    if (result.sent === 0) {
      return { error: 'No se pudo enviar la notificación de prueba a este dispositivo' }
    }
    return { success: true }
  } catch {
    return { error: 'No se pudo enviar la notificación de prueba' }
  }
}
