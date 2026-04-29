'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { markModuleCompleteAction } from './progress'
import { filterCoursesByWorkerAreas } from '@/lib/utils'
import type { UserAnswers, QuizSubmitResult, QuizStatus } from '@/lib/types/database'

const AnswerOptionSchema = z.enum(['a', 'b', 'c', 'd'])
const AnswersSchema = z.record(z.string().uuid(), AnswerOptionSchema)

/**
 * Obtiene el estado actual del quiz para el usuario autenticado.
 * Se llama ANTES de mostrar el quiz para determinar si puede intentar.
 * Los intentos se cuentan solo después del último reset (last_quiz_reset_at).
 */
export async function getQuizStatusAction(
  quizId: string,
  courseId: string
): Promise<QuizStatus> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        attemptsUsed: 0,
        maxAttempts: 3,
        attemptsRemaining: 0,
        hasPassedBefore: false,
        lastScore: null,
        isBlocked: true,
      }
    }

    // Obtener configuración del quiz
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('max_attempts, passing_score')
      .eq('id', quizId)
      .single()

    if (!quiz) {
      return {
        attemptsUsed: 0,
        maxAttempts: 3,
        attemptsRemaining: 0,
        hasPassedBefore: false,
        lastScore: null,
        isBlocked: true,
      }
    }

    const maxAttempts = quiz.max_attempts

    // Obtener fecha del último reset para este curso
    const { data: progress } = await supabase
      .from('course_progress')
      .select('last_quiz_reset_at')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    const resetAt = progress?.last_quiz_reset_at ?? null

    // Construir query de intentos - filtrar por fecha si hubo reset
    let attemptsQuery = supabase
      .from('quiz_attempts')
      .select('score, status, completed_at')
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })

    // Si hubo reset, solo contar intentos posteriores al reset
    if (resetAt) {
      attemptsQuery = attemptsQuery.gt('completed_at', resetAt)
    }

    const { data: attempts } = await attemptsQuery

    const attemptsUsed = attempts?.length || 0
    const attemptsRemaining = Math.max(0, maxAttempts - attemptsUsed)

    // Verificar si ya aprobó antes (después del reset)
    const hasPassedBefore = attempts?.some(a => a.status === 'aprobado') || false
    const lastScore = attempts && attempts.length > 0 ? attempts[0].score : null

    // El quiz está bloqueado si agotó intentos y no aprobó
    const isBlocked = attemptsUsed >= maxAttempts && !hasPassedBefore

    return {
      attemptsUsed,
      maxAttempts,
      attemptsRemaining,
      hasPassedBefore,
      lastScore,
      isBlocked,
    }
  } catch (error) {
    console.error('Error getting quiz status:', error)
    return {
      attemptsUsed: 0,
      maxAttempts: 3,
      attemptsRemaining: 0,
      hasPassedBefore: false,
      lastScore: null,
      isBlocked: true,
    }
  }
}

/**
 * Envía las respuestas del quiz y calcula el resultado en el servidor.
 * NO confiar en el cliente para el cálculo del score.
 */
