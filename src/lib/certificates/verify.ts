import { createAdminClient } from '@/lib/supabase/server'

/**
 * Verificación pública de certificados.
 *
 * Este módulo NO es un `'use server'` a propósito: se consume solo desde el
 * server component de /certificados/verificar/[codigo]. Marcarlo como server
 * action lo publicaría además como endpoint RPC, superficie pública extra que
 * no necesitamos.
 */

/** Crockford base32 sin I/L/O/U, 12 caracteres. Debe calzar con gen_verification_code() en SQL. */
const CODE_RE = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{12}$/

/** Normaliza lo que venga de la URL (minúsculas, guiones de un código tipeado a mano). */
export function normalizeVerificationCode(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]/g, '')
}

export function isValidVerificationCode(code: string): boolean {
  return CODE_RE.test(code)
}

/** Lo mínimo para acreditar el certificado ante un tercero. */
export interface VerifiedCertificate {
  code: string
  workerName: string
  courseTitle: string
  issuedAt: string
  sede: string
  /** Certificado del mundo demo: válido, pero no acredita a nadie real. */
  isDemo: boolean
}

export type VerificationResult =
  | { status: 'valido'; certificate: VerifiedCertificate }
  | { status: 'no_encontrado' }
  | { status: 'formato_invalido' }
  | { status: 'limite_excedido'; retryAfter: number }

/**
 * Busca un certificado por su folio.
 *
 * Usa service_role porque `certificates` no tiene (ni debe tener) policy de
 * lectura pública: abrirla expondría el listado completo a cualquiera con la
 * anon key. El filtro por `verification_code` exacto y el `select` acotado son
 * lo que mantiene la exposición al mínimo — nunca sale RUT, correo, área ni id
 * interno del certificado.
 */
export async function verifyCertificateByCode(
  rawCode: string
): Promise<VerificationResult> {
  const code = normalizeVerificationCode(rawCode)
  if (!isValidVerificationCode(code)) return { status: 'formato_invalido' }

  const adminClient = await createAdminClient()

  const { data } = await adminClient
    .from('certificates')
    .select('verification_code, issued_at, is_demo, profiles(full_name, sede), courses(title)')
    .eq('verification_code', code)
    .maybeSingle() as {
      data: {
        verification_code: string
        issued_at: string
        is_demo: boolean | null
        profiles: { full_name: string; sede: string } | { full_name: string; sede: string }[] | null
        courses: { title: string } | { title: string }[] | null
      } | null
    }

  if (!data) return { status: 'no_encontrado' }

  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
  const course = Array.isArray(data.courses) ? data.courses[0] : data.courses

  return {
    status: 'valido',
    certificate: {
      code: data.verification_code,
      workerName: profile?.full_name ?? 'Titular no disponible',
      courseTitle: course?.title ?? 'Curso no disponible',
      issuedAt: data.issued_at,
      sede: sedeNombre(profile?.sede),
      isDemo: data.is_demo === true,
    },
  }
}

function sedeNombre(sede: string | undefined): string {
  if (sede === 'sede_1') return 'Hualpén'
  if (sede === 'sede_2') return 'Coyhaique'
  if (sede === 'sede_demo') return 'Demostración'
  return 'No registrada'
}

/** URL absoluta que va dentro del QR del PDF. */
export function verificationUrl(code: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'https://kimunko.vercel.app'
  return `${base}/certificados/verificar/${code}`
}
