import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { filterCoursesByWorkerAreas, getCourseGradient } from '@/lib/utils'
import { BookOpen } from 'lucide-react'

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

const statusConfig = {
  completed: {
    label: 'Completado',
    badgeClass: 'bg-[#27AE60]/20 text-[#EDFAF3] border-[#27AE60]/30',
    progressColor: '#27AE60',
    buttonText: 'Repasar',
    buttonClass: 'bg-white border border-slate-200 text-[#2B4FA0] hover:bg-slate-50',
  },
  in_progress: {
    label: 'En progreso',
    badgeClass: 'bg-[#F5A623]/20 text-[#FFF8EC] border-[#F5A623]/30',
    progressColor: '#2B4FA0',
    buttonText: 'Continuar',
    buttonClass: 'bg-[#2B4FA0] text-white hover:bg-[#1A2F6B]',
  },
  not_started: {
    label: 'Sin iniciar',
    badgeClass: 'bg-white/10 text-white/80 border-white/20',
    progressColor: '#CBD5E1',
    buttonText: 'Iniciar',
    buttonClass: 'bg-[#2B4FA0] text-white hover:bg-[#1A2F6B]',
  },
}

export default async function CursosPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter = 'todos' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: workerProfile } = await supabase
    .from('profiles')
    .select('area_trabajo')
    .eq('id', user!.id)
    .single() as { data: { area_trabajo: string[] } | null }

  const workerAreas = workerProfile?.area_trabajo ?? []

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, description, thumbnail_url, target_areas')
    .eq('is_published', true)
    .order('order_index') as { data: { id: string; title: string; description: string | null; thumbnail_url: string | null; target_areas: string[] }[] | null }

  const coursesByArea = filterCoursesByWorkerAreas(courses ?? [], workerAreas)

  const { data: progressData } = await supabase
    .from('course_progress')
    .select('course_id, completed_modules, is_completed')
    .eq('user_id', user!.id) as { data: { course_id: string; completed_modules: string[]; is_completed: boolean }[] | null }

  const courseIds = coursesByArea.map(c => c.id)

  const { data: allModules } = await supabase
    .from('modules')
    .select('course_id')
    .in('course_id', courseIds.length > 0 ? courseIds : ['none']) as { data: { course_id: string }[] | null }

  const totalModulesByCourse = new Map<string, number>()
  allModules?.forEach(module => {
    totalModulesByCourse.set(
      module.course_id,
      (totalModulesByCourse.get(module.course_id) || 0) + 1
    )
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

  const inProgressCount  = coursesWithProgress.filter(c => c.status === 'in_progress').length
  const completedCount   = coursesWithProgress.filter(c => c.status === 'completed').length
  const notStartedCount  = coursesWithProgress.filter(c => c.status === 'not_started').length

  const filteredCourses =
    filter === 'progreso'    ? coursesWithProgress.filter(c => c.status === 'in_progress')
    : filter === 'completados' ? coursesWithProgress.filter(c => c.status === 'completed')
    : filter === 'sin_iniciar' ? coursesWithProgress.filter(c => c.status === 'not_started')
    : coursesWithProgress

  const tabs = [
    { key: 'todos',      label: 'Todos',        count: coursesWithProgress.length },
    { key: 'progreso',   label: 'En progreso',  count: inProgressCount },
    { key: 'completados',label: 'Completados',  count: completedCount },
    { key: 'sin_iniciar',label: 'Sin iniciar',  count: notStartedCount },
  ]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Mis cursos</h1>
        <p className="text-[#6B7280] text-sm mt-0.5">
          Cursos asignados a tu área de trabajo
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map(t => (
          <Link
            key={t.key}
            href={`/cursos?filter=${t.key}`}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filter === t.key
                ? 'bg-[#2B4FA0] text-white'
                : 'text-[#6B7280] hover:text-[#1A1A2E]'
            }`}
          >
            {t.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              filter === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#6B7280]'
            }`}>
              {t.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#E6F1FB] flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-[#2B4FA0]" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-[#1A1A2E]">No hay cursos en esta categoría</p>
            <p className="text-sm text-[#6B7280] mt-1">Explora los demás filtros</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredCourses.map(course => {
            const config = statusConfig[course.status]

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col"
              >
                {/* Gradient header */}
                <div
                  className="h-40 relative flex items-end p-5"
                  style={{ background: getCourseGradient(course.target_areas ?? []) }}
                >
                  {/* Status badge */}
                  <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.badgeClass}`}>
                    {config.label}
                  </span>

                  {/* Decorative icon */}
                  <div className="absolute top-3 left-3 opacity-20 pointer-events-none" aria-hidden="true">
                    <BookOpen className="w-12 h-12 text-white" />
                  </div>

                  {/* Course title */}
                  <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 relative z-10">
                    {course.title}
                  </h3>
                </div>

                {/* Card body */}
                <div className="p-5 flex flex-col flex-1 gap-4">
                  {course.description && (
                    <p className="text-[#6B7280] text-sm line-clamp-2">{course.description}</p>
                  )}

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-[#6B7280]">
                        {course.completed_modules} de {course.total_modules} módulos
                      </span>
                      <span className="text-xs font-bold" style={{ color: config.progressColor }}>
                        {course.progress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${course.progress}%`,
                          backgroundColor: config.progressColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Action button */}
                  <Link
                    href={`/cursos/${course.id}`}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm text-center transition-colors min-h-[48px] flex items-center justify-center mt-auto ${config.buttonClass}`}
                  >
                    {config.buttonText}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
