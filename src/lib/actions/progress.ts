'use server'

import { createClient, createAdminClient, getCachedUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateCertificateAction } from './certificates'
import { filterCoursesByWorkerAreas, isModuleUnlocked } from '@/lib/utils'

/**
 * Valida que el módulo pertenezca al curso y que el trabajador tenga acceso por área.
 * Para admins/profesores no se aplica la restricción de área.
 */
async function validateModuleAccess(
  userId: string,
  moduleId: string,
  courseId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()

  // Las tres validaciones son independientes — una sola ronda de red.
  const [{ data: moduleCheck }, { data: callerProfile }, { data: course }] = await Promise.all([
    supabase
      .from('modules')
      .select('id')
      .eq('id', moduleId)
      .eq('course_id', courseId)
      .maybeSingle() as unknown as Promise<{ data: { id: string } | null }>,
    supabase
      .from('profiles')
      .select('role, area_trabajo')
      .eq('id', userId)
      .single() as unknown as Promise<{ data: { role: string; area_trabajo: string[] | null } | null }>,
    supabase
      .from('courses')
      .select('target_areas, is_published')
      .eq('id', courseId)
      .eq('is_published', true)
      .maybeSingle() as unknown as Promise<{ data: { target_areas: string[] | null; is_published: boolean } | null }>,
  ])

  if (!moduleCheck) {
    return { ok: false, error: 'Módulo no pertenece al curso indicado' }
  }

  if (callerProfile?.role === 'trabajador') {
    if (!course) return { ok: false, error: 'Curso no disponible' }

    const hasAccess = filterCoursesByWorkerAreas(
      [{ target_areas: (course.target_areas as string[]) ?? [] }],
      (callerProfile.area_trabajo as string[]) ?? []
    ).length > 0

    if (!hasAccess) return { ok: false, error: 'No autorizado' }
  }

  return { ok: true }
}

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sp = supabase as any
    const user = await getCachedUser()
    if (!user) return { success: false, error: 'Usuario no autenticado' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any

    // Validación, progreso actual y lista de módulos en paralelo;
    // las lecturas son inofensivas si la validación falla (RLS protege escrituras).
    const [access, { data: progress }, { data: allModules }] = await Promise.all([
      validateModuleAccess(user.id, moduleId, courseId),
      sp
        .from('course_progress')
        .select('id, completed_modules, is_completed, completed_at')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle() as Promise<{ data: { id: string; completed_modules: string[] | null; is_completed: boolean; completed_at: string | null } | null }>,
      ac
        .from('modules')
        .select('id, content_type, order_index')
        .eq('course_id', courseId)
        .order('order_index') as Promise<{ data: { id: string; content_type: string; order_index: number }[] | null }>,
    ])

    if (!access.ok) return { success: false, error: access.error }

    // Candado secuencial. La UI ya lo aplica, pero esta action es invocable
    // directamente: sin este check bastaba una llamada a mano para saltarse
    // los módulos y llegar al certificado.
    const yaCompletados = Array.isArray(progress?.completed_modules)
      ? progress.completed_modules
      : []
    if (allModules && !isModuleUnlocked(allModules, yaCompletados, moduleId)) {
      return {
        success: false,
        error: 'Debes completar el módulo anterior antes de avanzar a este.',
      }
    }

    let completedModules: string[]

    if (progress) {
      const current = Array.isArray(progress.completed_modules)
        ? progress.completed_modules
        : []
      completedModules = Array.from(new Set([...current, moduleId]))

      const { error } = await sp
        .from('course_progress')
        .update({
          completed_modules: completedModules,
          last_module_id: moduleId,
        })
        .eq('id', progress.id) as { error: { message: string } | null }

      if (error) {
        console.error('Error updating progress:', error)
        return { success: false, error: error.message }
      }
    } else {
      completedModules = [moduleId]

      const { error } = await sp
        .from('course_progress')
        .insert({
          user_id: user.id,
          course_id: courseId,
          completed_modules: completedModules,
          last_module_id: moduleId,
          is_completed: false,
          completed_at: null,
        }) as { error: { message: string } | null }

      if (error) {
        console.error('Error inserting progress:', error)
        return { success: false, error: error.message }
      }
    }

    // Verificar si todos los módulos del curso están completos
    let courseCompleted = false
    if (allModules && allModules.length > 0) {
      courseCompleted = allModules.every((m: { id: string }) =>
        completedModules.includes(m.id)
      )
    }

    // Si el curso está completo, actualizarlo
    if (courseCompleted) {
      await sp
        .from('course_progress')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        } as unknown as never)
        .eq('user_id', user.id)
        .eq('course_id', courseId)

      // Generar certificado para cursos sin módulo quiz (los quiz lo hacen desde submitQuizAction)
      const hasQuizModule = allModules?.some((m: { content_type: string }) => m.content_type === 'quiz') ?? false
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sp = supabase as any
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    const access = await validateModuleAccess(user.id, moduleId, courseId)
    if (!access.ok) return { success: false, error: access.error }

    // Get current progress — user client is sufficient (RLS allows user to read/write own rows)
    const { data: progress } = await sp
      .from('course_progress')
      .select('id, completed_modules')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle() as { data: { id: string; completed_modules: string[] | null } | null }

    // Mismo candado que en markModuleComplete: `last_module_id` es a dónde
    // vuelve el botón "Continuar", así que apuntarlo a un módulo bloqueado
    // dejaría al trabajador rebotando contra la pantalla de bloqueo.
    const adminClient = await createAdminClient()
    const { data: modules } = await (adminClient as unknown as typeof sp)
      .from('modules')
      .select('id')
      .eq('course_id', courseId)
      .order('order_index') as { data: { id: string }[] | null }

    if (modules && !isModuleUnlocked(modules, progress?.completed_modules ?? [], moduleId)) {
      return { success: false, error: 'Módulo bloqueado' }
    }

    if (progress) {
      const { error } = await sp
        .from('course_progress')
        .update({
          last_module_id: moduleId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', progress.id) as { error: unknown }

      if (error) throw error
    } else {
      const { error } = await sp
        .from('course_progress')
        .insert({
          user_id: user.id,
          course_id: courseId,
          completed_modules: [],
          last_module_id: moduleId,
          is_completed: false,
        }) as { error: unknown }

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any

    const { data: modules } = await ac
      .from('modules')
      .select('id')
      .eq('course_id', courseId) as { data: { id: string }[] | null }

    const { data: progress } = await ac
      .from('course_progress')
      .select('id, completed_modules, is_completed, completed_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single() as { data: { id: string; completed_modules: string[] | null; is_completed: boolean; completed_at: string | null; updated_at: string | null } | null }

    if (!modules || !progress) return { success: true, isComplete: false }

    const totalModules = modules.length
    const allCompleted = modules.every((m: { id: string }) => progress.completed_modules?.includes(m.id))

    if (allCompleted && totalModules > 0 && !progress.is_completed) {
      const { error } = await ac
        .from('course_progress')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', progress.id) as { error: unknown }

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
      .select('completed_modules, last_module_id, is_completed, completed_at')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single() as { data: { completed_modules: string[] | null; last_module_id: string | null; is_completed: boolean; completed_at: string | null } | null }

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

/**
 * Reinicia por completo el progreso del curso para el usuario actual.
 * Borra todos los módulos completados y marca un punto de reset para que los
 * intentos previos del quiz no cuenten contra max_attempts.
 */
export async function resetCourseProgressAction(
  courseId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sp = supabase as any
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  const { data: progress } = await sp
    .from('course_progress')
    .select('completed_modules, last_module_id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single() as { data: { completed_modules: string[] | null; last_module_id: string | null } | null }

  if (!progress) return { success: false, error: 'Progreso no encontrado' }

  const { error } = await sp
    .from('course_progress')
    .update({
      completed_modules: [],
      last_module_id: null,
      is_completed: false,
      completed_at: null,
      last_quiz_reset_at: new Date(Date.now() - 1000).toISOString(),
    } as unknown as never)
    .eq('user_id', user.id)
    .eq('course_id', courseId) as { error: { message: string } | null }

  if (error) return { success: false, error: error.message }

  revalidatePath(`/cursos/${courseId}`)
  return { success: true }
}
