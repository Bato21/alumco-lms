'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient, createClient } from '@/lib/supabase/server'
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }
    const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
    if (callerProfile?.role !== 'admin') return { error: 'No autorizado' }

    const raw = {
      full_name: formData.get('full_name'),
      rut: formData.get('rut') || undefined,
      sede: formData.get('sede'),
      area_trabajo: formData.getAll('area_trabajo'),
    }

    const parsed = UpdateWorkerSchema.safeParse(raw)
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
    }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { error } = await ac
      .from('profiles')
      .update(parsed.data)
      .eq('id', profileId) as { error: { message: string } | null }

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }
    const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
    if (callerProfile?.role !== 'admin') return { error: 'No autorizado' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { error } = await ac
      .from('profiles')
      .update({ status: 'suspendido' })
      .eq('id', profileId) as { error: { message: string } | null }

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }
    const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
    if (callerProfile?.role !== 'admin') return { error: 'No autorizado' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any
    const { error } = await ac
      .from('profiles')
      .update({ status: 'activo' })
      .eq('id', profileId) as { error: { message: string } | null }

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }
    const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
    if (callerProfile?.role !== 'admin') return { error: 'No autorizado' }

    const adminClient = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = adminClient as any

    const { data: worker, error: workerError } = await ac
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single() as {
        data: { id: string; full_name: string; rut: string | null; sede: string; area_trabajo: string[]; role: string; status: string; created_at: string; approved_at: string | null } | null
        error: { message: string } | null
      }

    if (workerError || !worker) {
      return { error: workerError?.message ?? 'Trabajador no encontrado' }
    }

    const { data: progressRaw, error: progressError } = await ac
      .from('course_progress')
      .select('course_id, is_completed, completed_at, completed_modules, courses(id, title)')
      .eq('user_id', profileId) as {
        data: Array<{
          course_id: string
          is_completed: boolean
          completed_at: string | null
          completed_modules: string[] | null
          courses: { title: string } | { title: string }[] | null
        }> | null
        error: { message: string } | null
      }

    if (progressError) return { error: progressError.message }

    const { data: certsRaw, error: certError } = await ac
      .from('certificates')
      .select('id, course_id, issued_at, courses(title)')
      .eq('user_id', profileId) as {
        data: Array<{
          id: string
          course_id: string
          issued_at: string
          courses: { title: string } | { title: string }[] | null
        }> | null
        error: { message: string } | null
      }

    if (certError) return { error: certError.message }

    const progress = (progressRaw ?? []).map(p => {
      const course = Array.isArray(p.courses) ? p.courses[0] : p.courses
      return {
        course_id: p.course_id,
        course_title: (course as { title: string } | null)?.title ?? 'Curso',
        is_completed: p.is_completed,
        completed_at: p.completed_at,
        completed_modules: (p.completed_modules ?? []) as string[],
      }
    })

    const certificates = (certsRaw ?? []).map(c => {
      const course = Array.isArray(c.courses) ? c.courses[0] : c.courses
      return {
        id: c.id,
        course_id: c.course_id,
        course_title: (course as { title: string } | null)?.title ?? 'Curso',
        issued_at: c.issued_at,
      }
    })

    return { worker, progress, certificates }
  } catch {
    return { error: 'Error inesperado al obtener los datos del trabajador' }
  }
}

export async function updateProfileAction(
  userId: string,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sp = supabase as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return { error: 'No autorizado' }
    }

    const fechaNacimiento = formData.get('fecha_nacimiento') as string | null

    const { error } = await sp
      .from('profiles')
      .update({
        fecha_nacimiento: fechaNacimiento || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId) as { error: unknown }

    if (error) throw error

    revalidatePath('/perfil')
    return { success: true }
  } catch (err) {
    console.error('Error actualizando perfil:', err)
    return { error: 'Error al actualizar el perfil' }
  }
}

export async function uploadFirmaAction(
  userId: string,
  formData: FormData,
): Promise<{ success?: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sp = supabase as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) return { error: 'No autorizado' }

    const file = formData.get('firma') as File
    if (!file || file.size === 0) return { error: 'No se seleccionó archivo' }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return { error: 'Solo se permiten imágenes PNG o JPG' }
    }

    if (file.size > 2 * 1024 * 1024) {
      return { error: 'La imagen no puede superar 2MB' }
    }

    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const path = `firmas/${userId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('firmas')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('firmas')
      .getPublicUrl(path)

    const { error: updateError } = await sp
      .from('profiles')
      .update({ firma_url: publicUrl })
      .eq('id', userId) as { error: unknown }

    if (updateError) throw updateError

    revalidatePath('/perfil')
    return { success: true, url: publicUrl }
  } catch (err) {
    console.error('Error subiendo firma:', err)
    return { error: 'Error al subir la firma' }
  }
}

export async function deleteFirmaAction(
  userId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sp = supabase as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) return { error: 'No autorizado' }

    await supabase.storage.from('firmas').remove([
      `firmas/${userId}.png`,
      `firmas/${userId}.jpg`,
    ])

    const { error } = await sp
      .from('profiles')
      .update({ firma_url: null })
      .eq('id', userId) as { error: unknown }

    if (error) throw error

    revalidatePath('/perfil')
    return { success: true }
  } catch (err) {
    console.error('Error eliminando firma:', err)
    return { error: 'Error al eliminar la firma' }
  }
}

export async function completeOnboardingAction(): Promise<{
  success?: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sp = supabase as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const { error } = await sp
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id) as { error: unknown }

    if (error) throw error

    revalidatePath('/inicio')
    return { success: true }
  } catch (err) {
    console.error('Error completando onboarding:', err)
    return { error: 'Error al completar onboarding' }
  }
}
