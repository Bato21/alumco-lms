'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateCertificateAction } from './certificates'

/**
 * Marks a module as complete for the current user.
 * Also updates the last_module_id and checks if course should be marked complete.
 */
export async function markModuleCompleteAction(
  moduleId: string,
  courseId: string
): Promise<{ success: boolean; error?: string; courseCompleted?: boolean; completedModules?: string[] }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Usuario no autenticado' }

    // Usar el cliente del usuario — RLS garantiza que solo escribe su propio progreso
    const { data: progress } = await supabase
      .from('course_progress')
      .select('id, completed_modules, is_completed, completed_at')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    let completedModules: string[]

    if (progress) {
      const current = Array.isArray(progress.completed_modules)
        ? progress.completed_modules
        : []
      completedModules = Array.from(new Set([...current, moduleId]))

      const { error } = await supabase
        .from('course_progress')
        .update({
          completed_modules: completedModules,
          last_module_id: moduleId,
        })
        .eq('id', progress.id)

      if (error) {
        console.error('Error updating progress:', error)
        return { success: false, error: error.message }
      }
    } else {
      completedModules = [moduleId]

      const { error } = await supabase
        .from('course_progress')
        .insert({
          user_id: user.id,
          course_id: courseId,
          completed_modules: completedModules,
          last_module_id: moduleId,
          is_completed: false,
          completed_at: null,
        })

      if (error) {
        console.error('Error inserting progress:', error)
        return { success: false, error: error.message }
      }
    }

    // Verificar si todos los módulos del curso están completos
    const adminClient = await createAdminClient()
    const { data: allModules } = await adminClient
      .from('modules')
      .select('id, content_type')
      .eq('course_id', courseId)

    let courseCompleted = false
    if (allModules && allModules.length > 0) {
      courseCompleted = allModules.every((m) =>
        completedModules.includes(m.id)
      )
    }

    // Si el curso está completo, actualizarlo
    if (courseCompleted) {
      await supabase
        .from('course_progress')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('course_id', courseId)

      // Generar certificado para cursos sin módulo quiz (los quiz lo hacen desde submitQuizAction)
      const hasQuizModule = allModules?.some(m => m.content_type === 'quiz') ?? false
      if (!hasQuizModule) {
        try {
          await generateCertificateAction(null, courseId)
        } catch (certError) {
          console.error('Error generando certificado sin quiz:', certError)
        }
      }
    }

    revalidatePath(`/cursos/${courseId}`)
    revalidatePath('/cursos')

    return { success: true, courseCompleted, completedModules }
  } catch (error) {
    console.error('Error FATAL marking module complete:', error)
    return { success: false, error: 'Error al marcar el módulo como completado' }
  }
}

/**
 * Updates the last module viewed by the user.
 */
export async function updateLastModuleAction(
  moduleId: string,
  courseId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    // Get current progress — user client is sufficient (RLS allows user to read/write own rows)
    const { data: progress } = await supabase
      .from('course_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    if (progress) {
      const { error } = await supabase
        .from('course_progress')
        .update({
          last_module_id: moduleId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', progress.id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('course_progress')
        .insert({
          user_id: user.id,
          course_id: courseId,
          completed_modules: [],
          last_module_id: moduleId,
          is_completed: false,
        })

      if (error) throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating last module:', error)
    return { success: false, error: 'Error al actualizar el progreso' }
  }
}

/**
 * Marks a course as complete when all modules are done.
 */
export async function markCourseCompleteAction(
  courseId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    const result = await checkAndUpdateCourseCompletion(courseId, user.id)

    if (result.success) {
      revalidatePath(`/cursos/${courseId}`)
    }

    return result
  } catch (error) {
    console.error('Error marking course complete:', error)
    return { success: false, error: 'Error al completar el curso' }
  }
}

/**
 * Helper function to check if all modules are completed and mark course as complete.
 */
async function checkAndUpdateCourseCompletion(
  courseId: string,
  userId: string
): Promise<{ success: boolean; error?: string; isComplete?: boolean }> {
  try {
    const adminClient = await createAdminClient()

    const { data: modules } = await adminClient
      .from('modules')
      .select('id')
      .eq('course_id', courseId)

    const { data: progress } = await adminClient
      .from('course_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (!modules || !progress) return { success: true, isComplete: false }

    const totalModules = modules.length
    const allCompleted = modules.every(m => progress.completed_modules?.includes(m.id))

    if (allCompleted && totalModules > 0 && !progress.is_completed) {
      const { error } = await adminClient
        .from('course_progress')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', progress.id)

      if (error) throw error
      return { success: true, isComplete: true }
    }

    return { success: true, isComplete: progress.is_completed || (allCompleted && totalModules > 0) }
  } catch (error) {
    console.error('Error checking course completion:', error)
    return { success: false, error: 'Error al verificar completitud del curso' }
  }
}

/**
 * Gets the progress for a specific course.
 */
export async function getCourseProgressAction(
  courseId: string
): Promise<{
  success: boolean
  data?: {
    completedModules: string[]
    lastModuleId: string | null
    isCompleted: boolean
    completedAt: string | null
  }
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    const { data: progress } = await supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    return {
      success: true,
      data: {
        completedModules: progress?.completed_modules || [],
        lastModuleId: progress?.last_module_id || null,
        isCompleted: progress?.is_completed || false,
        completedAt: progress?.completed_at || null,
      },
    }
  } catch (error) {
    console.error('Error getting course progress:', error)
    return { success: false, error: 'Error al obtener el progreso' }
  }
}

export async function resetModuleProgressAction(
  moduleId: string,
  courseId: string,
  previousModuleId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  const { data: progress } = await supabase
    .from('course_progress')
    .select('completed_modules, last_module_id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (!progress) return { success: false, error: 'Progreso no encontrado' }

  // Reinicio completo: todos los módulos vuelven a estado pendiente.
  // last_quiz_reset_at queda 1s en el pasado para que los intentos
  // anteriores no cuenten, pero el trigger acepte nuevos intentos.
  const { error } = await supabase
    .from('course_progress')
    .update({
      completed_modules: [],
      last_module_id: null,
      is_completed: false,
      completed_at: null,
      last_quiz_reset_at: new Date(Date.now() - 1000).toISOString(),
    })
    .eq('user_id', user.id)
    .eq('course_id', courseId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/cursos/${courseId}`)
  return { success: true }
}
