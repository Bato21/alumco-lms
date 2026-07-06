'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { sendPushToUsers } from '@/lib/push/send'
import {
  EVENT_TYPE_EMOJI,
  type CreateEventPayload,
  type EventDocType,
  type EventTaskStatus,
} from '@/lib/types/database'

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

// Distingue un rechazo de RLS de un error genérico de base de datos, para
// dar un mensaje claro cuando una acción con cliente de usuario es
// rechazada por permisos (encargado de sección / admin).
function isRlsDenied(message?: string | null): boolean {
  if (!message) return false
  return /row-level security|permission denied/i.test(message)
}

// Error con mensaje seguro para mostrar al usuario. Se usa para los throw
// manuales dentro de bloques try/catch (p.ej. createEventAction), de modo
// que el catch pueda distinguirlos de errores crudos de Postgres.
class FriendlyError extends Error {}

async function getEventIdForSection(sectionId: string): Promise<string | null> {
  const adminClient = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ac = adminClient as any
  const { data } = await ac
    .from('event_sections')
    .select('event_id')
    .eq('id', sectionId)
    .maybeSingle() as { data: { event_id: string } | null }
  return data?.event_id ?? null
}

// Contexto de una sección para armar notificaciones push: nombre de la
// sección, evento al que pertenece y miembros actuales.
async function getSectionContexto(sectionId: string): Promise<{
  sectionName: string
  eventId: string
  eventTitle: string
  eventEmoji: string
  memberIds: string[]
} | null> {
  const adminClient = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ac = adminClient as any
  const { data } = await ac
    .from('event_sections')
    .select('name, event_id, events(title, event_type), event_section_members(user_id)')
    .eq('id', sectionId)
    .maybeSingle() as {
      data: {
        name: string
        event_id: string
        events: { title: string; event_type: keyof typeof EVENT_TYPE_EMOJI } | null
        event_section_members: { user_id: string }[] | null
      } | null
    }

  if (!data || !data.events) return null
  return {
    sectionName: data.name,
    eventId: data.event_id,
    eventTitle: data.events.title,
    eventEmoji: EVENT_TYPE_EMOJI[data.events.event_type] ?? '🎉',
    memberIds: (data.event_section_members ?? []).map(m => m.user_id),
  }
}

function revalidateEventos(eventId?: string | null) {
  revalidatePath('/admin/eventos')
  revalidatePath('/eventos')
  revalidatePath('/inicio')
  if (eventId) {
    revalidatePath(`/admin/eventos/${eventId}`)
    revalidatePath(`/eventos/${eventId}`)
  }
}

// ── CRUD de eventos (solo admin) ───────────────────────────

const CreateEventSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  event_type: z.enum(['dieciocho', 'navidad', 'ano_nuevo']),
  sede_id: z.string().min(1, 'Selecciona una sede'),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  description: z.string().min(10, 'Describe el evento (mínimo 10 caracteres)'),
  sections: z.array(z.object({
    name: z.string().min(2, 'El nombre de la sección debe tener al menos 2 caracteres'),
    description: z.string().optional(),
    members: z.array(z.object({
      user_id: z.string().uuid('Selecciona un trabajador'),
      member_role: z.enum(['encargado', 'colaborador']),
    })),
    tasks: z.array(z.object({
      title: z.string().min(3, 'La tarea debe tener al menos 3 caracteres'),
      description: z.string().optional(),
      due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    })),
  })),
})