export async function submitQuizAction(
  quizId: string,
  moduleId: string,
  courseId: string,
  answers: UserAnswers
): Promise<QuizSubmitResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        score: 0,
        passed: false,
        attemptNumber: 0,
        attemptsRemaining: 0,
        error: 'Usuario no autenticado',
      }
    }

    // Validar shape de answers (defensa frente a clientes maliciosos)
    const parsedAnswers = AnswersSchema.safeParse(answers)
    if (!parsedAnswers.success) {
      return { success: false, score: 0, passed: false, attemptNumber: 0, attemptsRemaining: 0, error: 'Respuestas inválidas' }
    }
    const validatedAnswers = parsedAnswers.data

    // Validar cadena quiz → módulo → curso para evitar manipulación de parámetros
    const { data: moduleCheck } = await supabase
      .from('modules')
      .select('id')
      .eq('id', moduleId)
      .eq('course_id', courseId)
      .single()

    if (!moduleCheck) {
      return { success: false, score: 0, passed: false, attemptNumber: 0, attemptsRemaining: 0, error: 'Acceso no autorizado' }
    }

    const { data: quizCheck } = await supabase
      .from('quizzes')
      .select('id')
      .eq('id', quizId)
      .eq('module_id', moduleId)
      .single()

    if (!quizCheck) {
      return { success: false, score: 0, passed: false, attemptNumber: 0, attemptsRemaining: 0, error: 'Acceso no autorizado' }
    }

    // Verificar acceso al curso por área del trabajador
    const { data: course } = await supabase
      .from('courses')
      .select('target_areas, is_published')
      .eq('id', courseId)
      .eq('is_published', true)
      .maybeSingle()

    if (!course) {
      return { success: false, score: 0, passed: false, attemptNumber: 0, attemptsRemaining: 0, error: 'Curso no disponible' }
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, area_trabajo')
      .eq('id', user.id)
      .single()

    if (callerProfile?.role === 'trabajador') {
      const hasAccess = filterCoursesByWorkerAreas(
        [{ target_areas: (course.target_areas as string[]) ?? [] }],
        (callerProfile.area_trabajo as string[]) ?? []
      ).length > 0
      if (!hasAccess) {
        return { success: false, score: 0, passed: false, attemptNumber: 0, attemptsRemaining: 0, error: 'No autorizado' }
      }
    }

    // Obtener configuración del quiz
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('max_attempts, passing_score')
      .eq('id', quizId)
      .single()

    if (!quiz) {
      return {
        success: false,
        score: 0,
        passed: false,
        attemptNumber: 0,
        attemptsRemaining: 0,
        error: 'Quiz no encontrado',
      }
    }

    // Obtener fecha del último reset para este curso
    const { data: progress } = await supabase
      .from('course_progress')
      .select('last_quiz_reset_at')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    const resetAt = progress?.last_quiz_reset_at ?? null

    // Verificar intentos previos (solo después del último reset)
    let attemptsQuery = supabase
      .from('quiz_attempts')
      .select('status, completed_at')
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)

    if (resetAt) {
      attemptsQuery = attemptsQuery.gt('completed_at', resetAt)
    }

    const { data: attempts } = await attemptsQuery

    const attemptsUsed = attempts?.length || 0
    const hasPassedBefore = attempts?.some(a => a.status === 'aprobado') || false

    // Si ya aprobó, no permitir nuevo intento
    if (hasPassedBefore) {
      return {
        success: false,
        score: 0,
        passed: false,
        attemptNumber: attemptsUsed,
        attemptsRemaining: 0,
        error: 'Ya aprobaste este quiz',
      }
    }

    // Si agotó intentos, no permitir nuevo intento
    if (attemptsUsed >= quiz.max_attempts) {
      return {
        success: false,
        score: 0,
        passed: false,
        attemptNumber: attemptsUsed,
        attemptsRemaining: 0,
        error: 'Agotaste todos los intentos',
      }
    }

    // Obtener las respuestas correctas desde el servidor
    const { data: questions } = await supabase
      .from('questions')
      .select('id, correct_option')
      .eq('quiz_id', quizId)

    if (!questions || questions.length === 0) {
      return {
        success: false,
        score: 0,
        passed: false,
        attemptNumber: 0,
        attemptsRemaining: 0,
        error: 'No hay preguntas en este quiz',
      }
    }

    // Verificar que el usuario respondió todas las preguntas — sin esto el intento
    // se grabaría con score=0 y consumiría un intento incluso si fue por error de UI/red
    const providedIds = new Set(Object.keys(validatedAnswers))
    const allCovered = questions.every(q => providedIds.has(q.id))
    if (!allCovered) {
      return {
        success: false,
        score: 0,
        passed: false,
        attemptNumber: attemptsUsed,
        attemptsRemaining: quiz.max_attempts - attemptsUsed,
        error: 'Debes responder todas las preguntas',
      }
    }

    // Calcular score en el servidor (NO confiar en el cliente)
    let correctCount = 0
    const questionResults: Record<string, boolean> = {}
    questions.forEach(q => {
      const isCorrect = validatedAnswers[q.id] === q.correct_option
      questionResults[q.id] = isCorrect
      if (isCorrect) correctCount++
    })

    const score = Math.round((correctCount / questions.length) * 100)
    const passed = score >= quiz.passing_score
    const status: 'aprobado' | 'reprobado' = passed ? 'aprobado' : 'reprobado'

    // Insertar intento en la DB
    const { data: newAttempt, error: insertError } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        user_id: user.id,
        score,
        status,
        answers: validatedAnswers,
      })
      .select('id, attempt_number')
      .single()

    if (insertError) {
      console.error('Error inserting quiz attempt:', insertError)
      return {
        success: false,
        score: 0,
        passed: false,
        attemptNumber: 0,
        attemptsRemaining: 0,
        error: 'Error al guardar el intento',
      }
    }

    const attemptNumber = newAttempt?.attempt_number || attemptsUsed + 1
    const attemptsRemaining = quiz.max_attempts - attemptNumber

    let courseCompleted = false // Variable para guardar el estado

    // Si aprobó, marcar el módulo como completo y verificar si el curso se completó
    if (passed) {
      const progressResult = await markModuleCompleteAction(moduleId, courseId)
      if (!progressResult.success) {
        // El intento aprobado quedó guardado pero no se pudo marcar el módulo
        // como completo: el cliente reintentará desde QuizClient.handleContinue.
        console.error('[submitQuizAction] markModuleCompleteAction failed after passing attempt', {
          userId: user.id,
          courseId,
          moduleId,
          quizId,
          attemptId: newAttempt?.id,
          error: progressResult.error,
        })
      }
      courseCompleted = progressResult.courseCompleted || false

      // Generar certificado SOLO si todo el curso está completo
      if (courseCompleted) {
        try {
          const { generateCertificateAction } = await import('./certificates')
          await generateCertificateAction(newAttempt.id, courseId)
        } catch (certError) {
          console.error('[submitQuizAction] generateCertificateAction failed', {
            userId: user.id,
            courseId,
            moduleId,
            quizId,
            attemptId: newAttempt?.id,
            error: certError,
          })
        }
      }
    }

    // CRÍTICO: Revalidar SIEMPRE, haya aprobado o no, para que el caché refleje el estado actual
    revalidatePath(`/cursos/${courseId}`, 'page')
    revalidatePath(`/cursos/${courseId}/modulos/${moduleId}`, 'page')

    return {
      success: true,
      score,
      passed,
      attemptNumber,
      attemptsRemaining,
      courseCompleted,
      questionResults,
    }
  } catch (error) {
    console.error('Error submitting quiz:', error)
    return {
      success: false,
      score: 0,
      passed: false,
      attemptNumber: 0,
      attemptsRemaining: 0,
      error: 'Error al enviar el quiz',
    }
  }
}

type AttemptHistoryRow = {
  id: string
  score: number
  status: 'aprobado' | 'reprobado' | 'en_progreso'
  attempt_number: number
  completed_at: string
}

export async function getQuizAttemptsHistoryAction(
  quizId: string,
  courseId: string
): Promise<{ attempts: AttemptHistoryRow[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { attempts: [] }

  // Obtener fecha del último reset para filtrar intentos anteriores
  const { data: progress } = await supabase
    .from('course_progress')
    .select('last_quiz_reset_at')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()

  const resetAt = progress?.last_quiz_reset_at ?? null

  let query = supabase
    .from('quiz_attempts')
    .select('id, score, status, attempt_number, completed_at')
    .eq('quiz_id', quizId)
    .eq('user_id', user.id)
    .order('attempt_number', { ascending: true })

  if (resetAt) {
    query = query.gt('completed_at', resetAt)
  }

  const { data } = await query

  return { attempts: (data ?? []) as AttemptHistoryRow[] }
}