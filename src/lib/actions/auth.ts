'use server'
// src/lib/actions/auth.ts

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ── Schemas de validación ──────────────────────────────────

const LoginSchema = z.object({
  email: z
    .string()
    .email('Ingresa un correo válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

const RegisterSchema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  full_name: z.string().min(2, 'Ingresa tu nombre completo'),
  sede: z.enum(['sede_1', 'sede_2']),
  area_trabajo: z.string().min(2, 'Ingresa tu área de trabajo'),
  fecha_nacimiento: z.string().optional(),
})

// ── Tipos de respuesta ─────────────────────────────────────

export interface ActionResult {
  error?: string
  success?: boolean
}

type ActionState = ActionResult | undefined

function resolveFormData(
  stateOrFormData: ActionState | FormData,
  maybeFormData?: FormData
): FormData | null {
  if (stateOrFormData instanceof FormData) {
    return stateOrFormData
  }

  if (maybeFormData instanceof FormData) {
    return maybeFormData
  }

  return null
}

// ── Login ──────────────────────────────────────────────────

export async function loginAction(
  stateOrFormData: ActionState | FormData,
  maybeFormData?: FormData
): Promise<ActionResult> {
  const formData = resolveFormData(stateOrFormData, maybeFormData)
  if (!formData) {
    return { error: 'No se pudo procesar el formulario. Intenta nuevamente.' }
  }

  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error || !data.user) {
    return { error: 'Correo o contraseña incorrectos' }
  }

  // Verificar estado del perfil antes de permitir acceso
  const { data: profile } = await supabase
    .from('profiles')
    .select('status, role')
    .eq('id', data.user.id)
    .single()

  if (profile?.status === 'pendiente') {
    await supabase.auth.signOut()
    return {
      error: 'Tu cuenta está pendiente de aprobación. Te notificaremos por correo cuando sea activada.',
    }
  }

  if (profile?.status === 'suspendido') {
    await supabase.auth.signOut()
    return {
      error: 'Tu cuenta ha sido suspendida. Contacta a tu administrador.',
    }
  }

  revalidatePath('/', 'layout')
  redirect('/inicio')
}

// ── Logout ─────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

// ── Registro (usado por admin para crear trabajadores) ─────

export async function registerWorkerAction(
  stateOrFormData: ActionState | FormData,
  maybeFormData?: FormData
): Promise<ActionResult> {
  const formData = resolveFormData(stateOrFormData, maybeFormData)
  if (!formData) {
    return { error: 'No se pudo procesar el formulario. Intenta nuevamente.' }
  }

  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
    full_name: formData.get('full_name'),
    sede: formData.get('sede'),
    area_trabajo: formData.get('area_trabajo'),
    fecha_nacimiento: formData.get('fecha_nacimiento') || undefined,
  }

  const parsed = RegisterSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        sede: parsed.data.sede,
        area_trabajo: parsed.data.area_trabajo,
        fecha_nacimiento: parsed.data.fecha_nacimiento,
        role: 'trabajador',
      },
    },
  })

  if (error) {
    if (error.code === 'user_already_exists') {
      return { error: 'Ya existe un usuario con ese correo' }
    }
    return { error: 'Error al crear el usuario. Intenta nuevamente.' }
  }

  revalidatePath('/admin/cursos')
  return { success: true }
}

export async function forgotPasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get('email')

  const parsed = z.string().email('Ingresa un correo válido').safeParse(email)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  })

  // No revelar si el email existe o no
  if (error) {
    console.error('Reset password error:', error)
  }

  return { success: true }
}