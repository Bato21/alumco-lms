import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { getViewerIsDemo } from '@/lib/auth/demoScope'
import { ReportesClient } from './ReportesClient'

export const metadata: Metadata = { title: 'Reportes' }
export const dynamic = 'force-dynamic'

export default async function ReportesPage() {
  const adminClient = await createAdminClient()
  const isDemo = await getViewerIsDemo()

  const [{ data: workersRaw }, { data: courses }, { data: progressRaw }] = await Promise.all([
    adminClient
      .from('profiles')
      .select('id, full_name, sede, area_trabajo')
      .eq('role', 'trabajador')
      .eq('status', 'activo')
      .eq('is_demo', isDemo)
      .order('full_name') as unknown as Promise<{ data: { id: string; full_name: string; sede: string; area_trabajo: string[] | null }[] | null }>,
    adminClient
      .from('courses')
      .select('id, title, target_areas')
      .eq('is_published', true)
      .eq('is_demo', isDemo)
      .order('order_index') as unknown as Promise<{ data: { id: string; title: string; target_areas: string[] | null }[] | null }>,
    adminClient
      .from('course_progress')
      .select('user_id, course_id, is_completed')
      .eq('is_demo', isDemo) as unknown as Promise<{ data: { user_id: string; course_id: string; is_completed: boolean }[] | null }>,
  ])

  // Índice por trabajador para evitar recorrer todo el progreso por cada uno
  const progressByUser = new Map<string, { user_id: string; course_id: string; is_completed: boolean }[]>()
  for (const p of progressRaw ?? []) {
    const list = progressByUser.get(p.user_id)
    if (list) list.push(p)
    else progressByUser.set(p.user_id, [p])
  }

  // Construir datos por trabajador, respetando target_areas por curso
  const workers = (workersRaw ?? []).map(worker => {
    const workerAreas = (worker.area_trabajo as string[]) ?? []

    const relevantCourses = (courses ?? []).filter(c => {
      const targetAreas = (c.target_areas as string[] | null) ?? []
      return targetAreas.length === 0 || targetAreas.some(a => workerAreas.includes(a))
    })

    const workerProgress = progressByUser.get(worker.id) ?? []
    const completedIds = new Set(workerProgress.filter(p => p.is_completed).map(p => p.course_id))

    const totalCourses = relevantCourses.length
    const completedCourses = relevantCourses.filter(c => completedIds.has(c.id as string)).length
    const pendingCourses = relevantCourses
      .filter(c => !completedIds.has(c.id as string))
      .map(c => ({ course_id: c.id as string, course_title: c.title as string }))

    const progressPct = totalCourses > 0
      ? Math.round((completedCourses / totalCourses) * 100)
      : 0

    return {
      user_id: worker.id as string,
      full_name: worker.full_name as string,
      sede: worker.sede as string,
      area_trabajo: workerAreas,
      totalCourses,
      completedCourses,
      pendingCourses,
      progressPct,
    }
  })

  const totalWorkers = workers.length
  const fullyCompliant = workers.filter(w => w.progressPct === 100).length
  const atRisk = workers.filter(w => w.pendingCourses.length > 0 && w.progressPct < 50).length
  const avgCompliance = totalWorkers > 0
    ? Math.round(workers.reduce((acc, w) => acc + w.progressPct, 0) / totalWorkers)
    : 0

  // Áreas únicas (todas las áreas de todos los trabajadores)
  const areas = [...new Set((workersRaw ?? []).flatMap(w => (w.area_trabajo as string[]) ?? []))]
    .filter(Boolean)
    .sort()

  const courseList = (courses ?? []).map(c => ({ id: c.id as string, title: c.title as string }))

  return (
    <ReportesClient
      workers={workers}
      courses={courseList}
      areas={areas}
      stats={{ totalWorkers, fullyCompliant, atRisk, avgCompliance }}
    />
  )
}