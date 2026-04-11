import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Mis Cursos | Alumco LMS' }

interface Course {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  total_modules?: number
  completed_modules?: number
  status: 'completed' | 'in_progress' | 'not_started'
  progress: number
}

export default async function CursosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, sede, area_trabajo')
    .eq('id', user!.id)
    .single()

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, description, thumbnail_url')
    .eq('is_published', true)
    .order('order_index')

  // Fetch course progress for the user
  const { data: progressData } = await supabase
    .from('course_progress')
    .select('course_id, completed_modules, is_completed')
    .eq('user_id', user!.id)

  // Fetch total modules count for each course
  const courseIds = courses?.map(c => c.id) ?? []

  const { data: allModules } = await supabase
    .from('modules')
    .select('course_id')
    .in('course_id', courseIds.length > 0 ? courseIds : ['none'])

  const totalModulesByCourse = new Map<string, number>()
  allModules?.forEach(module => {
    totalModulesByCourse.set(module.course_id, (totalModulesByCourse.get(module.course_id) || 0) + 1)
  })

  // Merge courses with progress data
  const coursesWithProgress: Course[] = (courses || []).map(course => {
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

  const totalCourses = coursesWithProgress.length
  const inProgress = coursesWithProgress.filter(c => c.status === 'in_progress').length
  const completed = coursesWithProgress.filter(c => c.status === 'completed').length

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Bienvenido'
  const sedeName = profile?.sede === 'sede_1' ? 'Sede Principal' : 'Sede 2'
  const areaName = profile?.area_trabajo ?? 'Área de Enfermería'

  return (
    <>
      {/* Greeting */}
      <section className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--md-on-surface)] mb-1">
          Hola, {firstName}
        </h1>
        <p className="text-[var(--md-secondary)] font-medium">
          {sedeName} · {areaName}
        </p>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6 mb-12">
        <div className="bg-[var(--md-surface-container-low)] p-6 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-[#2B4FA0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-[var(--md-secondary)]">Cursos Totales</p>
            <p className="text-xl font-bold">{totalCourses}</p>
          </div>
        </div>

        <div className="bg-[var(--md-surface-container-low)] p-6 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-[#F5A623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 2h4" />
              <path d="M12 14v-4" />
              <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z" />
              <path d="M12 6v2" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-[var(--md-secondary)]">En Progreso</p>
            <p className="text-xl font-bold">{inProgress}</p>
          </div>
        </div>

        <div className="bg-[var(--md-surface-container-low)] p-6 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-[#27AE60]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-[var(--md-secondary)]">Completados</p>
            <p className="text-xl font-bold">{completed}</p>
          </div>
        </div>
      </div>

      {/* Course Grid Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-[var(--md-on-surface)]">Mis cursos</h2>
          <Link
            href="/cursos"
            className="text-[#2B4FA0] font-semibold text-sm hover:underline flex items-center gap-1"
          >
            Ver todos
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>

        {coursesWithProgress.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {coursesWithProgress.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-[var(--md-surface-container-low)] rounded-xl">
            <div className="h-16 w-16 rounded-2xl bg-[var(--md-surface-container)] flex items-center justify-center">
              <svg className="h-8 w-8 text-[var(--md-on-surface-variant)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <p className="font-medium text-[var(--md-on-surface)]">No hay cursos disponibles aún</p>
            <p className="text-sm text-[var(--md-secondary)]">
              Tu administrador publicará cursos próximamente.
            </p>
          </div>
        )}
      </section>

      {/* Decorative Background */}
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-[#2B4FA0]/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="fixed -top-24 right-1/4 w-64 h-64 bg-[#F5A623]/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
    </>
  )
}

// Course Card Component
function CourseCard({ course }: { course: Course }) {
  const statusConfig = {
    completed: {
      label: 'Completado',
      bgColor: 'bg-[#27AE60]',
      textColor: 'text-white',
      buttonText: 'Repasar material',
      buttonClass: 'bg-[var(--md-surface-container-high)] text-[#2B4FA0] hover:bg-[var(--md-surface-container-highest)]',
      progressColor: 'bg-[#27AE60]',
    },
    in_progress: {
      label: 'En progreso',
      bgColor: 'bg-[#F5A623]',
      textColor: 'text-white',
      buttonText: 'Continuar',
      buttonClass: 'bg-[#2B4FA0] text-white hover:bg-[#2B4FA0]/90 shadow-lg shadow-[#2B4FA0]/20',
      progressColor: 'bg-[#2B4FA0]',
    },
    not_started: {
      label: 'No iniciado',
      bgColor: 'bg-slate-400',
      textColor: 'text-white',
      buttonText: 'Iniciar',
      buttonClass: 'border border-[#2B4FA0] text-[#2B4FA0] hover:bg-[#2B4FA0] hover:text-white',
      progressColor: 'bg-slate-300',
    },
  }

  const config = statusConfig[course.status]

  return (
    <div className="bg-[var(--md-surface-container-lowest)] rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(42,52,57,0.04)] hover:shadow-[0_20px_40px_rgba(42,52,57,0.08)] transition-all duration-300">
      <div className="h-40 relative">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--md-surface-container-high)] to-[var(--md-surface-container)] flex items-center justify-center">
            <svg className="w-12 h-12 text-[var(--md-outline)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}
        <div className={`absolute top-4 right-4 ${config.bgColor} ${config.textColor} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
          {config.label}
        </div>
      </div>

      <div className="p-8">
        <h3 className="text-xl font-bold text-[#2B4FA0] mb-4">{course.title}</h3>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-[var(--md-secondary)]">Progreso</span>
            <span className={`text-sm font-bold ${course.status === 'completed' ? 'text-[#27AE60]' : course.status === 'not_started' ? 'text-slate-400' : 'text-[#2B4FA0]'}`}>
              {course.progress}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${config.progressColor}`} style={{ width: `${course.progress}%` }}></div>
          </div>
        </div>

        <Link
          href={`/cursos/${course.id}`}
          className={`w-full py-3 font-bold rounded-lg transition-colors flex items-center justify-center ${config.buttonClass}`}
        >
          {config.buttonText}
        </Link>
      </div>
    </div>
  )
}
