'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { type Question } from '@/lib/types/database'

interface QuestionInput {
  id?: string
  quiz_id: string
  question_text: string
  order_index: number
  options: { id: string; text: string }[]
  correct_option: string
}

const OptionIdSchema = z.enum(['a', 'b', 'c', 'd'])

const QuestionInputSchema = z.object({
  id: z.string().uuid().optional(),
  quiz_id: z.string().uuid(),
  question_text: z.string().min(2, 'El texto de la pregunta es muy corto'),
  order_index: z.number().int().nonnegative(),
  options: z
    .array(
      z.object({
        id: OptionIdSchema,
        text: z.string().min(1, 'El texto de la opción es requerido'),
      })
    )
    .length(4, 'Debe haber exactamente 4 opciones'),
  correct_option: OptionIdSchema,
}).refine(
  (data) => {
    const ids = data.options.map((o) => o.id)
    return new Set(ids).size === 4
  },
  { message: 'Las opciones deben tener ids únicos a, b, c, d' }
)

export async function saveQuestionAction(
  data: QuestionInput,
  courseId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const parsed = QuestionInputSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any

    const payload = {
      quiz_id: parsed.data.quiz_id,
      question_text: parsed.data.question_text,
      order_index: parsed.data.order_index,
      options: parsed.data.options,
      correct_option: parsed.data.correct_option,
    }

    let error

    if (parsed.data.id) {
      const { error: updateError } = await ac
        .from('questions')
        .update(payload)
        .eq('id', parsed.data.id) as { error: unknown }
      error = updateError
    } else {
      const { error: insertError } = await ac
        .from('questions')
        .insert(payload) as { error: unknown }
      error = insertError
    }

    if (error) throw error

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
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any

    const { error } = await ac
      .from('questions')
      .delete()
      .eq('id', questionId) as { error: unknown }

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
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { data, error } = await ac
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index') as { data: Question[] | null; error: unknown }

    if (error) throw error
    return { success: true, questions: data ?? [] }
  } catch (err) {
    console.error('Error obteniendo preguntas:', err)
    return { success: false, error: 'Error al obtener preguntas' }
  }
}
