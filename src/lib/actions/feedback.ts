'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient, createClient, getCachedUser } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import type { CourseFeedback } from '@/lib/types/database'

/**
 * Feedback de cursos: una valoración de 1 a 5 más un comentario opcional,
 * disponible solo al completar el 100% del curso.
 *
 * La regla de "solo si lo completaste" está además en la policy de la tabla
 * (ver supabase/propuestas/course-feedback.sql). Acá se repite para poder
 * devolver un mensaje decente en vez de un error de RLS.
 */

const FeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
})

// ── Escritura ──────────────────────────────────────────────

export async function submitCourseFeedbackAction(input: {
  courseId: string
  rating: number
  comment?: string
}): Promise<{ success?: boolean; error?: string }> {
  const user = await getCachedUser()
  if (!user) return { error: 'No autenticado' }

  const parsed = FeedbackSchema.safeParse({ rating: input.rating, comment: input.comment })
  if (!parsed.success) {
    return { error: 'Elige una valoración de 1 a 5 estrellas.' }
  }

  const supabase = await createClient()

  const { data: progress } = await supabase
    .from('course_progress')
    .select('is_completed')
    .eq('user_id', user.id)
    .eq('course_id', input.courseId)
    .maybeSingle() as { data: { is_completed: boolean } | null }

  if (!progress?.is_completed) {
    return { error: 'Podrás valorar este curso cuando lo completes al 100%.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_demo')
    .eq('id', user.id)
    .single() as { data: { is_demo: boolean | null } | null }

  // upsert sobre (course_id, user_id): cambiar de opinión reemplaza la
  // valoración anterior en vez de acumular filas.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('course_feedback')
    .upsert(
      {
        course_id: input.courseId,
        user_id: user.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment && parsed.data.comment.length > 0
          ? parsed.data.comment
          : null,
        is_demo: profile?.is_demo === true,
      },
      { onConflict: 'course_id,user_id' }
    )

  if (error) {
    console.error('Error guardando feedback:', error)
    return { error: 'No se pudo guardar tu valoración.' }
  }

  revalidatePath(`/cursos/${input.courseId}`)
  return { success: true }
}

// ── Lectura del propio feedback ────────────────────────────

export async function getMyCourseFeedbackAction(
  courseId: string
): Promise<{ rating: number; comment: string | null } | null> {
  const user = await getCachedUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('course_feedback')
    .select('rating, comment')
    .eq('course_id', courseId)
    .eq('user_id', user.id)
    .maybeSingle() as { data: { rating: number; comment: string | null } | null }

  return data ?? null
}

// ── Resumen para capacitador/admin ─────────────────────────

export interface FeedbackSummary {
  average: number
  total: number
  /** Cuántas valoraciones hay de cada nota, de 1 a 5. */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
  comments: { rating: number; comment: string; created_at: string; author: string }[]
}

/**
 * Resumen de un curso. Los comentarios llegan con nombre porque quien dicta el
 * curso necesita poder hacer seguimiento — no es una encuesta anónima, y la
 * UI del trabajador lo dice antes de enviar.
 */
export async function getCourseFeedbackSummaryAction(
  courseId: string
): Promise<{ data?: FeedbackSummary; error?: string }> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const adminClient = await createAdminClient()

  const { data: rows } = await adminClient
    .from('course_feedback')
    .select('rating, comment, created_at, user_id')
    .eq('course_id', courseId)
    .eq('is_demo', auth.isDemo)
    .order('created_at', { ascending: false }) as {
      data: Pick<CourseFeedback, 'rating' | 'comment' | 'created_at' | 'user_id'>[] | null
    }

  const feedback = rows ?? []
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let suma = 0

  for (const f of feedback) {
    const nota = Math.min(5, Math.max(1, f.rating)) as 1 | 2 | 3 | 4 | 5
    distribution[nota]++
    suma += f.rating
  }

  const conComentario = feedback.filter((f) => f.comment && f.comment.trim().length > 0)
  const autores: Record<string, string> = {}

  if (conComentario.length > 0) {
    const ids = [...new Set(conComentario.map((f) => f.user_id))]
    const { data: perfiles } = await adminClient
      .from('profiles')
      .select('id, full_name')
      .in('id', ids) as { data: { id: string; full_name: string }[] | null }
    for (const p of perfiles ?? []) autores[p.id] = p.full_name
  }

  return {
    data: {
      average: feedback.length > 0 ? Math.round((suma / feedback.length) * 10) / 10 : 0,
      total: feedback.length,
      distribution,
      comments: conComentario.map((f) => ({
        rating: f.rating,
        comment: f.comment!,
        created_at: f.created_at,
        author: autores[f.user_id] ?? 'Participante',
      })),
    },
  }
}
