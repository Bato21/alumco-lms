'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { type Sede, type UserRole, type ProfileStatus } from '@/lib/types/database'

// ── Validación de RUT chileno ──────────────────────────────

function validarRut(rut: string): boolean {
  const rutLimpio = rut.replace(/[.\-]/g, '').toUpperCase()
  if (rutLimpio.length < 2) return false

  const cuerpo = rutLimpio.slice(0, -1)
  const dv = rutLimpio.slice(-1)

  if (!/^\d+$/.test(cuerpo)) return false

  let suma = 0
  let multiplo = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo
    multiplo = multiplo === 7 ? 2 : multiplo + 1
  }

  const dvEsperado = 11 - (suma % 11)
  const dvCalculado =
    dvEsperado === 11 ? '0' :
    dvEsperado === 10 ? 'K' :
    String(dvEsperado)

  return dv === dvCalculado
}

// ── Schemas de validación ──────────────────────────────────

const RegisterSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Ingresa tu nombre completo'),
  rut: z
    .string()
    .min(1, 'Ingresa tu RUT')
    .refine(validarRut, 'El RUT ingresado no es válido'),
  email: z
    .string()
    .email('Ingresa un correo válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirm_password: z
    .string()
    .min(1, 'Confirma tu contraseña'),
}).refine(
  (data) => data.password === data.confirm_password,
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'],
  }
)

const ApproveSchema = z.object({
  profileId: z.string().uuid(),
  sede: z.enum(['sede_1', 'sede_2']),
  area_trabajo: z.string().min(2, 'Ingresa el área de trabajo'),
  role: z.enum(['admin', 'trabajador', 'profesor']),
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
  if (stateOrFormData instanceof FormData) return stateOrFormData
  if (maybeFormData instanceof FormData) return maybeFormData
  return null
}

// ── Registro de solicitud de acceso ───────────────────────

export async function registerRequestAction(
  stateOrFormData: ActionState | FormData,
  maybeFormData?: FormData
): Promise<ActionResult> {
  const formData = resolveFormData(stateOrFormData, maybeFormData)
  if (!formData) {
    return { error: 'No se pudo procesar el formulario. Intenta nuevamente.' }
  }

  const raw = {
    full_name: formData.get('full_name'),
    rut: formData.get('rut'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirm_password: formData.get('confirm_password'),
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
        rut: parsed.data.rut,
      },
    },
  })

  if (error) {
    if (error.code === 'user_already_exists') {
      return { error: 'Ya existe una cuenta con ese correo electrónico' }
    }
    return { error: 'Error al enviar la solicitud. Intenta nuevamente.' }
  }

  // Cerrar sesión inmediatamente — el usuario no debe tener acceso
  // hasta que un admin apruebe su solicitud
  await supabase.auth.signOut()

  return { success: true }
}

// ── Aprobar solicitud de acceso ────────────────────────────

export async function approveWorkerAction(
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    profileId: formData.get('profileId'),
    sede: formData.get('sede'),
    area_trabajo: formData.get('area_trabajo'),
    role: formData.get('role'),
  }

  const parsed = ApproveSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const adminClient = await createAdminClient()

  // Actualizar perfil usando update con match por id
  // @ts-expect-error: Evitamos el error de tipo 'never' generado por Supabase
  const { error } = await adminClient
    .from('profiles')
    .update({
      status: 'activo',
      sede: parsed.data.sede,
      area_trabajo: parsed.data.area_trabajo,
      role: parsed.data.role,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.profileId)

  if (error) {
    return { error: 'Error al aprobar la solicitud. Intenta nuevamente.' }
  }

  revalidatePath('/admin/trabajadores')
  return { success: true }
}

// ── Rechazar solicitud de acceso ───────────────────────────

export async function rejectWorkerAction(formData: FormData) {
  // 1. Usamos el cliente con privilegios de administrador para saltar el RLS
  const adminClient = await createAdminClient()

  // 2. Extraemos el ID exactamente como lo enviamos desde el panel
  const profileId = formData.get('profileId') as string
  if (!profileId) return { error: 'ID de perfil no proporcionado' }

  // 3. Buscamos el perfil usando el adminClient
  const { data: profile, error: searchError } = await adminClient
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .single()

  if (searchError || !profile) {
    return { error: 'Perfil no encontrado' } // Aquí es donde fallaba antes
  }

  // 4. Borramos al usuario directamente desde Auth (elimina el perfil en cascada)
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(profileId)

  if (deleteError) {
    return { error: 'Error al rechazar la solicitud. Intenta nuevamente.' }
  }

  // 5. Actualizamos la vista
  revalidatePath('/admin/trabajadores')
  return { success: true }
}