'use server'

import { createClient, createAdminClient, getCachedUser } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { revalidatePath } from 'next/cache'
import {
  ADMIN_DAY_MAX_PER_REQUEST,
  ADMIN_DAY_MIN_ADVANCE_BUSINESS_DAYS,
  type AdminDayRequest,
  type AdminDayResetPeriod,
  type AdminDayStatus,
} from '@/lib/types/database'

// ── Helpers de fechas (trabajan sobre 'YYYY-MM-DD', sin timezone) ──────────

function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function todayLocal(): Date {
  const t = new Date()
  return new Date(t.getFullYear(), t.getMonth(), t.getDate())
}

function isBusinessDay(d: Date): boolean {
  const wd = d.getDay()
  return wd !== 0 && wd !== 6 // 0=domingo, 6=sábado
}

/** Días hábiles (lun-vie) entre start y end, ambos inclusive. */
function countBusinessDays(start: Date, end: Date): number {
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    if (isBusinessDay(cur)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

/** Días hábiles estrictamente entre `from` y `to` (exclusivos ambos). */
function businessDaysBetweenExclusive(from: Date, to: Date): number {
  let count = 0
  const cur = new Date(from)
  cur.setDate(cur.getDate() + 1)
  while (cur < to) {
    if (isBusinessDay(cur)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

// ── Config / cupo ──────────────────────────────────────────────────────────

interface Config {
  default_quota: number
  reset_period: AdminDayResetPeriod
}

async function loadConfig(
  client: Awaited<ReturnType<typeof createAdminClient>>
): Promise<{ config: Config; areaQuotas: Record<string, number> }> {
  try {
    const [{ data: cfg }, { data: quotas }] = await Promise.all([
      client.from('admin_day_config').select('default_quota, reset_period').eq('id', true).single() as unknown as Promise<{ data: Config | null }>,
      client.from('admin_day_area_quotas').select('area, quota') as unknown as Promise<{ data: { area: string; quota: number }[] | null }>,
    ])

    const config: Config = {
      default_quota: cfg?.default_quota ?? 5,
      reset_period: cfg?.reset_period ?? 'anual',
    }
    const areaQuotas: Record<string, number> = {}
    ;(quotas ?? []).forEach(q => { areaQuotas[q.area] = q.quota })
    return { config, areaQuotas }
  } catch {
    return { config: { default_quota: 5, reset_period: 'anual' }, areaQuotas: {} }
  }
}

/** Cupo del trabajador: el mayor override entre sus áreas, o el default. */
function resolveQuota(areas: string[], config: Config, areaQuotas: Record<string, number>): number {
  let quota = config.default_quota
  for (const area of areas) {
    const override = areaQuotas[area]
    if (override !== undefined && override > quota) quota = override
  }
  return quota
}

/** Inicio del período vigente (para contar días ya usados). */
function periodStartISO(reset: AdminDayResetPeriod): string {
  if (reset === 'anual') return `${new Date().getFullYear()}-01-01`
  return '1970-01-01'
}

// ── Cursos vencidos ──────────────────────────────────────────────────────

/** Cursos publicados, visibles según áreas, no completados y con deadline pasado. */
async function getOverdueCourseTitles(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const today = todayLocal()

  const [{ data: profile }, { data: courses }, { data: progress }] = await Promise.all([
    supabase.from('profiles').select('area_trabajo').eq('id', userId).single() as unknown as Promise<{ data: { area_trabajo: string[] | null } | null }>,
    supabase.from('courses').select('id, title, deadline, target_areas').eq('is_published', true).not('deadline', 'is', null) as unknown as Promise<{ data: { id: string; title: string; deadline: string | null; target_areas: string[] | null }[] | null }>,
    supabase.from('course_progress').select('course_id, is_completed').eq('user_id', userId) as unknown as Promise<{ data: { course_id: string; is_completed: boolean }[] | null }>,
  ])

  const workerAreas: string[] = profile?.area_trabajo ?? []
  const completedIds = new Set((progress ?? []).filter(p => p.is_completed).map(p => p.course_id))

  return (courses ?? [])
    .filter(c => {
      const areas: string[] = c.target_areas ?? []
      const visible = areas.length === 0 || areas.some(a => workerAreas.includes(a))
      if (!visible || completedIds.has(c.id) || !c.deadline) return false
      const deadline = parseISODate(c.deadline.slice(0, 10))
      return deadline < today
    })
    .map(c => c.title)
}

// ── Resumen para el trabajador ──────────────────────────────────────────

export interface AdminDaysSummary {
  quota: number
  usedDays: number
  pendingDays: number
  remainingDays: number
  resetPeriod: AdminDayResetPeriod
  overdueCourses: string[]
  requests: AdminDayRequest[]
}

export async function getMyAdminDaysSummary(): Promise<AdminDaysSummary | null> {
  const user = await getCachedUser()
  if (!user) return null

  try {
  const supabase = await createClient()
  const adminClient = await createAdminClient()

  const [{ config, areaQuotas }, { data: profile }, { data: requests }, overdueCourses] = await Promise.all([
    loadConfig(adminClient),
    supabase.from('profiles').select('area_trabajo').eq('id', user.id).single() as unknown as Promise<{ data: { area_trabajo: string[] | null } | null }>,
    supabase.from('admin_day_requests').select('*').eq('user_id', user.id).order('start_date', { ascending: false }) as unknown as Promise<{ data: AdminDayRequest[] | null }>,
    getOverdueCourseTitles(user.id),
  ])

  const quota = resolveQuota(profile?.area_trabajo ?? [], config, areaQuotas)
  const periodStart = periodStartISO(config.reset_period)

  const inPeriod = (r: AdminDayRequest) => r.start_date >= periodStart
  const all = requests ?? []
  const usedDays = all.filter(r => r.status === 'aprobada' && inPeriod(r)).reduce((s, r) => s + r.days_count, 0)
  const pendingDays = all.filter(r => r.status === 'pendiente' && inPeriod(r)).reduce((s, r) => s + r.days_count, 0)
  const remainingDays = Math.max(0, quota - usedDays - pendingDays)

  return {
    quota,
    usedDays,
    pendingDays,
    remainingDays,
    resetPeriod: config.reset_period,
    overdueCourses,
    requests: all,
  }
  } catch {
    // Si las tablas de días administrativos aún no existen en la DB, no
    // rompemos las páginas centrales (inicio/perfil): devolvemos null.
    return null
  }
}

// ── Crear solicitud ──────────────────────────────────────────────────────

export async function createAdminDayRequest(input: {
  startDate: string
  endDate: string
  reason?: string
}): Promise<{ success?: true; error?: string }> {
  const user = await getCachedUser()
  if (!user) return { error: 'No autenticado' }

  const start = input.startDate?.slice(0, 10)
  const end = input.endDate?.slice(0, 10)
  if (!start || !end) return { error: 'Debes seleccionar las fechas de inicio y término.' }

  const startD = parseISODate(start)
  const endD = parseISODate(end)
  if (isNaN(startD.getTime()) || isNaN(endD.getTime())) return { error: 'Fechas inválidas.' }
  if (endD < startD) return { error: 'La fecha de término no puede ser anterior a la de inicio.' }

  const today = todayLocal()
  if (startD <= today) return { error: 'La solicitud debe ser para una fecha futura.' }

  // Días hábiles solicitados (los fines de semana no consumen cupo).
  const daysCount = countBusinessDays(startD, endD)
  if (daysCount < 1) return { error: 'El rango seleccionado no incluye días hábiles.' }
  if (daysCount > ADMIN_DAY_MAX_PER_REQUEST) {
    return { error: `Puedes solicitar como máximo ${ADMIN_DAY_MAX_PER_REQUEST} días por solicitud.` }
  }

  // 5 días hábiles de anticipación.
  const advance = businessDaysBetweenExclusive(today, startD)
  if (advance < ADMIN_DAY_MIN_ADVANCE_BUSINESS_DAYS) {
    return { error: `Debes solicitar con al menos ${ADMIN_DAY_MIN_ADVANCE_BUSINESS_DAYS} días hábiles de anticipación.` }
  }

  // Cursos vencidos bloquean la solicitud.
  const overdue = await getOverdueCourseTitles(user.id)
  if (overdue.length > 0) {
    return { error: `No puedes solicitar días administrativos mientras tengas cursos vencidos (${overdue.length}). Complétalos primero.` }
  }

  const adminClient = await createAdminClient()
  const { config, areaQuotas } = await loadConfig(adminClient)

  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('area_trabajo').eq('id', user.id).single() as unknown as { data: { area_trabajo: string[] | null } | null }
  const quota = resolveQuota(profile?.area_trabajo ?? [], config, areaQuotas)
  const periodStart = periodStartISO(config.reset_period)

  const { data: existing } = await supabase
    .from('admin_day_requests')
    .select('start_date, end_date, days_count, status')
    .eq('user_id', user.id) as unknown as { data: { start_date: string; end_date: string; days_count: number; status: AdminDayStatus }[] | null }

  const active = (existing ?? []).filter(r => r.status === 'pendiente' || r.status === 'aprobada')

  // Solapamiento con otra solicitud vigente.
  const overlaps = active.some(r => !(end < r.start_date || start > r.end_date))
  if (overlaps) return { error: 'Ya tienes una solicitud que se cruza con esas fechas.' }

  // Cupo restante.
  const consumed = active
    .filter(r => r.start_date >= periodStart)
    .reduce((s, r) => s + r.days_count, 0)
  const remaining = quota - consumed
  if (daysCount > remaining) {
    return { error: `No tienes cupo suficiente. Te quedan ${Math.max(0, remaining)} de ${quota} días.` }
  }

  const { error } = await supabase
    .from('admin_day_requests')
    .insert({
      user_id: user.id,
      start_date: start,
      end_date: end,
      days_count: daysCount,
      reason: input.reason?.trim() || null,
      status: 'pendiente',
    } as unknown as never)

  if (error) return { error: error.message }

  revalidatePath('/dias-administrativos')
  revalidatePath('/inicio')
  revalidatePath('/perfil')
  revalidatePath('/admin/dias-administrativos')
  return { success: true }
}

export async function cancelAdminDayRequest(id: string): Promise<{ success?: true; error?: string }> {
  const user = await getCachedUser()
  if (!user) return { error: 'No autenticado' }

  const supabase = await createClient()
  const { data: req } = await supabase
    .from('admin_day_requests')
    .select('user_id, status')
    .eq('id', id)
    .single() as unknown as { data: { user_id: string; status: AdminDayStatus } | null }

  if (!req || req.user_id !== user.id) return { error: 'Solicitud no encontrada.' }
  if (req.status !== 'pendiente') return { error: 'Solo puedes cancelar solicitudes pendientes.' }

  const { error } = await supabase
    .from('admin_day_requests')
    .update({ status: 'cancelada' } as unknown as never)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dias-administrativos')
  revalidatePath('/perfil')
  revalidatePath('/admin/dias-administrativos')
  return { success: true }
}

// ── Admin: listado, revisión y configuración ─────────────────────────────

export interface AdminDayRequestRow extends AdminDayRequest {
  full_name: string
  sede: string
  area_trabajo: string[]
}

export async function getAdminDayRequests(): Promise<AdminDayRequestRow[]> {
  const auth = await requireAdmin()
  if (!auth.ok) return []

  const adminClient = await createAdminClient()
  let requests: AdminDayRequest[] | null = null
  try {
    const res = await adminClient
      .from('admin_day_requests')
      .select('*')
      .order('created_at', { ascending: false }) as unknown as { data: AdminDayRequest[] | null }
    requests = res.data
  } catch {
    return []
  }

  const rows = requests ?? []
  const userIds = [...new Set(rows.map(r => r.user_id))]
  if (userIds.length === 0) return []

  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, full_name, sede, area_trabajo')
    .in('id', userIds) as unknown as { data: { id: string; full_name: string; sede: string; area_trabajo: string[] | null }[] | null }

  const byId = new Map((profiles ?? []).map(p => [p.id, p]))
  return rows.map(r => {
    const p = byId.get(r.user_id)
    return {
      ...r,
      full_name: p?.full_name ?? 'Trabajador',
      sede: p?.sede ?? '',
      area_trabajo: p?.area_trabajo ?? [],
    }
  })
}

export async function reviewAdminDayRequest(
  id: string,
  decision: 'aprobada' | 'rechazada',
  note?: string
): Promise<{ success?: true; error?: string }> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const adminClient = await createAdminClient()
  const { data: req } = await adminClient
    .from('admin_day_requests')
    .select('status')
    .eq('id', id)
    .single() as unknown as { data: { status: AdminDayStatus } | null }

  if (!req) return { error: 'Solicitud no encontrada.' }
  if (req.status !== 'pendiente') return { error: 'Esta solicitud ya fue procesada.' }

  const { error } = await adminClient
    .from('admin_day_requests')
    .update({
      status: decision,
      review_note: note?.trim() || null,
      reviewed_by: auth.userId,
      reviewed_at: new Date().toISOString(),
    } as unknown as never)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/dias-administrativos')
  revalidatePath('/dias-administrativos')
  revalidatePath('/perfil')
  return { success: true }
}

export interface AdminDaysConfigData {
  default_quota: number
  reset_period: AdminDayResetPeriod
  areaQuotas: { area: string; quota: number }[]
}

export async function getAdminDaysConfig(): Promise<AdminDaysConfigData> {
  const adminClient = await createAdminClient()
  const { config, areaQuotas } = await loadConfig(adminClient)
  return {
    default_quota: config.default_quota,
    reset_period: config.reset_period,
    areaQuotas: Object.entries(areaQuotas).map(([area, quota]) => ({ area, quota })),
  }
}

export async function updateAdminDaysConfig(input: {
  default_quota: number
  reset_period: AdminDayResetPeriod
  areaQuotas: { area: string; quota: number }[]
}): Promise<{ success?: true; error?: string }> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const defaultQuota = Math.round(input.default_quota)
  if (!Number.isFinite(defaultQuota) || defaultQuota < 0 || defaultQuota > 365) {
    return { error: 'El cupo por defecto debe ser un número entre 0 y 365.' }
  }
  if (input.reset_period !== 'anual' && input.reset_period !== 'fijo') {
    return { error: 'Período de renovación inválido.' }
  }

  const adminClient = await createAdminClient()

  const { error: cfgError } = await adminClient
    .from('admin_day_config')
    .update({
      default_quota: defaultQuota,
      reset_period: input.reset_period,
      updated_by: auth.userId,
      updated_at: new Date().toISOString(),
    } as unknown as never)
    .eq('id', true)

  if (cfgError) return { error: cfgError.message }

  // Reemplazar cupos por área: borrar los que ya no vienen, upsert del resto.
  const clean = input.areaQuotas
    .filter(q => q.area && Number.isFinite(q.quota) && q.quota >= 0)
    .map(q => ({ area: q.area, quota: Math.round(q.quota) }))

  const { data: existing } = await adminClient
    .from('admin_day_area_quotas')
    .select('area') as unknown as { data: { area: string }[] | null }

  const keep = new Set(clean.map(q => q.area))
  const toDelete = (existing ?? []).map(e => e.area).filter(a => !keep.has(a))
  if (toDelete.length > 0) {
    await adminClient.from('admin_day_area_quotas').delete().in('area', toDelete)
  }
  if (clean.length > 0) {
    const { error: upErr } = await adminClient
      .from('admin_day_area_quotas')
      .upsert(clean as unknown as never)
    if (upErr) return { error: upErr.message }
  }

  revalidatePath('/admin/dias-administrativos')
  revalidatePath('/dias-administrativos')
  revalidatePath('/perfil')
  return { success: true }
}
