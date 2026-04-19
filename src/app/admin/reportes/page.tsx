import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { ReportesClient } from './ReportesClient'

export const metadata: Metadata = { title: 'Reportes | Alumco LMS' }
export const dynamic = 'force-dynamic'

export default async function ReportesPage() {
  const adminClient = await createAdminClient()

  const { data: rawData } = await adminClient
    .from('reporte_avance')
    .select('*')

  // Obtener lista de cursos publicados
  const { data: courses } = await adminClient
    .from('courses')
    .select('id, title')
    .eq('is_published', true)
    .order('order_index')

  // Agregar datos por trabajador
  const workerMap = new Map<string, {
    user_id: string
    full_name: string
    sede: string
    area_trabajo: string
    totalCourses: number
    completedCourses: number
    pendingCourses: { course_id: string; course_title: string; is_completed: boolean | null }[]
  }>()

  for (const row of rawData ?? []) {
    if (!workerMap.has(row.user_id)) {
      workerMap.set(row.user_id, {
        user_id: row.user_id,
        full_name: row.full_name,
        sede: row.sede,
        area_trabajo: row.area_trabajo,
        totalCourses: 0,
        completedCourses: 0,
        pendingCourses: [],
      })
    }
    const worker = workerMap.get(row.user_id)!
    worker.totalCourses++
    if (row.is_completed) {
      worker.completedCourses++
    } else {
      worker.pendingCourses.push({
        course_id: row.course_id,
        course_title: row.course_title,
        is_completed: row.is_completed,
      })
    }
  }

  const workers = Array.from(workerMap.values()).map(w => ({
    ...w,
    progressPct: w.totalCourses > 0
      ? Math.round((w.completedCourses / w.totalCourses) * 100)
      : 0,
  }))

  // Stats globales
  const totalWorkers = workers.length
  const fullyCompliant = workers.filter(w => w.progressPct === 100).length
  const atRisk = workers.filter(w => w.pendingCourses.length > 0 && w.progressPct < 50).length
  const avgCompliance = totalWorkers > 0
    ? Math.round(workers.reduce((acc, w) => acc + w.progressPct, 0) / totalWorkers)
    : 0

  // Áreas únicas
  const areas = [...new Set(workers.map(w => w.area_trabajo))].filter(Boolean).sort()

  return (
    <ReportesClient
      workers={workers}
      courses={courses ?? []}
      areas={areas}
      stats={{ totalWorkers, fullyCompliant, atRisk, avgCompliance }}
    />
  )
}