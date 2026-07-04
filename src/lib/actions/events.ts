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

// ── Roles: jefes y delegados ───────────────────────────────

const RoleSchema = z.object({
  user_id: z.string().uuid('Selecciona un trabajador'),
  role: z.enum(['jefe', 'delegado']),
  area: AREA_ENUM,
})

export async function setEventRoleAction(
  eventId: string,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }
    if (caller.role !== 'admin') return { error: 'No autorizado' }

    const parsed = RoleSchema.safeParse({
      user_id: formData.get('user_id'),
      role: formData.get('role'),
      area: formData.get('area'),
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { error } = await ac
      .from('event_roles')
      .insert({ event_id: eventId, ...parsed.data }) as { error: { message: string; code?: string } | null }

    if (error) {
      if (error.code === '23505') {
        return { error: 'Esa persona ya tiene rol en el evento, o el área ya tiene jefe.' }
      }
      return { error: error.message }
    }
    revalidateEventos(eventId)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al asignar el rol' }
  }
}

export async function removeEventRoleAction(
  roleId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }
    if (caller.role !== 'admin') return { error: 'No autorizado' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { data: role } = await ac
      .from('event_roles').select('event_id').eq('id', roleId).single() as { data: { event_id: string } | null }
    const { error } = await ac.from('event_roles').delete().eq('id', roleId) as { error: { message: string } | null }

    if (error) return { error: error.message }
    revalidateEventos(role?.event_id)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al quitar el rol' }
  }
}

// ── Tareas ─────────────────────────────────────────────────

const TaskSchema = z.object({
  title: z.string().min(3, 'La tarea debe tener al menos 3 caracteres'),
  area: AREA_ENUM,
  assigned_to: z.string().uuid().optional().nullable(),
})

export async function createTaskAction(
  eventId: string,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }

    const parsed = TaskSchema.safeParse({
      title: formData.get('title'),
      area: formData.get('area'),
      assigned_to: formData.get('assigned_to') || null,
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

    // Admin crea en cualquier área; jefe solo en la(s) suya(s)
    const perms = await getEventPermissions(eventId, caller.userId, caller.role)
    if (!perms.isAdmin && !perms.jefeAreas.includes(parsed.data.area)) {
      return { error: 'Solo puedes crear tareas de tu área' }
    }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any

    const { data: maxRow } = await ac
      .from('event_tasks')
      .select('order_index')
      .eq('event_id', eventId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: { order_index: number } | null }

    const { error } = await ac.from('event_tasks').insert({
      event_id: eventId,
      title: parsed.data.title,
      area: parsed.data.area,
      assigned_to: parsed.data.assigned_to ?? null,
      is_done: false,
      done_by: null,
      done_at: null,
      order_index: (maxRow?.order_index ?? -1) + 1,
      created_by: caller.userId,
    }) as { error: { message: string } | null }

    if (error) return { error: error.message }
    revalidateEventos(eventId)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al crear la tarea' }
  }
}

export async function toggleTaskAction(
  taskId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { data: task } = await ac
      .from('event_tasks')
      .select('event_id, area, assigned_to, is_done')
      .eq('id', taskId)
      .single() as { data: { event_id: string; area: string; assigned_to: string | null; is_done: boolean } | null }

    if (!task) return { error: 'Tarea no encontrada' }

    const perms = await getEventPermissions(task.event_id, caller.userId, caller.role)
    const canToggle = perms.isAdmin
      || perms.jefeAreas.includes(task.area)
      || task.assigned_to === caller.userId
    if (!canToggle) return { error: 'No puedes modificar esta tarea' }

    const nowDone = !task.is_done
    const { error } = await ac
      .from('event_tasks')
      .update({
        is_done: nowDone,
        done_by: nowDone ? caller.userId : null,
        done_at: nowDone ? new Date().toISOString() : null,
      })
      .eq('id', taskId) as { error: { message: string } | null }

    if (error) return { error: error.message }
    revalidateEventos(task.event_id)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al actualizar la tarea' }
  }
}

export async function deleteTaskAction(
  taskId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { data: task } = await ac
      .from('event_tasks')
      .select('event_id, area')
      .eq('id', taskId)
      .single() as { data: { event_id: string; area: string } | null }

    if (!task) return { error: 'Tarea no encontrada' }

    const perms = await getEventPermissions(task.event_id, caller.userId, caller.role)
    if (!perms.isAdmin && !perms.jefeAreas.includes(task.area)) {
      return { error: 'No puedes eliminar esta tarea' }
    }

    const { error } = await ac.from('event_tasks').delete().eq('id', taskId) as { error: { message: string } | null }
    if (error) return { error: error.message }
    revalidateEventos(task.event_id)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al eliminar la tarea' }
  }
}

// ── Documentos (bucket privado event-docs) ─────────────────

const DOC_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const DOC_MAX = 10 * 1024 * 1024

