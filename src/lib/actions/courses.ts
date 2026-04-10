'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { type ContentType } from '@/lib/types/database'

// ── Schemas de validación ──────────────────────────────────

const CourseSchema = z.object({
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  deadline: z.string().optional(),
  deadline_description: z.string().optional(),
})

const VideoModuleSchema = z.object({
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres'),
  content_url: z.string().url('Ingresa una URL válida de YouTube'),
  duration_mins: z.coerce.number().min(1).optional(),
  is_required: z.coerce.boolean().default(true),
})

const PdfModuleSchema = z.object({
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres'),
  content_url: z.string().min(1, 'La URL del PDF es requerida'),
  is_required: z.coerce.boolean().default(true),
})

const QuizModuleSchema = z.object({
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres'),
  passing_score: z.coerce.number().min(0).max(100).default(70),
  max_attempts: z.coerce.number().min(1).max(5).default(3),
})

// ── Tipos de respuesta ─────────────────────────────────────

export interface ActionResult {
  error?: string
  success?: boolean
  id?: string
}

// ── Crear curso ────────────────────────────────────────────

export async function createCourseAction(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    deadline: formData.get('deadline') || undefined,
    deadline_description: formData.get('deadline_description') || undefined,
  }

  const parsed = CourseSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Obtener el mayor order_index actual
  const adminClient = await createAdminClient()
  const { data: lastCourse } = await adminClient
    .from('courses')
    .select('order_index')
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  const nextIndex = (lastCourse?.order_index ?? 0) + 1

  const { data: course, error } = await adminClient
    .from('courses')
    .insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      deadline: parsed.data.deadline ?? null,
      deadline_description: parsed.data.deadline_description ?? null,
      is_published: false,
      order_index: nextIndex,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    return { error: 'Error al crear el curso. Intenta nuevamente.' }
  }

  revalidatePath('/admin/cursos')
  return { success: true, id: course.id }
}

// ── Actualizar curso ───────────────────────────────────────

export async function updateCourseAction(
  courseId: string,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    deadline: formData.get('deadline') || undefined,
    deadline_description: formData.get('deadline_description') || undefined,
  }

  const parsed = CourseSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const adminClient = await createAdminClient()
  const { error } = await adminClient
    .from('courses')
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      deadline: parsed.data.deadline ?? null,
      deadline_description: parsed.data.deadline_description ?? null,
    })
    .eq('id', courseId)

  if (error) {
    return { error: 'Error al actualizar el curso.' }
  }

  revalidatePath('/admin/cursos')
  revalidatePath(`/admin/cursos/${courseId}/editar`)
  return { success: true }
}

// ── Publicar / despublicar curso ───────────────────────────

export async function togglePublishCourseAction(
  courseId: string,
  isPublished: boolean
): Promise<ActionResult> {
  const adminClient = await createAdminClient()
  const { error } = await adminClient
    .from('courses')
    .update({ is_published: isPublished })
    .eq('id', courseId)

  if (error) {
    return { error: 'Error al cambiar el estado del curso.' }
  }

  revalidatePath('/admin/cursos')
  revalidatePath(`/admin/cursos/${courseId}/editar`)
  return { success: true }
}

// ── Eliminar curso ─────────────────────────────────────────

export async function deleteCourseAction(
  courseId: string
): Promise<ActionResult> {
  const adminClient = await createAdminClient()
  const { error } = await adminClient
    .from('courses')
    .delete()
    .eq('id', courseId)

  if (error) {
    return { error: 'Error al eliminar el curso.' }
  }

  revalidatePath('/admin/cursos')
  redirect('/admin/cursos')
}

// ── Crear módulo ───────────────────────────────────────────

