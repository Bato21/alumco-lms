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

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, description, thumbnail_url')
    .eq('is_published', true)
    .order('order_index')

  const { data: progressData } = await supabase
    .from('course_progress')
    .select('course_id, completed_modules, is_completed')
    .eq('user_id', user!.id)

  const courseIds = courses?.map(c => c.id) ?? []

  const { data: allModules } = await supabase
    .from('modules')
    .select('course_id')
    .in('course_id', courseIds.length > 0 ? courseIds : ['none'])

  const totalModulesByCourse = new Map<string, number>()
  allModules?.forEach(module => {
    totalModulesByCourse.set(
      module.course_id,
      (totalModulesByCourse.get(module.course_id) || 0) + 1
    )
  })

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Mis cursos</h1>
        <p className="text-muted-foreground mt-1">
          Todos tus cursos de capacitación disponibles
        </p>
      </div>

      {coursesWithProgress.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coursesWithProgress.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-white rounded-2xl border">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <svg className="h-8 w-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <p className="font-medium text-[#1A1A2E]">No hay cursos disponibles aún</p>
          <p className="text-sm text-muted-foreground">
            Tu administrador publicará cursos próximamente.
          </p>
        </div>
      )}
    </div>
  )
}

function CourseCard({ course }: { course: Course }) {
  const statusConfig = {
    completed: {
      label: 'Completado',
      bgColor: 'bg-[#27AE60]',
      textColor: 'text-white',
      buttonText: 'Repasar material',
      buttonClass: 'bg-slate-100 text-[#2B4FA0] hover:bg-slate-200',
      progressColor: 'bg-[#27AE60]',
    },
    in_progress: {
      label: 'En progreso',
      bgColor: 'bg-[#F5A623]',
      textColor: 'text-white',
      buttonText: 'Continuar',
      buttonClass: 'bg-[#2B4FA0] text-white hover:bg-[#2B4FA0]/90',
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
    <div className="bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-28 sm:h-36 relative">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover"/>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2B4FA0] to-[#1A2F6B] flex items-center justify-center">
            <svg className="w-10 h-10 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
        )}
        <div className={`absolute top-2 sm:top-3 right-2 sm:right-3 ${config.bgColor} ${config.textColor} px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
          {config.label}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="font-bold text-[#2B4FA0] text-lg mb-3 line-clamp-1">
          {course.title}
        </h3>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-muted-foreground">Progreso</span>
            <span className={`text-xs font-bold ${
              course.status === 'completed' ? 'text-[#27AE60]' :
              course.status === 'not_started' ? 'text-slate-400' : 'text-[#2B4FA0]'
            }`}>
              {course.progress}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${config.progressColor} transition-all`} style={{ width: `${course.progress}%` }}/>
          </div>
        </div>

        <Link
          href={`/cursos/${course.id}`}
          className={`w-full py-2.5 font-semibold rounded-lg transition-colors flex items-center justify-center text-sm min-h-[48px] ${config.buttonClass}`}
        >
          {config.buttonText}
        </Link>
      </div>
    </div>
  )
}
