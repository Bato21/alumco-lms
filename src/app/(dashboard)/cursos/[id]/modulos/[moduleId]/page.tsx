import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import Link from 'next/link'
import { VideoPlayer } from '@/components/alumco/curso/VideoPlayer'
import { PdfViewer } from '@/components/alumco/curso/PdfViewer'
import { ModuleIndex } from '@/components/alumco/curso/ModuleIndex'
import type { Module, Course, CourseProgress } from '@/lib/types/database'
import { filterCoursesByWorkerAreas } from '@/lib/utils'
import { Badge, Icono } from '@/components/alumco/ds'

interface ModulePageProps {
  params: Promise<{
    id: string
    moduleId: string
  }>
}

export async function generateMetadata({ params }: ModulePageProps): Promise<Metadata> {
  const { id: courseId, moduleId } = await params
  const supabase = await createClient()

  const [{ data: module }, { data: course }] = await Promise.all([
    supabase
      .from('modules')
      .select('title')
      .eq('id', moduleId)
      .single() as unknown as Promise<{ data: { title: string } | null }>,
    supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .single() as unknown as Promise<{ data: { title: string } | null }>,
  ])

  return {
    title: module?.title
      ? `${module.title} | ${course?.title || 'Curso'} | Alumco LMS`
      : 'Módulo | Alumco LMS',
  }
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { id: courseId, moduleId } = await params
  const supabase = await createClient()
  const user = await getCachedUser()

  if (!user) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-[var(--tinta-3)]">Debes iniciar sesión para ver este contenido.</p>
      </div>
    )
  }

  // Todas las consultas en paralelo; los checks de acceso se validan después.
  const [
    { data: course },
    { data: accessProfile },
    { data: module },
    { data: modules },
    { data: progress },
  ] = await Promise.all([
    supabase
      .from('courses')
      .select('*, profiles(full_name)')
      .eq('id', courseId)
      .eq('is_published', true)
      .single() as unknown as Promise<{ data: Course | null }>,
    supabase
      .from('profiles')
      .select('area_trabajo, role')
      .eq('id', user.id)
      .single() as unknown as Promise<{ data: { area_trabajo: string[] | null; role: string } | null }>,
    supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .eq('course_id', courseId)
      .single() as unknown as Promise<{ data: Module | null }>,
    supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index') as unknown as Promise<{ data: Module[] | null }>,
    supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single() as unknown as Promise<{ data: CourseProgress | null }>,
  ])

  if (!course) {
    notFound()
  }

  if (accessProfile?.role === 'trabajador') {
    const courseForCheck = course as unknown as { target_areas?: string[] }
    const hasAccess = filterCoursesByWorkerAreas(
      [{ target_areas: courseForCheck.target_areas ?? [] }],
      (accessProfile.area_trabajo as string[]) ?? []
    ).length > 0

    if (!hasAccess) {
      return (
        <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-[var(--arena-100)] flex items-center justify-center mx-auto">
            <svg className="h-8 w-8 text-[var(--tinta-3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
          </div>
          <h2 className="t-display" style={{ fontSize: 22 }}>Acceso no permitido</h2>
          <p className="silencio">
            Este módulo pertenece a un curso que no está asignado a tu área de trabajo.
            Contacta a tu administrador si crees que es un error.
          </p>
          <Link href="/cursos" className="btn btn-primary">
            <Icono n="flechaIzq" s={18} /> Volver a mis cursos
          </Link>
        </div>
      )
    }
  }

  if (!module) {
    notFound()
  }

  if (module.content_type === 'quiz') {
    redirect(`/cursos/${courseId}/modulos/${moduleId}/quiz`)
  }

  const completedModuleIds = progress?.completed_modules || []
  const isModuleCompleted = completedModuleIds.includes(moduleId)

  const currentIndex = modules?.findIndex(m => m.id === moduleId) ?? -1
  const prevModule = currentIndex > 0 ? modules?.[currentIndex - 1] : null
  const nextModule = currentIndex < (modules?.length || 0) - 1 ? modules?.[currentIndex + 1] : null

  const prevModuleId = currentIndex > 0 ? modules?.[currentIndex - 1]?.id : null
  const prevModuleIsCompleted = prevModuleId ? completedModuleIds.includes(prevModuleId) : true
  const canAccess = currentIndex === 0 || prevModuleIsCompleted

  // ── Módulo bloqueado ──────────────────────────────────────────────────────
  if (!canAccess) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
          <Link href="/cursos" className="text-[var(--tinta-3)] hover:text-[var(--ambar)] transition-colors">
            Mis cursos
          </Link>
          <span className="text-[var(--tinta-3)]">›</span>
          <Link href={`/cursos/${courseId}`} className="text-[var(--tinta-3)] hover:text-[var(--ambar)] transition-colors truncate">
            {course.title}
          </Link>
          <span className="text-[var(--tinta-3)]">›</span>
          <span className="text-[var(--tinta)] font-medium">Módulo bloqueado</span>
        </nav>

        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[var(--arena-100)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--tinta-3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--tinta)] mb-2">Módulo bloqueado</h2>
          <p className="text-[var(--tinta-3)] max-w-md mx-auto mb-6">
            Debes completar el módulo anterior para acceder a este contenido.
          </p>
          <Link href={`/cursos/${courseId}`} className="btn btn-primary">
            <Icono n="flechaIzq" s={17} /> Volver al curso
          </Link>
        </div>
      </div>
    )
  }

  // ── Vista principal ───────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

        {/* ── Contenido principal (2/3) ─────────────────────────────────── */}
        <div className="md:col-span-2 space-y-5">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm overflow-x-auto whitespace-nowrap">
            <Link href="/cursos" className="text-[var(--tinta-3)] hover:text-[var(--ambar)] transition-colors shrink-0">
              Mis cursos
            </Link>
            <span className="text-[var(--tinta-3)] shrink-0">›</span>
            <Link href={`/cursos/${courseId}`} className="text-[var(--tinta-3)] hover:text-[var(--ambar)] transition-colors shrink-0 max-w-[120px] truncate">
              {course.title}
            </Link>
            <span className="text-[var(--tinta-3)] shrink-0">›</span>
            <span className="text-[var(--tinta)] font-medium shrink-0 max-w-[140px] truncate">{module.title}</span>
          </nav>

          {/* Header del módulo */}
          <div className="card p-5">
            <div className="fila" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <Badge tono="neutro" punto={false}>Módulo {currentIndex + 1}</Badge>
              <ContentTypeBadge type={module.content_type} />
              {module.is_required && <Badge tono="peligro" punto={false}>Obligatorio</Badge>}
            </div>
            <h1 className="t-display" style={{ fontSize: 22 }}>{module.title}</h1>
            {module.description && (
              <p className="silencio texto-s" style={{ marginTop: 8, lineHeight: 1.5 }}>{module.description}</p>
            )}
          </div>

          {/* Player */}
          <div className="card overflow-hidden">
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

          {/* Navegación */}
          <div className="fila" style={{ justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            {prevModule ? (
              <Link href={`/cursos/${courseId}/modulos/${prevModule.id}`} className="btn btn-secondary">
                <Icono n="flechaIzq" s={17} />
                <span className="recorte" style={{ maxWidth: 180 }}>Anterior: {prevModule.title}</span>
              </Link>
            ) : (
              <Link href={`/cursos/${courseId}`} className="btn btn-secondary">
                <Icono n="flechaIzq" s={17} /> Volver al curso
              </Link>
            )}

            {nextModule ? (
              <Link href={`/cursos/${courseId}/modulos/${nextModule.id}`} className="btn btn-primary">
                <span className="recorte" style={{ maxWidth: 180 }}>Siguiente: {nextModule.title}</span>
                <Icono n="chevR" s={17} />
              </Link>
            ) : isModuleCompleted ? (
              <Link href={`/cursos/${courseId}`} className="btn btn-primary" style={{ background: 'var(--ok)', color: '#fff' }}>
                <Icono n="check" s={17} /> Completar curso
              </Link>
            ) : (
              <Link href={`/cursos/${courseId}`} className="btn btn-secondary">
                <Icono n="flechaIzq" s={17} /> Volver al curso
              </Link>
            )}
          </div>
        </div>

        {/* ── Sidebar (1/3) — solo desktop ──────────────────────────────── */}
        <div className="hidden md:flex flex-col gap-5">

          {/* Índice de módulos */}
          <ModuleIndex
            modules={modules || []}
            currentModuleId={moduleId}
            completedModuleIds={completedModuleIds}
            courseId={courseId}
          />

          {/* Sobre este curso */}
          <div className="card p-5">
            <h4 className="font-bold text-[var(--tinta)] text-sm mb-4">Sobre este curso</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-sm text-[var(--tinta-3)]">
                <div className="w-7 h-7 rounded-lg bg-[var(--ambar-50)] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[var(--ambar-700)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span><strong className="text-[var(--tinta)]">{modules?.length || 0}</strong> módulos en total</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-[var(--tinta-3)]">
                <div className="w-7 h-7 rounded-lg bg-[var(--ok-bg,#EDFAF3)] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[var(--ok,#27AE60)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
                <span><strong className="text-[var(--tinta)]">{completedModuleIds.length}</strong> completados</span>
              </div>
            </div>
          </div>

          {/* ¿Necesitas ayuda? */}
          <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'var(--grad-oliva)' }}>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <svg className="h-5 w-5 text-[var(--oliva-clara)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <h4 className="text-white font-semibold text-sm">¿Necesitas ayuda?</h4>
              </div>
              <p className="text-white/70 text-xs leading-relaxed mb-4">
                Contacta al administrador si tienes dudas sobre el contenido de este módulo.
              </p>
              {course.created_by ? (
                <a
                  href="mailto:alumco@ongalumco.cl"
                  className="w-full py-2.5 bg-[var(--oliva-clara)] hover:opacity-90 text-[var(--oliva-950)] font-bold rounded-lg text-sm transition-opacity flex items-center justify-center gap-2 min-h-[44px]"
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
                  className="w-full py-2.5 bg-[var(--oliva-clara)] hover:opacity-90 text-[var(--oliva-950)] font-bold rounded-lg text-sm transition-opacity flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  Contactar administrador
                </a>
              )}
            </div>
            <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-[var(--blanco)]/5" aria-hidden="true"/>
            <div className="absolute -right-2 -top-4 h-16 w-16 rounded-full bg-[var(--blanco)]/5" aria-hidden="true"/>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── ContentTypeBadge ────────────────────────────────────────────────────────

function ContentTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; tono: 'peligro' | 'info' | 'aviso' | 'neutro' }> = {
    video: { label: 'Video', tono: 'peligro' },
    pdf: { label: 'PDF', tono: 'info' },
    slides: { label: 'Presentación', tono: 'info' },
    quiz: { label: 'Evaluación', tono: 'aviso' },
  }
  const { label, tono } = config[type] || { label: type, tono: 'neutro' as const }
  return <Badge tono={tono} punto={false}>{label}</Badge>
}