export async function createModuleAction(
  courseId: string,
  contentType: ContentType,
  formData: FormData
): Promise<ActionResult> {
  const adminClient = await createAdminClient()

  // Obtener el mayor order_index actual para este curso
  const { data: lastModule } = await adminClient
    .from('modules')
    .select('order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  const nextIndex = (lastModule?.order_index ?? 0) + 1

  if (contentType === 'video') {
    const parsed = VideoModuleSchema.safeParse({
      title: formData.get('title'),
      content_url: formData.get('content_url'),
      duration_mins: formData.get('duration_mins'),
      is_required: formData.get('is_required') === 'true',
    })
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const { data: module, error } = await adminClient
      .from('modules')
      .insert({
        course_id: courseId,
        title: parsed.data.title,
        content_type: 'video',
        content_url: parsed.data.content_url,
        duration_mins: parsed.data.duration_mins ?? null,
        is_required: parsed.data.is_required,
        order_index: nextIndex,
      })
      .select('id')
      .single()

    if (error) return { error: 'Error al crear el módulo de video.' }
    await syncFinalModule(courseId)
    revalidatePath(`/admin/cursos/${courseId}/editar`)
    return { success: true, id: module.id }
  }

  if (contentType === 'pdf') {
    const parsed = PdfModuleSchema.safeParse({
      title: formData.get('title'),
      content_url: formData.get('content_url'),
      is_required: formData.get('is_required') === 'true',
    })
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const { data: module, error } = await adminClient
      .from('modules')
      .insert({
        course_id: courseId,
        title: parsed.data.title,
        content_type: 'pdf',
        content_url: parsed.data.content_url,
        is_required: parsed.data.is_required,
        order_index: nextIndex,
      })
      .select('id')
      .single()

    if (error) return { error: 'Error al crear el módulo PDF.' }
    await syncFinalModule(courseId)
    revalidatePath(`/admin/cursos/${courseId}/editar`)
    return { success: true, id: module.id }
  }

  if (contentType === 'quiz') {
    const parsed = QuizModuleSchema.safeParse({
      title: formData.get('title'),
      passing_score: formData.get('passing_score'),
      max_attempts: formData.get('max_attempts'),
    })
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    // Crear módulo primero
    const { data: module, error: moduleError } = await adminClient
      .from('modules')
      .insert({
        course_id: courseId,
        title: parsed.data.title,
        content_type: 'quiz',
        content_url: '',
        is_required: true,
        order_index: nextIndex,
      })
      .select('id')
      .single()

    if (moduleError) return { error: 'Error al crear el módulo de evaluación.' }

    // Crear quiz ligado al módulo
    const { error: quizError } = await adminClient
      .from('quizzes')
      .insert({
        module_id: module.id,
        title: parsed.data.title,
        passing_score: parsed.data.passing_score,
        max_attempts: parsed.data.max_attempts,
      })

    if (quizError) return { error: 'Error al crear la evaluación.' }

    revalidatePath(`/admin/cursos/${courseId}/editar`)
    return { success: true, id: module.id }
  }

  return { error: 'Tipo de módulo no válido.' }
}

// ── Actualizar módulo ──────────────────────────────────────

export async function updateModuleAction(
  moduleId: string,
  courseId: string,
  formData: FormData
): Promise<ActionResult> {
  const adminClient = await createAdminClient()

  const title = formData.get('title') as string
  if (!title || title.length < 2) {
    return { error: 'El título debe tener al menos 2 caracteres' }
  }

  const { error } = await adminClient
    .from('modules')
    .update({ title })
    .eq('id', moduleId)

  if (error) return { error: 'Error al actualizar el módulo.' }

  revalidatePath(`/admin/cursos/${courseId}/editar`)
  return { success: true }
}

// ── Eliminar módulo ────────────────────────────────────────

export async function deleteModuleAction(
  moduleId: string,
  courseId: string
): Promise<ActionResult> {
  const adminClient = await createAdminClient()
  const { error } = await adminClient
    .from('modules')
    .delete()
    .eq('id', moduleId)

  if (error) return { error: 'Error al eliminar el módulo.' }

  await syncFinalModule(courseId)
  revalidatePath(`/admin/cursos/${courseId}/editar`)
  return { success: true }
}

// ── Reordenar módulos (drag & drop) ───────────────────────

export async function reorderModulesAction(
  courseId: string,
  modules: { id: string; order_index: number }[]
): Promise<ActionResult> {
  const adminClient = await createAdminClient()

  const updates = modules.map(({ id, order_index }) =>
    adminClient
      .from('modules')
      .update({ order_index })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const hasError = results.some(({ error }) => error)

  if (hasError) {
    return { error: 'Error al reordenar los módulos.' }
  }

  await syncFinalModule(courseId)
  revalidatePath(`/admin/cursos/${courseId}/editar`)
  return { success: true }
}

// ── Helper: Sincronizar el último módulo ───────────────────

async function syncFinalModule(courseId: string) {
  const adminClient = await createAdminClient()

  // 1. Obtenemos todos los módulos del curso ordenados
  const { data: modules } = await adminClient
    .from('modules')
    .select('id')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (!modules || modules.length === 0) return

  const lastModuleId = modules[modules.length - 1].id

  // 2. Le quitamos la etiqueta a todos los que NO son el último
  await adminClient
    .from('modules')
    .update({ is_final_module: false })
    .eq('course_id', courseId)
    .neq('id', lastModuleId)

  // 3. Le ponemos la etiqueta exclusivamente al último
  await adminClient
    .from('modules')
    .update({ is_final_module: true })
    .eq('id', lastModuleId)
}