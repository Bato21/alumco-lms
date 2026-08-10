'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { type ContentType } from '@/lib/types/database'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { courseInScope } from '@/lib/auth/demoScope'
import { hasVisibleText, sanitizeModuleHtml, MAX_HTML_LENGTH } from '@/lib/sanitizeHtml'

// ── Schemas de validación ──────────────────────────────────

const CourseSchema = z.object({
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  deadline: z.string().optional(),
  deadline_description: z.string().optional(),
  target_areas: z.array(z.enum([
    'Enfermería',
    'Auxiliar de enfermería',
    'Kinesiología',
    'Terapia ocupacional',
    'Nutrición',
    'Trabajo social',
    'Psicología',
    'Administración',
    'Dirección técnica',
    'Geriatría',
    'Sin asignar',
  ])).default([]),
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

const TextModuleSchema = z.object({
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres'),
  content_html: z.string().min(1, 'El contenido no puede estar vacío').max(MAX_HTML_LENGTH),
  duration_mins: z.coerce.number().min(1).optional(),
  is_required: z.coerce.boolean().default(true),
})

const QuizModuleSchema = z.object({
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres'),
  passing_score: z.preprocess((val) => (val ? Number(val) : 70), z.number().min(0).max(100)),
  max_attempts: z.preprocess((val) => (val ? Number(val) : 3), z.number().min(1).max(5)),
})

// ── Tipos de respuesta ─────────────────────────────────────

export interface ActionResult {
  error?: string
  success?: boolean
  id?: string
  quizId?: string
  url?: string
}

const BANNER_BUCKET = 'course-banners'
const MAX_BANNER_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_BANNER_TYPES = ['image/png', 'image/jpeg', 'image/webp']

// ── Crear curso ────────────────────────────────────────────

export async function createCourseAction(
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }
  const userId = auth.userId

  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    deadline: formData.get('deadline') || undefined,
    deadline_description: formData.get('deadline_description') || undefined,
    target_areas: formData.getAll('target_areas'),
  }

  const parsed = CourseSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Obtener el mayor order_index actual
  const adminClient = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ac = adminClient as any
  const { data: lastCourse } = await ac
    .from('courses')
    .select('order_index')
    .eq('is_demo', auth.isDemo)
    .order('order_index', { ascending: false })
    .limit(1)
    .single() as { data: { order_index: number } | null }

  const nextIndex = (lastCourse?.order_index ?? 0) + 1

  const { data: course, error } = await ac
    .from('courses')
    .insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      deadline: parsed.data.deadline ?? null,
      deadline_description: parsed.data.deadline_description ?? null,
      target_areas: parsed.data.target_areas,
      is_published: false,
      order_index: nextIndex,
      created_by: userId,
      is_demo: auth.isDemo,
    } as unknown as never)
    .select('id')
    .single() as unknown as { data: { id: string } | null; error: { message: string } | null }

  if (error) {
    return { error: 'Error al crear el curso. Intenta nuevamente.' }
  }

  revalidatePath('/admin/cursos')
  return { success: true, id: (course as { id: string }).id }
}

// ── Actualizar curso ───────────────────────────────────────

export async function updateCourseAction(
  courseId: string,
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    deadline: formData.get('deadline') || undefined,
    deadline_description: formData.get('deadline_description') || undefined,
    target_areas: formData.getAll('target_areas'),
  }

  const parsed = CourseSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const adminClient = await createAdminClient()
  if (!(await courseInScope(adminClient, courseId, auth.isDemo))) {
    return { error: 'No autorizado' }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from('courses')
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      deadline: parsed.data.deadline ?? null,
      deadline_description: parsed.data.deadline_description ?? null,
      target_areas: parsed.data.target_areas,
    } as unknown as never)
    .eq('id', courseId)

  if (error) {
    return { error: 'Error al actualizar el curso.' }
  }

  revalidatePath('/admin/cursos')
  revalidatePath(`/admin/cursos/${courseId}/editar`)
  return { success: true }
}

// ── Banner del curso ───────────────────────────────────────

/**
 * Persiste la imagen de banner del curso (URL de la galería o de Storage).
 * Pasar `null` quita la imagen y el curso vuelve a mostrar solo el degradado.
 */
export async function updateCourseBannerAction(
  courseId: string,
  thumbnailUrl: string | null
): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const adminClient = await createAdminClient()
  if (!(await courseInScope(adminClient, courseId, auth.isDemo))) {
    return { error: 'No autorizado' }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from('courses')
    .update({ thumbnail_url: thumbnailUrl } as unknown as never)
    .eq('id', courseId)

  if (error) {
    return { error: 'Error al guardar el banner del curso.' }
  }

  revalidatePath('/admin/cursos')
  revalidatePath(`/admin/cursos/${courseId}/editar`)
  revalidatePath('/cursos')
  revalidatePath(`/cursos/${courseId}`)
  return { success: true }
}

