'use server'

import { createClient, createAdminClient, getCachedUser } from '@/lib/supabase/server'
import { getViewerIsDemo } from '@/lib/auth/demoScope'
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sp = supabase as any
  const user = await getCachedUser()
  if (!user) return { courses: [], workers: [], role: 'trabajador' }

  const q = query.trim().toLowerCase()
  const qPattern = `%${escapeIlike(q)}%`

  // Perfil, cursos y trabajadores en paralelo; el resultado de trabajadores
  // se descarta si el rol no es staff.
  const adminClient = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ac = adminClient as any
  const isViewerDemo = await getViewerIsDemo()

  const [{ data: profile }, { data: allCourses }, { data: workersData }] = await Promise.all([
    sp
      .from('profiles')
      .select('role, area_trabajo')
      .eq('id', user.id)
      .single() as Promise<{ data: { role: string; area_trabajo: string[] | null } | null }>,
    sp
      .from('courses')
      .select('id, title, is_published, target_areas')
      .ilike('title', qPattern)
      .order('title')
      .limit(5) as Promise<{ data: { id: string; title: string; is_published: boolean; target_areas: string[] | null }[] | null }>,
    ac
      .from('profiles')
      .select('id, full_name, area_trabajo, sede')
      .eq('status', 'activo')
      .eq('role', 'trabajador')
      .eq('is_demo', isViewerDemo)
      .ilike('full_name', qPattern)
      .order('full_name')
      .limit(5) as Promise<{ data: { id: string; full_name: string; area_trabajo: string[] | null; sede: string }[] | null }>,
  ])

  const role = profile?.role ?? 'trabajador'
  const workerAreas: string[] = profile?.area_trabajo ?? []

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
    workers = (workersData ?? []).map((w: { id: string; full_name: string; area_trabajo: string[] | null; sede: string }) => ({
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