export async function createEventAction(
  payload: CreateEventPayload,
): Promise<{ success?: boolean; eventId?: string; error?: string }> {
  let createdEventId: string | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ac: any = null

  try {
    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ac = adminClient as any

    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }
    if (caller.role !== 'admin') return { error: 'No autorizado' }

    const parsed = CreateEventSchema.safeParse(payload)
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
    const data = parsed.data

    const { data: eventRow, error: eventError } = await ac
      .from('events')
      .insert({
        title: data.title,
        event_type: data.event_type,
        sede_id: data.sede_id,
        event_date: data.event_date,
        description: data.description,
        status: 'planificacion',
        cover_image_url: null,
        created_by: caller.userId,
      })
      .select('id')
      .single() as { data: { id: string } | null; error: { message: string } | null }

    if (eventError || !eventRow) return { error: eventError?.message ?? 'No se pudo crear el evento' }
    createdEventId = eventRow.id

    for (let i = 0; i < data.sections.length; i++) {
      const section = data.sections[i]

      const { data: sectionRow, error: sectionError } = await ac
        .from('event_sections')
        .insert({
          event_id: createdEventId,
          name: section.name,
          description: section.description ?? null,
          order_index: i,
        })
        .select('id')
        .single() as { data: { id: string } | null; error: { message: string; code?: string } | null }

      if (sectionError || !sectionRow) {
        if (sectionError?.code === '23505') {
          throw new FriendlyError('Ya existe una sección con ese nombre en el evento')
        }
        throw new Error(sectionError?.message ?? `No se pudo crear la sección "${section.name}"`)
      }

      if (section.members.length > 0) {
        const { error: membersError } = await ac
          .from('event_section_members')
          .insert(section.members.map(m => ({
            section_id: sectionRow.id,
            user_id: m.user_id,
            member_role: m.member_role,
          }))) as { error: { message: string } | null }
        if (membersError) throw new Error(membersError.message)
      }

      if (section.tasks.length > 0) {
        const { error: tasksError } = await ac
          .from('event_tasks')
          .insert(section.tasks.map((t, idx) => ({
            section_id: sectionRow.id,
            title: t.title,
            description: t.description ?? null,
            status: 'pendiente',
            due_date: t.due_date ?? null,
            order_index: idx,
            created_by: caller.userId,
          }))) as { error: { message: string } | null }
        if (tasksError) throw new Error(tasksError.message)
      }
    }

    revalidateEventos()
    return { success: true, eventId: createdEventId }
  } catch (err) {
    // Rollback manual: el evento creado se borra y el cascade limpia
    // secciones/miembros/tareas ya insertados en este intento.
    if (createdEventId && ac) {
      await ac.from('events').delete().eq('id', createdEventId)
    }
    return { error: err instanceof FriendlyError ? err.message : 'Error inesperado al crear el evento' }
  }
}

const UpdateEventSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').optional(),
  event_type: z.enum(['dieciocho', 'navidad', 'ano_nuevo']).optional(),
  sede_id: z.string().min(1, 'Selecciona una sede').optional(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida').optional(),
  description: z.string().min(10, 'Describe el evento (mínimo 10 caracteres)').optional(),
  status: z.enum(['planificacion', 'activo', 'finalizado']).optional(),
})

// Acepta actualizaciones parciales: sirve tanto para el formulario de
// edición completo como para un cambio de solo el status (sin la regla
// bloqueante de doc de dificultades alimenticias — esa es solo una
// advertencia visual en la UI, ver Task 4).
export async function updateEventAction(
  eventId: string,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }
    if (caller.role !== 'admin') return { error: 'No autorizado' }

    const raw: Record<string, unknown> = {}
    for (const key of ['title', 'event_type', 'sede_id', 'event_date', 'description', 'status'] as const) {
      const value = formData.get(key)
      if (value !== null) raw[key] = value
    }

    const parsed = UpdateEventSchema.safeParse(raw)
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
    if (Object.keys(parsed.data).length === 0) return { error: 'No hay cambios para guardar' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any

    if (parsed.data.status) {
      const { data: current } = await ac
        .from('events')
        .select('status')
        .eq('id', eventId)
        .maybeSingle() as { data: { status: string } | null }

      const validTransitions: Record<string, string[]> = {
        planificacion: ['planificacion', 'activo'],
        activo: ['activo', 'finalizado'],
        finalizado: ['finalizado'],
      }

      if (!current || !(validTransitions[current.status] ?? []).includes(parsed.data.status)) {
        return { error: 'Transición de estado inválida' }
      }
    }

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

// ── Secciones (solo admin) ──────────────────────────────────

const SectionSchema = z.object({
  name: z.string().min(2, 'El nombre de la sección debe tener al menos 2 caracteres'),
  description: z.string().optional().nullable(),
})

export async function addSectionAction(
  eventId: string,
  formData: FormData,
): Promise<{ success?: boolean; sectionId?: string; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }
    if (caller.role !== 'admin') return { error: 'No autorizado' }

    const parsed = SectionSchema.safeParse({
      name: formData.get('name'),
      description: formData.get('description') || null,
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any

    const { data: maxRow } = await ac
      .from('event_sections')
      .select('order_index')
      .eq('event_id', eventId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: { order_index: number } | null }

    const { data, error } = await ac
      .from('event_sections')
      .insert({
        event_id: eventId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        order_index: (maxRow?.order_index ?? -1) + 1,
      })
      .select('id')
      .single() as { data: { id: string } | null; error: { message: string; code?: string } | null }

    if (error) {
      if (error.code === '23505') return { error: 'Ya existe una sección con ese nombre en este evento' }
      return { error: error.message }
    }
    if (!data) return { error: 'No se pudo crear la sección' }

    revalidateEventos(eventId)
    return { success: true, sectionId: data.id }
  } catch {
    return { error: 'Error inesperado al crear la sección' }
  }
}

export async function removeSectionAction(
  sectionId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }
    if (caller.role !== 'admin') return { error: 'No autorizado' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { data: section } = await ac
      .from('event_sections').select('event_id').eq('id', sectionId).single() as { data: { event_id: string } | null }

    if (!section) return { error: 'Sección no encontrada' }

    const { error } = await ac.from('event_sections').delete().eq('id', sectionId) as { error: { message: string } | null }
    if (error) return { error: error.message }

    revalidateEventos(section.event_id)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al eliminar la sección' }
  }
}

