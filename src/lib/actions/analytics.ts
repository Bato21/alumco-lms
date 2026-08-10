'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { filterCoursesByWorkerAreas } from '@/lib/utils'
import {
  AREAS_TRABAJO,
  SETTING_ANNUAL_TARGET,
  DEFAULT_ANNUAL_TARGET,
} from '@/lib/types/database'

/**
 * Agregaciones para el dashboard de BI del admin.
 *
 * Todo se agrega en memoria en vez de con SQL: los volúmenes son de una ONG
 * con dos sedes (cientos de trabajadores, miles de certificados), así que una
 * pasada en JS cuesta menos que mantener vistas materializadas — y evita
 * agregar funciones nuevas a una DB que solo Bato puede migrar.
 *
 * Todas respetan el aislamiento `is_demo`: un admin demo ve solo números demo.
 */

// ── Certificados emitidos por mes ──────────────────────────

export interface MonthlyCertificates {
  /** 'YYYY-MM' — clave estable para ordenar. */
  month: string
  /** 'ene 26' — etiqueta corta para el eje. */
  label: string
  count: number
}

export async function getCertificatesByMonth(
  months = 12
): Promise<{ data?: MonthlyCertificates[]; error?: string }> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const adminClient = await createAdminClient()

  // Primer día del mes que abre la ventana (incluye el mes en curso).
  const desde = new Date()
  desde.setDate(1)
  desde.setHours(0, 0, 0, 0)
  desde.setMonth(desde.getMonth() - (months - 1))

  const { data } = await adminClient
    .from('certificates')
    .select('issued_at')
    .eq('is_demo', auth.isDemo)
    .gte('issued_at', desde.toISOString()) as { data: { issued_at: string }[] | null }

  // Los meses sin certificados tienen que salir en cero, no desaparecer: un
  // hueco en la serie haría leer una caída como si no hubiera pasado nada.
  const buckets = new Map<string, number>()
  const cursor = new Date(desde)
  for (let i = 0; i < months; i++) {
    buckets.set(monthKey(cursor), 0)
    cursor.setMonth(cursor.getMonth() + 1)
  }

  for (const cert of data ?? []) {
    const key = monthKey(new Date(cert.issued_at))
    if (buckets.has(key)) buckets.set(key, buckets.get(key)! + 1)
  }

  return {
    data: [...buckets.entries()].map(([month, count]) => ({
      month,
      label: monthLabel(month),
      count,
    })),
  }
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-')
  const nombre = new Intl.DateTimeFormat('es-CL', { month: 'short' })
    .format(new Date(Number(year), Number(month) - 1, 1))
    .replace('.', '')
  return `${nombre} ${year.slice(2)}`
}

// ── Cumplimiento por área de trabajo ───────────────────────

export interface AreaCompliance {
  area: string
  workers: number
  /** Pares (trabajador × curso visible para su área). */
  assigned: number
  completed: number
  rate: number
}

export async function getComplianceByArea(): Promise<{
  data?: AreaCompliance[]
  error?: string
}> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const adminClient = await createAdminClient()

  const [{ data: workers }, { data: courses }, { data: progress }] = await Promise.all([
    adminClient
      .from('profiles')
      .select('id, area_trabajo')
      .eq('role', 'trabajador')
      .eq('status', 'activo')
      .eq('is_demo', auth.isDemo) as unknown as Promise<{ data: { id: string; area_trabajo: string[] | null }[] | null }>,
    adminClient
      .from('courses')
      .select('id, target_areas')
      .eq('is_published', true)
      .eq('is_demo', auth.isDemo) as unknown as Promise<{ data: { id: string; target_areas: string[] | null }[] | null }>,
    adminClient
      .from('course_progress')
      .select('user_id, course_id, is_completed')
      .eq('is_demo', auth.isDemo) as unknown as Promise<{ data: { user_id: string; course_id: string; is_completed: boolean }[] | null }>,
  ])

  const completado = new Set(
    (progress ?? [])
      .filter((p) => p.is_completed)
      .map((p) => `${p.user_id}:${p.course_id}`)
  )

  // Una persona con dos áreas cuenta en ambas: el desglose responde "¿cómo va
  // Enfermería?", no "¿cuántas personas hay en total?".
  const acc = new Map<string, { workers: number; assigned: number; completed: number }>()

  for (const worker of workers ?? []) {
    const areas = (worker.area_trabajo as string[] | null) ?? []
    const efectivas = areas.length > 0 ? areas : ['Sin asignar']

    for (const area of efectivas) {
      const bucket = acc.get(area) ?? { workers: 0, assigned: 0, completed: 0 }
      bucket.workers++

      const visibles = filterCoursesByWorkerAreas(
        (courses ?? []).map((c) => ({ id: c.id, target_areas: c.target_areas ?? [] })),
        areas
      )
      for (const curso of visibles) {
        bucket.assigned++
        if (completado.has(`${worker.id}:${curso.id}`)) bucket.completed++
      }

      acc.set(area, bucket)
    }
  }

  const orden = [...AREAS_TRABAJO, 'Sin asignar']

  const data = [...acc.entries()]
    .map(([area, b]) => ({
      area,
      workers: b.workers,
      assigned: b.assigned,
      completed: b.completed,
      rate: b.assigned > 0 ? Math.round((b.completed / b.assigned) * 100) : 0,
    }))
    // Peor cumplimiento arriba: es lo accionable. Empates se rompen por el
    // orden canónico de áreas para que el gráfico no baile entre recargas.
    .sort((a, b) => a.rate - b.rate || orden.indexOf(a.area) - orden.indexOf(b.area))

  return { data }
}

