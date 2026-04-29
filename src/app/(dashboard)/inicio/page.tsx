import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { filterCoursesByWorkerAreas } from '@/lib/utils'
import { BookOpen, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { DeadlineCalendar } from '@/components/alumco/DeadlineCalendar'
import WelcomeModal from '@/components/alumco/WelcomeModal'

export const metadata: Metadata = { title: 'Inicio | Alumco LMS' }

export default async function InicioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, sede, area_trabajo, onboarding_completed')
    .eq('id', user!.id)
    .single() as { data: { full_name: string; sede: string; area_trabajo: string[]; onboarding_completed: boolean | null } | null }

  const workerAreas = profile?.area_trabajo ?? []

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, deadline, deadline_description, is_published, target_areas')
    .eq('is_published', true)
    .order('order_index') as { data: { id: string; title: string; deadline: string | null; deadline_description: string | null; is_published: boolean; target_areas: string[] }[] | null }

  const filteredCourses = filterCoursesByWorkerAreas(courses ?? [], workerAreas)

  const { data: progressData } = await supabase
    .from('course_progress')
    .select('course_id, completed_modules, is_completed')
    .eq('user_id', user!.id) as { data: { course_id: string; completed_modules: string[]; is_completed: boolean }[] | null }

  const courseIds = filteredCourses.map(c => c.id)
  const { data: allModules } = await supabase
    .from('modules')
    .select('course_id')
    .in('course_id', courseIds.length > 0 ? courseIds : ['none']) as { data: { course_id: string }[] | null }

  const totalModulesByCourse = new Map<string, number>()
  allModules?.forEach(m => {
    totalModulesByCourse.set(m.course_id, (totalModulesByCourse.get(m.course_id) || 0) + 1)
  })

  // Calcular stats
  const coursesWithStatus = filteredCourses.map(course => {
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
  const soonCount = coursesWithStatus.filter(c => c.deadlineStatus === 'soon').length

  const cumulativeProgress = coursesWithStatus.length > 0
    ? Math.round(
        coursesWithStatus.reduce((acc, c) => acc + c.progressPct, 0) /
        coursesWithStatus.length
      )
    : 0

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Bienvenido'
  const sedeName = profile?.sede === 'sede_1' ? 'Sede Hualpén' : 'Sede Coyhaique'
  const areaName = Array.isArray(profile?.area_trabajo)
    ? profile.area_trabajo.join(', ')
    : (profile?.area_trabajo ?? '')

  let heroBannerTitle: string
  if (overdue > 0) {
    heroBannerTitle = `Tienes ${overdue} curso${overdue > 1 ? 's' : ''} vencido${overdue > 1 ? 's' : ''}, ${firstName}.`
  } else if (soonCount > 0) {
    heroBannerTitle = `Atención: ${soonCount} curso${soonCount > 1 ? 's' : ''} vence${soonCount > 1 ? 'n' : ''} pronto.`
  } else if (completedCount === totalCourses && totalCourses > 0) {
    heroBannerTitle = `¡Vas muy bien, ${firstName}! Sigue así.`
  } else {
    heroBannerTitle = `Capacítate a tu ritmo, ${firstName}.`
  }

  const showWelcome = profile?.onboarding_completed === false

  return (
    <div className="space-y-8">

      {showWelcome && (
        <WelcomeModal
          fullName={profile?.full_name ?? ''}
          areas={Array.isArray(profile?.area_trabajo) ? profile.area_trabajo : []}
          sede={profile?.sede ?? 'sede_1'}
        />
      )}

      {/* Hero Banner — negative margins to break out of layout padding */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1A2F6B] to-[#2B4FA0] h-52 lg:h-56 flex items-center px-6 lg:px-10 -mx-4 lg:-mx-8">
        {/* Decorative circles */}
        <div className="absolute right-0 top-0 w-full h-full pointer-events-none">
          <div className="absolute right-[-60px] top-[-60px] w-64 h-64 rounded-full bg-[#F5A623] opacity-10" />
          <div className="absolute right-[60px] top-[20px] w-44 h-44 rounded-full bg-[#2B4FA0] opacity-20 border-2 border-white/10" />
          <div className="absolute right-[20px] bottom-[-40px] w-48 h-48 rounded-full bg-[#E74C3C] opacity-10" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <p className="text-white/60 text-sm font-medium mb-1">
            {sedeName}{areaName && ` · ${areaName}`}
          </p>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight mb-2">
            {heroBannerTitle}
          </h1>
          <p className="text-white/75 text-sm mb-5">
            Llevas {completedCount} cursos completados de {totalCourses}.
          </p>
          <Link
            href="/cursos"
            className="px-5 py-2.5 bg-[#F5A623] text-[#1A2F6B] font-bold rounded-lg text-sm hover:bg-[#e0961a] transition-colors inline-block"
          >
            Ver mis cursos →
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">

        {/* Card 1 — Blue */}
        <div className="bg-[#2B4FA0] text-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-4">
            <BookOpen className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Total de cursos</p>
          <p className="text-3xl font-extrabold">{totalCourses}</p>
        </div>

        {/* Card 2 — White */}
        <div className="bg-white border border-slate-200 text-[#1A1A2E] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6">
          <div className="w-10 h-10 rounded-full bg-[#E6F1FB] flex items-center justify-center mb-4">
            <Clock className="w-5 h-5 text-[#2B4FA0]" aria-hidden="true" />
          </div>
          <p className="text-[#1A1A2E]/70 text-xs font-semibold uppercase tracking-wider mb-1">En progreso</p>
          <p className="text-3xl font-extrabold">{inProgress}</p>
        </div>

        {/* Card 3 — Soft green */}
        <div className="bg-[#EDFAF3] text-[#1A6B3A] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6">
          <div className="w-10 h-10 rounded-full bg-[#27AE60]/10 flex items-center justify-center mb-4">
            <CheckCircle className="w-5 h-5 text-[#27AE60]" aria-hidden="true" />
          </div>
          <p className="text-[#1A6B3A]/70 text-xs font-semibold uppercase tracking-wider mb-1">Cumplimiento</p>
          <p className="text-3xl font-extrabold text-[#1A6B3A]">{cumulativeProgress}%</p>
        </div>

        {/* Card 4 — Amber tint if overdue, slate if none */}
        <div className={`${overdue > 0 ? 'bg-[#FFF8EC] text-[#92600A]' : 'bg-slate-50 text-slate-500'} rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6`}>
          <div className={`w-10 h-10 rounded-full ${overdue > 0 ? 'bg-[#F5A623]/20' : 'bg-slate-200'} flex items-center justify-center mb-4`}>
            <AlertTriangle className={`w-5 h-5 ${overdue > 0 ? 'text-[#F5A623]' : 'text-slate-400'}`} aria-hidden="true" />
          </div>
          <p className={`${overdue > 0 ? 'text-[#92600A]/70' : 'text-slate-400'} text-xs font-semibold uppercase tracking-wider mb-1`}>Vencidos</p>
          <p className="text-3xl font-extrabold">{overdue}</p>
          <p className="text-xs mt-1 opacity-60">{completedCount} completado{completedCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Calendario de plazos */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[#1A1A2E]">Plazos de cursos</h2>
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
      </div>

    </div>
  )
}
