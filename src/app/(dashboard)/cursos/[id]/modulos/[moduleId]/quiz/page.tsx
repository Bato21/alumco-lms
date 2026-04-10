import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import QuizClient from './QuizClient'

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
    .single()

  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .single()

  return {
    title: module?.title
      ? `${module.title} | ${course?.title || 'Curso'} | Alumco LMS`
      : 'Evaluación | Alumco LMS',
  }
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { id: courseId, moduleId } = await params
  const supabase = await createClient()

  // Fetch quiz data
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, passing_score, max_attempts')
    .eq('module_id', moduleId)
    .single()

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
    .order('order_index')

  // Find previous and next module (the content modules before/after this quiz)
  const moduleIds = modules?.map(m => m.id) || []
  const currentIndex = moduleIds.indexOf(moduleId)
  
  const previousModuleId = currentIndex > 0 ? moduleIds[currentIndex - 1] : null
  const nextModuleId = currentIndex < moduleIds.length - 1 ? moduleIds[currentIndex + 1] : null

  return (
    <QuizClient
      courseId={courseId}
      moduleId={moduleId}
      previousModuleId={previousModuleId}
      nextModuleId={nextModuleId} 
      quizId={quiz.id}
      passingScore={quiz.passing_score}
      maxAttempts={quiz.max_attempts}
      questions={questions || []}
    />
  )
}
