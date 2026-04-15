import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react'
import { DeadlineCalendar } from '@/components/alumco/DeadlineCalendar'

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

      {/* Calendario */}
      <section className="space-y-3 lg:space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#2B4FA0]" aria-hidden="true"/>
            <h2 className="text-lg lg:text-xl font-bold text-[#1A1A2E]">
              Calendario de plazos
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

        <DeadlineCalendar courses={coursesWithStatus} />
      </section>
    </div>
  )
}
