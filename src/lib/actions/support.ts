'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient, createClient, getCachedUser } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { checkRateLimit } from '@/lib/rateLimit'
import type {
  SupportCategory,
  SupportPriority,
  SupportStatus,
  SupportTicket,
  SupportTicketMessage,
} from '@/lib/types/database'

/**
 * Tickets de soporte.
 *
 * El MVP es solo para autenticados. Un formulario público sin login (como el
 * del competidor) es fácil de agregar después —el schema ya lo contempla— pero
 * hoy no hay ni sistema de correo ni un store de rate limit compartido, así
 * que abrirlo sería un buzón de spam sin nadie mirándolo. Ver el resumen en
 * docs/GAPS-CRITICOS.md §Gap 4.
 */

const CATEGORIAS = [
  'acceso',
  'error_tecnico',
  'contenido_curso',
  'certificado',
  'cuenta',
  'otro',
] as const

const CrearTicketSchema = z.object({
  category: z.enum(CATEGORIAS),
  subject: z.string().trim().min(6, 'El asunto necesita al menos 6 caracteres').max(160),
  description: z.string().trim().min(12, 'Cuéntanos un poco más — al menos 12 caracteres').max(5000),
  context: z.record(z.string(), z.unknown()).optional(),
})

export type CrearTicketInput = z.input<typeof CrearTicketSchema>

/** 5 tickets por usuario cada 15 min: margen de sobra para reportar algo real. */
const LIMITE_TICKETS = 5
const VENTANA_TICKETS_MS = 15 * 60 * 1000

// ── Crear ──────────────────────────────────────────────────

export async function createSupportTicketAction(
  input: CrearTicketInput
): Promise<{ success?: boolean; ticketId?: string; error?: string }> {
  const user = await getCachedUser()
  if (!user) return { error: 'No autenticado' }

  const parsed = CrearTicketSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos del formulario.' }
  }

  // Límite por usuario, no por IP: acá hay sesión, que es un identificador
  // mucho más fiable que la IP de una sede compartida.
  const limite = checkRateLimit(`ticket:${user.id}`, LIMITE_TICKETS, VENTANA_TICKETS_MS)
  if (!limite.ok) {
    return {
      error: `Creaste varios tickets seguidos. Espera unos minutos antes de enviar otro (${Math.ceil(limite.retryAfter / 60)} min).`,
    }
  }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, is_demo')
    .eq('id', user.id)
    .single() as { data: { full_name: string; is_demo: boolean | null } | null }

  // Se inserta con el cliente de usuario a propósito: así la policy
  // `st_insert_own` es la que verifica que requester_id sea el caller, en vez
  // de confiar solo en este código.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('support_tickets')
    .insert({
      requester_id: user.id,
      requester_email: user.email ?? null,
      requester_name: profile?.full_name ?? null,
      category: parsed.data.category,
      subject: parsed.data.subject,
      description: parsed.data.description,
      context: sanitizeContext(parsed.data.context),
      is_demo: profile?.is_demo === true,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('Error creando ticket de soporte:', error)
    return { error: 'No se pudo crear el ticket. Inténtalo de nuevo.' }
  }

  revalidatePath('/soporte')
  revalidatePath('/admin/soporte')
  return { success: true, ticketId: data.id as string }
}

/**
 * El contexto viene del navegador, así que se trata como entrada hostil:
 * lista blanca de claves, todo a string y recortado. Sin esto, un cliente
 * modificado podría empujar un JSON gigante a la columna jsonb.
 */
function sanitizeContext(raw: Record<string, unknown> | undefined): Record<string, string> {
  if (!raw) return {}
  const permitidas = ['url', 'userAgent', 'viewport', 'timestamp'] as const
  const out: Record<string, string> = {}
  for (const clave of permitidas) {
    const valor = raw[clave]
    if (typeof valor === 'string' && valor.length > 0) {
      out[clave] = valor.slice(0, 500)
    }
  }
  return out
}

// ── Lecturas del solicitante ───────────────────────────────

export async function getMyTicketsAction(): Promise<{
  data?: SupportTicket[]
  error?: string
}> {
  const user = await getCachedUser()
  if (!user) return { error: 'No autenticado' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false }) as { data: SupportTicket[] | null; error: unknown }

  if (error) return { error: 'No se pudieron cargar tus tickets.' }
  return { data: data ?? [] }
}

// ── Lecturas de admin ──────────────────────────────────────

export interface TicketFilters {
  status?: SupportStatus | 'todos'
  category?: SupportCategory | 'todas'
}

export interface TicketConSolicitante extends SupportTicket {
  requester_display: string
}

export async function listTicketsAction(
  filters: TicketFilters = {}
): Promise<{ data?: TicketConSolicitante[]; error?: string }> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const adminClient = await createAdminClient()
  let query = adminClient
    .from('support_tickets')
    .select('*')
    .eq('is_demo', auth.isDemo)
    .order('created_at', { ascending: false })

  if (filters.status && filters.status !== 'todos') {
    query = query.eq('status', filters.status)
  }
  if (filters.category && filters.category !== 'todas') {
    query = query.eq('category', filters.category)
  }

  const { data, error } = await query as unknown as {
    data: SupportTicket[] | null
    error: unknown
  }

  if (error) return { error: 'No se pudieron cargar los tickets.' }

  return {
    data: (data ?? []).map((t) => ({
      ...t,
      requester_display: t.requester_name ?? t.requester_email ?? 'Solicitante desconocido',
    })),
  }
}

