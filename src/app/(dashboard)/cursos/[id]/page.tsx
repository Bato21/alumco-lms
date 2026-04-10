import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
        <p className="text-[var(--md-on-surface-variant)]">Debes iniciar sesión para ver este curso.</p>
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

  // Fetch perfil del usuario para el certificado
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Fetch certificado si el curso está completado
  const { data: certificate } = await supabase
    .from('certificates')
    .select('id, issued_at, pdf_url')
    .eq('user_id', user.id)
    .eq('course_id', id)
    .single()

  // Calculate course progress
  const completedModuleIds = progress?.completed_modules || []
  const totalModules = modules?.length || 0
  const completedModules = completedModuleIds.length
  const courseProgress = totalModules > 0
    ? Math.round((completedModules / totalModules) * 100)
    : 0

  // Check if course is completed
  const isCourseCompleted = progress?.is_completed || false

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
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
        <span className="text-[var(--md-on-surface)] font-medium truncate">{course.title}</span>
      </nav>

      {/* Course Header */}
      <section className="relative">
        <div className="h-48 md:h-64 rounded-2xl overflow-hidden relative">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#2B4FA0] to-[#1A2F6B] flex items-center justify-center">
              <svg className="w-20 h-20 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            {isCourseCompleted ? (
              <span className="bg-[#27AE60] text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                Completado
              </span>
            ) : courseProgress > 0 ? (
              <span className="bg-[#F5A623] text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                En progreso
              </span>
            ) : (
              <span className="bg-slate-500 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                No iniciado
              </span>
            )}
          </div>
        </div>

        {/* Course Info */}
        <div className="mt-6">
          <h1 className="text-3xl font-bold text-[var(--md-on-surface)] mb-2">{course.title}</h1>
          {course.description && (
            <p className="text-[var(--md-on-surface-variant)] max-w-3xl">{course.description}</p>
          )}

          {/* Progress Bar */}
          <div className="mt-6 max-w-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[var(--md-on-surface)]">
                Progreso del curso
              </span>
              <span className={`text-sm font-bold ${isCourseCompleted ? 'text-[#27AE60]' : 'text-[#2B4FA0]'}`}>
                {courseProgress}%
              </span>
            </div>
            <div className="w-full h-3 bg-[var(--md-surface-container)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isCourseCompleted ? 'bg-[#27AE60]' : 'bg-[#2B4FA0]'}`}
                style={{ width: `${courseProgress}%` }}
              />
            </div>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-2">
              {completedModules} de {totalModules} módulos completados
            </p>
          </div>

          {/* Certificate Badge */}
          { isCourseCompleted && certificate && profile && (
            <div className="mt-6 max-w-xl">
              <CertificateBadge
                certificate={certificate}
                courseName={course.title}
                workerName={profile.full_name}
              />
            </div>
          )}
        </div>
      </section>

      {/* Modules Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--md-on-surface)]">Contenido del curso</h2>
          <span className="text-sm text-[var(--md-on-surface-variant)]">
            {totalModules} módulos
          </span>
        </div>

        {modules && modules.length > 0 ? (
          <div className="space-y-4">
            {modules.map((module, index) => (
              <ModuleCard
                key={module.id}
                module={module}
                index={index + 1}
                isCompleted={completedModuleIds.includes(module.id)}
                isPreviousCompleted={index === 0 || completedModuleIds.includes(modules[index - 1]?.id)}
                hasQuiz={true} // Will be fetched dynamically
              />
            ))}
          </div>
        ) : (
          <div className="bg-[var(--md-surface-container-low)] rounded-xl p-8 text-center">
            <svg className="w-12 h-12 text-[var(--md-outline)] mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
            <p className="text-[var(--md-on-surface-variant)]">
              Este curso aún no tiene contenido disponible.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

// Module Card Component
interface ModuleCardProps {
  module: Module
  index: number
  isCompleted: boolean
  isPreviousCompleted: boolean
  hasQuiz: boolean
}

function ModuleCard({ module, index, isCompleted, isPreviousCompleted, hasQuiz }: ModuleCardProps) {
  const canAccess = isPreviousCompleted || isCompleted

  const contentTypeConfig: Record<ContentType, { icon: string; label: string; bgColor: string }> = {
    video: {
      icon: 'play_circle',
      label: 'Video',
      bgColor: 'bg-red-50',
    },
    pdf: {
      icon: 'description',
      label: 'PDF',
      bgColor: 'bg-blue-50',
    },
    slides: {
      icon: 'slideshow',
      label: 'Presentación',
      bgColor: 'bg-purple-50',
    },
    quiz: {
      icon: 'quiz',
      label: 'Evaluación',
      bgColor: 'bg-[#FFF8E7]',
    },
  }

  const config = contentTypeConfig[module.content_type]

  return (
    <div className={`
      relative bg-[var(--md-surface-container-lowest)] rounded-xl p-5
      transition-all duration-300
      ${canAccess ? 'shadow-[0_4px_20px_rgba(42,52,57,0.04)] hover:shadow-[0_8px_30px_rgba(42,52,57,0.08)]' : 'opacity-60'}
    `}>
      <div className="flex items-start gap-4">
        {/* Module Number / Status */}
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center shrink-0
          ${isCompleted
            ? 'bg-[#27AE60] text-white'
            : canAccess
              ? 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]'
              : 'bg-[var(--md-surface-container)] text-[var(--md-outline)]'
          }
        `}>
          {isCompleted ? (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          ) : (
            <span className="text-lg font-bold">{index}</span>
          )}
        </div>

        {/* Module Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-[var(--md-on-surface)] mb-1">{module.title}</h3>
              {module.description && (
                <p className="text-sm text-[var(--md-on-surface-variant)] line-clamp-2">{module.description}</p>
              )}

              {/* Meta Info */}
              <div className="flex items-center gap-4 mt-2">
                <span className={`
                  inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
                  ${config.bgColor} text-[var(--md-on-surface)]
                `}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {module.content_type === 'video' && <><path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" /><path d="m9 9 6 3-6 3V9z" /></>}
                    {module.content_type === 'pdf' && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /></>}
                    {module.content_type === 'slides' && <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /></>}
                    {module.content_type === 'quiz' && <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>}
                  </svg>
                  {config.label}
                </span>

                {module.duration_mins && (
                  <span className="text-xs text-[var(--md-on-surface-variant)] flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12,6 12,12 16,14" />
                    </svg>
                    {module.duration_mins} min
                  </span>
                )}

                {module.is_required && (
                  <span className="text-xs font-medium text-[#9e3f4e]">
                    Obligatorio
                  </span>
                )}
              </div>
            </div>

            {/* Action Button */}
            {canAccess ? (
              <div className="flex items-center gap-2">
                <Link
                  href={`/cursos/${module.course_id}/modulos/${module.id}`}
                  className={`
                    px-4 py-2 rounded-lg font-semibold text-sm transition-all
                    ${isCompleted
                      ? 'bg-[var(--md-surface-container-high)] text-[var(--md-primary)] hover:bg-[var(--md-surface-container-highest)]'
                      : 'bg-[#2B4FA0] text-white hover:bg-[#2B4FA0]/90 shadow-md shadow-[#2B4FA0]/20'
                    }
                  `}
                >
                  {isCompleted ? 'Repasar' : 'Iniciar'}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[var(--md-outline)]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-sm">Bloqueado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Line Connector */}
      <div className="absolute left-[2.25rem] top-full w-0.5 h-4 bg-[var(--md-surface-container)] -z-10" />
    </div>
  )
}