export async function uploadEventDocAction(
  eventId: string,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }
    if (caller.role !== 'admin') return { error: 'No autorizado' }

    const file = formData.get('file') as File
    if (!file || file.size === 0) return { error: 'No se seleccionó archivo' }
    if (!DOC_TYPES.includes(file.type)) return { error: 'Solo se permiten PDF, Excel o Word' }
    if (file.size > DOC_MAX) return { error: 'El documento no puede superar 10MB' }

    const docType = formData.get('doc_type') === 'dificultades_alimenticias'
      ? 'dificultades_alimenticias' : 'otro'
    const name = (formData.get('name') as string) || file.name

    const adminClient = await createAdminClient()
    const path = `${eventId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`

    const { error: uploadError } = await adminClient.storage
      .from('event-docs')
      .upload(path, file, { contentType: file.type })
    if (uploadError) return { error: 'Error al subir el archivo' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { error } = await ac.from('event_documents').insert({
      event_id: eventId,
      name,
      file_path: path,
      doc_type: docType,
      uploaded_by: caller.userId,
    }) as { error: { message: string } | null }

    if (error) {
      await adminClient.storage.from('event-docs').remove([path])
      return { error: error.message }
    }
    revalidateEventos(eventId)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al subir el documento' }
  }
}

export async function deleteEventDocAction(
  docId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }
    if (caller.role !== 'admin') return { error: 'No autorizado' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { data: doc } = await ac
      .from('event_documents')
      .select('event_id, file_path, doc_type')
      .eq('id', docId)
      .single() as { data: { event_id: string; file_path: string; doc_type: string } | null }

    if (!doc) return { error: 'Documento no encontrado' }

    // No dejar un evento activo sin su doc de dificultades alimenticias
    if (doc.doc_type === 'dificultades_alimenticias') {
      const [{ data: event }, { data: others }] = await Promise.all([
        ac.from('events').select('status').eq('id', doc.event_id).single() as Promise<{ data: { status: string } | null }>,
        ac.from('event_documents').select('id').eq('event_id', doc.event_id).eq('doc_type', 'dificultades_alimenticias').neq('id', docId) as Promise<{ data: { id: string }[] | null }>,
      ])
      if (event?.status === 'activo' && (others ?? []).length === 0) {
        return { error: 'Un evento activo no puede quedar sin el documento de dificultades alimenticias. Sube otro primero.' }
      }
    }

    const { error } = await ac.from('event_documents').delete().eq('id', docId) as { error: { message: string } | null }
    if (error) return { error: error.message }

    await adminClient.storage.from('event-docs').remove([doc.file_path])
    revalidateEventos(doc.event_id)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al eliminar el documento' }
  }
}

export async function getEventDocUrlAction(
  docId: string,
): Promise<{ url?: string; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { data: doc } = await ac
      .from('event_documents').select('file_path').eq('id', docId).single() as { data: { file_path: string } | null }
    if (!doc) return { error: 'Documento no encontrado' }

    const { data, error } = await adminClient.storage
      .from('event-docs')
      .createSignedUrl(doc.file_path, 3600)
    if (error || !data) return { error: 'No se pudo generar el enlace' }
    return { url: data.signedUrl }
  } catch {
    return { error: 'Error inesperado al obtener el documento' }
  }
}

// ── Fotos (bucket público event-photos) ────────────────────

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const PHOTO_MAX = 5 * 1024 * 1024

export async function uploadEventPhotoAction(
  eventId: string,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }

    const perms = await getEventPermissions(eventId, caller.userId, caller.role)
    if (!perms.isParticipant) return { error: 'Solo quienes participan del evento pueden subir fotos' }

    const file = formData.get('file') as File
    if (!file || file.size === 0) return { error: 'No se seleccionó archivo' }
    if (!PHOTO_TYPES.includes(file.type)) return { error: 'Solo se permiten imágenes JPG, PNG o WebP' }
    if (file.size > PHOTO_MAX) return { error: 'La foto no puede superar 5MB' }

    const caption = ((formData.get('caption') as string) || '').slice(0, 200) || null

    const adminClient = await createAdminClient()
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${eventId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await adminClient.storage
      .from('event-photos')
      .upload(path, file, { contentType: file.type })
    if (uploadError) return { error: 'Error al subir la foto' }

    const { data: { publicUrl } } = adminClient.storage
      .from('event-photos')
      .getPublicUrl(path)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { error } = await ac.from('event_photos').insert({
      event_id: eventId,
      image_url: publicUrl,
      caption,
      uploaded_by: caller.userId,
    }) as { error: { message: string } | null }

    if (error) {
      await adminClient.storage.from('event-photos').remove([path])
      return { error: error.message }
    }
    revalidateEventos(eventId)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al subir la foto' }
  }
}

export async function deleteEventPhotoAction(
  photoId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { data: photo } = await ac
      .from('event_photos')
      .select('event_id, image_url, uploaded_by')
      .eq('id', photoId)
      .single() as { data: { event_id: string; image_url: string; uploaded_by: string } | null }

    if (!photo) return { error: 'Foto no encontrada' }
    if (caller.role !== 'admin' && photo.uploaded_by !== caller.userId) {
      return { error: 'Solo puedes eliminar tus propias fotos' }
    }

    const { error } = await ac.from('event_photos').delete().eq('id', photoId) as { error: { message: string } | null }
    if (error) return { error: error.message }

    // Derivar el path desde la URL pública: .../event-photos/<path>
    const marker = '/event-photos/'
    const idx = photo.image_url.indexOf(marker)
    if (idx !== -1) {
      await adminClient.storage.from('event-photos').remove([photo.image_url.slice(idx + marker.length)])
    }
    revalidateEventos(photo.event_id)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al eliminar la foto' }
  }
}