export async function getTicketAction(ticketId: string): Promise<{
  ticket?: SupportTicket
  messages?: SupportTicketMessage[]
  /** Nombres por id de autor, para no resolverlos en la vista. */
  authors?: Record<string, string>
  canManage?: boolean
  error?: string
}> {
  const user = await getCachedUser()
  if (!user) return { error: 'No autenticado' }

  const auth = await requireAdmin()
  const esStaff = auth.ok

  const adminClient = await createAdminClient()
  const { data: ticket } = await adminClient
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle() as { data: SupportTicket | null }

  if (!ticket) return { error: 'Ticket no encontrado' }

  // Aislamiento demo: el panel admin usa service_role (ignora RLS), así que
  // esta comprobación es la que impide que un admin demo lea tickets reales.
  if (esStaff && ticket.is_demo !== auth.isDemo) {
    return { error: 'Ticket no encontrado' }
  }
  if (!esStaff && ticket.requester_id !== user.id) {
    return { error: 'Ticket no encontrado' }
  }

  const { data: rawMessages } = await adminClient
    .from('support_ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true }) as { data: SupportTicketMessage[] | null }

  // Las notas internas no salen del servidor para un no-staff: filtrarlas en
  // la vista dejaría el texto viajando en el HTML igual.
  const messages = (rawMessages ?? []).filter((m) => esStaff || !m.is_internal)

  const authorIds = [...new Set(messages.map((m) => m.author_id).filter(Boolean))] as string[]
  const authors: Record<string, string> = {}
  if (authorIds.length > 0) {
    const { data: perfiles } = await adminClient
      .from('profiles')
      .select('id, full_name')
      .in('id', authorIds) as { data: { id: string; full_name: string }[] | null }
    for (const p of perfiles ?? []) authors[p.id] = p.full_name
  }

  return { ticket, messages, authors, canManage: esStaff }
}

// ── Escrituras ─────────────────────────────────────────────

const ESTADOS = ['abierto', 'en_progreso', 'cerrado'] as const
const PRIORIDADES = ['baja', 'media', 'alta'] as const

export async function updateTicketAction(
  ticketId: string,
  cambios: { status?: SupportStatus; priority?: SupportPriority }
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  if (cambios.status && !ESTADOS.includes(cambios.status)) {
    return { error: 'Estado no válido' }
  }
  if (cambios.priority && !PRIORIDADES.includes(cambios.priority)) {
    return { error: 'Prioridad no válida' }
  }

  const adminClient = await createAdminClient()

  const { data: ticket } = await adminClient
    .from('support_tickets')
    .select('id, is_demo')
    .eq('id', ticketId)
    .maybeSingle() as { data: { id: string; is_demo: boolean } | null }

  if (!ticket || ticket.is_demo !== auth.isDemo) return { error: 'Ticket no encontrado' }

  const patch: Record<string, unknown> = { ...cambios }
  if (cambios.status) {
    // closed_at se deriva del estado — no es un campo que la UI mande suelto.
    patch.closed_at = cambios.status === 'cerrado' ? new Date().toISOString() : null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from('support_tickets')
    .update(patch)
    .eq('id', ticketId)

  if (error) return { error: 'No se pudo actualizar el ticket.' }

  revalidatePath('/admin/soporte')
  revalidatePath(`/admin/soporte/${ticketId}`)
  revalidatePath('/soporte')
  return { success: true }
}

const MensajeSchema = z.object({
  body: z.string().trim().min(1, 'El mensaje no puede ir vacío').max(5000),
  isInternal: z.boolean().optional(),
})

export async function addTicketMessageAction(
  ticketId: string,
  input: { body: string; isInternal?: boolean }
): Promise<{ success?: boolean; error?: string }> {
  const user = await getCachedUser()
  if (!user) return { error: 'No autenticado' }

  const parsed = MensajeSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Mensaje no válido.' }
  }

  const auth = await requireAdmin()
  const esStaff = auth.ok

  // Solo staff puede escribir notas internas; para el resto la bandera se
  // ignora en vez de rechazar el envío.
  const isInternal = esStaff && parsed.data.isInternal === true

  const adminClient = await createAdminClient()
  const { data: ticket } = await adminClient
    .from('support_tickets')
    .select('id, requester_id, is_demo, status')
    .eq('id', ticketId)
    .maybeSingle() as { data: { id: string; requester_id: string | null; is_demo: boolean; status: SupportStatus } | null }

  if (!ticket) return { error: 'Ticket no encontrado' }
  if (esStaff ? ticket.is_demo !== auth.isDemo : ticket.requester_id !== user.id) {
    return { error: 'Ticket no encontrado' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from('support_ticket_messages')
    .insert({
      ticket_id: ticketId,
      author_id: user.id,
      body: parsed.data.body,
      is_internal: isInternal,
    })

  if (error) return { error: 'No se pudo enviar el mensaje.' }

  // Que el solicitante responda un ticket cerrado lo reabre: si volvió a
  // escribir, para esa persona el problema sigue vivo.
  if (!esStaff && ticket.status === 'cerrado') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient as any)
      .from('support_tickets')
      .update({ status: 'abierto', closed_at: null })
      .eq('id', ticketId)
  }

  revalidatePath(`/soporte/${ticketId}`)
  revalidatePath(`/admin/soporte/${ticketId}`)
  revalidatePath('/admin/soporte')
  return { success: true }
}
