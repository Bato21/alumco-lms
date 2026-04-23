import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { filterCoursesByWorkerAreas } from '@/lib/utils'
import { CertificateBadge } from '@/components/alumco/CertificateBadge'
import Link from 'next/link'
import type { ContentType, Module, Quiz } from '@/lib/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface CourseDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('id', id)
    .single()

  return {
    title: course?.title ? `${course.title} | Alumco LMS` : 'Curso | Alumco LMS',
  }
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-[#6B7280]">Debes iniciar sesión para ver este curso.</p>
      </div>
    )
  }

  // Fetch course data
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (!course) {
    notFound()
  }

  // Fetch perfil temprano para control de acceso
  const { data: accessProfile } = await supabase
    .from('profiles')
    .select('area_trabajo, role')
    .eq('id', user.id)
    .single()

  if (accessProfile?.role === 'trabajador') {
    const workerAreas = accessProfile.area_trabajo ?? []
    const hasAccess = filterCoursesByWorkerAreas(
      [{ ...course, target_areas: course.target_areas ?? [] }],
      workerAreas
    ).length > 0

    if (!hasAccess) {
      return (
        <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
            <svg className="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1A1A2E]">
            Curso no disponible
          </h2>
          <p className="text-[#6B7280]">
            Este curso no está asignado a tu área de trabajo.
            Contacta a tu administrador si crees que es un error.
          </p>
          <a
            href="/cursos"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2B4FA0] text-white rounded-lg font-semibold text-sm hover:bg-[#2B4FA0]/90 transition-colors"
          >
            ← Volver a mis cursos
          </a>
        </div>
      )
    }
  }

  // Fetch modules for this course
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', id)
    .order('order_index')

  // Fetch user's progress for this course
  const { data: progress } = await supabase
    .from('course_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', id)
    .single()

  // Fetch quiz attempts for this user in this course
  const { data: quizAttempts } = await supabase
    .from('quiz_attempts')
    .select('id, quiz_id, status, score')
    .eq('user_id', user.id)

  // Fetch perfil del usuario para el certificado y control de acceso
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, area_trabajo, role')
    .eq('id', user.id)
    .single()

  // Fetch certificado si el curso está completado
  const { data: certificate } = await supabase
    .from('certificates')
    .select('id, issued_at, pdf_url')
    .eq('user_id', user.id)
    .eq('course_id', id)
    .single()

  // Calcular course progress
  const completedModuleIds = progress?.completed_modules || []
  const totalModules = modules?.length || 0
  const completedModules = completedModuleIds.length
  const courseProgress = totalModules > 0
    ? Math.round((completedModules / totalModules) * 100)
    : 0

  const isCourseCompleted = progress?.is_completed || false

  const statusLabel = isCourseCompleted
    ? 'Completado'
    : courseProgress > 0 ? 'En progreso' : 'No iniciado'

  const statusBadgeClass = isCourseCompleted
    ? 'bg-[#27AE60]/20 text-[#EDFAF3] border border-[#27AE60]/30'
    : courseProgress > 0
      ? 'bg-[#F5A623]/20 text-[#FFF8EC] border border-[#F5A623]/30'
      : 'bg-white/10 text-white/80 border border-white/20'

  return (
    <div className="space-y-6 lg:space-y-8">

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
        <Link
          href="/cursos"
          className="text-[#6B7280] hover:text-[#2B4FA0] transition-colors"
        >
          Mis cursos
        </Link>
        <span className="text-[#6B7280]">›</span>
        <span className="text-[#1A1A2E] font-medium truncate">{course.title}</span>
      </nav>

      {/* Hero del curso */}
      <div className="relative rounded-2xl overflow-hidden h-48 bg-gradient-to-r from-[#1A2F6B] to-[#2B4FA0] flex items-end p-6">
        {/* Decorative icon */}
        <div className="absolute top-4 left-6 opacity-10 pointer-events-none" aria-hidden="true">
          <svg className="w-24 h-24 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </div>

        {/* Status badge */}
        <span className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass}`}>
          {statusLabel}
        </span>

        {/* Title + description */}
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl font-extrabold text-white leading-tight">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-white/70 text-sm mt-1 line-clamp-2">{course.description}</p>
          )}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-[#1A1A2E]">Progreso del curso</span>
          <span className={`text-sm font-bold ${isCourseCompleted ? 'text-[#1A6B3A]' : 'text-[#2B4FA0]'}`}>
            {courseProgress}%
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${courseProgress}%`,
              backgroundColor: isCourseCompleted ? '#27AE60' : '#2B4FA0',
            }}
          />
        </div>
        <p className="text-xs text-[#6B7280] mt-2">
          {completedModules} de {totalModules} módulos completados
        </p>

        {isCourseCompleted && certificate && profile && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <CertificateBadge
              certificate={certificate}
              courseName={course.title}
              workerName={profile.full_name}
            />
          </div>
        )}
      </div>

      {/* Lista de módulos */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1A1A2E]">Contenido del curso</h2>
          <span className="text-xs font-semibold text-[#6B7280] bg-slate-100 px-2.5 py-1 rounded-full">
            {totalModules} módulos
          </span>
        </div>

        {modules && modules.length > 0 ? (
          <div>
            {modules.map((module, index) => (
              <div key={module.id}>
                <ModuleCard
                  module={module}
                  index={index + 1}
                  isCompleted={completedModuleIds.includes(module.id)}
                  isPreviousCompleted={index === 0 || completedModuleIds.includes(modules[index - 1]?.id)}
                  hasQuiz={true}
                />
                {/* Connector line */}
                {index < modules.length - 1 && (
                  <div className="ml-[1.125rem] h-4 border-l-2 border-dashed border-slate-200" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
            </div>
            <p className="text-[#6B7280]">Este curso aún no tiene contenido disponible.</p>
          </div>
        )}
      </section>
    </div>
  )
}

// ─── Module Card ────────────────────────────────────────────────────────────

interface ModuleCardProps {
  module: Module
  index: number
  isCompleted: boolean
  isPreviousCompleted: boolean
  hasQuiz: boolean
}

const contentTypeConfig: Record<ContentType, { label: string; badgeClass: string }> = {
  video:  { label: 'Video',       badgeClass: 'bg-red-50 text-red-700' },
  pdf:    { label: 'PDF',         badgeClass: 'bg-[#E6F1FB] text-[#2B4FA0]' },
  slides: { label: 'Presentación',badgeClass: 'bg-purple-50 text-purple-700' },
  quiz:   { label: 'Evaluación',  badgeClass: 'bg-[#FFF8EC] text-[#92600A]' },
}

function ModuleCard({ module, index, isCompleted, isPreviousCompleted }: ModuleCardProps) {
  const canAccess = isPreviousCompleted || isCompleted
  const config = contentTypeConfig[module.content_type]

  return (
    <div className="flex gap-4">
      {/* Left indicator */}
      <div className="flex flex-col items-center shrink-0 pt-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
          isCompleted
            ? 'bg-[#27AE60] text-white'
            : canAccess
              ? 'bg-[#2B4FA0] text-white'
              : 'bg-slate-100 text-slate-400'
        }`}>
          {isCompleted ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          ) : (
            <span>{index}</span>
          )}
        </div>
      </div>

      {/* Card */}
      <div className={`flex-1 min-w-0 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-4 lg:p-5 mb-0 ${
        !canAccess ? 'opacity-60' : ''
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${config.badgeClass}`}>
                {config.label}
              </span>
              {module.is_required && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700">
                  Obligatorio
                </span>
              )}
              {module.duration_mins && (
                <span className="flex items-center gap-1 text-xs text-[#6B7280]">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  {module.duration_mins} min
                </span>
              )}
            </div>
            <h3 className="font-semibold text-[#1A1A2E] leading-snug">{module.title}</h3>
            {module.description && (
              <p className="text-sm text-[#6B7280] mt-1 line-clamp-2">{module.description}</p>
            )}
          </div>

          {/* Action */}
          <div className="shrink-0">
            {canAccess ? (
              <Link
                href={`/cursos/${module.course_id}/modulos/${module.id}`}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors min-h-[40px] flex items-center ${
                  isCompleted
                    ? 'bg-slate-100 text-[#2B4FA0] hover:bg-slate-200'
                    : 'bg-[#2B4FA0] text-white hover:bg-[#1A2F6B]'
                }`}
              >
                {isCompleted ? 'Repasar' : 'Iniciar'}
              </Link>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400 px-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-xs font-semibold hidden sm:inline">Bloqueado</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
