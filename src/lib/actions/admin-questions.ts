'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type Question } from '@/lib/types/database'

interface QuestionInput {
  id?: string
  quiz_id: string
  question_text: string
  order_index: number
  options: { id: string; text: string }[]
  correct_option: string
}

export async function saveQuestionAction(
  data: QuestionInput,
  courseId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'No autorizado' }

    const adminClient = await createAdminClient()

    // Preparar el payload
    const payload = {
      quiz_id: data.quiz_id,
      question_text: data.question_text,
      order_index: data.order_index,
      options: data.options,
      correct_option: data.correct_option
    }

    let error;

    if (data.id) {
      // Actualizar pregunta existente
      const { error: updateError } = await adminClient
        .from('questions')
        .update(payload)
        .eq('id', data.id)
      error = updateError
    } else {
      // Insertar nueva pregunta
      const { error: insertError } = await adminClient
        .from('questions')
        .insert(payload)
      error = insertError
    }

    if (error) throw error

    // Refrescar caché del administrador
    revalidatePath(`/admin/cursos/${courseId}`)
    
    return { success: true }
  } catch (err) {
    console.error('Error guardando pregunta:', err)
    return { success: false, error: 'Error al guardar la pregunta en la base de datos' }
  }
}

export async function deleteQuestionAction(
  questionId: string,
  courseId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'No autorizado' }

    const adminClient = await createAdminClient()

    const { error } = await adminClient
      .from('questions')
      .delete()
      .eq('id', questionId)

    if (error) throw error

    revalidatePath(`/admin/cursos/${courseId}`)
    return { success: true }
  } catch (err) {
    console.error('Error borrando pregunta:', err)
    return { success: false, error: 'Error al borrar la pregunta' }
  }
}

export async function getQuestionsAction(
  quizId: string
): Promise<{ success: boolean; questions?: Question[]; error?: string }> {
  try {
    const adminClient = await createAdminClient()
    const { data, error } = await adminClient
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index')

    if (error) throw error
    return { success: true, questions: data ?? [] }
  } catch (err) {
    console.error('Error obteniendo preguntas:', err)
    return { success: false, error: 'Error al obtener preguntas' }
  }
}