// ── Miembros de sección (solo admin) ────────────────────────

const MemberSchema = z.object({
  user_id: z.string().uuid('Selecciona un trabajador'),
  member_role: z.enum(['encargado', 'colaborador']),
})

export async function addMemberAction(
  sectionId: string,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }
    if (caller.role !== 'admin') return { error: 'No autorizado' }

    const parsed = MemberSchema.safeParse({
      user_id: formData.get('user_id'),
      member_role: formData.get('member_role'),
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any

    // El miembro debe ser de la misma sede del evento: la RLS filtra los
    // eventos por sede, así que uno de otra sede quedaría asignado pero sin
    // poder ver el evento nunca.
    const [{ data: sec }, { data: prof }] = await Promise.all([
      ac.from('event_sections').select('events(sede_id)').eq('id', sectionId).maybeSingle() as Promise<{ data: { events: { sede_id: string } | null } | null }>,
      ac.from('profiles').select('sede').eq('id', parsed.data.user_id).maybeSingle() as Promise<{ data: { sede: string } | null }>,
    ])
    const eventoSede = sec?.events?.sede_id
    if (eventoSede && prof && prof.sede !== eventoSede) {
      return { error: 'Solo puedes asignar trabajadores de la misma sede del evento' }
    }

    const { error } = await ac
      .from('event_section_members')
      .insert({ section_id: sectionId, ...parsed.data }) as { error: { message: string; code?: string } | null }

    if (error) {
      if (error.code === '23505') return { error: 'Esa persona ya es miembro de esta sección' }
      return { error: error.message }
    }

    // Aviso push al nuevo miembro (best-effort, nunca falla la action)
    const ctx = await getSectionContexto(sectionId)
    if (ctx) {
      await sendPushToUsers([parsed.data.user_id], {
        title: `${ctx.eventEmoji} ${ctx.eventTitle}`,
        body: `Te sumaron a la sección ${ctx.sectionName} como ${parsed.data.member_role}`,
        url: `/eventos/${ctx.eventId}`,
      })
    }

    revalidateEventos(ctx?.eventId ?? await getEventIdForSection(sectionId))
    return { success: true }
  } catch {
    return { error: 'Error inesperado al agregar el miembro' }
  }
}

export async function removeMemberAction(
  sectionId: string,
  userId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }
    if (caller.role !== 'admin') return { error: 'No autorizado' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { error } = await ac
      .from('event_section_members')
      .delete()
      .eq('section_id', sectionId)
      .eq('user_id', userId) as { error: { message: string } | null }

    if (error) return { error: error.message }

    const eventId = await getEventIdForSection(sectionId)
    revalidateEventos(eventId)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al quitar el miembro' }
  }
}

// ── Tareas por sección ──────────────────────────────────────
// Permisos: admin o encargado de la sección. Se usa el cliente de USUARIO
// para que RLS decida — si la política rechaza, se traduce a un mensaje
// claro en vez del error crudo de Postgres.

const UpsertTaskSchema = z.object({
  title: z.string().min(3, 'La tarea debe tener al menos 3 caracteres'),
  description: z.string().optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida').optional().nullable(),
  due_time: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida').optional().nullable(),
})

