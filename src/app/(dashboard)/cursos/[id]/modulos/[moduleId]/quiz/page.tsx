import { createClient, getCachedUser } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import QuizClient from './QuizClient'
import { filterCoursesByWorkerAreas, isModuleUnlocked } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface QuizPageProps {
  params: Promise<{
    id: string
    moduleId: string
  }>
}

export async function generateMetadata({ params }: QuizPageProps): Promise<Metadata> {
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
      ? `${module.title} | ${course?.title || 'Curso'}`
      : 'Evaluación',
  }
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { id: courseId, moduleId } = await params
  const supabase = await createClient()

  // Auth check
  const user = await getCachedUser()
  if (!user) notFound()

  // Consultas independientes en paralelo; las preguntas se cargan después
  // porque dependen del id del quiz.
  const [
    { data: courseAccess },
    { data: quizProfile },
    { data: quiz },
    { data: modules },
    { data: progress },
  ] = await Promise.all([
    supabase
      .from('courses')
      .select('target_areas, is_published')
      .eq('id', courseId)
      .eq('is_published', true)
      .single() as unknown as Promise<{ data: { target_areas: string[] | null; is_published: boolean } | null }>,
    supabase
      .from('profiles')
      .select('area_trabajo, role')
      .eq('id', user.id)
      .single() as unknown as Promise<{ data: { area_trabajo: string[] | null; role: string } | null }>,
    supabase
      .from('quizzes')
      .select('id, passing_score, max_attempts')
      .eq('module_id', moduleId)
      .single() as unknown as Promise<{ data: { id: string; passing_score: number; max_attempts: number } | null }>,
    supabase
      .from('modules')
      .select('id')
      .eq('course_id', courseId)
      .order('order_index') as unknown as Promise<{ data: { id: string }[] | null }>,
    supabase
      .from('course_progress')
      .select('completed_modules')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle() as unknown as Promise<{ data: { completed_modules: string[] | null } | null }>,
  ])

  if (!courseAccess) notFound()

  if (quizProfile?.role === 'trabajador') {
    const hasAccess = filterCoursesByWorkerAreas(
      [{ target_areas: (courseAccess.target_areas as string[]) ?? [] }],
      (quizProfile.area_trabajo as string[]) ?? []
    ).length > 0

    if (!hasAccess) {
      return (
        <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-[var(--arena-100)] flex items-center justify-center mx-auto">
            <svg className="h-8 w-8 text-[var(--tinta-3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--tinta)]">Acceso no permitido</h2>
          <p className="text-[var(--tinta-3)]">
            Esta evaluación pertenece a un curso que no está asignado a tu área de trabajo.
          </p>
          <Link
            href="/cursos"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--ambar)] text-white rounded-lg font-semibold text-sm hover:bg-[var(--ambar-600)] transition-colors"
          >
            ← Volver a mis cursos
          </Link>
        </div>
      )
    }
  }

  if (!quiz) {
    notFound()
  }

  // Candado secuencial. Faltaba acá: la evaluación suele ser el último módulo,
  // así que sin este check se podía entrar directo por URL y certificarse sin
  // haber abierto el contenido.
  const completedModuleIds = progress?.completed_modules ?? []
  if (
    quizProfile?.role === 'trabajador' &&
    !isModuleUnlocked(modules ?? [], completedModuleIds, moduleId)
  ) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-[var(--arena-100)] flex items-center justify-center mx-auto">
          <svg className="h-8 w-8 text-[var(--tinta-3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--tinta)]">Evaluación bloqueada</h2>
        <p className="text-[var(--tinta-3)]">
          Necesitas completar los módulos anteriores antes de rendir esta evaluación.
        </p>
        <Link
          href={`/cursos/${courseId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--ambar)] text-white rounded-lg font-semibold text-sm hover:bg-[var(--ambar-600)] transition-colors"
        >
          ← Volver al curso
        </Link>
      </div>
    )
  }

  // Fetch questions
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', quiz.id)
    .order('order_index')

  // Find previous and next module (the content modules before/after this quiz)
  const moduleIds = modules?.map(m => m.id) || []
  const currentIndex = moduleIds.indexOf(moduleId)

  const nextModuleId = currentIndex < moduleIds.length - 1 ? moduleIds[currentIndex + 1] : null

  return (
    <QuizClient
      courseId={courseId}
      moduleId={moduleId}
      nextModuleId={nextModuleId}
      quizId={quiz.id}
      passingScore={quiz.passing_score}
      maxAttempts={quiz.max_attempts}
      questions={questions || []}
    />
  )
}
