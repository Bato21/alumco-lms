'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { AREAS_TRABAJO, type AreaTrabajo } from '@/lib/types/database'

const AREA_ENUM = z.enum(AREAS_TRABAJO as [AreaTrabajo, ...AreaTrabajo[]])

const EventSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  event_type: z.enum(['dieciocho', 'navidad', 'ano_nuevo']),
  description: z.string().min(10, 'Describe el evento (mínimo 10 caracteres)'),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
})

// ── Helpers internos ───────────────────────────────────────

async function getCaller(): Promise<{ userId: string; role: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
  if (!profile) return null
  return { userId: user.id, role: profile.role }
}

type EventPerms = {
  isAdmin: boolean
  jefeAreas: string[]
  isParticipant: boolean // admin, tiene rol en el evento, o tiene tarea asignada
}

async function getEventPermissions(eventId: string, userId: string, role: string): Promise<EventPerms> {
  if (role === 'admin') return { isAdmin: true, jefeAreas: [], isParticipant: true }
  const adminClient = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ac = adminClient as any
  const [{ data: roles }, { data: tasks }] = await Promise.all([
    ac.from('event_roles').select('role, area').eq('event_id', eventId).eq('user_id', userId) as Promise<{ data: { role: string; area: string }[] | null }>,
    ac.from('event_tasks').select('id').eq('event_id', eventId).eq('assigned_to', userId).limit(1) as Promise<{ data: { id: string }[] | null }>,
  ])
  const jefeAreas = (roles ?? []).filter(r => r.role === 'jefe').map(r => r.area)
  const isParticipant = (roles ?? []).length > 0 || (tasks ?? []).length > 0
  return { isAdmin: false, jefeAreas, isParticipant }
}

function revalidateEventos(eventId?: string) {
  revalidatePath('/admin/eventos')
  revalidatePath('/eventos')
  revalidatePath('/inicio')
  if (eventId) {
    revalidatePath(`/admin/eventos/${eventId}`)
    revalidatePath(`/eventos/${eventId}`)
  }
}

// ── CRUD de eventos (solo admin) ───────────────────────────

export async function createEventAction(
  formData: FormData,
): Promise<{ success?: boolean; eventId?: string; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }
    if (caller.role !== 'admin') return { error: 'No autorizado' }

    const parsed = EventSchema.safeParse({
      title: formData.get('title'),
      event_type: formData.get('event_type'),
      description: formData.get('description'),
      event_date: formData.get('event_date'),
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { data, error } = await ac
      .from('events')
      .insert({ ...parsed.data, status: 'planificacion', cover_image_url: null, created_by: caller.userId })
      .select('id')
      .single() as { data: { id: string } | null; error: { message: string } | null }

    if (error || !data) return { error: error?.message ?? 'No se pudo crear el evento' }

    revalidateEventos()
    return { success: true, eventId: data.id }
  } catch {
    return { error: 'Error inesperado al crear el evento' }
  }
}

export async function updateEventAction(
  eventId: string,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }
    if (caller.role !== 'admin') return { error: 'No autorizado' }

    const parsed = EventSchema.safeParse({
      title: formData.get('title'),
      event_type: formData.get('event_type'),
      description: formData.get('description'),
      event_date: formData.get('event_date'),
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { error } = await ac
      .from('events')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', eventId) as { error: { message: string } | null }

    if (error) return { error: error.message }
    revalidateEventos(eventId)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al actualizar el evento' }
  }
}

export async function publishEventAction(
  eventId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }
    if (caller.role !== 'admin') return { error: 'No autorizado' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any

    // Regla dura: sin doc de dificultades alimenticias no se publica
    const { data: docs } = await ac
      .from('event_documents')
      .select('id')
      .eq('event_id', eventId)
      .eq('doc_type', 'dificultades_alimenticias')
      .limit(1) as { data: { id: string }[] | null }

    if (!docs || docs.length === 0) {
      return { error: 'Falta el documento de dificultades alimenticias. Súbelo antes de publicar.' }
    }

    const { data: updated, error } = await ac
      .from('events')
      .update({ status: 'activo', updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .eq('status', 'planificacion')
      .select('id') as { data: { id: string }[] | null; error: { message: string } | null }

    if (error) return { error: error.message }
    if (!updated || updated.length === 0) {
      return { error: 'El evento no está en planificación — no se puede publicar.' }
    }
    revalidateEventos(eventId)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al publicar el evento' }
  }
}

export async function finalizeEventAction(
  eventId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }
    if (caller.role !== 'admin') return { error: 'No autorizado' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { data: updated, error } = await ac
      .from('events')
      .update({ status: 'finalizado', updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .eq('status', 'activo')
      .select('id') as { data: { id: string }[] | null; error: { message: string } | null }

    if (error) return { error: error.message }
    if (!updated || updated.length === 0) {
      return { error: 'Solo un evento activo se puede finalizar.' }
    }
    revalidateEventos(eventId)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al finalizar el evento' }
  }
}

export async function deleteEventAction(
  eventId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }
    if (caller.role !== 'admin') return { error: 'No autorizado' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { error } = await ac.from('events').delete().eq('id', eventId) as { error: { message: string } | null }

    if (error) return { error: error.message }
    revalidateEventos(eventId)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al eliminar el evento' }
  }
}
