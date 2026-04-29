'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { escapeIlike } from '@/lib/utils'

export async function searchAction(query: string): Promise<{
  courses: { id: string; title: string; is_published: boolean }[]
  workers: { id: string; full_name: string; area_trabajo: string[]; sede: string }[]
  role: 'admin' | 'profesor' | 'trabajador'
}> {
  if (!query || query.trim().length < 2) {
    return { courses: [], workers: [], role: 'trabajador' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { courses: [], workers: [], role: 'trabajador' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, area_trabajo')
    .eq('id', user.id)
    .single() as { data: { role: string; area_trabajo: string[] } | null }

  const role = profile?.role ?? 'trabajador'
  const workerAreas: string[] = profile?.area_trabajo ?? []
  const q = query.trim().toLowerCase()
  const qPattern = `%${escapeIlike(q)}%`

  const { data: allCourses } = await supabase
    .from('courses')
    .select('id, title, is_published, target_areas')
    .ilike('title', qPattern)
    .order('title')
    .limit(5) as { data: { id: string; title: string; is_published: boolean; target_areas: string[] | null }[] | null }

  let courses = (allCourses ?? [])
  if (role === 'trabajador') {
    courses = courses.filter(c => {
      const targets = c.target_areas ?? []
      return targets.length === 0 ||
        targets.some((a: string) => workerAreas.includes(a))
    })
  }

  let workers: { id: string; full_name: string; area_trabajo: string[]; sede: string }[] = []
  if (role === 'admin' || role === 'profesor') {
    const adminClient = await createAdminClient()
    const { data: workersData } = await adminClient
      .from('profiles')
      .select('id, full_name, area_trabajo, sede')
      .eq('status', 'activo')
      .eq('role', 'trabajador')
      .ilike('full_name', qPattern)
      .order('full_name')
      .limit(5) as { data: { id: string; full_name: string; area_trabajo: string[]; sede: string }[] | null }

    workers = (workersData ?? []).map(w => ({
      ...w,
      area_trabajo: Array.isArray(w.area_trabajo) ? w.area_trabajo : [],
    }))
  }

  return {
    courses: courses.map(c => ({
      id: c.id,
      title: c.title,
      is_published: c.is_published,
    })),
    workers,
    role: role as 'admin' | 'profesor' | 'trabajador',
  }
}