// La columna due_time es una adición reciente; hasta que la migración se
// aplique en todos los entornos, si el insert/update falla por columna
// inexistente se reintenta sin ella (la tarea se guarda igual, sin hora).
function isColumnaFaltante(message?: string | null, code?: string | null): boolean {
  if (code === 'PGRST204') return true
  if (!message) return false
  return /due_time|could not find.*column|schema cache/i.test(message)
}

export async function upsertTaskAction(
  sectionId: string,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }

    const taskId = (formData.get('taskId') as string | null) || null
    const parsed = UpsertTaskSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description') || null,
      due_date: formData.get('due_date') || null,
      due_time: formData.get('due_time') || null,
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sc = supabase as any

    if (taskId) {
      const baseUpdate = {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        due_date: parsed.data.due_date ?? null,
        updated_at: new Date().toISOString(),
      }
      const runUpdate = (payload: Record<string, unknown>) => sc
        .from('event_tasks')
        .update(payload)
        .eq('id', taskId)
        .select('id, section_id') as Promise<{ data: { id: string; section_id: string }[] | null; error: { message: string; code?: string } | null }>

      let { data: updated, error } = await runUpdate({ ...baseUpdate, due_time: parsed.data.due_time ?? null })
      if (error && isColumnaFaltante(error.message, error.code)) {
        ({ data: updated, error } = await runUpdate(baseUpdate))
      }

      if (error) {
        return { error: isRlsDenied(error.message) ? 'No tienes permisos para editar esta tarea (solo el encargado de la sección o un admin)' : error.message }
      }
      if (!updated || updated.length === 0) {
        return { error: 'No tienes permisos para editar esta tarea (solo el encargado de la sección o un admin)' }
      }

      revalidateEventos(await getEventIdForSection(updated[0].section_id))
      return { success: true }
    }

    const { data: maxRow } = await sc
      .from('event_tasks')
      .select('order_index')
      .eq('section_id', sectionId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: { order_index: number } | null }

    const baseInsert = {
      section_id: sectionId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      status: 'pendiente',
      due_date: parsed.data.due_date ?? null,
      order_index: (maxRow?.order_index ?? -1) + 1,
      created_by: caller.userId,
    }
    const runInsert = (payload: Record<string, unknown>) => sc
      .from('event_tasks')
      .insert(payload)
      .select('id') as Promise<{ data: { id: string }[] | null; error: { message: string; code?: string } | null }>

    let { data: inserted, error } = await runInsert({ ...baseInsert, due_time: parsed.data.due_time ?? null })
    if (error && isColumnaFaltante(error.message, error.code)) {
      ({ data: inserted, error } = await runInsert(baseInsert))
    }

    if (error) {
      return { error: isRlsDenied(error.message) ? 'No tienes permisos para crear tareas en esta sección (solo el encargado o un admin)' : error.message }
    }
    if (!inserted || inserted.length === 0) {
      return { error: 'No tienes permisos para crear tareas en esta sección (solo el encargado o un admin)' }
    }

    // Aviso push a los miembros de la sección (menos quien la creó)
    const ctx = await getSectionContexto(sectionId)
    if (ctx) {
      const destinatarios = ctx.memberIds.filter(id => id !== caller.userId)
      await sendPushToUsers(destinatarios, {
        title: `${ctx.eventEmoji} Nueva tarea en ${ctx.sectionName}`,
        body: parsed.data.title,
        url: `/eventos/${ctx.eventId}`,
      })
    }

    revalidateEventos(ctx?.eventId ?? await getEventIdForSection(sectionId))
    return { success: true }
  } catch {
    return { error: 'Error inesperado al guardar la tarea' }
  }
}

export async function toggleTaskStatusAction(
  taskId: string,
  nextStatus: EventTaskStatus,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }

    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sc = supabase as any

    const isCompleting = nextStatus === 'completada'
    const update = isCompleting
      ? { status: 'completada', completed_at: new Date().toISOString(), completed_by: caller.userId, updated_at: new Date().toISOString() }
      : { status: nextStatus, completed_at: null, completed_by: null, updated_at: new Date().toISOString() }

    const { data: updated, error } = await sc
      .from('event_tasks')
      .update(update)
      .eq('id', taskId)
      .select('id, section_id') as { data: { id: string; section_id: string }[] | null; error: { message: string } | null }

    if (error) {
      return { error: isRlsDenied(error.message) ? 'No tienes permisos para modificar esta tarea (solo el encargado de la sección o un admin)' : error.message }
    }
    if (!updated || updated.length === 0) {
      return { error: 'No tienes permisos para modificar esta tarea (solo el encargado de la sección o un admin)' }
    }

    revalidateEventos(await getEventIdForSection(updated[0].section_id))
    return { success: true }
  } catch {
    return { error: 'Error inesperado al actualizar la tarea' }
  }
}

