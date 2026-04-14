import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react'

export const metadata: Metadata = { title: 'Inicio | Alumco LMS' }

export default async function InicioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, sede, area_trabajo')
    .eq('id', user!.id)
    .single()

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, deadline, deadline_description, is_published')
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
  allModules?.forEach(m => {
    totalModulesByCourse.set(m.course_id, (totalModulesByCourse.get(m.course_id) || 0) + 1)
  })

  // Calcular stats
  const coursesWithStatus = (courses || []).map(course => {
    const progress = progressData?.find(p => p.course_id === course.id)
    const completed = Array.isArray(progress?.completed_modules)
      ? progress.completed_modules.length
      : 0
    const total = totalModulesByCourse.get(course.id) || 1
    const progressPct = Math.round((completed / total) * 100)

    let status: 'completed' | 'in_progress' | 'not_started' = 'not_started'
    if (progress?.is_completed) status = 'completed'
    else if (completed > 0) status = 'in_progress'

    // Calcular estado del deadline
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let deadlineStatus: 'overdue' | 'soon' | 'ok' | null = null

    if (course.deadline && status !== 'completed') {
      const deadline = new Date(course.deadline)
      deadline.setHours(0, 0, 0, 0)
      const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (daysLeft < 0) deadlineStatus = 'overdue'
      else if (daysLeft <= 7) deadlineStatus = 'soon'
      else deadlineStatus = 'ok'
    }

    return { ...course, status, progressPct, deadlineStatus }
  })

  const totalCourses = coursesWithStatus.length
  const inProgress = coursesWithStatus.filter(c => c.status === 'in_progress').length
  const completedCount = coursesWithStatus.filter(c => c.status === 'completed').length
  const overdue = coursesWithStatus.filter(c => c.deadlineStatus === 'overdue').length

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Bienvenido'
  const sedeName = profile?.sede === 'sede_1' ? 'Sede Principal' : 'Sede 2'
  const areaName = profile?.area_trabajo ?? ''

  // Cursos con deadline ordenados por fecha
  const coursesWithDeadline = coursesWithStatus
    .filter(c => c.deadline && c.status !== 'completed')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())

  return (
    <div className="space-y-6 lg:space-y-8">

      {/* Saludo */}
      <section>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#1A1A2E]">
          Hola, {firstName}
        </h1>
        <p className="text-muted-foreground font-medium mt-1">
          {sedeName}{areaName && ` · ${areaName}`}
        </p>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white rounded-2xl border p-4 lg:p-5 flex items-center gap-3 lg:gap-4">
          <div className="h-10 w-10 lg:h-11 lg:w-11 rounded-xl bg-[#E6F1FB] flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-[#185FA5]" aria-hidden="true"/>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl lg:text-2xl font-bold text-[#1A1A2E]">{totalCourses}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-4 lg:p-5 flex items-center gap-3 lg:gap-4">
          <div className="h-10 w-10 lg:h-11 lg:w-11 rounded-xl bg-[#FFF8E7] flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-[#F5A623]" aria-hidden="true"/>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">En progreso</p>
            <p className="text-xl lg:text-2xl font-bold text-[#1A1A2E]">{inProgress}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-4 lg:p-5 flex items-center gap-3 lg:gap-4">
          <div className="h-10 w-10 lg:h-11 lg:w-11 rounded-xl bg-[#EAF3DE] flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5 text-[#27AE60]" aria-hidden="true"/>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Completados</p>
            <p className="text-xl lg:text-2xl font-bold text-[#1A1A2E]">{completedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-4 lg:p-5 flex items-center gap-3 lg:gap-4">
          <div className={`h-10 w-10 lg:h-11 lg:w-11 rounded-xl flex items-center justify-center shrink-0 ${
            overdue > 0 ? 'bg-[#FAECE7]' : 'bg-slate-100'
          }`}>
            <AlertTriangle className={`h-5 w-5 ${overdue > 0 ? 'text-[#E74C3C]' : 'text-slate-400'}`} aria-hidden="true"/>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vencidos</p>
            <p className={`text-xl lg:text-2xl font-bold ${overdue > 0 ? 'text-[#E74C3C]' : 'text-[#1A1A2E]'}`}>
              {overdue}
            </p>
          </div>
        </div>
      </div>

      {/* Calendario de plazos */}
      <section className="space-y-3 lg:space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#2B4FA0]" aria-hidden="true"/>
            <h2 className="text-lg lg:text-xl font-bold text-[#1A1A2E]">
              Plazos de cursos
            </h2>
          </div>
          <Link
            href="/cursos"
            className="text-sm text-[#2B4FA0] font-semibold hover:underline flex items-center gap-1 shrink-0"
          >
            <span className="hidden sm:inline">Ver todos los cursos</span>
            <span className="sm:hidden">Ver todos</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

        {coursesWithDeadline.length === 0 ? (
          <div className="bg-white rounded-2xl border p-8 lg:p-10 text-center space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <Calendar className="h-7 w-7 text-slate-400" aria-hidden="true"/>
            </div>
            <p className="font-medium text-[#1A1A2E]">
              No hay plazos pendientes
            </p>
            <p className="text-sm text-muted-foreground">
              Tus cursos no tienen fecha límite asignada o ya están completados.
            </p>
          </div>
        ) : (
          <ul className="space-y-3" role="list">
            {coursesWithDeadline.map((course) => {
              const deadline = new Date(course.deadline!)
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              deadline.setHours(0, 0, 0, 0)
              const daysLeft = Math.ceil(
                (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              )

              const deadlineLabel =
                daysLeft < 0 ? `Venció hace ${Math.abs(daysLeft)} día${Math.abs(daysLeft) !== 1 ? 's' : ''}` :
                daysLeft === 0 ? 'Vence hoy' :
                daysLeft === 1 ? 'Vence mañana' :
                `Vence en ${daysLeft} días`

              const borderColor =
                course.deadlineStatus === 'overdue' ? 'border-l-[#E74C3C]' :
                course.deadlineStatus === 'soon' ? 'border-l-[#F5A623]' :
                'border-l-[#27AE60]'

              const badgeColor =
                course.deadlineStatus === 'overdue'
                  ? 'bg-[#FAECE7] text-[#E74C3C]'
                  : course.deadlineStatus === 'soon'
                  ? 'bg-[#FFF8E7] text-[#854F0B]'
                  : 'bg-[#EAF3DE] text-[#27500A]'

              return (
                <li key={course.id}>
                  <Link
                    href={`/cursos/${course.id}`}
                    className={`block bg-white rounded-xl border border-l-4 ${borderColor} p-4 lg:p-5 hover:shadow-sm transition-shadow`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[#1A1A2E] truncate">
                          {course.title}
                        </h3>
                        {course.deadline_description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {course.deadline_description}
                          </p>
                        )}
                        {/* Barra de progreso */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                course.status === 'completed' ? 'bg-[#27AE60]' : 'bg-[#2B4FA0]'
                              }`}
                              style={{ width: `${course.progressPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground shrink-0">
                            {course.progressPct}%
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColor} whitespace-nowrap`}>
                          {deadlineLabel}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Intl.DateTimeFormat('es-CL', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }).format(new Date(course.deadline!))}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
