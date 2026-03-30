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
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    // Use admin client to bypass RLS for this operation
    const adminClient = await createAdminClient()

    // Get current progress
    const { data: progress } = await adminClient
      .from('course_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    if (progress) {
      // Update existing progress
      const completedModules = [...(progress.completed_modules || [])]
      if (!completedModules.includes(moduleId)) {
        completedModules.push(moduleId)
      }

      const { error } = await adminClient
        .from('course_progress')
        .update({
          completed_modules: completedModules,
          last_module_id: moduleId,
          is_completed: false, // Will check and update below
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
          completed_modules: [moduleId],
          last_module_id: moduleId,
          is_completed: false,
        })

      if (error) throw error
    }

    // Check if course is now complete
    await checkAndUpdateCourseCompletion(courseId, user.id)

    revalidatePath(`/cursos/${courseId}`)
    revalidatePath(`/cursos/${courseId}/modulos/${moduleId}`)

    return { success: true }
  } catch (error) {
    console.error('Error marking module complete:', error)
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
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = await createAdminClient()

    // Get all modules in the course
    const { data: modules } = await adminClient
      .from('modules')
      .select('id')
      .eq('course_id', courseId)

    // Get current progress
    const { data: progress } = await adminClient
      .from('course_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (!modules || !progress) {
      return { success: true } // Nothing to do
    }

    const totalModules = modules.length
    const completedModules = progress.completed_modules?.length || 0

    // Check if all modules are completed
    const allCompleted = modules.every(m =>
      progress.completed_modules?.includes(m.id)
    )

    if (allCompleted && totalModules > 0 && !progress.is_completed) {
      // Mark course as complete
      const { error } = await adminClient
        .from('course_progress')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', progress.id)

      if (error) throw error

      // Create certificate for course completion
      // This would typically involve more logic to check if certificate already exists
    }

    return { success: true }
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