// La policy RLS de DELETE para encargados no está confirmada en la base de
// datos viva, así que acá se usa el cliente admin con un chequeo manual de
// permiso (admin o encargado de la sección de la tarea), en vez de confiar
// en que RLS rechace correctamente.
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
      .select('id, section_id')
      .eq('id', taskId)
      .maybeSingle() as { data: { id: string; section_id: string } | null }

    if (!task) return { error: 'No tienes permisos para eliminar esta tarea, o ya no existe' }

    if (caller.role !== 'admin') {
      const { data: membership } = await ac
        .from('event_section_members')
        .select('member_role')
        .eq('section_id', task.section_id)
        .eq('user_id', caller.userId)
        .maybeSingle() as { data: { member_role: string } | null }

      if (!membership || membership.member_role !== 'encargado') {
        return { error: 'No puedes eliminar tareas de esta sección' }
      }
    }

    const { error } = await ac
      .from('event_tasks')
      .delete()
      .eq('id', taskId) as { error: { message: string } | null }

    if (error) return { error: error.message }

    revalidateEventos(await getEventIdForSection(task.section_id))
    return { success: true }
  } catch {
    return { error: 'Error inesperado al eliminar la tarea' }
  }
}

// ── Documentos (bucket privado event-documents) ─────────────
// Doc de dificultades alimenticias = advertencia persistente en la UI,
// NO bloquea creación, publicación ni eliminación de documentos.

const DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const DOC_MAX = 10 * 1024 * 1024
const DOC_BUCKET = 'event-documents'

export async function uploadEventDocumentAction(
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

    const docType: EventDocType = formData.get('doc_type') === 'dificultades_alimenticias'
      ? 'dificultades_alimenticias' : 'general'
    const title = ((formData.get('title') as string) || file.name).slice(0, 200)

    const adminClient = await createAdminClient()
    const path = `${eventId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`

    const { error: uploadError } = await adminClient.storage
      .from(DOC_BUCKET)
      .upload(path, file, { contentType: file.type })
    if (uploadError) return { error: 'Error al subir el archivo' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { error } = await ac.from('event_documents').insert({
      event_id: eventId,
      doc_type: docType,
      title,
      file_url: path,
      uploaded_by: caller.userId,
    }) as { error: { message: string } | null }

    if (error) {
      await adminClient.storage.from(DOC_BUCKET).remove([path])
      return { error: error.message }
    }
    revalidateEventos(eventId)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al subir el documento' }
  }
}

export async function deleteEventDocumentAction(
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
      .select('event_id, file_url')
      .eq('id', docId)
      .single() as { data: { event_id: string; file_url: string } | null }

    if (!doc) return { error: 'Documento no encontrado' }

    const { error } = await ac.from('event_documents').delete().eq('id', docId) as { error: { message: string } | null }
    if (error) return { error: error.message }

    await adminClient.storage.from(DOC_BUCKET).remove([doc.file_url])
    revalidateEventos(doc.event_id)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al eliminar el documento' }
  }
}

export async function getDocumentSignedUrlAction(
  docId: string,
): Promise<{ url?: string; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }

    // Autorización primero con cliente de USUARIO: RLS solo deja ver el
    // documento a admin o miembros de alguna sección del evento. Si no lo
    // ve, no se firma nada.
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sc = supabase as any
    const { data: doc } = await sc
      .from('event_documents')
      .select('file_url')
      .eq('id', docId)
      .maybeSingle() as { data: { file_url: string } | null }

    if (!doc) return { error: 'No autorizado' }

    const adminClient = await createAdminClient()
    const { data, error } = await adminClient.storage
      .from(DOC_BUCKET)
      .createSignedUrl(doc.file_url, 60)
    if (error || !data) return { error: 'No se pudo generar el enlace' }
    return { url: data.signedUrl }
  } catch {
    return { error: 'Error inesperado al obtener el documento' }
  }
}

