import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import QuizClient from './QuizClient'
import { filterCoursesByWorkerAreas } from '@/lib/utils'

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
      : 'Evaluación | Alumco LMS',
  }
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { id: courseId, moduleId } = await params
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Verificar que el curso existe, está publicado y el trabajador tiene acceso por área
  const { data: courseAccess } = await supabase
    .from('courses')
    .select('target_areas, is_published')
    .eq('id', courseId)
    .eq('is_published', true)
    .single() as { data: { target_areas: string[] | null; is_published: boolean } | null }

  if (!courseAccess) notFound()

  const { data: quizProfile } = await supabase
    .from('profiles')
    .select('area_trabajo, role')
    .eq('id', user.id)
    .single() as { data: { area_trabajo: string[] | null; role: string } | null }

  if (quizProfile?.role === 'trabajador') {
    const hasAccess = filterCoursesByWorkerAreas(
      [{ target_areas: (courseAccess.target_areas as string[]) ?? [] }],
      (quizProfile.area_trabajo as string[]) ?? []
    ).length > 0

    if (!hasAccess) {
      return (
        <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
            <svg className="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1A1A2E]">Acceso no permitido</h2>
          <p className="text-[#6B7280]">
            Esta evaluación pertenece a un curso que no está asignado a tu área de trabajo.
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

  // Fetch quiz data
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, passing_score, max_attempts')
    .eq('module_id', moduleId)
    .single() as { data: { id: string; passing_score: number; max_attempts: number } | null }

  if (!quiz) {
    notFound()
  }

  // Fetch questions
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', quiz.id)
    .order('order_index')

  // Fetch all modules to find previous module
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId)
    .order('order_index') as { data: { id: string }[] | null }

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
