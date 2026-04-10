'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'

// ── Tipos de respuesta ─────────────────────────────────────

export interface CertificateResult {
  error?: string
  success?: boolean
  certificateId?: string
}

// ── Generar certificado al aprobar quiz ────────────────────

export async function generateCertificateAction(
  quizAttemptId: string,
  courseId: string
): Promise<CertificateResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const adminClient = await createAdminClient()

  // Verificar que el intento existe y fue aprobado
  const { data: attempt } = await adminClient
    .from('quiz_attempts')
    .select('id, status, user_id')
    .eq('id', quizAttemptId)
    .single()

  if (!attempt) return { error: 'Intento no encontrado' }
  if (attempt.status !== 'aprobado') return { error: 'El intento no fue aprobado' }
  if (attempt.user_id !== user.id) return { error: 'No autorizado' }

  // Verificar que no exista ya un certificado para este usuario y curso
  const { data: existing } = await adminClient
    .from('certificates')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (existing) {
    return { success: true, certificateId: existing.id }
  }

  // Crear el certificado
  const { data: certificate, error } = await adminClient
    .from('certificates')
    .insert({
      user_id: user.id,
      quiz_attempt_id: quizAttemptId,
      course_id: courseId,
      pdf_url: null,
    })
    .select('id')
    .single()

  if (error) {
    return { error: 'Error al generar el certificado.' }
  }

  revalidatePath(`/cursos/${courseId}`)
  revalidatePath(`/cursos/${courseId}/certificado`)
  return { success: true, certificateId: certificate.id }
}

// ── Obtener certificado del usuario para un curso ──────────

export async function getCertificateAction(
  courseId: string
): Promise<{
  id: string
  issued_at: string
  pdf_url: string | null
} | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('certificates')
    .select('id, issued_at, pdf_url')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  return data ?? null
}

// ── Obtener todos los certificados (admin) ─────────────────

export async function getAllCertificatesAction(): Promise<{
  id: string
  issued_at: string
  pdf_url: string | null
  course_id: string
  user_id: string
}[]> {
  const adminClient = await createAdminClient()

  const { data } = await adminClient
    .from('certificates')
    .select('id, issued_at, pdf_url, course_id, user_id')
    .order('issued_at', { ascending: false })

  return data ?? []
}