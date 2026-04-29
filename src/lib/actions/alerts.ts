'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

interface AdminAlert {
  courseId: string
  courseTitle: string
  deadline: string
  daysLeft: number
  urgency: 'overdue' | 'critical' | 'warning'
  pendingWorkers: number
  totalWorkers: number
  completionPct: number
}

interface WorkerAlert {
  courseId: string
  courseTitle: string
  deadline: string
  daysLeft: number
  urgency: 'overdue' | 'critical' | 'warning'
}

export async function getAdminAlerts(): Promise<{
  count: number
  alerts: AdminAlert[]
}> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { count: 0, alerts: [] }

    const adminClient = await createAdminClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: courses } = await adminClient
      .from('courses')
      .select('id, title, deadline, target_areas')
      .eq('is_published', true)
      .not('deadline', 'is', null)
      .order('deadline', { ascending: true }) as { data: { id: string; title: string; deadline: string | null; target_areas: string[] | null }[] | null }

    const { data: workers } = await adminClient
      .from('profiles')
      .select('id, area_trabajo')
      .eq('role', 'trabajador')
      .eq('status', 'activo') as { data: { id: string; area_trabajo: string[] }[] | null }

    const { data: allProgress } = await adminClient
      .from('course_progress')
      .select('course_id, user_id, is_completed') as { data: { course_id: string; user_id: string; is_completed: boolean }[] | null }

    const alerts: AdminAlert[] = (courses ?? [])
      .flatMap(course => {
        const deadline = new Date(course.deadline as string)
        deadline.setHours(0, 0, 0, 0)
        const daysLeft = Math.ceil(
          (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Filtrar trabajadores relevantes para este curso según target_areas
        const targetAreas = (course.target_areas as string[] | null) ?? []
        const relevantWorkers = targetAreas.length === 0
          ? workers ?? []
          : (workers ?? []).filter(w => {
              const workerAreas = (w.area_trabajo as string[]) ?? []
              return targetAreas.some(a => workerAreas.includes(a))
            })
        const totalWorkers = relevantWorkers.length
        const relevantIds = new Set(relevantWorkers.map(w => w.id))

        const completed = allProgress?.filter(
          p => p.course_id === course.id && p.is_completed && relevantIds.has(p.user_id)
        ).length ?? 0

        const pendingWorkers = totalWorkers - completed
        const completionPct = totalWorkers > 0
          ? Math.round((completed / totalWorkers) * 100)
          : 0

        let urgency: 'overdue' | 'critical' | 'warning' | null = null
        if (daysLeft < 0) urgency = 'overdue'
        else if (daysLeft <= 7) urgency = 'critical'
        else if (daysLeft <= 30) urgency = 'warning'

        if (!urgency || pendingWorkers === 0) return []

        return [{
          courseId: course.id as string,
          courseTitle: course.title as string,
          deadline: course.deadline as string,
          daysLeft,
          urgency,
          pendingWorkers,
          totalWorkers,
          completionPct,
        }]
      })

    return { count: alerts.length, alerts }
  } catch {
    return { count: 0, alerts: [] }
  }
}

export async function getWorkerAlerts(): Promise<{
  count: number
  alerts: WorkerAlert[]
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { count: 0, alerts: [] }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: profile } = await supabase
      .from('profiles')
      .select('area_trabajo')
      .eq('id', user.id)
      .single() as { data: { area_trabajo: string[] } | null }

    const workerAreas: string[] = profile?.area_trabajo ?? []

    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, deadline, target_areas')
      .eq('is_published', true)
      .not('deadline', 'is', null) as { data: { id: string; title: string; deadline: string | null; target_areas: string[] | null }[] | null }

    const { data: progress } = await supabase
      .from('course_progress')
      .select('course_id, is_completed')
      .eq('user_id', user.id) as { data: { course_id: string; is_completed: boolean }[] | null }

    const completedIds = new Set(
      progress?.filter(p => p.is_completed).map(p => p.course_id) ?? []
    )

    const alerts: WorkerAlert[] = (courses ?? [])
      .flatMap(course => {
        const areas: string[] = course.target_areas ?? []
        const visibleToWorker = areas.length === 0 ||
          areas.some(a => workerAreas.includes(a))
        if (!visibleToWorker) return []
        if (completedIds.has(course.id as string)) return []

        const deadline = new Date(course.deadline as string)
        deadline.setHours(0, 0, 0, 0)
        const daysLeft = Math.ceil(
          (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        let urgency: 'overdue' | 'critical' | 'warning' | null = null
        if (daysLeft < 0) urgency = 'overdue'
        else if (daysLeft <= 7) urgency = 'critical'
        else if (daysLeft <= 30) urgency = 'warning'

        if (!urgency) return []

        return [{
          courseId: course.id as string,
          courseTitle: course.title as string,
          deadline: course.deadline as string,
          daysLeft,
          urgency,
        }]
      })

    return { count: alerts.length, alerts }
  } catch {
    return { count: 0, alerts: [] }
  }
}
