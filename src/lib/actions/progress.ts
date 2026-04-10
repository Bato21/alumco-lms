'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Marks a module as complete for the current user.
 * Also updates the last_module_id and checks if course should be marked complete.
 */
export async function markModuleCompleteAction(
  moduleId: string,
  courseId: string
): Promise<{ success: boolean; error?: string; courseCompleted?: boolean }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Usuario no autenticado' }

    const adminClient = await createAdminClient()

    // 1. Averiguamos si es el último (Usamos maybeSingle para no romper la app si falta la columna)
    const { data: moduleInfo } = await adminClient
      .from('modules')
      .select('is_final_module')
      .eq('id', moduleId)
      .maybeSingle()

    const isFinal = moduleInfo?.is_final_module || false

    // 2. Traemos el progreso (Usamos maybeSingle para evitar errores de Supabase)
    const { data: progress } = await adminClient
      .from('course_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    if (progress) {
      // Blindaje de Array: Aseguramos que sea un arreglo válido antes de sumar el nuevo ID
      const currentModules = Array.isArray(progress.completed_modules) 
        ? progress.completed_modules 
        : []
      
      const completedModules = Array.from(new Set([...currentModules, moduleId]))

      const { error } = await adminClient
        .from('course_progress')
        .update({
          completed_modules: completedModules,
          last_module_id: moduleId,
          is_completed: isFinal ? true : progress.is_completed,
          completed_at: isFinal ? new Date().toISOString() : progress.completed_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', progress.id)

      if (error) throw error
    } else {
      const { error } = await adminClient
        .from('course_progress')
        .insert({
          user_id: user.id,
          course_id: courseId,
          completed_modules: [moduleId],
          last_module_id: moduleId,
          is_completed: isFinal,
          completed_at: isFinal ? new Date().toISOString() : null,
        })

      if (error) throw error
    }

    revalidatePath('/cursos', 'layout')
    return { success: true, courseCompleted: isFinal }
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

    const adminClient = await createAdminClient()

    // Get current progress
    const { data: progress } = await adminClient
      .from('course_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    if (progress) {
      const { error } = await adminClient
        .from('course_progress')
        .update({
          last_module_id: moduleId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', progress.id)

      if (error) throw error
    } else {
      // Create new progress entry
      const { error } = await adminClient
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

  // Remove quiz module from completed_modules
  let updatedModules = (progress.completed_modules ?? []).filter(
    (id: string) => id !== moduleId
  )

  // Also remove previous content module if provided (for quiz reset)
  if (previousModuleId) {
    updatedModules = updatedModules.filter((id: string) => id !== previousModuleId)
  }

  const { error } = await supabase
    .from('course_progress')
    .update({
      completed_modules: updatedModules,
      last_module_id: progress.last_module_id === moduleId
        ? null
        : progress.last_module_id,
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