/**
 * Sube una imagen al bucket `course-banners`, la asocia al curso y
 * devuelve la URL pública.
 */
export async function uploadCourseBannerAction(
  courseId: string,
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'No se recibió ninguna imagen.' }
  }
  if (file.size > MAX_BANNER_BYTES) {
    return { error: 'La imagen supera el máximo de 5 MB.' }
  }
  if (!ALLOWED_BANNER_TYPES.includes(file.type)) {
    return { error: 'Formato no válido. Usa PNG, JPG o WebP.' }
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${courseId}/${Date.now()}.${ext}`

  const adminClient = await createAdminClient()
  if (!(await courseInScope(adminClient, courseId, auth.isDemo))) {
    return { error: 'No autorizado' }
  }
  const { error: uploadError } = await adminClient.storage
    .from(BANNER_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true })

  if (uploadError) {
    return { error: 'Error al subir la imagen. Intenta nuevamente.' }
  }

  const { data: publicData } = adminClient.storage
    .from(BANNER_BUCKET)
    .getPublicUrl(path)
  const publicUrl = publicData.publicUrl

  const result = await updateCourseBannerAction(courseId, publicUrl)
  if (result.error) return result

  return { success: true, url: publicUrl }
}

// ── Publicar / despublicar curso ───────────────────────────

export async function togglePublishCourseAction(
  courseId: string,
  isPublished: boolean
): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const adminClient = await createAdminClient()
  if (!(await courseInScope(adminClient, courseId, auth.isDemo))) {
    return { error: 'No autorizado' }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from('courses')
    .update({ is_published: isPublished } as unknown as never)
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
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const adminClient = await createAdminClient()
  if (!(await courseInScope(adminClient, courseId, auth.isDemo))) {
    return { error: 'No autorizado' }
  }
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
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const adminClient = await createAdminClient()
  if (!(await courseInScope(adminClient, courseId, auth.isDemo))) {
    return { error: 'No autorizado' }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ac = adminClient as any

  // Obtener el mayor order_index actual para este curso
  const { data: lastModule } = await ac
    .from('modules')
    .select('order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single() as { data: { order_index: number } | null }

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

    const { data: module, error } = await ac
      .from('modules')
      .insert({
        course_id: courseId,
        title: parsed.data.title,
        content_type: 'video',
        content_url: parsed.data.content_url,
        duration_mins: parsed.data.duration_mins ?? null,
        is_required: parsed.data.is_required,
        order_index: nextIndex,
      } as unknown as never)
      .select('id')
      .single() as { data: { id: string } | null; error: unknown }

    if (error) return { error: 'Error al crear el módulo de video.' }
    await syncFinalModule(courseId)
    revalidatePath(`/admin/cursos/${courseId}/editar`)
    return { success: true, id: (module as { id: string }).id }
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

    const { data: module, error } = await ac
      .from('modules')
      .insert({
        course_id: courseId,
        title: parsed.data.title,
        content_type: 'pdf',
        content_url: parsed.data.content_url,
        is_required: parsed.data.is_required,
        order_index: nextIndex,
      } as unknown as never)
      .select('id')
      .single() as { data: { id: string } | null; error: unknown }

    if (error) return { error: 'Error al crear el módulo PDF.' }
    await syncFinalModule(courseId)
    revalidatePath(`/admin/cursos/${courseId}/editar`)
    return { success: true, id: (module as { id: string }).id }
  }

  if (contentType === 'texto') {
    const parsed = TextModuleSchema.safeParse({
      title: formData.get('title'),
      content_html: formData.get('content_html'),
      duration_mins: formData.get('duration_mins'),
      is_required: formData.get('is_required') === 'true',
    })
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    // El saneado es del servidor. Lo que haya hecho el editor del cliente es
    // presentación; acá es donde se decide qué HTML queda guardado.
    const html = sanitizeModuleHtml(parsed.data.content_html)
    if (!hasVisibleText(html)) {
      return { error: 'El contenido del módulo no puede quedar vacío.' }
    }

    const { data: module, error } = await ac
      .from('modules')
      .insert({
        course_id: courseId,
        title: parsed.data.title,
        content_type: 'texto',
        // content_url es NOT NULL en el schema y un módulo de texto no tiene
        // URL que guardar.
        content_url: '',
        content_html: html,
        duration_mins: parsed.data.duration_mins ?? null,
        is_required: parsed.data.is_required,
        order_index: nextIndex,
      } as unknown as never)
      .select('id')
      .single() as { data: { id: string } | null; error: unknown }

    if (error) return { error: 'Error al crear el módulo de texto.' }
    await syncFinalModule(courseId)
    revalidatePath(`/admin/cursos/${courseId}/editar`)
    return { success: true, id: (module as { id: string }).id }
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
    const { data: module, error: moduleError } = await ac
      .from('modules')
      .insert({
        course_id: courseId,
        title: parsed.data.title,
        content_type: 'quiz',
        content_url: '',
        is_required: true,
        order_index: nextIndex,
      } as unknown as never)
      .select('id')
      .single() as { data: { id: string } | null; error: unknown }

    if (moduleError) return { error: 'Error al crear el módulo de evaluación.' }

    // Crear quiz ligado al módulo
    const { data: quiz, error: quizError } = await ac
      .from('quizzes')
      .insert({
        module_id: (module as { id: string }).id,
        title: parsed.data.title,
        passing_score: parsed.data.passing_score,
        max_attempts: parsed.data.max_attempts,
      } as unknown as never)
      .select('id')
      .single() as { data: { id: string } | null; error: unknown }

    if (quizError) return { error: 'Error al crear la evaluación.' }

    await syncFinalModule(courseId)
    revalidatePath(`/admin/cursos/${courseId}/editar`)
    return { success: true, id: (module as { id: string }).id, quizId: (quiz as { id: string }).id }
  }

  return { error: 'Tipo de módulo no válido.' }
}

// ── Actualizar módulo ──────────────────────────────────────

export async function updateModuleAction(
  moduleId: string,
  courseId: string,
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const adminClient = await createAdminClient()
  if (!(await courseInScope(adminClient, courseId, auth.isDemo))) {
    return { error: 'No autorizado' }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const acU = adminClient as any

  const title = formData.get('title') as string
  if (!title || title.length < 2) {
    return { error: 'El título debe tener al menos 2 caracteres' }
  }

  const patch: Record<string, unknown> = { title }

  // Solo los módulos de texto traen `content_html`. Se vuelve a sanear en cada
  // edición: es la única forma de que un cambio en la lista de etiquetas
  // permitidas alcance también al contenido que ya estaba guardado.
  const rawHtml = formData.get('content_html')
  if (typeof rawHtml === 'string') {
    const html = sanitizeModuleHtml(rawHtml)
    if (!hasVisibleText(html)) {
      return { error: 'El contenido del módulo no puede quedar vacío.' }
    }
    patch.content_html = html
  }

  const { error } = await acU
    .from('modules')
    .update(patch)
    .eq('id', moduleId) as { error: unknown }

  if (error) return { error: 'Error al actualizar el módulo.' }

  revalidatePath(`/admin/cursos/${courseId}/editar`)
  return { success: true }
}

// ── Eliminar módulo ────────────────────────────────────────

export async function deleteModuleAction(
  moduleId: string,
  courseId: string
): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const adminClient = await createAdminClient()
  if (!(await courseInScope(adminClient, courseId, auth.isDemo))) {
    return { error: 'No autorizado' }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const acD = adminClient as any
  const { error } = await acD
    .from('modules')
    .delete()
    .eq('id', moduleId) as { error: unknown }

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
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const adminClient = await createAdminClient()
  if (!(await courseInScope(adminClient, courseId, auth.isDemo))) {
    return { error: 'No autorizado' }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const acR = adminClient as any

  const updates = modules.map(({ id, order_index }) =>
    (acR
      .from('modules')
      .update({ order_index })
      .eq('id', id)) as Promise<{ error: unknown }>
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

// ── Duplicar curso ─────────────────────────────────────────

/**
 * Clona un curso completo: curso → módulos → quizzes → preguntas.
 *
 * Lo que NO se copia, a propósito:
 *   • el progreso y los certificados de los trabajadores (son del curso viejo);
 *   • `is_published` — el clon nace en borrador, para que nadie lo vea a
 *     medio editar;
 *   • `deadline` — una fecha límite copiada casi siempre nace vencida.
 *
 * `duplicated_from` queda apuntando al original, solo como trazabilidad: el
 * clon es independiente y editarlo no toca al padre.
 */
export async function duplicateCourseAction(
  courseId: string,
  nuevoTitulo?: string
): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const adminClient = await createAdminClient()
  if (!(await courseInScope(adminClient, courseId, auth.isDemo))) {
    return { error: 'No autorizado' }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ac = adminClient as any

  const { data: original } = await ac
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .maybeSingle() as { data: Record<string, unknown> | null }

  if (!original) return { error: 'Curso no encontrado.' }

  const titulo = (nuevoTitulo ?? '').trim() || `${original.title as string} (copia)`
  if (titulo.length < 2) return { error: 'El título debe tener al menos 2 caracteres.' }
  if (titulo.length > 200) return { error: 'El título es demasiado largo.' }

  const { data: lastCourse } = await ac
    .from('courses')
    .select('order_index')
    .eq('is_demo', auth.isDemo)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle() as { data: { order_index: number } | null }

  const { data: clon, error: errorCurso } = await ac
    .from('courses')
    .insert({
      title: titulo,
      description: original.description ?? null,
      thumbnail_url: original.thumbnail_url ?? null,
      target_areas: original.target_areas ?? [],
      deadline: null,
      deadline_description: original.deadline_description ?? null,
      is_published: false,
      order_index: (lastCourse?.order_index ?? 0) + 1,
      created_by: auth.userId,
      is_demo: auth.isDemo,
      duplicated_from: courseId,
    } as unknown as never)
    .select('id')
    .single() as { data: { id: string } | null; error: { message: string } | null }

  if (errorCurso || !clon) {
    console.error('Error duplicando el curso:', errorCurso)
    return { error: 'No se pudo duplicar el curso.' }
  }

  const nuevoCursoId = clon.id

  const { data: modules } = await ac
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true }) as { data: Record<string, unknown>[] | null }

  // Sin módulos el curso clonado ya está listo.
  if (!modules || modules.length === 0) {
    revalidatePath('/admin/cursos')
    return { success: true, id: nuevoCursoId }
  }

  const { data: nuevosModulos, error: errorModulos } = await ac
    .from('modules')
    .insert(
      modules.map((m) => ({
        course_id: nuevoCursoId,
        title: m.title,
        description: m.description ?? null,
        content_type: m.content_type,
        content_url: m.content_url ?? '',
        content_html: m.content_html ?? null,
        order_index: m.order_index,
        duration_mins: m.duration_mins ?? null,
        is_required: m.is_required ?? true,
        is_final_module: false,
      })) as unknown as never
    )
    .select('id, order_index') as {
      data: { id: string; order_index: number }[] | null
      error: { message: string } | null
    }

  if (errorModulos || !nuevosModulos) {
    // Rollback manual: sin transacciones a través de PostgREST, un clon a
    // medio armar confunde más que no tener nada.
    await ac.from('courses').delete().eq('id', nuevoCursoId)
    console.error('Error duplicando los módulos:', errorModulos)
    return { error: 'No se pudieron duplicar los módulos del curso.' }
  }

  // El insert no garantiza el orden de vuelta; se aparea por order_index, que
  // es único dentro de un curso.
  const idPorOrden = new Map(nuevosModulos.map((m) => [m.order_index, m.id]))

  const quizModules = modules.filter((m) => m.content_type === 'quiz')
  if (quizModules.length > 0) {
    const { data: quizzes } = await ac
      .from('quizzes')
      .select('*')
      .in('module_id', quizModules.map((m) => m.id as string)) as {
        data: Record<string, unknown>[] | null
      }

    for (const quiz of quizzes ?? []) {
      const moduloOriginal = quizModules.find((m) => m.id === quiz.module_id)
      const nuevoModuloId = moduloOriginal
        ? idPorOrden.get(moduloOriginal.order_index as number)
        : undefined
      if (!nuevoModuloId) continue

      const { data: nuevoQuiz } = await ac
        .from('quizzes')
        .insert({
          module_id: nuevoModuloId,
          title: quiz.title,
          passing_score: quiz.passing_score,
          max_attempts: quiz.max_attempts,
        } as unknown as never)
        .select('id')
        .single() as { data: { id: string } | null }

      if (!nuevoQuiz) continue

      const { data: questions } = await ac
        .from('questions')
        .select('*')
        .eq('quiz_id', quiz.id as string)
        .order('order_index', { ascending: true }) as { data: Record<string, unknown>[] | null }

      if (questions && questions.length > 0) {
        await ac.from('questions').insert(
          questions.map((q) => ({
            quiz_id: nuevoQuiz.id,
            question_text: q.question_text,
            options: q.options,
            correct_option: q.correct_option,
            order_index: q.order_index,
          })) as unknown as never
        )
      }
    }
  }

  await syncFinalModule(nuevoCursoId)

  revalidatePath('/admin/cursos')
  revalidatePath(`/admin/cursos/${nuevoCursoId}/editar`)
  return { success: true, id: nuevoCursoId }
}

// ── Helper: Sincronizar el último módulo ───────────────────

async function syncFinalModule(courseId: string) {
  const adminClient = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const acS = adminClient as any

  // 1. Obtenemos todos los módulos del curso ordenados
  const { data: modules } = await acS
    .from('modules')
    .select('id')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true }) as { data: { id: string }[] | null }

  if (!modules || modules.length === 0) return

  const lastModuleId = modules[modules.length - 1].id

  // 2. Le quitamos la etiqueta a todos los que NO son el último
  await acS
    .from('modules')
    .update({ is_final_module: false } as unknown as never)
    .eq('course_id', courseId)
    .neq('id', lastModuleId)

  // 3. Le ponemos la etiqueta exclusivamente al último
  await acS
    .from('modules')
    .update({ is_final_module: true } as unknown as never)
    .eq('id', lastModuleId)
}