// ── Cobertura anual vs. target ─────────────────────────────

export interface AnnualCoverage {
  year: number
  /** % de trabajadores activos con al menos un certificado emitido este año. */
  actual: number
  target: number
  covered: number
  totalWorkers: number
}

export async function getAnnualCoverage(): Promise<{
  data?: AnnualCoverage
  error?: string
}> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const adminClient = await createAdminClient()
  const year = new Date().getFullYear()
  const inicioAno = new Date(year, 0, 1).toISOString()

  const [{ data: workers }, { data: certs }, target] = await Promise.all([
    adminClient
      .from('profiles')
      .select('id')
      .eq('role', 'trabajador')
      .eq('status', 'activo')
      .eq('is_demo', auth.isDemo) as unknown as Promise<{ data: { id: string }[] | null }>,
    adminClient
      .from('certificates')
      .select('user_id')
      .eq('is_demo', auth.isDemo)
      .gte('issued_at', inicioAno) as unknown as Promise<{ data: { user_id: string }[] | null }>,
    getAnnualTarget(),
  ])

  const activos = new Set((workers ?? []).map((w) => w.id))
  // Solo cuentan los certificados de gente activa hoy: quien ya no trabaja en
  // Alumco no puede sumar a la cobertura del año en curso.
  const conCertificado = new Set(
    (certs ?? []).map((c) => c.user_id).filter((id) => activos.has(id))
  )

  const totalWorkers = activos.size
  const covered = conCertificado.size

  return {
    data: {
      year,
      actual: totalWorkers > 0 ? Math.round((covered / totalWorkers) * 100) : 0,
      target,
      covered,
      totalWorkers,
    },
  }
}

// ── Target configurable ────────────────────────────────────

/**
 * Lee el target de cobertura anual. Si la tabla `platform_settings` todavía no
 * se corrió en la DB viva, devuelve el default en vez de reventar el dashboard.
 */
export async function getAnnualTarget(): Promise<number> {
  const adminClient = await createAdminClient()

  const { data, error } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', SETTING_ANNUAL_TARGET)
    .maybeSingle() as { data: { value: unknown } | null; error: unknown }

  if (error || !data) return DEFAULT_ANNUAL_TARGET

  const value = data.value as { target?: unknown } | null
  const target = Number(value?.target)
  return Number.isFinite(target) && target > 0 && target <= 100
    ? Math.round(target)
    : DEFAULT_ANNUAL_TARGET
}

export async function setAnnualTargetAction(
  target: number
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }
  if (auth.role !== 'admin') return { error: 'Solo un administrador puede cambiar el objetivo' }

  if (!Number.isFinite(target) || target < 1 || target > 100) {
    return { error: 'El objetivo debe estar entre 1 y 100.' }
  }

  const adminClient = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from('platform_settings')
    .upsert(
      {
        key: SETTING_ANNUAL_TARGET,
        value: { target: Math.round(target) },
        updated_by: auth.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )

  if (error) return { error: 'No se pudo guardar el objetivo.' }

  revalidatePath('/admin/dashboard')
  return { success: true }
}
