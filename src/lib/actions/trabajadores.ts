'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { AREAS_TRABAJO } from '@/lib/types/database'

void AREAS_TRABAJO // imported for type reference

const UpdateWorkerSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  rut: z.string().optional(),
  sede: z.enum(['sede_1', 'sede_2']),
  area_trabajo: z.array(z.enum([
    'Enfermería', 'Auxiliar de enfermería', 'Kinesiología',
    'Terapia ocupacional', 'Nutrición', 'Trabajo social',
    'Psicología', 'Administración', 'Dirección técnica',
    'Geriatría', 'Sin asignar',
  ])).min(1, 'Selecciona al menos un área'),
})

export async function updateWorkerAction(
  profileId: string,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const raw = {
      full_name: formData.get('full_name'),
      rut: formData.get('rut') || undefined,
      sede: formData.get('sede'),
      area_trabajo: formData.getAll('area_trabajo'),
    }

    const parsed = UpdateWorkerSchema.safeParse(raw)
    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
    }

    const adminClient = await createAdminClient()
    const { error } = await adminClient
      .from('profiles')
      .update(parsed.data)
      .eq('id', profileId)

    if (error) return { error: error.message }

    revalidatePath('/admin/trabajadores')
    revalidatePath(`/admin/trabajadores/${profileId}`)
    return { success: true }
  } catch {
    return { error: 'Error inesperado al actualizar el trabajador' }
  }
}

export async function suspendWorkerAction(
  profileId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const adminClient = await createAdminClient()
    const { error } = await adminClient
      .from('profiles')
      .update({ status: 'suspendido' })
      .eq('id', profileId)

    if (error) return { error: error.message }

    revalidatePath('/admin/trabajadores')
    return { success: true }
  } catch {
    return { error: 'Error inesperado al suspender el trabajador' }
  }
}

export async function reactivateWorkerAction(
  profileId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const adminClient = await createAdminClient()
    const { error } = await adminClient
      .from('profiles')
      .update({ status: 'activo' })
      .eq('id', profileId)

    if (error) return { error: error.message }

    revalidatePath('/admin/trabajadores')
    return { success: true }
  } catch {
    return { error: 'Error inesperado al reactivar el trabajador' }
  }
}

export async function getWorkerDetailAction(profileId: string): Promise<
  | {
      worker: {
        id: string
        full_name: string
        rut: string | null
        sede: string
        area_trabajo: string[]
        role: string
        status: string
        created_at: string
        approved_at: string | null
      }
      progress: Array<{
        course_id: string
        course_title: string
        is_completed: boolean
        completed_at: string | null
        completed_modules: string[]
      }>
      certificates: Array<{
        id: string
        course_id: string
        course_title: string
        issued_at: string
      }>
    }
  | { error: string }
> {
  try {
    const adminClient = await createAdminClient()

    const { data: worker, error: workerError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (workerError || !worker) {
      return { error: workerError?.message ?? 'Trabajador no encontrado' }
    }

    const { data: progressRaw, error: progressError } = await adminClient
      .from('course_progress')
      .select('course_id, is_completed, completed_at, completed_modules, courses(id, title)')
      .eq('user_id', profileId)

    if (progressError) return { error: progressError.message }

    const { data: certsRaw, error: certError } = await adminClient
      .from('certificates')
      .select('id, course_id, issued_at, courses(title)')
      .eq('user_id', profileId)

    if (certError) return { error: certError.message }

    const progress = (progressRaw ?? []).map(p => {
      const course = Array.isArray(p.courses) ? p.courses[0] : p.courses
      return {
        course_id: p.course_id as string,
        course_title: (course as { title: string } | null)?.title ?? 'Curso',
        is_completed: p.is_completed as boolean,
        completed_at: p.completed_at as string | null,
        completed_modules: (p.completed_modules ?? []) as string[],
      }
    })

    const certificates = (certsRaw ?? []).map(c => {
      const course = Array.isArray(c.courses) ? c.courses[0] : c.courses
      return {
        id: c.id as string,
        course_id: c.course_id as string,
        course_title: (course as { title: string } | null)?.title ?? 'Curso',
        issued_at: c.issued_at as string,
      }
    })

    return { worker, progress, certificates }
  } catch {
    return { error: 'Error inesperado al obtener los datos del trabajador' }
  }
}
