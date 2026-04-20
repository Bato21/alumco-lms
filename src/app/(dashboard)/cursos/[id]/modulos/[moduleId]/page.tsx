import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { VideoPlayer } from '@/components/alumco/VideoPlayer'
import { PdfViewer } from '@/components/alumco/PdfViewer'
import { ModuleIndex } from '@/components/alumco/ModuleIndex'
import type { Module, Course, CourseProgress } from '@/lib/types/database'

interface ModulePageProps {
  params: Promise<{
    id: string
    moduleId: string
  }>
}

export async function generateMetadata({ params }: ModulePageProps): Promise<Metadata> {
  const { id: courseId, moduleId } = await params
  const supabase = await createClient()

  const { data: module } = await supabase
    .from('modules')
    .select('title')
    .eq('id', moduleId)
    .single() as { data: { title: string } | null }

  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .single() as { data: { title: string } | null }

  return {
    title: module?.title
      ? `${module.title} | ${course?.title || 'Curso'} | Alumco LMS`
      : 'Módulo | Alumco LMS',
  }
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { id: courseId, moduleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-[var(--md-on-surface-variant)]">Debes iniciar sesión para ver este contenido.</p>
      </div>
    )
  }

  const { data: course } = await supabase
    .from('courses')
    .select('*, profiles(full_name)')
    .eq('id', courseId)
    .eq('is_published', true)
    .single() as { data: Course | null }

  if (!course) {
    notFound()
  }

  const { data: module } = await supabase
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .eq('course_id', courseId)
    .single() as { data: Module | null }

  if (!module) {
    notFound()
  }

  if (module.content_type === 'quiz') {
    redirect(`/cursos/${courseId}/modulos/${moduleId}/quiz`)
  }

  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index') as { data: Module[] | null }

  const { data: progress } = await supabase
    .from('course_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single() as { data: CourseProgress | null }

  const completedModuleIds = progress?.completed_modules || []
  const isModuleCompleted = completedModuleIds.includes(moduleId)

  const currentIndex = modules?.findIndex(m => m.id === moduleId) ?? -1
  const prevModule = currentIndex > 0 ? modules?.[currentIndex - 1] : null
  const nextModule = currentIndex < (modules?.length || 0) - 1 ? modules?.[currentIndex + 1] : null

  const prevModuleId = currentIndex > 0 ? modules?.[currentIndex - 1]?.id : null
  const prevModuleIsCompleted = prevModuleId ? completedModuleIds.includes(prevModuleId) : true
  const canAccess = currentIndex === 0 || prevModuleIsCompleted

  if (!canAccess) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/cursos"
            className="text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)] transition-colors"
          >
            Mis cursos
          </Link>
          <svg className="w-4 h-4 text-[var(--md-outline)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span className="text-[var(--md-on-surface)] font-medium truncate">Módulo bloqueado</span>
        </nav>

        <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--md-surface-container)] flex items-center justify-center">
            <svg className="w-10 h-10 text-[var(--md-outline)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--md-on-surface)] mb-2">Módulo bloqueado</h2>
          <p className="text-[var(--md-on-surface-variant)] max-w-md mx-auto mb-6">
            Debes completar el módulo anterior para acceder a este contenido.
          </p>
          <Link
            href={`/cursos/${courseId}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2B4FA0] text-white rounded-lg font-semibold hover:bg-[#2B4FA0]/90 transition-colors min-h-[48px]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Volver al curso
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-4 md:space-y-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap">
            <Link
              href="/cursos"
              className="text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)] transition-colors shrink-0"
            >
              Mis cursos
            </Link>
            <svg className="w-4 h-4 text-[var(--md-outline)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
            <Link
              href={`/cursos/${courseId}`}
              className="text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)] transition-colors shrink-0"
            >
              {course.title}
            </Link>
            <svg className="w-4 h-4 text-[var(--md-outline)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
            <span className="text-[var(--md-on-surface)] font-medium shrink-0">{module.title}</span>
          </nav>

          {/* Module Header */}
          <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] p-4 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                  <span className="px-2.5 md:px-3 py-1 bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] rounded-full text-xs font-bold uppercase">
                    Módulo {currentIndex + 1}
                  </span>
                  <ContentTypeBadge type={module.content_type} />
                  {module.is_required && (
                    <span className="px-2 py-1 bg-red-100 text-[#9e3f4e] rounded text-xs font-semibold">
                      Obligatorio
                    </span>
                  )}
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-[var(--md-on-surface)]">{module.title}</h1>
                {module.description && (
                  <p className="text-[var(--md-on-surface-variant)] mt-2">{module.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Content Player */}
          <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] overflow-hidden">
            {module.content_type === 'video' && (
              <div className="p-4 md:p-6">
                <VideoPlayer
                  videoUrl={module.content_url}
                  moduleId={moduleId}
                  courseId={courseId}
                  isCompleted={isModuleCompleted}
                />
              </div>
            )}

            {(module.content_type === 'pdf' || module.content_type === 'slides') && (
              <div className="p-4 md:p-6">
                <PdfViewer
                  pdfUrl={module.content_url}
                  moduleId={moduleId}
                  courseId={courseId}
                  isCompleted={isModuleCompleted}
                  moduleTitle={module.title}
                />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4">
            {prevModule ? (
              <Link
                href={`/cursos/${courseId}/modulos/${prevModule.id}`}
                className="inline-flex items-center justify-center gap-2 text-[var(--md-primary)] font-medium hover:underline min-h-[48px] px-4 py-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6" />
                </svg>
                <span className="truncate">Anterior: {prevModule.title}</span>
              </Link>
            ) : (
              <Link
                href={`/cursos/${courseId}`}
                className="inline-flex items-center justify-center gap-2 text-[var(--md-primary)] font-medium hover:underline min-h-[48px] px-4 py-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
                Volver al curso
              </Link>
            )}

            {nextModule ? (
              <Link
                href={`/cursos/${courseId}/modulos/${nextModule.id}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2B4FA0] text-white rounded-lg font-semibold hover:bg-[#2B4FA0]/90 shadow-md shadow-[#2B4FA0]/20 transition-colors min-h-[48px]"
              >
                <span className="truncate">Siguiente: {nextModule.title}</span>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            ) : (
              <Link
                href={`/cursos/${courseId}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#27AE60] text-white rounded-lg font-semibold hover:bg-[#27AE60]/90 shadow-md shadow-[#27AE60]/20 transition-colors min-h-[48px]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <polyline points="9,12 12,15 16,10" />
                </svg>
                Completar curso
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar - oculto en mobile, visible en desktop */}
        <div className="hidden md:block space-y-4 md:space-y-6">
          <ModuleIndex
            modules={modules || []}
            currentModuleId={moduleId}
            completedModuleIds={completedModuleIds}
            courseId={courseId}
          />

          {/* Course Info Card */}
          <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] p-5">
            <h4 className="font-semibold text-[var(--md-on-surface)] mb-3">Sobre este curso</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-[var(--md-on-surface-variant)]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {modules?.length || 0} módulos
              </div>
              <div className="flex items-center gap-2 text-[var(--md-on-surface-variant)]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                </svg>
                {completedModuleIds.length} completados
              </div>
            </div>
          </div>
          {/* Contactar tutor */}
          <div className="bg-gradient-to-br from-[#1A2F6B] to-[#2B4FA0] rounded-xl p-5 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <svg className="h-5 w-5 text-[#F5A623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <h4 className="text-white font-semibold text-sm">
                  ¿Necesitas ayuda?
                </h4>
              </div>
              <p className="text-white/70 text-xs leading-relaxed mb-4">
                Contacta al administrador si tienes dudas sobre el contenido de este módulo.
              </p>
              {course.created_by ? (
                <a
                  href="mailto:alumco@ongalumco.cl"
                  className="w-full py-2.5 bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#1A2F6B] font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  Contactar administrador
                </a>
              ) : (
                <a
                  href="mailto:da.ehualpen@gmail.com"
                  className="w-full py-2.5 bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#1A2F6B] font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  Contactar administrador
                </a>
              )}
            </div>
            {/* Decoración de fondo */}
            <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-white/5" aria-hidden="true"/>
            <div className="absolute -right-2 -top-4 h-16 w-16 rounded-full bg-white/5" aria-hidden="true"/>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContentTypeBadge({ type }: { type: string }) {
  const config = {
    video: { label: 'Video', color: 'bg-red-100 text-red-700' },
    pdf: { label: 'PDF', color: 'bg-blue-100 text-blue-700' },
    slides: { label: 'Presentación', color: 'bg-purple-100 text-purple-700' },
    quiz: { label: 'Evaluación', color: 'bg-[#F5A623]/20 text-[#F5A623]' },
  }

  const { label, color } = config[type as keyof typeof config] || { label: type, color: 'bg-gray-100 text-gray-700' }

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>
      {label}
    </span>
  )
}