// ── Galería de fotos (bucket PRIVADO event-photos) ──────────
// Las fotos muestran residentes en contexto de cuidado: dato sensible bajo
// Ley 21.719. El bucket es privado, en `image_url` se guarda el PATH relativo
// dentro del bucket y todo acceso va por signed URL generada server-side.
// RLS real (migración de Bato): SELECT por sede; DELETE de fila admin o autor;
// borrar OBJETOS de storage solo lo puede el service role.

const PHOTO_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const PHOTO_MAX = 5 * 1024 * 1024
const PHOTO_BUCKET = 'event-photos'

// Detecta que la tabla o el bucket de fotos todavía no existen en la DB
// (feature no habilitada por Bato), para mostrar un mensaje amigable en vez
// del error crudo de Postgres/Storage.
function isGaleriaNoHabilitada(message?: string | null, code?: string | null): boolean {
  if (code === '42P01') return true
  if (!message) return false
  return /does not exist|bucket not found/i.test(message)
}

async function isEventMember(eventId: string, userId: string): Promise<boolean> {
  const adminClient = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ac = adminClient as any
  const { data: sections } = await ac
    .from('event_sections')
    .select('id')
    .eq('event_id', eventId) as { data: { id: string }[] | null }

  const sectionIds = (sections ?? []).map((s: { id: string }) => s.id)
  if (sectionIds.length === 0) return false

  const { data: membership } = await ac
    .from('event_section_members')
    .select('user_id')
    .in('section_id', sectionIds)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle() as { data: { user_id: string } | null }

  return !!membership
}

export async function uploadEventPhotoAction(
  eventId: string,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const caller = await getCaller()
    if (!caller) return { error: 'No autenticado' }

    if (caller.role !== 'admin') {
      const member = await isEventMember(eventId, caller.userId)
      if (!member) return { error: 'No autorizado' }
    }

    const file = formData.get('file') as File
    if (!file || file.size === 0) return { error: 'No se seleccionó archivo' }
    const ext = PHOTO_TYPES[file.type]
    if (!ext) return { error: 'Solo se permiten imágenes JPG, PNG o WEBP' }
    if (file.size > PHOTO_MAX) return { error: 'La foto no puede superar 5MB' }

    const caption = ((formData.get('caption') as string) || '').trim().slice(0, 200) || null

    const adminClient = await createAdminClient()
    const path = `${eventId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await adminClient.storage
      .from(PHOTO_BUCKET)
      .upload(path, file, { contentType: file.type })
    if (uploadError) {
      return {
        error: isGaleriaNoHabilitada(uploadError.message)
          ? 'La galería aún no está habilitada'
          : 'Error al subir el archivo',
      }
    }

    // Bucket privado: se guarda el path relativo, nunca una URL pública.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { error } = await ac.from('event_photos').insert({
      event_id: eventId,
      image_url: path,
      caption,
      uploaded_by: caller.userId,
    }) as { error: { message: string; code?: string } | null }

    if (error) {
      await adminClient.storage.from(PHOTO_BUCKET).remove([path])
      return {
        error: isGaleriaNoHabilitada(error.message, error.code)
          ? 'La galería aún no está habilitada'
          : error.message,
      }
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

    // La fila se borra con el cliente del USUARIO: la policy RLS de DELETE
    // (admin o autor) es la que autoriza — el server no decide por su cuenta.
    // Solo después de que RLS confirmó el borrado se elimina el objeto de
    // storage con service role (la policy de objetos solo deja borrar al admin).
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sp = supabase as any
    const { data: deleted, error } = await sp
      .from('event_photos')
      .delete()
      .eq('id', photoId)
      .select('image_url, event_id') as {
        data: { image_url: string; event_id: string }[] | null
        error: { message: string; code?: string } | null
      }

    if (error) {
      return {
        error: isGaleriaNoHabilitada(error.message, error.code)
          ? 'La galería aún no está habilitada'
          : error.message,
      }
    }
    if (!deleted || deleted.length === 0) {
      return { error: 'No puedes eliminar esta foto (o ya no existe)' }
    }

    const adminClient = await createAdminClient()
    await adminClient.storage.from(PHOTO_BUCKET).remove([deleted[0].image_url])

    revalidateEventos(deleted[0].event_id)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al eliminar la foto' }
  }
}
