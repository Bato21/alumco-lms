'use server'
// src/lib/actions/auth.ts

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { z } from 'zod'

// ── Schemas de validación ──────────────────────────────────

// A11Y-24 · 3.3.3 pide que el mensaje diga cómo corregir, no sólo qué falló.
const LoginSchema = z.object({
  email: z
    .string()
    .email('Ingresa un correo válido, con @ y dominio — por ejemplo nombre@alumco.cl.'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres. Revisa que no falten caracteres al escribirla.'),
})

const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres. Añade más caracteres hasta llegar a 8.'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Las dos contraseñas no coinciden. Vuelve a escribirlas asegurándote de que sean idénticas.',
    path: ['confirm'],
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
  /**
   * A11Y-24 · Nombre del campo que originó el error, para que el formulario pueda
   * marcarlo con `aria-invalid` y apuntarle el `aria-describedby` (3.3.1). Sin
   * esto, el mensaje llegaba al `role="alert"` pero quien navega por campos con
   * lector de pantalla no sabía cuál corregir.
   */
  field?: string
}

interface AuthProfileStatusRole {
  status: 'pendiente' | 'activo' | 'suspendido' | null
  role: 'admin' | 'trabajador' | 'profesor' | null
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
    const issue = parsed.error.issues[0]
    return { error: issue.message, field: String(issue.path[0] ?? '') }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error || !data.user) {
    // No se dice cuál de los dos falló —sería un oráculo de cuentas—, pero sí
    // qué hacer a continuación (3.3.3).
    return {
      error: 'Correo o contraseña incorrectos. Revisa ambos campos; si no recuerdas tu clave, usa «¿Olvidó su clave?».',
    }
  }

  // Verificar estado del perfil antes de permitir acceso
  const { data: profile } = await supabase
    .from('profiles')
    .select('status, role')
    .eq('id', data.user.id)
    .single()

  const profileData = profile as AuthProfileStatusRole | null

  if (profileData?.status === 'pendiente') {
    await supabase.auth.signOut()
    return {
      error: 'Tu cuenta está pendiente de aprobación. Te notificaremos por correo cuando sea activada.',
    }
  }

  if (profileData?.status === 'suspendido') {
    await supabase.auth.signOut()
    return {
      error: 'Tu cuenta ha sido suspendida. Contacta a tu administrador.',
    }
  }

  revalidatePath('/', 'layout')

  // Redirigir según rol
  if (profileData?.role === 'admin' || profileData?.role === 'profesor') {
    redirect('/admin/dashboard')
  }
  redirect('/inicio')
}

// ── Logout ─────────────────────────────────────────────────
export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // Nota: no usar revalidatePath('/', 'layout') aquí. Revalidar el layout
  // mientras la sesión ya fue borrada re-renderiza el árbol protegido actual,
  // que dispara su propio redirect('/login') → choca con este redirect y
  // produce un error intermitente al cerrar sesión. El redirect navega a una
  // ruta pública con datos frescos, así que la revalidación no es necesaria.
  redirect('/')
}

// ── Registro (usado por admin para crear trabajadores) ─────

export async function registerWorkerAction(
  stateOrFormData: ActionState | FormData,
  maybeFormData?: FormData
): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

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
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get('email')

  const parsed = z
    .string()
    .email('Ingresa un correo válido, con @ y dominio — por ejemplo nombre@alumco.cl.')
    .safeParse(email)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, field: 'email' }
  }

  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kimunko.vercel.app'
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl}/reset-password`,
  })

  // No revelar si el email existe o no
  if (error) {
    console.error('Reset password error:', error)
  }

  return { success: true }
}

// ── Fijar contraseña nueva desde el enlace del correo ──────
//
// Destino de `forgotPasswordAction`. El enlace llega a /reset-password con la
// credencial de un solo uso en la URL; esta acción la canjea por una sesión,
// escribe la contraseña y cierra la sesión enseguida.
export async function resetPasswordAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = ResetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { error: issue.message, field: String(issue.path[0] ?? '') }
  }

  const tokenHash = formData.get('token_hash')
  const code = formData.get('code')

  const supabase = await createClient()

  // Supabase manda uno de dos formatos según la plantilla del correo:
  // `token_hash` (verifyOtp) funciona en cualquier dispositivo; `code` (PKCE)
  // exige que el verificador siga en las cookies del MISMO navegador que pidió
  // el enlace. Se aceptan los dos para no depender de la plantilla.
  const canje =
    typeof tokenHash === 'string' && tokenHash.length > 0
      ? await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash })
      : typeof code === 'string' && code.length > 0
        ? await supabase.auth.exchangeCodeForSession(code)
        : null

  if (!canje) {
    return {
      error: 'El enlace está incompleto. Solicita uno nuevo desde «¿Olvidó su clave?».',
    }
  }

  if (canje.error) {
    return {
      error:
        'El enlace no es válido, ya fue usado o expiró. Solicita uno nuevo desde «¿Olvidó su clave?». Si lo abriste en un teléfono distinto al que lo pediste, ábrelo en el mismo.',
    }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    if (error.code === 'same_password') {
      return { error: 'La contraseña nueva debe ser distinta de la anterior.' }
    }
    console.error('Reset password update error:', error)
    return { error: 'No se pudo guardar la contraseña. Intenta nuevamente.' }
  }

  // Cerrar la sesión que abrió el enlace: el usuario vuelve a entrar con su
  // contraseña nueva, lo que además le confirma que quedó bien guardada.
  await supabase.auth.signOut()

  return { success: true }
}