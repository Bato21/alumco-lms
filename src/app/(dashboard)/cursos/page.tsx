import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import { filterCoursesByWorkerAreas } from '@/lib/utils'
import { Vacio } from '@/components/alumco/ds'
import { CursoCardTrab, type EstadoCurso } from '@/components/alumco/curso/CursoCardTrab'

export const metadata: Metadata = { title: 'Mis Cursos | Alumco LMS' }

interface CourseWithProgress {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  target_areas: string[]
  total_modules: number
  completed_modules: number
  status: 'completed' | 'in_progress' | 'not_started'
  progress: number
}

export default async function CursosPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter = 'todos' } = await searchParams

  const supabase = await createClient()
  const user = await getCachedUser()

  const [{ data: workerProfile }, { data: courses }, { data: progressData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('area_trabajo')
      .eq('id', user!.id)
      .single() as unknown as Promise<{ data: { area_trabajo: string[] | null } | null }>,
    supabase
      .from('courses')
      .select('id, title, description, thumbnail_url, target_areas')
      .eq('is_published', true)
      .order('order_index') as unknown as Promise<{ data: { id: string; title: string; description: string | null; thumbnail_url: string | null; target_areas: string[] | null }[] | null }>,
    supabase
      .from('course_progress')
      .select('course_id, completed_modules, is_completed')
      .eq('user_id', user!.id) as unknown as Promise<{ data: { course_id: string; completed_modules: string[] | null; is_completed: boolean }[] | null }>,
  ])

  const workerAreas = workerProfile?.area_trabajo ?? []

  const coursesNormalized = (courses ?? []).map(c => ({ ...c, target_areas: c.target_areas ?? [] }))
  const coursesByArea = filterCoursesByWorkerAreas(coursesNormalized, workerAreas)

  const courseIds = coursesByArea.map(c => c.id)

  const { data: allModules } = await supabase
    .from('modules')
    .select('course_id')
    .in('course_id', courseIds.length > 0 ? courseIds : ['none']) as { data: { course_id: string }[] | null }

  const totalModulesByCourse = new Map<string, number>()
  allModules?.forEach(module => {
    totalModulesByCourse.set(module.course_id, (totalModulesByCourse.get(module.course_id) || 0) + 1)
  })

  const coursesWithProgress: CourseWithProgress[] = coursesByArea.map(course => {
    const progress = progressData?.find(p => p.course_id === course.id)
    const completedModules = progress?.completed_modules || []
    const completed = Array.isArray(completedModules) ? completedModules.length : 0
    const total = totalModulesByCourse.get(course.id) || 1
    const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0

    let status: 'completed' | 'in_progress' | 'not_started' = 'not_started'
    if (progress?.is_completed) status = 'completed'
    else if (completed > 0) status = 'in_progress'

    return {
      ...course,
      completed_modules: completed,
      total_modules: total,
      status,
      progress: progressPct,
    }
  })

  const inProgressCount = coursesWithProgress.filter(c => c.status === 'in_progress').length
  const completedCount = coursesWithProgress.filter(c => c.status === 'completed').length
  const notStartedCount = coursesWithProgress.filter(c => c.status === 'not_started').length

  const filteredCourses =
    filter === 'progreso' ? coursesWithProgress.filter(c => c.status === 'in_progress')
    : filter === 'completados' ? coursesWithProgress.filter(c => c.status === 'completed')
    : filter === 'sin_iniciar' ? coursesWithProgress.filter(c => c.status === 'not_started')
    : coursesWithProgress

  const tabs = [
    { key: 'todos', label: 'Todos', count: coursesWithProgress.length },
    { key: 'progreso', label: 'En progreso', count: inProgressCount },
    { key: 'completados', label: 'Completados', count: completedCount },
    { key: 'sin_iniciar', label: 'Sin iniciar', count: notStartedCount },
  ]

  const estadoCurso = (s: 'completed' | 'in_progress' | 'not_started'): EstadoCurso =>
    s === 'completed' ? 'completado' : s === 'in_progress' ? 'en-curso' : 'pendiente'

  return (
    <div className="col" style={{ gap: 22 }} data-screen-label="Trabajador · Catálogo">
      <div className="entra">
        <h1 className="t-display" style={{ fontSize: 32 }}>Mis cursos</h1>
        <p className="silencio" style={{ marginTop: 6, fontSize: 16 }}>Cursos asignados a tu área de trabajo.</p>
      </div>

      <div className="chips entra entra-1">
        {tabs.map((t) => (
          <Link key={t.key} href={`/cursos?filter=${t.key}`} className={'chip' + (filter === t.key ? ' activo' : '')}>
            {t.label} <span className="conteo">{t.count}</span>
          </Link>
        ))}
      </div>

      {filteredCourses.length === 0 ? (
        <div className="card">
          <Vacio icono="cursos" titulo="No hay cursos en esta categoría" texto="Explora los demás filtros para ver tus cursos asignados." />
        </div>
      ) : (
        <div className="entra entra-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
          {filteredCourses.map((course) => (
            <CursoCardTrab
              key={course.id}
              titulo={course.title}
              href={`/cursos/${course.id}`}
              estado={estadoCurso(course.status)}
              progreso={course.progress}
              meta={`${course.completed_modules} de ${course.total_modules} módulos`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
