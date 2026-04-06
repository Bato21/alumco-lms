'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { markModuleCompleteAction } from './progress'
import type { UserAnswers, QuizSubmitResult, QuizStatus } from '@/lib/types/database'

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

    // Calcular score en el servidor (NO confiar en el cliente)
    let correctCount = 0
    questions.forEach(q => {
      if (answers[q.id] === q.correct_option) {
        correctCount++
      }
    })

    const score = Math.round((correctCount / questions.length) * 100)
    const passed = score >= quiz.passing_score
    const status: 'aprobado' | 'reprobado' = passed ? 'aprobado' : 'reprobado'

    // Insertar intento en la DB (el trigger SQL asignará attempt_number)
    const { data: newAttempt, error: insertError } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        user_id: user.id,
        score,
        status,
        answers,
      })
      .select('attempt_number')
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

    // Si aprobó, marcar el módulo como completo
    if (passed) {
      await markModuleCompleteAction(moduleId, courseId)
    }

    return {
      success: true,
      score,
      passed,
      attemptNumber,
      attemptsRemaining,
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
