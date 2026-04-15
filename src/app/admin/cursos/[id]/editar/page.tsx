import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { CourseBuilder } from '@/components/alumco/CourseBuilder/CourseBuilder'
import { type ModuleBlock } from '@/components/alumco/CourseBuilder/CourseBuilder'
import { type Question } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Editar curso | Alumco LMS' }

interface EditarCursoPageProps {
  params: Promise<{ id: string }>
}

export default async function EditarCursoPage({ params }: EditarCursoPageProps) {
  const { id } = await params
  const supabase = await createAdminClient()

  // Cargar curso
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, description, deadline, deadline_description, is_published')
    .eq('id', id)
    .single()

  if (!course) notFound()

  // Cargar módulos ordenados con sus quizzes y preguntas
  const { data: modules } = await supabase
    .from('modules')
    .select(`
      id,
      title,
      content_type,
      content_url,
      order_index,
      duration_mins,
      is_required,
      quizzes (
        id,
        passing_score,
        max_attempts,
        questions (
          id,
          quiz_id,
          question_text,
          options,
          correct_option,
          order_index,
          created_at
        )
      )
    `)
    .eq('course_id', id)
    .order('order_index')

  const initialModules: ModuleBlock[] = (modules ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    content_type: m.content_type as ModuleBlock['content_type'],
    content_url: m.content_url,
    order_index: m.order_index,
    duration_mins: m.duration_mins,
    is_required: m.is_required,
    quiz: Array.isArray(m.quizzes) && m.quizzes.length > 0
      ? {
          id: m.quizzes[0].id,
          passing_score: m.quizzes[0].passing_score,
          max_attempts: m.quizzes[0].max_attempts,
          questions: m.quizzes[0].questions ?? [],
        }
      : undefined,
  }))

  return (
    <CourseBuilder
      course={course}
      initialModules={initialModules}
    />
  )
}